import path from "node:path";
import { defineConfig } from "vite";
import pragtConfig from "./pragt.config.js";
import {
  createApplyStylePostHandler,
  createAnalyzeHooksPostHandler,
  createDeleteElementPostHandler,
  createExtractPureBlockPostHandler,
  createInspectPostHandler,
  createRefactorFunctionsPostHandler,
  createReparentElementPostHandler,
  createSwapElementsPostHandler,
  createUpdateTextPostHandler
} from "@pragt/css-tool/next";

const PRAGT_ROUTE_HANDLERS = new Map([
  ["/api/pragt/apply-color", createApplyStylePostHandler(pragtConfig)],
  ["/api/pragt/analyze-hooks", createAnalyzeHooksPostHandler(pragtConfig)],
  ["/api/pragt/delete-element", createDeleteElementPostHandler(pragtConfig)],
  ["/api/pragt/extract-pure-block", createExtractPureBlockPostHandler(pragtConfig)],
  ["/api/pragt/inspect", createInspectPostHandler(pragtConfig)],
  ["/api/pragt/refactor-functions", createRefactorFunctionsPostHandler(pragtConfig)],
  ["/api/pragt/reparent-element", createReparentElementPostHandler(pragtConfig)],
  ["/api/pragt/swap-elements", createSwapElementsPostHandler(pragtConfig)],
  ["/api/pragt/update-text", createUpdateTextPostHandler(pragtConfig)]
]);

function buildRequestHeaders(headers = {}) {
  const requestHeaders = new Headers();

  Object.entries(headers).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => requestHeaders.append(name, entry));
      return;
    }

    if (typeof value === "string") {
      requestHeaders.set(name, value);
    }
  });

  return requestHeaders;
}

async function writeFetchResponse(res, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

function createFetchRequest(req) {
  const origin = `http://${req.headers.host || "127.0.0.1"}`;
  const url = new URL(req.url || "/", origin);

  return new Request(url, {
    method: req.method || "GET",
    headers: buildRequestHeaders(req.headers),
    body:
      req.method && req.method !== "GET" && req.method !== "HEAD"
        ? req
        : undefined,
    duplex: "half"
  });
}

function attachPragtRoutes(middlewares) {
  middlewares.use(async (req, res, next) => {
    const origin = `http://${req.headers.host || "127.0.0.1"}`;
    const url = new URL(req.url || "/", origin);
    const handler = PRAGT_ROUTE_HANDLERS.get(url.pathname);

    if (!handler) {
      next();
      return;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    try {
      const response = await handler(createFetchRequest(req));
      await writeFetchResponse(res, response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel processar a requisicao do PRAGT.";

      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  });
}

function pragtApiPlugin() {
  return {
    name: "pragt-api",
    configureServer(server) {
      attachPragtRoutes(server.middlewares);
    },
    configurePreviewServer(server) {
      attachPragtRoutes(server.middlewares);
    }
  };
}

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@pragt\/css-tool\/browser$/,
        replacement: path.resolve("Packages/pragt-css/src/browser/init.js")
      },
      {
        find: /^@pragt\/css-tool\/react$/,
        replacement: path.resolve("Packages/pragt-css/src/react/index.js")
      },
      {
        find: /^@pragt\/css-tool\/next$/,
        replacement: path.resolve("Packages/pragt-css/src/next/index.js")
      },
      {
        find: /^@pragt\/css-tool\/styles\.css$/,
        replacement: path.resolve(
          "Packages/pragt-css/src/styles/pragt-specificity-tool.css"
        )
      },
      {
        find: /^@pragt\/css-tool$/,
        replacement: path.resolve("Packages/pragt-css/src/index.js")
      }
    ]
  },
  optimizeDeps: {
    exclude: ["@pragt/css-tool"]
  },
  plugins: [pragtApiPlugin()]
});
