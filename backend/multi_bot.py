import asyncio
from playwright.async_api import async_playwright
import urllib.parse

class MultiBookmakerBot:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None

    async def start(self):
        playwright = await async_playwright().start()
        # Headless=False para você ver a "IA" trabalhando
        self.browser = await playwright.chromium.launch(headless=False, channel="chrome")
        self.context = await self.browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        self.page = await self.context.new_page()

    async def navigate_sportingbet(self, game_info):
        """
        Inteligência para Sportingbet:
        1. Tenta Busca Direta via URL
        2. Se falhar, tenta navegar pelos menus (placeholder)
        """
        home_team = game_info.get("home")
        print(f"🤖 [Sportingbet] Iniciando busca inteligente para: {home_team}")
        
        # Estratégia 1: Link de busca direto (Simula digitar na busca)
        # A Sportingbet permite busca por query params em algumas versões, mas navegar na interface é mais garantido/visual.
        
        await self.page.goto("https://sports.sportingbet.com/pt-br/sports", wait_until="domcontentloaded")
        await asyncio.sleep(3)
        
        try:
            # Tenta encontrar botão de busca (Lupa)
            # Os seletores mudam, então vamos tentar clicar em ícones comuns
            search_btn = self.page.locator("vn-search-icon, .search-icon, [data-testid='search-icon']")
            if await search_btn.count() > 0:
                await search_btn.first.click()
            else:
                # Se não achar lupa, tenta ir para URL de busca (fallback)
                safe_query = urllib.parse.quote(home_team)
                await self.page.goto(f"https://sports.sportingbet.com/pt-br/sports/search?q={safe_query}")
            
            await asyncio.sleep(2)
            
            # Digitar nome do time
            search_input = self.page.locator("input[type='search'], input[placeholder='Buscar']")
            if await search_input.count() > 0:
                await search_input.first.fill(home_team)
                await self.page.keyboard.press("Enter")
                print("🤖 [Sportingbet] Pesquisando time...")
                
                await asyncio.sleep(3)
                
                # Tentar clicar no primeiro evento que pareça o jogo
                # Geralmente tem a classe 'event-name' ou similar
                # Vamos tentar clicar no primeiro link que contenha o nome do time e 'vs' ou 'x'
                
                links = self.page.locator(f"a:has-text('{home_team}')")
                count = await links.count()
                for i in range(count):
                    txt = await links.nth(i).inner_text()
                    if " v " in txt or " X " in txt or "-" in txt:
                        print(f"🤖 [Sportingbet] Encontrei o jogo: {txt}")
                        await links.nth(i).click()
                        break
            
        except Exception as e:
            print(f"❌ Erro na navegação Sportingbet: {e}")

    async def navigate_bet365(self, game_info):
        """
        Inteligência para bet365 (Hardcore):
        A bet365 tem proteções pesadas. Vamos tentar o acesso básico de busca.
        """
        home_team = game_info.get("home")
        print(f"🤖 [bet365] Iniciando busca inteligente para: {home_team}")
        
        # A bet365 é muito hostil a automação. 
        # Vamos tentar apenas abrir a página de futebol e deixar o usuário terminar, 
        # ou tentar a busca se a proteção permitir.
        
        await self.page.goto("https://www.bet365.com/#/AX/K^Soccer/", wait_until="domcontentloaded")
        await asyncio.sleep(5)
        
        try:
            # Tentar clicar na lupa (Geralmente canto superior direito)
            # A classe é dinâmica e ofuscada, vamos tentar por texto ou posição
            lupa = self.page.locator(".hm-MainHeader_SearchButton")
            if await lupa.count() > 0:
                await lupa.click()
                await asyncio.sleep(1)
                
                input_field = self.page.locator(".sgl-SearchHeader_Input")
                await input_field.fill(home_team)
                await asyncio.sleep(2)
                
                # Clicar no primeiro resultado
                first_res = self.page.locator(".ssm-SiteSearch_ResultLink").first
                if await first_res.is_visible():
                    print(f"🤖 [bet365] Jogo encontrado!")
                    await first_res.click()
            else:
                print("⚠️ [bet365] Lupa de busca não encontrada / Bloqueio detectado.")
                
        except Exception as e:
            print(f"❌ Erro na navegação bet365: {e}")

    async def run(self, bookmaker, game_info):
        await self.start()
        
        if bookmaker.lower() == "sportingbet":
            await self.navigate_sportingbet(game_info)
        elif bookmaker.lower() == "bet365":
            await self.navigate_bet365(game_info)
        else:
            print("Casa desconhecida")
            
        # Não fecha o navegador para o usuário continuar
        # await self.context.close()  <-- COMENTADO PROPOSITALMENTE

# Singleton helper
bot_instance = None
async def get_multi_bot():
    global bot_instance
    if not bot_instance:
        bot_instance = MultiBookmakerBot()
    return bot_instance
