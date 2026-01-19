import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def _ensure_repo_root_on_syspath():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(os.path.join(here, "..", ".."))
    if root not in sys.path:
        sys.path.insert(0, root)


_ensure_repo_root_on_syspath()

from jason_service.ai_engine.vlm import VLM


def _extract_json_obj(text: str):
    if not text:
        return None
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    s = m.group(0)
    try:
        return json.loads(s)
    except Exception:
        return None


class _VlmCache:
    def __init__(self):
        self._instances = {}

    def get(self, model_name: str, revision: str) -> VLM:
        key = (str(model_name or "").strip() or "vikhyatk/moondream2", str(revision or "").strip() or "2024-05-20")
        if key not in self._instances:
            self._instances[key] = VLM(model_name=key[0], revision=key[1])
        return self._instances[key]


_CACHE = _VlmCache()


class Handler(BaseHTTPRequestHandler):
    server_version = "JASONVLM/1"

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path.rstrip("/") == "/health":
            return self._send_json(200, {"ok": True})
        return self._send_json(404, {"ok": False, "error": "not_found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/analyze":
            return self._send_json(404, {"ok": False, "error": "not_found"})

        try:
            n = int(self.headers.get("Content-Length") or "0")
        except Exception:
            n = 0
        if n <= 0:
            return self._send_json(400, {"ok": False, "error": "body_required"})

        raw = self.rfile.read(n)
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            return self._send_json(400, {"ok": False, "error": "invalid_json"})

        image_path = str((data.get("image") or data.get("imagePath") or "")).strip()
        prompt = str((data.get("prompt") or "")).strip()
        model_name = str((data.get("model_name") or data.get("modelName") or os.environ.get("VLM_MODEL_NAME") or "vikhyatk/moondream2")).strip()
        revision = str((data.get("revision") or os.environ.get("VLM_REVISION") or "2024-05-20")).strip()

        if not image_path:
            return self._send_json(400, {"ok": False, "error": "image_required"})
        if not prompt:
            return self._send_json(400, {"ok": False, "error": "prompt_required"})

        try:
            vlm = _CACHE.get(model_name=model_name, revision=revision)
            resp = vlm.analyze_image(image_path, prompt)
            obj = _extract_json_obj(resp)

            if isinstance(obj, dict) and ("x" in obj and "y" in obj):
                try:
                    x = float(obj.get("x"))
                    y = float(obj.get("y"))
                    return self._send_json(200, {"ok": True, "x": x, "y": y, "raw": resp})
                except Exception:
                    pass

            return self._send_json(200, {"ok": True, "raw": resp})

        except Exception as e:
            return self._send_json(500, {"ok": False, "error": str(e)})


def main():
    host = str(os.environ.get("VLM_SERVER_HOST") or "127.0.0.1").strip() or "127.0.0.1"
    port_raw = os.environ.get("VLM_SERVER_PORT")
    try:
        port = int(port_raw) if port_raw else 7777
    except Exception:
        port = 7777

    argv = sys.argv[1:]
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--host" and i + 1 < len(argv):
            host = argv[i + 1]
            i += 2
            continue
        if a == "--port" and i + 1 < len(argv):
            try:
                port = int(argv[i + 1])
            except Exception:
                port = port
            i += 2
            continue
        i += 1

    httpd = ThreadingHTTPServer((host, port), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    raise SystemExit(main())
