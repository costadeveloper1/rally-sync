# 🎯 Especificação Funcional: Ferramenta de Sincronia de Rallies (UTC)

Este documento descreve **o que a solução precisa fazer** na prática para os jogadores dentro do servidor do Discord, operando no formato de uma **Discord Activity** (janela visual interativa compartilhada dentro do próprio aplicativo do Discord).

## 1. Objetivo Central

Permitir que um grupo de jogadores coordene **rallies simultâneos** em um jogo de estratégia, garantindo que todas as tropas atinjam o alvo no **mesmo segundo exato**, utilizando como referência o relógio global **UTC** em tempo real.

## 2. Formato de Exibição e Ambiente (Discord Activity)

* **Janela Interativa Compartilhada:** A solução será uma **Discord Activity** — um mini-aplicativo visual embutido dentro do próprio Discord (acessível tanto no PC quanto no Celular).

* **Sincronização Visual ao Vivo:** Todos os jogadores que entrarem na Activity de um canal enxergam a mesma janela interativa simultaneamente, com cronômetros correndo segundo a segundo, indicadores visuais e atualização instantânea sempre que o coordenador inserir ou alterar um dado.

* **Isolamento por Canal:** A Activity deve funcionar de forma independente em vários canais do servidor ao mesmo tempo (ex: um rally sendo coordenado no *Canal Castelo* enquanto outro diferente ocorre no *Canal Fortaleza*, sem cruzar informações).

* **Hierarquia de Acesso (Coordenador vs. Participantes):** 
  * **Coordenador (Permissão Especial):** Apenas o usuário que possuir um cargo ou permissão específica no canal/servidor (ex: `@Líder de Rally` ou permissão de *Gerenciar Mensagens*) tem acesso aos controles de edição, cadastro de tempos e disparo do cronômetro.
  * **Demais Jogadores (Modo Visualização):** Todos os outros membros conectados no canal visualizam a janela em tempo real, acompanham a contagem regressiva e recebem os alertas, mas não podem inserir nem alterar os tempos na lista.

## 3. Detalhamento de Todas as Funções Necessárias

### Função 1: Parâmetros Fixos do Rally e Janela de Preparação

* **O que faz:** Em vez de digitar manualmente uma hora futura de impacto, o sistema opera sobre o **relógio UTC atual (em tempo real)** e trabalha com regras fixas do jogo:

  1. **Duração Fixa do Rally (Tempo de Espera):** O coordenador pode selecionar entre os tempos padrão do jogo (**5 minutos** ou **10 minutos**), que é o tempo em que as tropas aguardam reunidas antes de começar a caminhar. *(Nota: Como todos os participantes abrem rallies com a mesma duração fixa, a diferença de chegada depende exclusivamente do tempo de marcha de cada um).*

  2. **Janela de Preparação (Contagem Inicial):** Ao acionar o início/reinício da contagem, o sistema aplica um tempo de preparo selecionável (**10 segundos**, **20 segundos** ou **1 minuto**) antes da partida do primeiro jogador, dando tempo para todos olharem a tela e se posicionarem.

### Função 2: Cadastro Centralizado dos Tempos de Marcha (Acesso Restrito)

* **O que faz:** Apenas **1 pessoa autorizada** (o coordenador com permissão/cargo específico no canal) visualiza e pode utilizar o formulário para registrar o nome e o tempo de marcha de todos os jogadores da operação. Para os demais jogadores, os campos de inserção ficam ocultos ou bloqueados.

* **Dados inseridos pelo coordenador:**

  1. Nome ou apelido de cada jogador no jogo.

  2. Tempo de deslocamento (marcha) da base daquele jogador até o alvo (ex: `30` segundos, `35` segundos, `01:15`).

* **Atualização de dados:** Se o coordenador inserir novamente o nome de um jogador que já está na lista com um novo tempo (por exemplo, caso o jogador tenha teleportado para mais perto do alvo), o sistema substitui o tempo antigo pelo novo instantaneamente para todos os conectados, sem duplicar o nome na lista.

### Função 3: Disparo Automático (Botão Iniciar / Reiniciar Contagem) e Cálculo em Tempo Real

* **O que faz:** Quando todos os jogadores já estiverem cadastrados na lista, o coordenador clica no botão de **Iniciar / Reiniciar Sequência**.

* **Lógica de Cálculo Instantâneo:**

  1. O sistema captura o **horário exato atual em UTC** no momento do clique (ex: `21:08:00 UTC`).

  2. Define a saída do **1º jogador** (quem tem a maior marcha) para `Hora Atual + Janela de Preparação` (ex: `21:08:00 + 20s = 21:08:20 UTC`).

  3. Calcula o horário exato de impacto somando a duração do rally + a marcha desse 1º jogador.

  4. Calcula o horário exato de saída de todos os outros jogadores com base na diferença de segundos entre as marchas, garantindo que todos batam no alvo no mesmo segundo.

* **Cronômetro Regressivo ao Vivo:** Exibe um contador visual regressivo em destaque (`00:20`, `00:19`, `00:18`...) correndo segundo a segundo na tela de todos os conectados até a saída do primeiro jogador e o andamento das marchas.

### Função 4: Exibição Limpa da Ordem de Saída

* **O que faz:** Apresenta os resultados ordenados cronologicamente (do jogador com marcha mais longa para o de marcha mais curta) diretamente na janela interativa para todos os espectadores, exibindo o nome do jogador e o horário exato em UTC em que ele deve iniciar seu rally.

* **Exemplo prático de funcionamento:**

  * *Cenário:* Clique às `21:08:00 UTC` com janela de `20s`. Bruno tem marcha de `40s`, JR tem `36s`, FN tem `31s`.

  * *Resultado exibido na tela:*

    ```text
    Bruno 21:08:20 UTC
    JR 21:08:24 UTC
    FN 21:08:29 UTC
    ```

### Função 5: Alerta Visual e Sonoro na Hora da Partida

* **O que faz:** Acompanha a contagem regressiva inicial (10s, 20s ou 1 minuto) dentro da janela e dispara um destaque visual (e opcionalmente um alerta sonoro na interface) no momento exato em que cada jogador deve iniciar sua marcha, garantindo atenção total da equipe.

### Função 6: Limpar Lista (Zerar Jogadores)

* **O que faz:** Exclusivo para o coordenador, além do botão que **reinicia o cronômetro** mantendo os mesmos jogadores (ideal quando o grupo vai repetir o rally contra o mesmo alvo logo em seguida), deve haver um botão separado para **Limpar Lista**, que apaga todos os jogadores registrados quando a operação naquele canal terminar.