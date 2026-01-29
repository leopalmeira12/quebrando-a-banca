
import json
import os
import time
import random
import logging
from playwright.sync_api import sync_playwright

# Configuração de Logging
logging.basicConfig(
    filename='scraper_debug.log', 
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Caminho para o arquivo de dados
DATA_FILE = os.path.join(os.path.dirname(__file__), "google_data.json")

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    logging.error("Arquivo de dados google_data.json não encontrado.")
    return {}

def save_data(data):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        logging.info("Dados salvos e atualizados com sucesso.")
    except Exception as e:
        logging.error(f"Erro ao salvar dados: {e}")

def get_google_info(team_name):
    """
    Busca informações atualizadas do time no Google.
    Foca principalmente no Técnico e status recente.
    """
    logging.info(f"Iniciando busca Google para: {team_name}")
    print(f"🔄 Buscando atualização no Google para: {team_name}...")
    
    with sync_playwright() as p:
        try:
            # Lança navegador headless (invisível)
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Busca por "Técnico do [Time]"
            query = f"técnico do {team_name}"
            page.goto(f"https://www.google.com/search?q={query}")
            
            # Espera um pouco para garantir carregamento dinâmico
            page.wait_for_timeout(2000)
            
            coach = None
            
            # Seletores de Resposta Rápida (Featured Snippets) e Knowledge Graph
            selectors = [
                ".hgKElc", # Snippet de destaque (texto grande) - Onde provavelmente está o "Hernán Crespo" da CNN
                "div[data-attrid='subtitle']", 
                ".Z0LcW", 
                "div[data-attrid='description']",
                ".LGOjhe", # Outro tipo de header de resposta
                ".di3YZe", # Texto de resposta direta
                "span[class='LrzXr kno-fv']",
                "div[data-attrid='kc:/sports/team:coach'] span"
            ]
            
            for sel in selectors:
                try:
                    elements = page.query_selector_all(sel)
                    for element in elements:
                        text = element.inner_text()
                        if text:
                            logging.info(f"Texto bruto encontrado ({sel}): {text}")
                            
                            # Limpeza e Extração Inteligente
                            # Se o texto for longo (como um parágrafo da CNN), precisamos extrair o nome
                            clean_text = text.replace("Treinador: ", "").replace("Coach: ", "").strip()
                            
                            # Lista de nomes conhecidos para "match" rápido (ajuda a confirmar)
                            known_coaches = ["Crespo", "Zubeldía", "Abel", "Tite", "Renato", "Diniz", "Carpini", "Mano", "Ceni"]
                            
                            found_known = next((name for name in known_coaches if name in clean_text), None)
                            
                            if len(clean_text) < 40 and "Wiki" not in clean_text:
                                # Se for curto, é provavelmente só o nome
                                coach = clean_text
                                break
                            elif found_known:
                                # Se for longo mas tem um nome conhecido, vamos tentar extrair o nome completo ao redor
                                # Ex: "...o técnico do São Paulo, Hernán Crespo, fez..."
                                # Regex simples ou split
                                if "Hernán Crespo" in clean_text: coach = "Hernán Crespo"
                                elif "Luis Zubeldía" in clean_text: coach = "Luis Zubeldía"
                                elif "Abel Ferreira" in clean_text: coach = "Abel Ferreira"
                                else: coach = found_known # Fallback para o sobrenome
                                break
                                
                    if coach:
                        break
                except:
                    continue
            
            # Se não achou nos seletores específicos, tenta busca textual inteligente (Regex/Humana)
            if not coach:
                try:
                    content_text = page.locator("body").inner_text()
                    lines = content_text.split('\n')
                    for line in lines:
                        # Procura padrões comuns de resposta do Google
                        if "Treinador:" in line or "Técnico:" in line or "Coach:" in line:
                            parts = line.split(":")
                            if len(parts) > 1:
                                candidate = parts[1].strip()
                                # Limpa lixo (ex: datas, wikipedia)
                                candidate = candidate.split("(")[0].strip()
                                if 3 < len(candidate) < 30:
                                    coach = candidate
                                    logging.info(f"Técnico encontrado via Texto Bruto: {coach}")
                                    break
                except Exception as e:
                    logging.warning(f"Erro na busca textual: {e}")

            logging.info(f"Resultado final para {team_name}: {coach if coach else 'Não identificado'}")
            print(f"   -> Técnico: {coach if coach else 'Mantido/Não encontrado'}")
            
            return {
                "coach": coach,
                "last_update": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
        except Exception as e:
            logging.error(f"Erro crítico ao buscar {team_name}: {e}")
            print(f"❌ Erro ao buscar {team_name}: {e}")
            return None
        finally:
            if 'browser' in locals():
                browser.close()

def get_next_game_info(team_name):
    """
    Busca o próximo jogo do time no Google.
    """
    logging.info(f"Buscando PRÓXIMO JOGO para: {team_name}")
    print(f"⚽ Buscando próximo jogo: {team_name}...")
    
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Busca específica
            page.goto(f"https://www.google.com/search?q=próximo+jogo+{team_name}")
            page.wait_for_timeout(2000)
            
            opponent = "A definir"
            date = "Em breve"
            competition = "Campeonato"
            
            # Tenta ler o Card de Esportes do Google (Sports Result)
            # Geralmente tem classes como "imso_mh__score-kont" ou estrutura de tabela
            
            # Simplificação: Tentar ler o nome do adversário no snippet de destaque ou card
            # Ex: "São Paulo enfrenta o Palmeiras..."
            
            # Seletor genérico de card de jogo
            game_card = page.query_selector("div.imso-loa") # Card de lista de jogos
            if game_card:
                text = game_card.inner_text()
                # Tenta extrair. É complexo, mas vamos tentar pegar o primeiro time que não seja o próprio
                print(f"DEBUG GAME CARD: {text}")
            
            # Fallback textual para MVP
            content = page.locator("body").inner_text().lower()
            if "próxima partida" in content or "próximo jogo" in content:
                # Tenta achar "vs" ou "contra"
                pass

            # Nota: Implementação completa de scrape de jogos é complexa para um script simples.
            # Vou focar na estrutura de atualização para demonstrar a intenção.
            
            # Simulando sucesso para demonstrar a arquitetura (em produção, precisaria de seletores de Sports Widget robustos)
            # Se o Google falhar, mantemos o que tem no banco para não quebrar.
            
            browser.close()
            return None # Retorna None por enquanto para não sobrescrever com lixo até refinarmos os seletores de Jogo
            
        except Exception as e:
            print(f"Erro ao buscar jogo: {e}")
            return None

def update_all_teams():
    data = load_data()
    if not data:
        return

    logging.info(f"Iniciando ciclo de atualização para {len(data)} times.")
    
    teams_updated_count = 0
    
    # Randomiza a ordem para não parecer robô viciado na mesma sequência
    team_list = list(data.keys())
    random.shuffle(team_list)
    
    for team_name in team_list:
        # Verifica se precisa atualizar
        current_data = data[team_name]
        
        # 1. Atualizar TÉCNICO
        if random.random() < 0.2: # 20% de chance a cada ciclo (para não sobrecarregar)
            info = get_google_info(team_name)
            if info and info.get("coach"):
                if "lineup" not in data[team_name]:
                    data[team_name]["lineup"] = {}
                
                new_coach = info["coach"]
                old_coach = data[team_name]["lineup"].get("coach", "")
                
                if new_coach != old_coach:
                    logging.info(f"ATUALIZAÇÃO: {team_name} mudou de '{old_coach}' para '{new_coach}'")
                    data[team_name]["lineup"]["coach"] = new_coach
                    data[team_name]["lineup"]["last_checked"] = info["last_update"]
                    save_data(data)
                    teams_updated_count += 1
                    time.sleep(random.uniform(3, 7))

        # 2. Atualizar PRÓXIMO JOGO (Novo)
        # game_info = get_next_game_info(team_name)
        # if game_info:
        #    data[team_name]["next_games"] = [game_info]
        #    save_data(data)
    
    logging.info(f"Ciclo de atualização finalizado. {teams_updated_count} times processados.")

if __name__ == "__main__":
    # Garante que playwright browsers estão instalados
    os.system("playwright install chromium")
    update_all_teams()
