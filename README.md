# 🎯 Rally Sync — Discord Activity

Ferramenta visual interativa para sincronização de ataques conjuntos (**rallies**) em jogos de estratégia, operando no formato de uma **Discord Activity** em tempo real com relógio global UTC.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ (recomendado Node.js 20+)
- npm 9+

### 2. Instalação das Dependências
Instala as dependências do monorepo (cliente e servidor):
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz ou configure no backend (consulte `.env.example`):
```env
PORT=3001
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui
COORDINATOR_ROLE_NAME="Líder de Rally"
```
> *Nota: Para desenvolvimento local no navegador, o sistema possui mock automático caso as credenciais do Discord ainda não tenham sido configuradas.*

### 4. Iniciar em Modo de Desenvolvimento
Executa simultaneamente o servidor backend (porta 3001) e o frontend Vite com hot reload (porta 3000):
```bash
npm run dev
```

Acesse no navegador:
👉 **http://localhost:3000**

---

## 🧪 Modos de Teste e Demonstração

1. **Modo Navegador Local (Standalone):**
   - Ao abrir `http://localhost:3000` fora do Discord, o aplicativo ativa o modo simulado de desenvolvimento.
   - Um botão **"Trocar Papel"** no topo permite alternar instantaneamente entre a visão do **Coordenador** (com o painel de controle e inputs) e a visão do **Espectador** (apenas cronômetro e visualização).
   - Abra duas janelas do navegador (uma em aba anônima ou com canais diferentes como `http://localhost:3000?channel=sala-1` e `http://localhost:3000?channel=sala-2`) para testar o isolamento de canais e sincronia em tempo real!

2. **Modo Discord Activity:**
   - Exponha o servidor local usando um túnel HTTPS:
     ```bash
     npx cloudflared tunnel --url http://localhost:3001
     # ou
     npx ngrok http 3001
     ```
   - No [Discord Developer Portal](https://discord.com/developers/applications):
     - Vá em **Activities** e defina a URL do túnel como URL de mapeamento da Activity.
     - Entre em um canal de voz/texto no Discord e abra a Activity no menu do foguete (Activities)!

---

## 🧪 Rodar os Testes Automatizados

Executa a suíte de testes unitários do motor de cálculo UTC e o teste ponta a ponta (E2E) com múltiplos sockets:
```bash
npm test
```

## 📦 Build para Produção
Compila o cliente React e o servidor TypeScript:
```bash
npm run build
```
Para rodar em produção:
```bash
npm start
```
