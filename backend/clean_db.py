import sqlite3
import os
import datetime

# Usar caminho absoluto para o banco
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
DB_PATH = os.path.join(DATA_DIR, "games.db")

def clean_duplicates():
    if not os.path.exists(DB_PATH):
        print(f"Banco não encontrado em {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("--- INICIANDO LIMPEZA DE DADOS DUPLICADOS ---")
    
    # Contagem inicial
    cursor.execute("SELECT COUNT(*) FROM results")
    initial_count = cursor.fetchone()[0]
    print(f"Total inicial de registros: {initial_count}")

    # Lógica: Remover registros do mesmo jogo que ocorreram em menos de 10 segundos de diferença
    # e que tenham o mesmo multiplicador (captura durante o crescimento)
    cursor.execute("""
    DELETE FROM results 
    WHERE id NOT IN (
        SELECT MIN(id) 
        FROM results 
        GROUP BY game, CAST(multiplier AS TEXT), strftime('%Y-%m-%d %H:%M', timestamp)
    )
    """)
    
    conn.commit()
    
    # Contagem final
    cursor.execute("SELECT COUNT(*) FROM results")
    final_count = cursor.fetchone()[0]
    print(f"Total final de registros: {final_count}")
    print(f"Registros removidos: {initial_count - final_count}")
    
    # Limpar modelos antigos para forçar re-treinamento com dados limpos
    model_aviator = os.path.join(DATA_DIR, "model_aviator.joblib")
    model_jetx = os.path.join(DATA_DIR, "model_jetx.joblib")
    
    if os.path.exists(model_aviator):
        os.remove(model_aviator)
        print("Modelo Aviator removido para re-treinamento.")
    if os.path.exists(model_jetx):
        os.remove(model_jetx)
        print("Modelo JetX removido para re-treinamento.")
        
    conn.close()
    print("--- LIMPEZA CONCLUÍDA ---")

if __name__ == "__main__":
    clean_duplicates()
