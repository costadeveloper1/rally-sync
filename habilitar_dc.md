1. Como fazer com que isso funcione dentro de um servidor do Discord?

Para rodar como uma Discord Activity de verdade dentro dos canais do seu servidor, o fluxo é o seguinte:

Passo 1: Criar a Aplicação no Portal do Discord
Acesse o Discord Developer Portal.
Clique em "New Application" e dê um nome (ex: Rally Sync).
Na aba General Information:
Copie o Application ID (este é o seu DISCORD_CLIENT_ID).
Na aba OAuth2:
Em Client Secret, clique em Reset Secret e copie o código (este é o seu DISCORD_CLIENT_SECRET).
Salve ambos no seu arquivo .env.
Passo 2: Habilitar o recurso de Activity
No menu lateral do Developer Portal, vá na seção Activities (ou Embedded App SDK).
Habilite a opção de atividade.
Configure o URL Mapping: o Discord precisa de uma URL pública HTTPS para carregar a Activity dentro do aplicativo.
Passo 3: Expor seu servidor local (Para Desenvolvimento/Testes)

Como o Discord exige HTTPS e roda na nuvem, para testar a partir do seu PC você precisa de um túnel seguro temporário:

Usando Cloudflare Tunnel (gratuito e sem cadastro):
bash
npx cloudflared tunnel --url http://localhost:3001
(Ele vai gerar uma URL pública do tipo https://xxxxxx.trycloudflare.com).
Cole essa URL HTTPS gerada no campo URL Mappings da sua Activity no Developer Portal.
Passo 4: Abrir no Discord
Entre em qualquer Canal de Voz do seu servidor do Discord no PC ou Celular.
No rodapé do canal de voz, clique no botão do Foguete 🚀 ("Iniciar uma Atividade").
Selecione o seu Rally Sync na lista. Ele abrirá a janela interativa diretamente na chamada para todos que estiverem com você!