# Change: Creature Assisted Building Kits

## Summary

Adicionar um sistema de construção por kits, onde o jogador posiciona estruturas no mundo, deposita materiais, convoca criaturas com especialidades específicas e aguarda a conclusão da construção.

Depois de pronta, a construção pode ser mobiliada e transformada em moradia para criaturas.

## Problem

Atualmente, construção tende a ser apenas uma ação direta do jogador: selecionar, posicionar e finalizar.

Isso deixa pouco espaço para:

- Progressão por materiais.
- Participação das criaturas.
- Especialidades úteis.
- Decoração com função real.
- Moradia persistente.
- Pequenos objetivos emergentes.

## Goals

- Permitir que o jogador posicione kits de construção no mundo.
- Exigir materiais específicos para concluir construções.
- Exigir criaturas com especialidades específicas, como `build` ou `burn`.
- Permitir que criaturas sigam o jogador.
- Limitar o número de seguidores ativos.
- Fazer construções levarem tempo.
- Permitir mobiliar interiores.
- Permitir que criaturas se mudem para casas.
- Exibir habitat ideal das criaturas.
- Criar comportamento cozy dentro das casas.

## Non-Goals

- Criar um editor livre de arquitetura.
- Permitir construção bloco-a-bloco.
- Implementar multiplayer.
- Implementar economia avançada de aluguel, impostos ou upkeep.
- Criar simulação complexa de felicidade neste primeiro momento.

## User Story

Como jogador, quero colocar um kit de construção no mundo, reunir materiais e chamar criaturas com habilidades certas para me ajudar, para que a construção pareça parte viva da ilha e não apenas um item colocado no cenário.

## Design Notes

O fluxo principal será:

1. Jogador obtém um building kit.
2. Jogador posiciona o kit no mundo.
3. Um construction site aparece.
4. Jogador interage com a caixa de construção.
5. Interface mostra materiais necessários.
6. Interface mostra criaturas/especialidades necessárias.
7. Jogador deposita materiais.
8. Jogador chama criaturas para seguir.
9. Criaturas com especialidades certas validam o projeto.
10. Construção começa.
11. Timer de construção é iniciado.
12. Construção é finalizada.
13. Jogador entra no interior.
14. Jogador coloca ao menos 3 móveis.
15. Casa passa a ser válida.
16. Jogador convida uma criatura para morar ali.
