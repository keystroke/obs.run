// https://observablehq.com/@keystroke/obs-run
const { watch, ...args } = getArgs();

if (watch) {
  let etag = await getEtag(args);
  let worker = startWorker(args);
  let updated = new Date();
  while (true) {
    await delay(new Date() - updated > watch.recent ? watch.slow : watch.fast);
    const latest = await getEtag(args);
    if (latest && etag !== latest) {
      console.log(`$ SIGTERM -> p:${worker.pid}`);
      worker.kill("SIGTERM");
      worker.close();
      worker = startWorker(args);
      etag = latest;
      updated = new Date();
    }
  }
}

import(`https://obs.run/${notebook}`);

function getArgs() {
  let watch = Deno.args.filter(a => a.startsWith("--watch"))[0]
    || Deno.env.get("WATCH").filter(i => i).map(i => `--watch=${i}`)[0];
  let reload = Deno.args.filter(a => a.startsWith("--reload"))[0]
    || [Deno.env.get("RELOAD")].filter(i => i).map(i => i === "*" ? "--reload" : `--reload=${i}`)[0]
    || "--reload=https://api.observablehq.com";
  let permissions = Deno.args
    .filter(a => a === "-A" || a.startsWith("--"))
    .filter(a => a !== watch && a !== reload)
    .join(" ")
      || Deno.env.get("PERMISSIONS")
      || "";
  const notebook = Deno.args.filter(a => !a.startsWith("-"))[0]
    || Deno.env.get("NOTEBOOK");
  if (watch) {
    let parts = watch.split("=", 2)[1]?.split(';', 3) || [];
    watch = {
      slow: Number(parts[0]) || 31000,
      fast: Number(parts[1]) || 3000,
      recent: Number(parts[2]) || 5 * 60,
    };
  }
  if (reload != "--reload" && !reload.includes("https://api.observablehq.com"))
    reload += ",https://api.observablehq.com";
  if (reload != "--reload" && !reload.includes("https://obs.run"))
    reload += ",https://obs.run";
  if (permissions)
    permissions = permissions.split(" ");
  return { watch, reload, permissions, notebook };
}

async function getEtag({ notebook }) {
  const url = `https://api.observablehq.com/${notebook}.js?v=3`;
  try {
    const response = await fetch(url);
    if (!response.ok) console.warn(`${response.status} ${url}`, await response.text());
    return response.headers.get("etag");
  } catch (error) {
    console.warn(url, error);
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
