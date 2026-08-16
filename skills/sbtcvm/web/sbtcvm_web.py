#!/usr/bin/env python3
"""
sbtcvm_web.py — HTML wrapper for the SBTCVM-Gen2-9 balanced-ternary 9-trit VM.

Serves a terminal-style web UI (index.html) that drives the REAL VM headlessly:
  GET /                       -> the HTML shell
  GET /api/list               -> available trom apps (roms/ + vmuser/ + apps/)
  GET /api/run?trom=X         -> run bare_sbtcvm.py X, return captured stdout (JSON, halting)
  POST /api/stnp              -> body {"src":"..."} compile SSTNPL then run (JSON)
  GET /api/stream/run?trom=X  -> SSE: stream the 9-trit VM stdout live (for looping troms)
  POST /api/stream/stnp       -> SSE: compile SSTNPL then stream run live

The VM is Python (bare frontend, no pygame/curses needed). Browser = display.
Run:  python sbtcvm_web.py   then open http://127.0.0.1:8000/
"""
import os, sys, json, subprocess, urllib.parse, http.server, threading, time

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)  # so bare_sbtcvm.py finds vmsystem/ etc.

PORT = 8000
MAX_BYTES = 2_000_000  # safety cap on streamed output

def list_troms():
    out = {"roms": [], "vmuser": [], "apps": []}
    out["roms"] = [f[:-5] for f in sorted(os.listdir(os.path.join(HERE, "roms"))) if f.endswith(".trom")] if os.path.isdir(os.path.join(HERE, "roms")) else []
    out["vmuser"] = [f[:-5] for f in sorted(os.listdir(os.path.join(HERE, "vmuser"))) if f.endswith(".trom")] if os.path.isdir(os.path.join(HERE, "vmuser")) else []
    out["apps"] = [f[:-5] for f in sorted(os.listdir(os.path.join(HERE, "apps"))) if f.endswith(".trom")] if os.path.isdir(os.path.join(HERE, "apps")) else []
    return out

def iter_bare(trom, timeout=60):
    """Yield (event, payload) tuples as the VM runs. event in {line, done, error}."""
    cmd = [sys.executable, "bare_sbtcvm.py", trom]
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    except Exception as e:
        yield ("error", str(e)); return
    total = 0
    start = time.time()
    try:
        for line in proc.stdout:
            yield ("line", line.rstrip("\n"))
            total += len(line)
            if total > MAX_BYTES:
                proc.terminate(); yield ("error", f"output cap {MAX_BYTES} bytes reached"); break
            if time.time() - start > timeout:
                proc.terminate(); yield ("error", f"timeout {timeout}s"); break
        proc.wait()
        yield ("done", f"rc={proc.returncode}")
    except Exception as e:
        yield ("error", str(e))

def compile_stnp(src, timeout=30):
    """Write SSTNPL, assemble; return (ok, message). On ok, vmuser/web_user.trom is built."""
    name = "web_user"
    spath = os.path.join(HERE, "vmuser", f"{name}.stnp")
    with open(spath, "w", encoding="utf-8") as fh:
        fh.write(src)
    cproc = subprocess.run([sys.executable, "stnpcom.py", f"{name}.stnp"],
                           capture_output=True, text=True, timeout=timeout)
    if "compile pass" not in cproc.stdout:
        return (False, cproc.stdout + "\n---\n" + cproc.stderr[-1500:])
    return (True, "compiled -> web_user.trom")

def run_bare(trom, timeout=20):
    """Non-streaming run (halting troms)."""
    lines = []
    ok = True; err = None; rc = None
    for ev, pl in iter_bare(trom, timeout=timeout):
        if ev == "line": lines.append(pl)
        elif ev == "error": ok = False; err = pl
        elif ev == "done": rc = pl
    return {"ok": ok, "trom": trom, "stdout": "\n".join(lines), "error": err, "rc": rc}

def compile_and_run(src, timeout=30):
    ok, msg = compile_stnp(src, timeout=timeout)
    if not ok:
        return {"ok": False, "stage": "compile", "stdout": msg}
    return run_bare("web_user", timeout=timeout)

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json"):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def _sse(self, event_source):
        """Stream (event, payload) tuples as Server-Sent Events."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        try:
            for ev, pl in event_source:
                self.wfile.write(f"event: {ev}\n".encode("utf-8"))
                self.wfile.write(f"data: {json.dumps(pl)}\n\n".encode("utf-8"))
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass  # client disconnected

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path in ("/", "/index.html"):
            try:
                with open(os.path.join(HERE, "index.html"), "r", encoding="utf-8") as fh:
                    self._send(200, fh.read(), "text/html; charset=utf-8")
            except FileNotFoundError:
                self._send(404, "index.html missing", "text/plain")
            return
        if u.path == "/api/list":
            self._send(200, json.dumps(list_troms())); return
        if u.path.startswith("/api/run"):
            q = urllib.parse.parse_qs(u.query)
            trom = (q.get("trom") or ["hello_count"])[0]
            if not all(c.isalnum() or c in "_.-" for c in trom):
                self._send(400, json.dumps({"ok": False, "error": "bad trom name"})); return
            self._send(200, json.dumps(run_bare(trom))); return
        if u.path.startswith("/api/stream/run"):
            q = urllib.parse.parse_qs(u.query)
            trom = (q.get("trom") or ["counttestprint"])[0]
            if not all(c.isalnum() or c in "_.-" for c in trom):
                self._send(400, "bad trom name"); return
            self._sse(iter_bare(trom, timeout=60)); return
        self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == "/api/stnp":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length).decode("utf-8", "replace")
            try:
                payload = json.loads(raw); src = payload.get("src", "")
            except Exception:
                src = ""
            self._send(200, json.dumps(compile_and_run(src))); return
        if u.path == "/api/stream/stnp":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length).decode("utf-8", "replace")
            try:
                payload = json.loads(raw); src = payload.get("src", "")
            except Exception:
                src = ""
            ok, msg = compile_stnp(src, timeout=30)
            if not ok:
                def err_src():
                    yield ("error", msg)
                self._sse(err_src()); return
            self._sse(iter_bare("web_user", timeout=60)); return
        self._send(404, json.dumps({"error": "not found"}))

if __name__ == "__main__":
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"SBTCVM web wrapper on http://127.0.0.1:{PORT}/  (Ctrl+C to stop)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("stopped")
