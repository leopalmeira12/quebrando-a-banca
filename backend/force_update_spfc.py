from playwright.sync_api import sync_playwright
import json
import os
import time

DATA_FILE = os.path.join(os.path.dirname(__file__), "google_data.json")

def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def force_update_spfc():
    print("🚀 Iniciando força-tarefa de atualização do SPFC...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Mude para False se quiser ver rodando
        page = browser.new_page()
        
        # Estratégia 1: Busca direta agressiva
        query = "técnico do são paulo fc atual 2026"
        print(f"Buscando: {query}")
        page.goto(f"https://www.google.com/search?q={query}")
        page.wait_for_timeout(3000)
        
        coach = None
        
        # Estratégia Principal: Busca em Featured Snippets (.hgKElc) e Knowledge Graph
        try:
            selectors = [
                 ".hgKElc", # Snippet de destaque (texto grande) - Chave para notícias da CNN/Globo
                 "div[data-attrid='subtitle']", 
                ".Z0LcW", 
                "div[data-attrid='description']",
                ".di3YZe"
            ]
            
            for sel in selectors:
                els = page.query_selector_all(sel)
                for el in els:
                    text = el.inner_text()
                    print(f"DEBUG SELECTOR {sel}: {text}")
                    
                    clean_text = text.replace("Treinador: ", "").strip()
                    
                    # Match Inteligente de Nomes (Baseado no feedback do usuário sobre Crespo)
                    known_coaches = ["Crespo", "Zubeldía", "Carpini", "Dorival", "Ceni"]
                    found = next((c for c in known_coaches if c in clean_text), None)
                    
                    if len(clean_text) < 40 and "Wiki" not in clean_text:
                        coach = clean_text # Nome curto direto
                        break
                    elif found:
                        # Extrai nome completo se possível
                        if "Hernán Crespo" in clean_text: coach = "Hernán Crespo"
                        elif "Luis Zubeldía" in clean_text: coach = "Luis Zubeldía"
                        else: coach = found
                        break
                        
                if coach: break
                
        except Exception as e:
            print(f"Erro nos seletores: {e}")
            
        # Estratégia 2: Busca nos Snippets (Títulos e Descrições dos resultados)
        if not coach:
            print("Tentando ler snippets dos resultados...")
            snippets = page.query_selector_all(".VwiC3b") # Descrição do resultado
            for snippet in snippets:
                text = snippet.inner_text()
                if "técnico" in text.lower() or "treinador" in text.lower():
                    print(f"DEBUG SNIPPET: {text}")
                    # Tenta extrair nomes comuns (lógica simplificada)
                    # Procura por "técnico Fulano" ou "técnico X"
                    # Isso é difícil de fazer perfeito com regex simples, mas vamos tentar achar Nomes Próprios
                    if "Zubeldía" in text:
                        coach = "Luis Zubeldía" # Confirmação por snippet
                        break
                    if "Carpini" in text:
                         coach = "Thiago Carpini"
                         break
                    if "Dorival" in text:
                        coach = "Dorival Júnior"
                        break
            
            # Tenta ler H3 (Títulos)
            if not coach:
                titles = page.query_selector_all("h3")
                for title in titles:
                    t_text = title.inner_text()
                    if "técnico" in t_text.lower():
                        print(f"DEBUG TITLE: {t_text}")
                        # Lógica ad-hoc para os técnicos mais recentes do SPFC (ajuda a confirmar)
                        if "Zubeldía" in t_text: coach = "Luis Zubeldía"; break
                        if "Crespo" in t_text: coach = "Hernán Crespo"; break
                            
        print(f"✅ Resultado Final: {coach}")
        
        if coach:
            data = load_data()
            if "São Paulo" in data:
                print(f"Atualizando banco de dados... (Antigo: {data['São Paulo']['lineup']['coach']})")
                data["São Paulo"]["lineup"]["coach"] = coach
                save_data(data)
                print("Banco de dados atualizado!")
            else:
                print("São Paulo não encontrado no JSON.")
        else:
            print("❌ Não consegui identificar o nome do técnico.")
            
        browser.close()

if __name__ == "__main__":
    force_update_spfc()
