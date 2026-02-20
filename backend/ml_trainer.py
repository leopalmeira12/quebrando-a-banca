import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
import time

# Configuração de caminhos absolutos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
DATABASE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'games.db')}"

print(f"[ML_TRAINER] Usando banco em: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

def prepare_data(game):
    query = f"SELECT multiplier FROM results WHERE game='{game}' ORDER BY timestamp ASC"
    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        print(f"Erro ao ler banco: {e}")
        return None, None
    
    if len(df) < 50:
        return None, None
    
    # Criar features: últimos 5 multiplicadores (Janela Deslizante)
    for i in range(1, 6):
        df[f'last_{i}'] = df['multiplier'].shift(i)
    
    # Target: o próximo é >= 2.0? (1 = Sim, 0 = Não)
    df['target'] = (df['multiplier'].shift(-1) >= 2.0).astype(int)
    
    df = df.dropna()
    
    X = df[['last_1', 'last_2', 'last_3', 'last_4', 'last_5']]
    y = df['target']
    
    return X, y

def train_model(game):
    X, y = prepare_data(game)
    
    if X is None or len(X) < 50:
        print(f"[{game}] Dados insuficientes ({len(X) if X is not None else 0}). Coletando mais dados...")
        return
    
    # Stratified split to maintain class distribution
    # Usar até 2000 registros para treino robusto
    if len(X) > 2000:
        X = X.tail(2000)
        y = y.tail(2000)
        
    print(f"[{game}] Treinando Gradient Boosting com {len(X)} registros...")
    
    # Modelo Conservador: Gradient Boosting otimizado para precisão
    model = GradientBoostingClassifier(
        n_estimators=200, 
        learning_rate=0.05, 
        max_depth=4, 
        random_state=42
    )
    model.fit(X, y)
    
    # Avaliação simples
    accuracy = model.score(X, y)
    print(f"[{game}] Acurácia (Treino): {accuracy:.2f}")
    
    model_path = os.path.join(DATA_DIR, f"model_{game}.joblib")
    joblib.dump(model, model_path)
    print(f"Modelo salvo em: {model_path}")

if __name__ == "__main__":
    while True:
        print("Iniciando ciclo de treinamento ML...")
        train_model("aviator")
        train_model("jetx")
        print("Ciclo concluído. Aguardando 5 minutos...")
        time.sleep(300)
