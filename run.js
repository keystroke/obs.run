console.log(Deno.args);

window.setImmediate = func => setTimeout(func, 0);

const { Runtime } = await import(
  "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js"
);

const { default: define } = await import(getNotebookUrl(`&d=${Date.now()}`));

const main = await new Runtime().module(define).value(CELL);
return await main(Deno);
