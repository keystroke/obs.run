import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const OBSERVABLEHQ_USER = Deno.env.get("OBSERVABLEHQ_USER") || "@keystroke";
const DEFAULT_NOTEBOOK = Deno.env.get("DEFAULT_NOTEBOOK") || "keystroke-cloud";
const DEFAULT_CELL = Deno.env.get("DEFAULT_CELL") || "web";
const PORT = Number(Deno.env.get("PORT")) || 8000;

const app = new Application();

const router = new Router();

router.all("/:notebook?/:cell?", async context => {
  const start = Date.now();
  const { notebook = DEFAULT_NOTEBOOK, cell = DEFAULT_CELL } = context.params;
  const { request } = context;

  const worker = new Worker(new URL("./worker.js", import.meta.url).href, {
    type: "module",
  });

  const body = request.hasBody
    ? await request.body({ type: "json" }).value
    : null;

  const response = await new Promise((resolve, reject) => {
    worker.onerror = ({ error }) => {
      worker.terminate();
      console.log("ERROR", error);
      reject(error);
    };
    worker.onmessage = ({ data: response }) => {
      worker.terminate();
      resolve(response);
    };

    const message = Object.assign(
      {},
      context,
      { params: { notebook, cell } },
      { env: Deno.env },
      { user: OBSERVABLEHQ_USER },
      { body }
    );
    worker.postMessage(message);
  });

  Object.assign(context.response, response);
  const end = Date.now();
  console.log(`Duration: ${end - start}`);
});

app.use(router.routes());

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on ${secure ? "https://" : "http://"}${hostname}:${port}`
  );
});

await app.listen({ port: 8000 });
