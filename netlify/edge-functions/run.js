export default async (request, context) => {
  try {
    const url = new URL(request.url);
    if (url.pathname === "/") return;
    if (url.pathname.indexOf(".") !== -1) return;
    url.searchParams.set("v", "3");
    const notebookUrl = `https://api.observablehq.com${url.pathname}.js?${url.searchParams}`;
    context.log(notebookUrl);
    const response = new Response(getScript(notebookUrl));
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    context.log("error", request.url, error);
  }
};

function getScript(url) {
  return `import "https://obs.run/setImmediate.js";
import { Runtime } from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js";
import define from "${url}";
const handler = await new Runtime().module(define).value("Deno");
handler(Deno);`;
}