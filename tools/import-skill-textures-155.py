"""将原游戏贴图的混合方式转换为透明PNG，保留来源和哈希。"""
from pathlib import Path
from PIL import Image
import hashlib,json
OUT=Path('game/skin-assets/native-effects')
SOURCES={
 'wowBlood':('F:/WoW-Assets/classic-titan/raw/spells/textures/blood2.blp','magenta'),
 'lightningStrip':('D:/Games/Warcraft3/ExtractedAssets/技能特效补充_20260929/决战江湖1.63正式版+(1)/资源根目录/ReplaceableTextures/Weather/Lightning.blp','additive')
}
def convert(name,source,mode):
 """色键或加法材质转直通Alpha；不重新绘制原素材图形。"""
 im=Image.open(source).convert('RGBA');pixels=[]
 for r,g,b,a in im.get_flattened_data():
  if mode=='magenta':pixels.append((r,g,0,max(0,min(255,round((r-b)*255/max(1,r))))))
  else:
   peak=max(r,g,b);pixels.append(tuple(round(x*255/peak) if peak else 0 for x in (r,g,b))+(round(a*peak/255),))
 im.putdata(pixels);im.save(OUT/(name+'.png'))
 return {'source':source,'sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),'conversion':mode}
if __name__=='__main__':
 records={name:convert(name,*spec) for name,spec in SOURCES.items()}
 c=json.loads(Path('tools/lol-hook-source.json').read_text(encoding='utf-8'))
 p=Path(c['root'])/c['cable'];records['hookCable']={'source':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'conversion':'original texture copy'}
 Path('source-assets/skill-extra-sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
