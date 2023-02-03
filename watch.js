// https://observablehq.com/@keystroke/obs-run
const { watch, ...args } = getArgs();

if (watch) {
  let etag = await getEtag(args);
  let worker = startWorker(args);
  while (true) {
    await delay(watch);
    const latest = await getEtag(args);
    if (latest && etag !== latest) {
      console.log(`$ SIGTERM -> p:${worker.pid}`);
      worker.kill("SIGTERM");
      worker.close();
      worker = startWorker(args);
      etag = latest;
    }
  }
}

import(`https://obs.run/${notebook}`);

function getArgs() {
  let watch = Deno.args.filter(a => a.startsWith("--watch"))[0];
  let reload = Deno.args.filter(a => a.startsWith("--reload"))[0];
  const permissions = Deno.args.filter(
    a => a.startsWith("--") && a !== reload && a !== watch
  );
  const notebook = Deno.args.filter(a => !a.startsWith("--"))[0];
  if (watch) watch = Number(watch.split("=", 2)[1]) || 31000;
  if (!reload) reload = "--reload=https://api.observablehq.com";
  else if (reload !== "--reload") reload += ",https://api.observablehq.com";
  return { watch, reload, permissions, notebook };
}

async function getEtag({ notebook }) {
  const url = `https://api.observablehq.com/${notebook}.js?v=3`;
  try {
    const response = await fetch(url);
    return response.headers.get("etag");
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function startWorker({ reload, permissions, notebook }) {
  const cmd = [
    "deno",
    "run",
    reload,
    ...permissions,
    `https://obs.run/${notebook}`,
  ];
  console.log(`$ ${cmd.join(" ")}`);
  return Deno.run({ cmd });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
