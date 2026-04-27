# PRAGT CSS Tool

Overlay reutilizável para inspecionar especificidade, testar layout com grid systems e aplicar mudanças em código real durante a construção do site.

## O que o pacote expõe

- `PragtCssTool`: componente React que monta o Grid Tool e o Specificity Tool
- `PragtGridTool`: componente React do overlay de grid
- `PragtSpecificityTool`: componente React do overlay de especificidade
- `initPragtCssTool(options)`: bootstrap para páginas sem React explícito
- `createApplyStylePostHandler(config)`
- `createDeleteElementPostHandler(config)`
- `createSwapElementsPostHandler(config)`
- `createUpdateTextPostHandler(config)`
- `createPragtProjectConfig(config)`
- `@pragt/css-tool/styles.css`: stylesheet da UI

## Uso rápido em React / Next

```jsx
import "@pragt/css-tool/styles.css";
import { PragtCssTool } from "@pragt/css-tool/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PragtCssTool />
      </body>
    </html>
  );
}
```

O `PragtCssTool` ja monta os dois modulos internos:
- `PragtGridTool`: overlay visual para colunas, linhas, gutters, bounds, presets e breakpoints
- `PragtSpecificityTool`: inspecao e edicao de especificidade e estilos

Se quiser montar apenas o grid:

```jsx
import "@pragt/css-tool/styles.css";
import { PragtGridTool } from "@pragt/css-tool/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PragtGridTool />
      </body>
    </html>
  );
}
```

## Uso rápido sem montar React manualmente

```js
import "@pragt/css-tool/styles.css";
import { initPragtCssTool } from "@pragt/css-tool";

initPragtCssTool({
  apiBasePath: "/api/pragt"
});
```

## Inspector (indexador estrutural de funções)

O pacote inclui um analisador estático e um componente React mínimo para mapear a estrutura das funções de um arquivo do projeto.

- Handler: `createInspectPostHandler(config)` — gera um endpoint que recebe `{ script: "path/to/file.js" }` e retorna JSON com `functions`, `functionsCount`, `warnings` e, para cada função encontrada, um resumo com:
  - `params`
  - `localIdentifiers`
  - `externalReads`
  - `externalWrites`
  - `calls`
  - `hiddenInputs`
  - `usesWindow`
  - `usesDocument`
  - `usesStorage`
  - `usesProcessEnv`
- Componente: `PragtInspector` em `src/react/PragtInspector.jsx` — input para informar o `script`, botão para chamar o endpoint e tabela com scroll para inspecionar o índice estrutural.

Exemplo de rota Next para expor o inspector:

```js
import pragtConfig from "../../../../pragt.config.js";
import { createInspectPostHandler } from "../../../../packages/pragt-css/src/next/index.js";

export const POST = createInspectPostHandler(pragtConfig);
```

Uso do componente (em React/Next):

```jsx
import { PragtInspector } from "@pragt/css-tool/react";

export default function ToolPage() {
  return <PragtInspector defaultScript={"packages/pragt-css/src/next/project-config.js"} />;
}
```

Notas:

- O parser tenta `TypeScript+JSX` primeiro, depois `Flow+JSX`. Se encontrar trechos não suportados a resposta traz `warnings` e `parseError` quando aplicável.
- A análise é estática e conservadora. Ela ajuda a indexar dependências visíveis da função, mas não substitui leitura semântica do código.
```

## Levar para outro repositório

O fluxo mínimo ficou assim:

1. Copie a pasta [`/Users/pedrovictor/Aether-website/packages/pragt-css`](/Users/pedrovictor/Aether-website/packages/pragt-css) para o outro projeto.
2. Instale as dependências que o pacote usa no ambiente servidor:
   - `@babel/parser`
   - `@babel/traverse`
   - `@babel/generator`
3. Crie um `pragt.config.js` no projeto consumidor.
4. Monte o overlay no layout raiz.
5. Exponha as rotas `/api/pragt/*`.

### Config mínimo

```js
import { createPragtProjectConfig } from "./packages/pragt-css/src/next/index.js";

export default createPragtProjectConfig({
  css: {
    allowedFilePaths: [
      "src/App.css",
      "src/styles/editor.css",
      "packages/pragt-css/src/styles/pragt-specificity-tool.css"
    ],
    resolveTargetFile({ pathname, selector, scope, targetType }, { file }) {
      if (scope === "global" || targetType === "variable") {
        return file("src/App.css");
      }

      if (String(selector || "").includes(".pragt-specificity-")) {
        return file("packages/pragt-css/src/styles/pragt-specificity-tool.css");
      }

      if (String(pathname || "").startsWith("/editor")) {
        return file("src/styles/editor.css");
      }

      return file("src/App.css");
    }
  },
  sources: {
    allowedFilePaths: [
      "src/App.jsx",
      "src/components/EditorSection.jsx",
      "src/data/siteContent.json"
    ],
    jsxFilePaths: [
      "src/App.jsx",
      "src/components/EditorSection.jsx"
    ],
    resolveDeleteSourceFiles({ pathname }, { file }) {
      if (String(pathname || "").startsWith("/editor")) {
        return [file("src/components/EditorSection.jsx")];
      }

      return [
        file("src/App.jsx"),
        file("src/data/siteContent.json")
      ];
    },
    resolveUpdateTextSourceFiles({ pathname }, { file }) {
      if (String(pathname || "").startsWith("/editor")) {
        return [file("src/components/EditorSection.jsx")];
      }

      return [
        file("src/App.jsx"),
        file("src/data/siteContent.json")
      ];
    },
    resolveSwapSourceFile({ pathname }, { file }) {
      if (String(pathname || "").startsWith("/editor")) {
        return file("src/components/EditorSection.jsx");
      }

      return file("src/App.jsx");
    }
  }
});
```

### Rotas Next

```js
import pragtConfig from "../../../../pragt.config.js";
import { createApplyStylePostHandler } from "../../../../packages/pragt-css/src/next/index.js";

export const POST = createApplyStylePostHandler(pragtConfig);
```

Repita o mesmo padrão para:
- `delete-element`
- `swap-elements`
- `update-text`

### Montagem do overlay

```jsx
import "../packages/pragt-css/src/styles/pragt-specificity-tool.css";
import { PragtCssTool } from "../packages/pragt-css/src/react/index.js";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PragtCssTool />
      </body>
    </html>
  );
}
```

### O que você realmente adapta em cada app

- lista de arquivos CSS que podem ser escritos
- lista de arquivos-fonte que podem ser alterados
- regra que decide em qual arquivo mexer para `apply`, `delete`, `swap` e `update text`

O restante já vem pronto do pacote.

## Rotas de escrita

Para manter os recursos de `apply to code`, `delete element`, `swap` e `update text`, o projeto precisa expor rotas que apontem para os handlers do pacote e entregar uma configuração com:

- arquivos CSS permitidos para escrita
- arquivos-fonte permitidos para mutação
- quais arquivos JSX contêm texto editável
- funções de resolução de alvo por rota

No Aether isso está centralizado em [`/Users/pedrovictor/Aether-website/pragt.config.js`](/Users/pedrovictor/Aether-website/pragt.config.js).
