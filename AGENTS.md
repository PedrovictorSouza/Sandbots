# AGENTS.md

Este arquivo define regras operacionais obrigatorias para qualquer IA que trabalhe neste projeto. O objetivo e manter o trabalho pequeno, verificavel e cirurgico, evitando consumo excessivo de contexto, leituras desnecessarias, refatoracoes amplas e tentativas de resolver problemas grandes demais em uma unica passada.

## Regra principal

Antes de agir, reduza o escopo. A IA deve preferir a menor mudanca correta, tocar o menor numero possivel de arquivos e parar cedo quando a tarefa ficar ampla, incerta ou dependente de tentativa e erro.

## 1. Preflight obrigatorio antes de codar

Antes de qualquer implementacao, a IA deve fazer um preflight e identificar:

- Qual e o objetivo exato da tarefa.
- Quais arquivos provavelmente estao envolvidos.
- Qual e a menor alteracao possivel para cumprir o objetivo.
- Quais partes do projeto nao devem ser tocadas.
- Quais riscos existem.
- Se a tarefa parece pequena, media, grande ou grande demais.

Classificacao sugerida:

- Pequena: mudanca localizada, com erro ou objetivo claro, envolvendo ate 2 arquivos.
- Media: envolve algum fluxo entre arquivos, mas ainda tem escopo claro e baixo risco.
- Grande: exige entender varios subsistemas, alterar mais de 3 arquivos ou mexer em logica compartilhada.
- Grande demais: exige compreender o projeto inteiro, arquitetura global ou muitas tentativas sem diagnostico claro.

Se o preflight indicar tarefa grande ou grande demais, a IA deve propor uma divisao menor antes de implementar.

## 2. Deteccao de "zona burra"

A IA deve considerar que esta entrando em zona de risco quando qualquer uma destas condicoes aparecer:

- Precisa ler mais de 8 arquivos.
- Precisa modificar mais de 3 arquivos.
- Envolve arquitetura, runtime, camera, render frame, fluxo de cenas, input ou sistemas globais.
- Nao ha erro claro, stack trace, comportamento reproduzivel ou criterio objetivo de sucesso.
- Exige tentativa e erro repetida.
- O pedido usa termos como "corrija tudo", "deixe perfeito", "entenda o projeto inteiro" ou "faca globalmente".

Ao detectar essa zona, a IA deve parar antes de implementar e retornar:

- O que ja entendeu.
- Por que o escopo ficou arriscado.
- Uma divisao menor da tarefa.
- A primeira etapa segura que pode ser feita separadamente.

## 3. Regra de orcamento de contexto

Se a tarefa parecer que pode consumir mais de 100k tokens de contexto ou raciocinio, ela nao deve ser executada em uma unica passada.

Nesse caso, a IA deve retornar:

- Resumo do que entendeu.
- Arquivos provaveis.
- Duvidas ou partes desconhecidas.
- Plano reduzido.
- Primeira etapa pequena e segura.

A IA so deve seguir para implementacao depois que a etapa reduzida estiver clara e couber em uma alteracao pequena.

## 4. Busca e leitura de arquivos

A IA deve usar busca antes de abrir arquivos. Preferir `rg`, `rg --files` ou ferramenta equivalente para localizar pontos relevantes.

Regras de leitura:

- Nao ler o projeto inteiro.
- Nao abrir arquivos grandes sem motivo claro.
- Nao expandir a investigacao alem do necessario.
- Preferir trechos especificos em vez de arquivos completos.
- Parar de buscar quando houver contexto suficiente para uma mudanca pequena.
- Se a leitura passar de 8 arquivos, aplicar a regra de zona de risco.

## 5. Regra especifica para jogo

Este projeto e um jogo, nao um site responsivo.

A IA nao deve aplicar solucoes genericas de layout web quando estiver mexendo em:

- `game-stage`
- render frame
- camera
- cinematic
- intro
- tutorial
- gameplay
- overlays
- animacoes
- UI pixel-perfect

Qualquer alteracao nesses sistemas deve preservar:

- Logica de jogo.
- Escala fixa.
- Camera.
- Stage.
- Proporcoes visuais.
- Ordem de renderizacao.
- Consistencia visual entre cenas.
- Comportamento de input.

Antes de alterar esses sistemas, a IA deve explicar o risco e propor a menor mudanca possivel. Mudancas em camera, stage, render frame ou fluxo de cenas devem ser tratadas como tarefas de risco alto.

## 6. Regra de implementacao

Durante a implementacao, a IA deve:

- Explicar o plano antes de alterar codigo.
- Alterar o minimo possivel.
- Evitar refatoracoes fora do escopo.
- Nao renomear estruturas sem necessidade.
- Nao criar abstracoes grandes sem pedido explicito.
- Evitar mudancas globais quando uma correcao local resolve.
- Preservar padroes existentes do projeto.
- Validar o resultado com testes, build, lint ou analise estatica quando possivel.

Se a validacao nao puder ser executada, a IA deve dizer isso claramente e explicar qual risco permanece.

## 7. Regra de parada

Se apos 2 tentativas o problema continuar, a IA deve parar.

Ao parar, deve retornar:

- O que tentou.
- O que aprendeu.
- O que ainda nao sabe.
- Qual e o proximo diagnostico recomendado.

A IA nao deve continuar tentando aleatoriamente, ampliar o escopo sem necessidade ou fazer refatoracoes especulativas para tentar resolver o problema.

## Checklist obrigatorio antes de editar

Antes de qualquer edicao, confirme:

- O objetivo esta claro.
- Os arquivos provaveis foram localizados por busca.
- A mudanca cabe em ate 3 arquivos.
- Nao e necessario entender o projeto inteiro.
- Nao entrou em zona de risco.
- O plano foi explicado.
- Existe uma forma razoavel de validar.

Se qualquer item falhar, reduza o escopo antes de implementar.
