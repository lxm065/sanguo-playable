"""验证原件不变、模型来源、录制一致性和样板资源完整性。"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    """返回文件内容摘要，不依赖修改时间。"""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    """检查交付边界，任一缺失或原件变化都令命令失败。"""
    original = ROOT.parent / '__APP__.wxapkg_decrypt_unpack'
    hashes = json.loads((ROOT / 'evidence/original-hashes.json').read_text(encoding='utf-8'))
    for name, expected in hashes.items():
        assert digest(original / name) == expected, f'原件变化: {name}'
    main_script = (ROOT / 'game/subpackages/main/game.js').read_text(encoding='utf-8')
    begin = main_script.index('require("../../skin-adapter").install(')
    end = main_script.index('require("../../offline-preview").install(', begin)
    assert main_script[:begin] + main_script[end:] == (original / 'subpackages/main/game.js').read_text(encoding='utf-8')
    assets = ROOT / 'game/skin-assets'
    manifest = json.loads((assets / 'zhaoyun-manifest.json').read_text(encoding='utf-8'))
    skeleton = json.loads((assets / 'zhaoyun.json').read_text(encoding='utf-8'))
    assert set(manifest['actions']) == set(skeleton['animations'])
    for name, action in manifest['actions'].items():
        frames = skeleton['animations'][name]['slots']['body']['attachment']
        assert frames[-1]['time'] == action['duration'], name
        assert all(frame['name'] in skeleton['skins'][0]['attachments']['body'] for frame in frames)
    for name in manifest['textures'] + ['zhaoyun-avatar.png', 'zhaoyun-drawing.png', 'campaign-map.png', 'battle-ground.png']:
        assert (assets / name).stat().st_size > 0, name
    source = json.loads((ROOT / 'source-assets/animations.json').read_text(encoding='utf-8'))
    for relative, entry in source['dependencies'].items():
        assert digest(Path(entry['source'])) == entry['sha256'], entry['source']
        assert digest(ROOT / 'source-assets/mdx' / relative) == entry['sha256'], relative
    recording = ROOT / 'game/replay-data/official-replay.txt'
    assert digest(recording) == digest(ROOT.parent / 'traffic-captures/official-replay.jsonl')
    settings = json.loads((ROOT / 'game/src/settings.51118.json').read_text(encoding='utf-8'))
    assert settings['assets']['remoteBundles'] == [] and settings['assets']['server'] == ''
    result = {'originalFilesUnchanged': len(hashes), 'modelDependenciesVerified': len(source['dependencies']),
              'actions': list(manifest['actions']), 'frames': manifest['frames'],
              'recordingSha256': digest(recording), 'businessScriptChange': 'one adapter installation only',
              'bundleMode': 'local', 'status': 'PASS'}
    (ROOT / 'evidence/static-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
