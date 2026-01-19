import argparse
import json
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, '..', '..'))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

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


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--image', required=True)
    p.add_argument('--prompt', required=True)
    p.add_argument('--model_name', default=os.environ.get('VLM_MODEL_NAME', 'vikhyatk/moondream2'))
    p.add_argument('--revision', default=os.environ.get('VLM_REVISION', '2024-05-20'))
    args = p.parse_args()

    try:
        vlm = VLM(model_name=args.model_name, revision=args.revision)
        resp = vlm.analyze_image(args.image, args.prompt)
        obj = _extract_json_obj(resp)

        if isinstance(obj, dict) and ('x' in obj and 'y' in obj):
            try:
                x = float(obj.get('x'))
                y = float(obj.get('y'))
            except Exception:
                raise RuntimeError('vlm_json_missing_numeric_xy')
            out = {
                'ok': True,
                'x': x,
                'y': y,
                'raw': resp,
            }
            sys.stdout.write(json.dumps(out))
            return 0

        out = {
            'ok': False,
            'error': 'vlm_response_not_xy_json',
            'raw': resp,
        }
        sys.stdout.write(json.dumps(out))
        return 2

    except Exception as e:
        out = {
            'ok': False,
            'error': str(e),
        }
        sys.stdout.write(json.dumps(out))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
