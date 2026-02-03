import base64
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from io import BytesIO

try:
    import pyautogui
except Exception as e:
    raise RuntimeError("pyautogui_import_failed") from e


def _get_token() -> str:
    tok = os.environ.get("DESKTOP_AGENT_TOKEN", "").strip()
    if not tok:
        raise RuntimeError("DESKTOP_AGENT_TOKEN_missing")
    return tok


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict):
    raw = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def _read_json(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return {}


def _check_auth(handler: BaseHTTPRequestHandler) -> bool:
    expected = _get_token()
    got = (handler.headers.get("x-agent-token") or "").strip()
    return got == expected


def _to_int(v, name: str) -> int:
    try:
        return int(v)
    except Exception:
        raise ValueError(f"invalid_{name}")


def _to_float(v, name: str) -> float:
    try:
        return float(v)
    except Exception:
        raise ValueError(f"invalid_{name}")


class Handler(BaseHTTPRequestHandler):
    server_version = "JASONDesktopAgent/1.0"

    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path == "/health":
            try:
                size = pyautogui.size()
                pos = pyautogui.position()
                _json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "now": int(time.time() * 1000),
                        "screen": {"width": size.width, "height": size.height},
                        "mouse": {"x": int(pos.x), "y": int(pos.y)},
                    },
                )
            except Exception as e:
                _json_response(self, 500, {"ok": False, "error": str(e)})
            return

        _json_response(self, 404, {"ok": False, "error": "not_found"})

    def do_POST(self):
        if self.path != "/execute":
            _json_response(self, 404, {"ok": False, "error": "not_found"})
            return

        if not _check_auth(self):
            _json_response(self, 401, {"ok": False, "error": "unauthorized"})
            return

        body = _read_json(self)
        action = str(body.get("action") or "").strip().lower()

        try:
            if action == "move":
                x = _to_int(body.get("x"), "x")
                y = _to_int(body.get("y"), "y")
                pyautogui.moveTo(x, y)
                _json_response(self, 200, {"ok": True, "action": "move", "x": x, "y": y})
                return

            if action == "click":
                x = _to_int(body.get("x"), "x")
                y = _to_int(body.get("y"), "y")
                button = str(body.get("button") or "left").strip().lower()
                clicks = _to_int(body.get("clicks") or 1, "clicks")
                clicks = max(1, min(5, clicks))
                pyautogui.click(x=x, y=y, clicks=clicks, button=button)
                _json_response(
                    self,
                    200,
                    {"ok": True, "action": "click", "x": x, "y": y, "button": button, "clicks": clicks},
                )
                return

            if action == "type":
                text = str(body.get("text") or "")
                interval = body.get("interval")
                if interval is None or interval == "":
                    pyautogui.write(text)
                else:
                    pyautogui.write(text, interval=_to_float(interval, "interval"))
                _json_response(self, 200, {"ok": True, "action": "type", "length": len(text)})
                return

            if action == "press":
                key = str(body.get("key") or "").strip()
                if not key:
                    raise ValueError("missing_key")
                presses = _to_int(body.get("presses") or 1, "presses")
                presses = max(1, min(10, presses))
                pyautogui.press(key, presses=presses)
                _json_response(self, 200, {"ok": True, "action": "press", "key": key, "presses": presses})
                return

            if action == "hotkey":
                keys = body.get("keys")
                if not isinstance(keys, list) or len(keys) == 0:
                    raise ValueError("missing_keys")
                keys = [str(k).strip() for k in keys if str(k).strip()]
                if len(keys) == 0:
                    raise ValueError("missing_keys")
                pyautogui.hotkey(*keys)
                _json_response(self, 200, {"ok": True, "action": "hotkey", "keys": keys})
                return

            if action == "screenshot":
                fmt = str(body.get("format") or "jpeg").strip().lower()
                quality = body.get("quality")
                region = body.get("region")
                pil_img = None
                if isinstance(region, dict):
                    rx = _to_int(region.get("x"), "region_x")
                    ry = _to_int(region.get("y"), "region_y")
                    rw = _to_int(region.get("width"), "region_width")
                    rh = _to_int(region.get("height"), "region_height")
                    pil_img = pyautogui.screenshot(region=(rx, ry, rw, rh))
                else:
                    pil_img = pyautogui.screenshot()

                buf = BytesIO()
                mime = "image/jpeg"
                if fmt == "png":
                    pil_img.save(buf, format="PNG")
                    mime = "image/png"
                else:
                    q = 70
                    if quality is not None and quality != "":
                        q = max(20, min(95, _to_int(quality, "quality")))
                    pil_img.save(buf, format="JPEG", quality=q)
                    mime = "image/jpeg"

                b64 = base64.b64encode(buf.getvalue()).decode("ascii")
                _json_response(self, 200, {"ok": True, "action": "screenshot", "mime": mime, "base64": b64})
                return

            _json_response(self, 400, {"ok": False, "error": "unsupported_action"})
        except Exception as e:
            _json_response(self, 400, {"ok": False, "error": str(e)})


def main():
    try:
        _get_token()
    except Exception as e:
        sys.stderr.write(str(e) + "\n")
        sys.exit(2)

    host = os.environ.get("DESKTOP_AGENT_HOST", "127.0.0.1").strip() or "127.0.0.1"
    port_raw = os.environ.get("DESKTOP_AGENT_PORT", "5137")
    try:
        port = int(port_raw)
    except Exception:
        port = 5137

    httpd = HTTPServer((host, port), Handler)
    sys.stdout.write(f"Desktop agent listening on http://{host}:{port}\n")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
