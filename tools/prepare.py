"""建立可审计的样板资源副本；原工程、录制和模型始终只读。"""
import hashlib
import json
import shutil
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / '__APP__.wxapkg_decrypt_unpack'
CACHE = Path('C:/Users/Administrator/AppData/Local/微信开发者工具/User Data/bf938c1203f9e0460b7dd4d58f95dcc0/WeappSimulator/WeappFileSystem/o6zAJs1ny5b8qTgK0Bx6kNfXHlT8/wxcd4c59e939d1ffa6/usr')

def digest(path):
    """计算文件摘要，用于原件不变与资源来源验证。"""
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    """复制已有缓存到相同资源路径，保存原工程及战报摘要。"""
    original = {str(p.relative_to(SOURCE)).replace('\\', '/'): digest(p) for p in SOURCE.rglob('*') if p.is_file()}
    (ROOT / 'evidence/original-hashes.json').write_text(json.dumps(original, indent=2), encoding='utf-8')
    entries = json.loads((CACHE / 'gamecaches/cacheList.json').read_text(encoding='utf-8'))['files']
    copied, missing = [], []
    for url, entry in entries.items():
        source = CACHE / entry['url'].split('http://usr/')[-1]
        relative = urlparse(url).path.lstrip('/')
        if not relative.startswith('remote/'):
            continue
        if not source.is_file():
            missing.append(relative)
            continue
        target = ROOT / 'game' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied.append({'path': relative, 'sha256': digest(target)})
    for name in ['official-replay.jsonl']:
        shutil.copy2(ROOT.parent / 'traffic-captures' / name, ROOT / 'game/replay-data' / name)
    for name in ['battle-1.json', 'settlement-1.json']:
        shutil.copy2(ROOT.parent / 'traffic-captures/decoded' / name, ROOT / 'evidence' / name)
    (ROOT / 'evidence/local-cache.json').write_text(json.dumps({'copied': copied, 'missing': missing}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'cached': len(copied), 'missing': len(missing), 'sourceFiles': len(original)}))

if __name__ == '__main__':
    main()
