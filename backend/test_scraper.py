import asyncio
from betano_scraper import scrape_betano_live

async def main():
    print("--- TESTE 2: SCRAPER RELAXADO ---")
    try:
        data = await scrape_betano_live()
        games = data.get("all_games", [])
        
        print(f"Jogos encontrados: {len(games)}")
        if len(games) > 0:
            print("Exemplo:")
            print(games[0])
            
            # Verifica se tem 'ESMAGADORA'
            esmagadoras = [g for g in data.get("opportunities", []) if g.get("opportunity_type") == "ESMAGADORA"]
            if esmagadoras:
                print(f"🔥 SUCESSO! {len(esmagadoras)} Oportunidades 'ESMAGADORA' detectadas!")
                print(esmagadoras[0])
        else:
            print("⚠️ Ainda zerado.")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    asyncio.run(main())
