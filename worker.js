self.onmessage = async ({ data: context }) => {
  console.log(`Hello from worker! ${Date.now()}`, context);
  const {
    params: { notebook, cell },
    user,
    body,
  } = context;
  try {
    // import runtime
    self.setImmediate = func => setTimeout(func, 0);
    const { Runtime } = await import(
      "https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js"
    );

    // import notebook
    const etag = await getNotebookEtag(user, notebook);

    if (!etag) return self.postMessage({ status: 404 });

    const { default: define } = await import(
      `${getNotebookUrl(user, notebook)}&d=${etag}`
    );

    // invoke notebook
    const handler = await new Runtime().module(define).value(cell);
    const response = await handler({ request, body });

    self.postMessage(response);
  } catch (error) {
    console.error(error);
    self.postMessage({ status: 500, body: error });
  } finally {
    console.log(`Goodbye from worker! ${Date.now()}`);
  }
};

async function getNotebookEtag(user, notebook) {
  const response = await fetch(getNotebookUrl(user, notebook));
  return response.headers.get("etag");
}

function getNotebookUrl(user, notebook) {
  return `https://api.observablehq.com/${user}/${notebook}.js?v=3`;
}
