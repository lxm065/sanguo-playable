"""只读解析本地魔兽资源，将网格、原生蒙皮动作与武器依赖导出至工程。"""
import hashlib
import json
from pathlib import Path
import struct
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT/'tools/wow-models.config.json').read_text(encoding='utf-8'))
sys.path.insert(0, CONFIG['readerHome'])
from model_reader import AssetRepository, chunks, unpack


def vector(value):
    """将源文件的 Z 向上坐标转换为渲染器的 Y 向上坐标。"""
    return [value[0], value[2], -value[1]]


class TracedRepository(AssetRepository):
    """在现有只读资源解析端口记录真正读取过的依赖与摘要。"""
    def __init__(self):
        """从已提取清单解析资源，显式覆盖资源根目录。"""
        base = Path(CONFIG['readerHome'])
        config = json.loads((base/'config.json').read_text(encoding='utf-8-sig'))
        config['asset_root'] = CONFIG['assetRoot']
        self.used = {}
        super().__init__(config, base)

    def read(self, fid):
        """读取原资源并记录 SHA-256，绝不改写资产库。"""
        data = super().read(fid)
        self.used[self.by_id[fid]['path']] = dict(fdid=fid, bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        return data


def read_track(data, offset, sequence, kind):
    """解析选定内嵌动作轨道；不把缺失的外部动作误读成有效关键帧。"""
    interpolation, global_sequence = unpack('Hh', data, offset)
    global_duration = None
    if global_sequence != -1:
        count, start = unpack('II', data, 20)
        if global_sequence < count:
            global_duration = unpack('I', data, start+global_sequence*4)[0]
            sequence = 0
    arrays = []
    for address, fmt in [(offset+4, 'I'), (offset+12, '4H' if kind == 'rotation' else '3f')]:
        count, table = unpack('II', data, address)
        if sequence >= count:
            arrays.append([])
            continue
        length, start = unpack('II', data, table+sequence*8)
        step = struct.calcsize('<'+fmt)
        if start+length*step > len(data):
            raise ValueError('关键帧越界或缺失外部动作')
        values = [list(unpack(fmt, data, start+i*step)) for i in range(length)]
        arrays.append([v[0] for v in values] if fmt == 'I' else values)
    times, values = arrays
    if len(times) != len(values):
        raise ValueError('关键帧时间与数值数量不匹配')
    if interpolation not in (0, 1):
        raise ValueError('不支持的插值类型 '+str(interpolation))
    if kind == 'rotation':
        values = [[(q[0]-32767)/32768, (q[2]-32767)/32768, -(q[1]-32767)/32768, (q[3]-32767)/32768] for q in values]
    elif kind == 'translation':
        values = [vector(v) for v in values]
    else:
        values = [[v[0], v[2], v[1]] for v in values]
    return dict(interpolation=interpolation, times=times, values=values, globalDuration=global_duration)


def animation_data(repo, fid, actions):
    """保留源骨骼层级、蒙皮权重、附件锚点以及指定的真实动作。"""
    parts = chunks(repo.read(fid))
    if b'SKID' in parts:
        raise ValueError('该模型需要外置骨架；本次只选择动作齐全的内嵌骨架模型')
    data = parts[b'MD21']
    count, offset = unpack('II', data, 28)
    sequences = []
    for i in range(count):
        aid, variation, duration, speed, flags = unpack('HHIfI', data, offset+i*64)
        sequences.append(dict(id=aid, variation=variation, duration=duration, flags=flags, alias=unpack('H', data, offset+i*64+62)[0]))
    selected = {}
    for name, aid in actions.items():
        index = next(i for i,s in enumerate(sequences) if s['id'] == aid and s['variation'] == 0)
        seen = set()
        while sequences[index]['flags'] & 0x40:
            if index in seen:
                raise ValueError('循环动画别名')
            seen.add(index)
            index = sequences[index]['alias']
        if not sequences[index]['flags'] & 0x20:
            raise ValueError('指定动作不在模型内，禁止静默替代 '+name)
        selected[name] = dict(index=index, id=aid, duration=sequences[index]['duration']/1000)
    count, offset = unpack('II', data, 44)
    bones = []
    for i in range(count):
        start = offset+i*88
        bones.append(dict(parent=unpack('h', data, start+8)[0], flags=unpack('I', data, start+4)[0], pivot=vector(unpack('3f', data, start+76)), tracks={name:{kind:read_track(data, start+16+j*20, entry['index'], kind) for j,kind in enumerate(['translation','rotation','scale'])} for name,entry in selected.items()}))
    count, offset = unpack('II', data, 60)
    weights, indices = [], []
    for i in range(count):
        weights.extend(v/255 for v in unpack('4B', data, offset+i*48+12))
        indices.extend(unpack('4B', data, offset+i*48+16))
    count, offset = unpack('II', data, 240)
    attachments = []
    for i in range(count):
        aid, bone = unpack('IH', data, offset+i*40)
        attachments.append(dict(id=aid, bone=bone, position=vector(unpack('3f', data, offset+i*40+8))))
    return dict(bones=bones, weights=weights, boneIndices=indices, actions=selected, attachments=attachments)


def export_mesh(repo, specification, output, animated=False):
    """导出本体或武器网格及解析后的原贴图，动态贴图必须显式指定。"""
    fid = repo.resolve(specification['model'])
    if fid is None:
        raise ValueError('清单未找到 '+specification['model'])
    result = repo.model(fid)
    override = repo.resolve(specification['texture']) if specification.get('texture') else None
    for mesh in result['meshes']:
        mesh['geoset'] = int(mesh['name'].split()[1])
        if specification.get('geosets') is not None:
            mesh['visible'] = mesh['geoset'] in specification['geosets']
        texture = override if mesh['dynamic'] and override else mesh['texture']
        if mesh['visible'] and texture is None:
            raise ValueError('可见网格缺少贴图 '+specification['model']+' '+mesh['name'])
        if texture is not None:
            repo.read(texture)
            name = f'textures/{texture}.png'
            dest = output/name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                with Image.open(repo.path(texture)) as image:
                    image.convert('RGBA').save(dest)
            mesh['textureFile'] = name
    if animated:
        result.update(animation_data(repo, fid, specification['actions']))
    return result


def main():
    """逐位导出，依赖缺失时失败，避免用占位资源覆盖已接入的模型。"""
    repo = TracedRepository()
    output = ROOT/CONFIG['output']
    output.mkdir(parents=True, exist_ok=True)
    for hero_id in sys.argv[1:] or CONFIG['heroes']:
        spec = CONFIG['heroes'][hero_id]
        repo.used = {}
        body = export_mesh(repo, spec, output, True)
        weapons = [dict(config=w, data=export_mesh(repo,w,output)) for w in spec['weapons']]
        result = dict(id=hero_id, name=spec['name'], body=body, weapons=weapons, dependencies=repo.used)
        (output/(hero_id+'.json')).write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'),allow_nan=False),encoding='utf-8')
        print(hero_id, 'bones',len(body['bones']),'meshes',len(body['meshes']),'attachments',body['attachments'][:3],flush=True)


if __name__ == '__main__':
    main()
