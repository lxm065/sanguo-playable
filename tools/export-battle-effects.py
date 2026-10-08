"""从用户指定的三个素材库导出小型特效贴图，并记录不可变来源哈希。"""
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
SOURCES={
'ring':r'D:\Games\Warcraft3\ExtractedAssets\Textures\Textures\RingOFire.png',
'ice':r'D:\Games\Warcraft3\ExtractedAssets\Textures\Textures\Shockwave_Ice1.png',
'lightning':r'D:\Games\Warcraft3\ExtractedAssets\Textures\Textures\LightningBall.png',
'frost':r'F:\WoW-Assets\classic-titan\raw\spells\frost2.blp',
'holy':r'F:\WoW-Assets\classic-titan\raw\spells\11fx_alphamask_holyfire_glow_light.blp',
'spark':r'F:\LoL-Asset-Library\textures\Lux\a43e821b9d7c4e29ef64.png'}
def main():
 """只写游戏内衍生图，原库只读；去黑底、限制128像素适配手机。"""
 out=ROOT/'game/skin-assets/effects';out.mkdir(exist_ok=True);records=[]
 for name,file in SOURCES.items():
  p=Path(file);im=Image.open(p).convert('RGBA');im.thumbnail((128,128),Image.Resampling.LANCZOS);r,g,b,a=im.split();alpha=ImageChops.multiply(ImageChops.lighter(ImageChops.lighter(r,g),b),a);im.putalpha(alpha);im.save(out/(name+'.png'));records.append({'id':name,'source':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':im.size})
 (ROOT/'source-assets/battle-effects.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
 # 以已有箱盖和底座构成真实打开态，保留原图的宝藏标签。
 d=ROOT/'game/skin-assets/classic';src=Image.open(d/'treasure-active.png').convert('RGBA');w,h=src.size;opened=Image.new('RGBA',(w,h));base=Image.open(d/'chest-base.png').convert('RGBA').resize((w,38));lid=Image.open(d/'chest-lid.png').convert('RGBA').resize((w,27)).rotate(-9,resample=Image.Resampling.BICUBIC);opened.alpha_composite(base,(0,45));glow=ImageDraw.Draw(opened);glow.ellipse((22,35,w-20,51),fill=(255,228,139,210));opened.alpha_composite(lid,(0,3));opened.alpha_composite(src.crop((0,84,w,h)),(0,84));opened.save(d/'treasure-opened.png')
if __name__=='__main__':main()
