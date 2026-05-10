# Tasks

## 1. Building Kits

- [x] Criar tipo de item `BuildingKit`.
- [x] Permitir que o jogador selecione um kit no inventário.
- [x] Exibir preview da construção antes de posicionar.
- [x] Validar terreno, colisão e espaço livre.
- [x] Criar `ConstructionSite` ao confirmar posicionamento.
- [x] Persistir o estado do construction site no save.

## 2. Construction Site UI

- [x] Criar caixa/interação frontal do construction site.
- [x] Exibir nome da construção.
- [x] Exibir materiais necessários.
- [x] Exibir quantidade necessária por material.
- [x] Exibir quantidade atual no inventário.
- [x] Exibir materiais já depositados.
- [x] Implementar ação `deposit one`.
- [x] Implementar ação `deposit stack`.
- [x] Implementar ação `deposit all`.
- [x] Bloquear início da construção se faltar material.

## 3. Creature Specialties

- [x] Adicionar campo `specialties` nas criaturas.
- [x] Criar especialidade `build`.
- [x] Criar especialidade `burn`.
- [x] Permitir que building kits declarem especialidades exigidas.
- [x] Verificar criaturas próximas ou seguindo o jogador.
- [x] Mostrar especialidades ausentes na UI.
- [x] Bloquear construção se faltar criatura necessária.

## 4. Follow System

- [x] Criar opção `follow me` no menu de interação da criatura.
- [x] Criar comando/emote para chamar criaturas próximas.
- [x] Fazer criaturas seguirem o jogador.
- [x] Limitar seguidores ativos a 5.
- [x] Exibir feedback quando o limite for atingido.
- [x] Criar ação para dispensar seguidor.

## 5. Timed Construction

- [x] Adicionar `buildDurationSeconds` no building kit.
- [x] Criar estado `building`.
- [x] Salvar horário de início da construção.
- [x] Calcular horário de conclusão.
- [x] Atualizar construção quando o tempo terminar.
- [x] Trocar construction site por building finalizado.
- [x] Exibir feedback de construção concluída.

## 6. Interior And Furniture

- [x] Permitir entrar em construções finalizadas.
- [x] Criar espaço interior associado ao building.
- [x] Permitir posicionar móveis no interior.
- [x] Contar móveis válidos.
- [x] Exigir mínimo de 3 móveis para validar uma casa.
- [x] Persistir layout dos móveis.
- [x] Exibir feedback quando a casa estiver completa.

## 7. Creature Housing

- [x] Criar campo `currentHomeId` na criatura.
- [x] Criar opção `move in`.
- [x] Permitir mover criatura para uma casa válida.
- [x] Remover vínculo anterior caso a criatura já tenha casa.
- [x] Persistir vínculo criatura-casa.
- [x] Fazer criatura usar a casa como ponto de idle.

## 8. Habitat Preferences

- [x] Criar campo `idealHabitat`.
- [x] Exibir habitat ideal no perfil/Pokédex da criatura.
- [x] Associar casas a tipos de habitat.
- [x] Comparar casa atual com preferência da criatura.
- [x] Preparar sistema para bônus futuros de conforto.

## 9. Cozy Behaviors

- [x] Criar rotinas simples de idle dentro da casa.
- [x] Permitir criatura dormir, sentar, caminhar ou ficar perto de objetos.
- [x] Permitir interação com cama, cadeira, chão e campfire.
- [x] Não forçar a criatura a usar sempre o item “correto”.
