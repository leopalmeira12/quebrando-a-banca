# Guia de Deploy e Acesso Remoto

Como sua aplicação tem um **Robô de Scraping (Betano)**, hospedá-la gratuitamente é desafiador, pois a maioria dos servidores grátis não suporta o navegador Chrome (necessário para o robô) ou bloqueia o acesso à Betano.

A melhor solução GRATUITA para você "ver na internet" e mandar para amigos, mantendo tudo funcionando, é criar um **Túnel** no seu computador.

---

## 🚀 Opção 1 (Recomendada): Ngrok (Túnel)

Isso cria um link público (ex: `https://seu-site.ngrok-free.app`) que redireciona para o seu computador.
**Vantagem:** O Robô continua rodando no seu PC (onde já funciona) e você acessa de qualquer lugar.
**Desvantagem:** O PC precisa ficar ligado.

### Passo a Passo:

1. Baixe o **Ngrok**: https://ngrok.com/download
2. Crie uma conta grátis no site e pegue seu `Authtoken`.
3. Instale/Configure no seu terminal (CMD):
   ```cmd
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```

4. **Para expor o Frontend (Site):**
   Abra um novo terminal e rode:
   ```cmd
   ngrok http 3000
   ```
   *Copie o link HTTPS que ele gerar. Esse é o link do seu site!*

5. **Para expor o Backend (API):**
   *(Essa parte é chatinha no plano free do Ngrok pois só permite 1 túnel por vez. Mas para VISUALIZAR, você pode usar apenas o túnel do Frontend e deixar o Backend rodando local se estiver na mesma rede, OU usar uma alternativa como o `localtunnel` para ter 2 links)*.

   **Dica:** Se você quer mostrar para alguém fora da sua rede Wi-Fi, o Frontend precisa saber encontrar o Backend.
   1. Gere um link pro Backend: `ngrok http 8000`
   2. Copie esse link (ex: `https://api-leandro.ngrok.app`)
   3. Vá no arquivo `frontend/src/api.js` e troque `baseURL: 'http://127.0.0.1:8000'` pelo link do ngrok.
   4. Pare e inicie o `npm start`.
   5. Gere um link pro Frontend: (No Ngrok Free você teria que fechar o do backend... então recomendo a **Opção 2** para ter 2 links simultâneos).

---

## 🚀 Opção 2: Localtunnel (Totalmente Grátis e Ilimitado)

O `localtunnel` permite expor múltiplas portas sem cadastro.

**1. Expor o Backend (API):**
Abra um terminal e rode:
```powershell
npx localtunnel --port 8000
```
*Copie o link gerado (ex: `https://flat-cat-50.loca.lt`).*

**2. Configurar o Frontend:**
Vá em `frontend/src/api.js` e altere a baseURL:
```javascript
const api = axios.create({
    baseURL: 'https://COLE-O-LINK-DO-BACKEND-AQUI.loca.lt', 
    // ...
});
```

**3. Expor o Frontend:**
Abra OUTRO terminal e rode:
```powershell
npx localtunnel --port 3000
```
*Copie o link gerado (ex: `https://blue-dog-22.loca.lt`).*

➡️ **Acesse esse último link no celular ou mande para amigos!**

⚠️ **Importante:** O Localtunnel pede uma senha na primeira vez que acessa o link para evitar abuso. A senha é o seu IP externo (ele mostra no site onde pede a senha).

---

## ☁️ Opção 3: Deploy Real (Vercel + Render)

Se quiser subir pra nuvem (sem depender do PC ligado):

1. **Frontend na Vercel:**
   - Crie conta na Vercel.com
   - Instale a CLI: `npm i -g vercel`
   - Na pasta `frontend`, rode `vercel`. Siga os passos.
   - É 100% grátis e funciona super bem.

2. **Backend no Render.com (Grátis):**
   - É possível subir o FastAPI no Render (Web Service Free).
   - **PORÉM:** O Robô (Playwright) provavelmente **NÃO VAI FUNCIONAR** no plano grátis porque exige muita memória RAM e instalação do Chrome, que o plano free limita.
   - Você teria o painel online, mas as "Oportunidades Ao Vivo" da Betano ficariam vazias ou dariam erro.

**Resumo:** Use a **Opção 2 (Localtunnel)** para testes rápidos agora. Use a **Opção 1** se quiser algo mais estável (mas precisa criar conta).
