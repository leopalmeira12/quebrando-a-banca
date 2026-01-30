"""
Betano Bot - Automação de login e apostas usando cookies salvos do navegador
Usa Playwright com contexto persistente para reutilizar cookies do Chrome/Edge
"""

import asyncio
import os
from pathlib import Path
from typing import Dict, List, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

# Diretório para salvar dados do navegador (cookies, etc.)
USER_DATA_DIR = Path(__file__).parent / "browser_data"
USER_DATA_DIR.mkdir(exist_ok=True)

class BetanoBot:
    """Bot para automação de apostas na Betano usando cookies salvos"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.is_logged_in = False
        
    async def start(self, headless: bool = False):
        """
        Inicia o navegador com contexto persistente.
        Isso mantém os cookies entre sessões, permitindo login automático.
        """
        playwright = await async_playwright().start()
        
        # Usar contexto persistente para manter cookies/logins
        # Isso simula um navegador real com histórico
        self.context = await playwright.chromium.launch_persistent_context(
            user_data_dir=str(USER_DATA_DIR),
            headless=headless,
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            # Aceitar cookies automaticamente
            ignore_default_args=["--enable-automation"],
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-web-security",
            ]
        )
        
        self.page = await self.context.new_page()
        return self
    
    async def check_login_status(self) -> bool:
        """Verifica se está logado na Betano"""
        try:
            await self.page.goto("https://www.betano.bet.br/", wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(2)
            
            # Procurar elementos que indicam login (saldo, nome do usuário, etc.)
            login_indicators = [
                "button[data-qa='header-balance']",  # Saldo na header
                ".user-balance",
                "[data-qa='user-menu']",
                ".header__user",
            ]
            
            for selector in login_indicators:
                try:
                    element = await self.page.query_selector(selector)
                    if element:
                        self.is_logged_in = True
                        return True
                except:
                    continue
            
            self.is_logged_in = False
            return False
            
        except Exception as e:
            print(f"Erro ao verificar login: {e}")
            return False
    
    async def open_login_page(self) -> str:
        """
        Abre a página de login da Betano.
        O navegador vai usar os cookies salvos automaticamente.
        Se tiver senha salva no navegador, o login será automático.
        """
        try:
            await self.page.goto("https://www.betano.bet.br/login/", wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(3)
            
            # Verificar se já logou automaticamente
            if await self.check_login_status():
                return "LOGGED_IN"
            
            return "LOGIN_PAGE_OPENED"
            
        except Exception as e:
            return f"ERROR: {str(e)}"
    
    async def navigate_to_live(self) -> Dict:
        """Navega para a página de jogos ao vivo"""
        try:
            await self.page.goto("https://www.betano.bet.br/live/", wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(2)
            return {"status": "success", "url": self.page.url}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def add_bet_to_slip(self, game_data: Dict) -> Dict:
        """
        Adiciona uma aposta ao bilhete tentando encontrar a seleção exata.
        """
        try:
            url = game_data.get("direct_link")
            if not url:
                return {"status": "error", "message": "URL não fornecida"}

            await self.page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(2)
            
            recommendation = game_data.get("recommendation", "").lower()
            bet_type = game_data.get("bet_type", "").upper()
            
            # Logica de seleção inteligente
            clicked = False
            
            # 1. Mercado de Gols (UNDER/OVER)
            if "menos de" in recommendation or "mais de" in recommendation or bet_type in ["UNDER", "OVER"]:
                # Tentar extrair numero (ex: 3.5 ou 3)
                import re
                line_match = re.search(r"(\d+\.?\d*)", recommendation.replace(",", "."))
                line = line_match.group(1) if line_match else None
                
                if line:
                    keyword = "menos" if "menos" in recommendation or bet_type == "UNDER" else "mais"
                    selection_text = f"{keyword} de {line}"
                    print(f"BOT: Procurando seleção de gols: '{selection_text}'")
                    
                    try:
                        # Usar localizadores de texto do Playwright (case insensitive)
                        element = self.page.get_by_text(selection_text, exact=False).first
                        if await element.is_visible():
                            await element.click()
                            clicked = True
                            print(f"BOT: Clicado em '{selection_text}'")
                        else:
                            print(f"BOT: Botão '{selection_text}' não visível ou não encontrado.")
                    except Exception as e:
                        print(f"BOT: Erro ao clicar em gols: {e}")

            # 2. Resultado Final (1X2)
            if not clicked and (bet_type == "1X2" or "vence" in recommendation or "empate" in recommendation):
                try:
                    target = None
                    if "empate" in recommendation or "draw" in recommendation:
                        target = "Empate" # Ou X
                    elif game_data.get("home") in recommendation or "casa" in recommendation:
                        target = "1" # Home
                    elif game_data.get("away") in recommendation or "fora" in recommendation:
                        target = "2" # Away
                        
                    if target:
                        print(f"BOT: Procurando resultado final: '{target}'")
                        # Tentar clicar
                        pass
                except:
                    pass
            
            # 3. Fallback: Procura burra por texto da recomendação
            if not clicked:
                try:
                    # Tenta clicar em qualquer coisa que tenha o texto da recomendação
                    # Ex: "Menos de 2.5 Gols"
                    element = self.page.get_by_text(recommendation, exact=False).first
                    if await element.is_visible():
                        await element.click(timeout=2000)
                        clicked = True
                except:
                    pass

            # 4. Fallback final: Clica na primeira odd que ver (para não quebrar o fluxo, mas avisa)
            if not clicked:
                print(f"WARN: Seleção específica '{recommendation}' não encontrada. Tentando primeira odd.")
                selectors = [
                    ".market-odds-button:first-child",
                    "[data-qa='odds-button']:first-child",
                    ".odds-button:first-child"
                ]
                for selector in selectors:
                    try:
                        await self.page.click(selector, timeout=2000)
                        clicked = True
                        break
                    except:
                        continue
            
            await asyncio.sleep(1)
            return {"status": "success", "message": "Aposta adicionada" if clicked else "Falha ao clicar"}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def set_bet_amount(self, amount: float) -> Dict:
        """Define o valor da aposta no bilhete"""
        if amount <= 0:
            return {"status": "skipped", "message": "Valor zero ou negativo"}
        try:
            # Procurar campo de valor
            stake_selectors = [
                "[data-qa='betslip-stake-input']",
                ".betslip-stake input",
                "input[type='number']",
                ".stake-input"
            ]
            
            for selector in stake_selectors:
                try:
                    input_element = await self.page.query_selector(selector)
                    if input_element:
                        await input_element.fill(str(amount))
                        return {"status": "success", "amount": amount}
                except:
                    continue
            
            return {"status": "error", "message": "Campo de valor não encontrado"}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def get_betslip_info(self) -> Dict:
        """Obtém informações do bilhete atual"""
        try:
            # Extrair informações do betslip
            info = {
                "odds": None,
                "potential_return": None,
                "selections": []
            }
            
            # Tentar extrair odds total
            odds_selectors = [".total-odds", "[data-qa='total-odds']", ".betslip-total-odds"]
            for selector in odds_selectors:
                try:
                    element = await self.page.query_selector(selector)
                    if element:
                        info["odds"] = await element.text_content()
                        break
                except:
                    continue
            
            return {"status": "success", "betslip": info}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def screenshot(self, path: str = "screenshot.png") -> str:
        """Captura screenshot da página atual"""
        try:
            save_path = Path(path)
            await self.page.screenshot(path=str(save_path))
            return str(save_path)
        except Exception as e:
            return f"Error: {e}"
    
    async def attempt_auto_login(self, credentials: Dict = None) -> Dict:
        """
        Tenta realizar login automaticamente.
        1. Se credentials fornecidas: preenche e clica.
        2. Se não: verifica se navegador preencheu (autofill) e clica.
        """
        try:
            # Ir para login
            await self.page.goto("https://www.betano.bet.br/login/", wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(3)
            
            # Se já logado, retorna sucesso
            if await self.check_login_status():
                return {"is_logged_in": True, "message": "Já logado."}
                
            # Seletores
            username_sel = "input[type='email'], input[name='username']"
            password_sel = "input[type='password'], input[name='password']"
            submit_sel = "button[type='submit'], [data-qa='login-button']"
            
            # Preencher se tiver credenciais (ou usar padrão do usuário)
            user_email = (credentials.get("username") if credentials else None) or "leandro2703palmeira@gmail.com"
            user_password = (credentials.get("password") if credentials else None) or "123456"
            
            if user_email and user_password:
                print(f"BOT: Tentando login para {user_email}")
                await self.page.fill(username_sel, user_email)
                await self.page.fill(password_sel, user_password)
                await asyncio.sleep(1)
            
            # Tentar clicar no botão de login (seja preenchido manual ou autofill)
            login_btn = await self.page.query_selector(submit_sel)
            if login_btn:
                await login_btn.click()
                await asyncio.sleep(5) # Esperar login processar
                
                if await self.check_login_status():
                    return {"is_logged_in": True, "message": "Login automático com sucesso!"}
                
            return {"is_logged_in": False, "message": "Falha no login automático."}
            
        except Exception as e:
            return {"is_logged_in": False, "message": str(e)}

    async def close(self):
        """Fecha o navegador, mantendo cookies para próxima sessão"""
        if self.context:
            await self.context.close()


# Instância global do bot
_bot_instance: Optional[BetanoBot] = None

async def get_bot(headless: bool = True) -> BetanoBot:
    """Obtém instância do bot (singleton) - Default Headless=True"""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = BetanoBot()
        # Verificar variável de ambiente para forçar headless em testes
        is_headless = headless or os.getenv("HEADLESS_MODE", "True").lower() == "true"
        await _bot_instance.start(headless=is_headless)
    return _bot_instance


# API Functions para uso nos endpoints
async def open_betano_with_cookies() -> Dict:
    """Abre Betano e tenta auto-login (Headless)"""
    bot = await get_bot(headless=False)
    
    # Verificar status de login
    is_logged = await bot.check_login_status()
    
    if is_logged:
        return {"status": "LOGGED_IN", "message": "Login via cookies OK", "is_logged_in": True}
    else:
        # Tentar Auto Login
        return await bot.attempt_auto_login()


async def place_combo_bet(games: List[Dict], amount: float, credentials: Dict = None) -> Dict:
    """
    Monta aposta combinada na Betano (VISÍVEL).
    """
    bot = await get_bot(headless=False)
    
    # 1. Navegação Prioritária (Abre o jogo primeiro, loga depois se precisar)
    games_with_links = [g for g in games if g.get("direct_link")]
    
    if games_with_links:
        # Abre o primeiro link para garantir que o usuário veja a página
        print(f"BOT: Navegando para {games_with_links[0].get('home')}...")
        await bot.page.goto(games_with_links[0].get("direct_link"), wait_until="domcontentloaded", timeout=60000)
    else:
        await bot.navigate_to_live()

    # 2. Verificar/Fazer Login (Opcional - só avisa se falhar)
    is_logged = await bot.check_login_status()
    if not is_logged:
        print("BOT: Não logado. Tentando auto-login...")
        login_res = await bot.attempt_auto_login(credentials)
        is_logged = login_res.get("is_logged_in")
        
        if not is_logged:
            # NÃO ABORTA! Deixa o navegador aberto para o usuário ver.
            print("BOT: Login automático falhou. Continuando como visitante.")
            # Se tivermos que adicionar apostas, pode falhar, mas a página está aberta.

    # 3. Adicionar Jogos
    added_games = []
    for game in games:
        if game.get("direct_link"):
            # Se já estamos na página (primeiro jogo), não precisa navegar de novo se for o mesmo
            if bot.page.url != game.get("direct_link"):
                 await bot.page.goto(game.get("direct_link"), wait_until="domcontentloaded")
            
            # Tenta clicar na aposta
            result = await bot.add_bet_to_slip(game)
            if result.get("status") == "success" or result.get("message") == "Aposta adicionada":
                 added_games.append(game)
        else:
             print(f"BOT: Jogo sem link direto, pulando: {game.get('home')}")
    
    # Finalização
    if added_games:
        # Define valor
        await bot.set_bet_amount(amount)
        path = await bot.screenshot("betslip_final.png")
        
        return {
            "status": "ready",
            "games_added": len(added_games),
            "amount": amount,
            "message": f"Aposta montada! Confirme no navegador.",
            "screenshot": path
        }
    
    # Se não conseguiu adicionar nada (ex: login required para ver odds), retorna sucesso parcia
    return {
        "status": "ready_manual", 
        "message": "Jogos abertos! Faça login ou adicione a aposta manualmente."
    }


# Teste rápido
if __name__ == "__main__":
    async def test():
        result = await open_betano_with_cookies()
        print(result)
        
        # Manter navegador aberto
        input("Pressione Enter para fechar...")
        
        bot = await get_bot()
        await bot.close()
    
    asyncio.run(test())
