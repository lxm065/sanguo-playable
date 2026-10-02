"""将固定版本的 Cocos 资源下载到样板本地，下载失败显式记录，不伪造资源。"""
import concurrent.futures
import json
import re
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'game'
SETTINGS = json.loads((ROOT.parent / '__APP__.wxapkg_decrypt_unpack/src/settings.51118.json').read_text(encoding='utf-8'))
SERVER = SETTINGS['assets']['server']
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

def uuid(value):
    """还原 Cocos 压缩 UUID，保留短 pack ID。"""
    if '@' in value:
        base, suffix = value.split('@', 1)
        return uuid(base) + '@' + suffix
    if len(value) != 22:
        return value
    s = value[:2]
    for i in range(2, 22, 2):
        n = (ALPHABET.index(value[i]) << 6) | ALPHABET.index(value[i+1])
        s += f'{n:03x}'
    return '-'.join([s[:8], s[8:12], s[12:16], s[16:20], s[20:]])

def fetch(relative):
    """以原版本 URL 获取缺失文件，已有副本保持不变。"""
    target = GAME / relative
    if target.is_file():
        return {'path': relative, 'ok': True, 'cached': True}
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(SERVER + relative, timeout=25) as response:
                data = response.read()
            target.write_bytes(data)
            return {'path': relative, 'ok': True, 'bytes': len(data)}
        except Exception as error:
            if attempt == 2:
                return {'path': relative, 'ok': False, 'error': str(error)}
            time.sleep(.25)

def fetch_all(paths):
    """有界并发获取互不依赖的资源。"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        return list(pool.map(fetch, paths))

def repair_native(report):
    """对装入 pack 的原生资源按引擎支持扩展查找真实文件，保留成功路径。"""
    if report['ok'] or '/native/' not in report['path']:
        return report
    stem = report['path'].rsplit('.', 1)[0]
    for extension in ['.jpg', '.bin', '.atlas', '.ttf', '.mp3', '.plist']:
        result = fetch(stem + extension)
        if result['ok']:
            return result
    return report

def version_paths(bundle, cfg, section):
    """解析配置中的版本表并生成标准资源路径。"""
    values = cfg.get('versions', {}).get(section, [])
    extension_map = {idx: ext for ext, ids in cfg.get('extensionMap', {}).items() for idx in ids}
    for key, version in zip(values[::2], values[1::2]):
        identity = uuid(cfg['uuids'][key]) if isinstance(key, int) else key
        ext = extension_map.get(key, '.json') if section == 'import' else '.png'
        if ext == '.ccon':
            ext = '.json'
        yield key, identity, version, f'remote/{bundle}/{section}/{identity[:2]}/{identity}.{version}{ext}'

def main():
    """下载启动、首页、角色和首场回放需要的资源 bundle。"""
    bundles = ['audio','big-img','datatables','fight-bullet','fight-eff','fight-hero','fight-img','icon','module_artifact','module_battle','module_common','module_handbook','module_job','module_loading','module_tips','vip-res']
    reports = []
    for bundle in bundles:
        version = SETTINGS['assets']['bundleVers'][bundle]
        config_path = f'remote/{bundle}/config.{version}.json'
        result = fetch(config_path); reports.append(result)
        if not result['ok']:
            continue
        cfg = json.loads((GAME / config_path).read_text(encoding='utf-8'))
        imports = list(version_paths(bundle, cfg, 'import'))
        reports += fetch_all([item[3] for item in imports])
        chunks = []
        for item in imports:
            local = GAME / item[3]
            if local.is_file() and local.suffix == '.json':
                data = json.loads(local.read_text(encoding='utf-8'))
                if isinstance(data, dict):
                    chunks += [item[3][:-5] + suffix for suffix in data.get('chunks', [])]
        reports += fetch_all(chunks)
        native_paths = []
        for key, identity, version, rel in version_paths(bundle, cfg, 'native'):
            existing = list((GAME / f'remote/{bundle}/native/{identity[:2]}').glob(f'{identity}.{version}.*'))
            if existing:
                native_paths.append(str(existing[0].relative_to(GAME)).replace('\\','/')); continue
            matching = [item for item in imports if item[1] == identity]
            text = (GAME / matching[0][3]).read_text(encoding='utf-8') if matching and (GAME / matching[0][3]).is_file() and matching[0][3].endswith('.json') else ''
            if 'sp.SkeletonData' in text:
                rel = rel[:-4] + '.bin'
            elif 'cc.AudioClip' in text:
                rel = rel[:-4] + '.mp3'
            elif 'cc.ImageAsset' in text and '_1"' in text:
                rel = rel[:-4] + '.jpg'
            elif 'cc.Asset' in text or 'cc.Font' in text or 'cc.TTFFont' in text:
                extension = re.search(r'"(\.(?:atlas|bin|ttf|otf|plist|txt))"', text)
                if extension:
                    rel = rel[:-4] + extension.group(1)
            native_paths.append(rel)
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            reports += list(pool.map(repair_native, fetch_all(native_paths)))
        print(bundle, 'files', len(imports)+len(native_paths), 'errors', sum(not r['ok'] for r in reports), flush=True)
        (ROOT / 'evidence/downloads.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
    print('TOTAL',len(reports),'FAILED',sum(not r['ok'] for r in reports))

if __name__ == '__main__':
    main()
