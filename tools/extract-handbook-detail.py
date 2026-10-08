import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];base=root.parent/'sanguo-sample/game/remote/icon';config=json.loads(next(base.glob('config*.json')).read_text());heroes=json.loads((root.parent/'策划资料库/原始配置/hero_cfg.json').read_text(encoding='utf-8'))
def decode(u):
    """还原 Cocos 压缩 UUID，定位原始技能图标。"""
    chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    if len(u)!=22:return u
    s=u[:2]
    for i in range(2,22,2):
        a=chars.index(u[i]);b=chars.index(u[i+1]);s+=format(a>>2,'x')+format(((a&3)<<2)|(b>>4),'x')+format(b&15,'x')
    return '-'.join([s[:8],s[8:12],s[12:16],s[16:20],s[20:]])
out=root/'game/skin-assets/skills';out.mkdir(exist_ok=True);icons={};sources={}
for k,v in config['paths'].items():
    if not v[0].startswith('hero-skill/') or v[0].count('/')!=1:continue
    sid=v[0].split('/')[1];uuid=decode(config['uuids'][int(k)]);files=list((base/'native'/uuid[:2]).glob(uuid+'.*'))
    if files:
        Image.open(files[0]).save(out/(sid+'.png'));icons[sid]='skills/'+sid+'.png';sources[sid]=str(files[0])
primary={k:int(v['prime_attr']) for k,v in heroes.items() if v.get('prime_attr','').isdigit()}
(root/'game/play/handbook-detail-assets.js').write_text("'use strict';\n/** 原始技能图标路径与主属性，只读提取，不改变数值。 */\nmodule.exports="+json.dumps({'icons':icons,'primary':primary},ensure_ascii=False)+';\n',encoding='utf-8')
(root/'evidence/handbook-detail-assets.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8');print('技能图标',len(icons))
