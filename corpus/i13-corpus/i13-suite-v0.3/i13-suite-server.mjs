// i13-suite-server.mjs — live node backend for the v0.3 I-13 WASM suite.
// Serves the verbatim i13-suite-v0.3.html AND re-measures the VM on demand via real WASM.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { runNative, runSuite } from "./i13-bridge.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.I13_SUITE_PORT || 8798);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".wasm": "application/wasm", ".txt": "text/plain; charset=utf-8", ".mjs": "text/javascript; charset=utf-8" };

async function send(res, status, body, type = "application/json") {
  const isBuf = Buffer.isBuffer(body) || body instanceof Uint8Array;
  const data = isBuf ? body : (typeof body === "string" ? body : JSON.stringify(body, null, 2));
  res.writeHead(status, { "content-type": type, "access-control-allow-origin": "*" });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const p = url.pathname;
    if (p === "/" || p === "/index.html") {
      const html = await readFile(join(HERE, "i13-suite-v0.3.html"));
      return send(res, 200, html, MIME[".html"]);
    }
    if (p === "/i13_cortex_vm_v03.wasm") {
      const w = await readFile(join(HERE, "i13_cortex_vm_v03.wasm"));
      return send(res, 200, w, MIME[".wasm"]);
    }
    if (p === "/i13-wasm-vm-bridge-v0.3.js" || p === "/i-reader-engine-v0.2.js") {
      const js = await readFile(join(HERE, p.slice(1)));
      return send(res, 200, js, MIME[".js"]);
    }
    if (p === "/icarium-i13-v03.html" || p === "/dashboard") {
      return send(res, 200, await readFile(join(HERE, "icarium-i13-v03.html")), MIME[".html"]);
    }
    if (p === "/api/native") return send(res, 200, await runNative());
    if (p === "/api/suite") return send(res, 200, await runSuite());
    if (p === "/api/health") return send(res, 200, { ok: true, port: PORT, ts: new Date().toISOString() });
    return send(res, 404, { error: "not found", path: p });
  } catch (e) {
    return send(res, 500, { error: String(e && e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`[i13-suite] v0.3 live backend on :${PORT}  (HTML + /api/native + /api/suite)`);
});
