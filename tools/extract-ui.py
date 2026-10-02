"""按已核对图集区域提取原版界面资产，保留源路径与矩形记录。"""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'game/skin-assets/classic'
SOURCES={
 'main':ROOT/'game/subpackages/main/native/1b/1bb8c0298.3e6da.png',
 'map':ROOT.parent/'sanguo-sample/game/remote/module_battle/native/6a/6a3f0a33-abab-4744-bb6c-a2123edc957f.4c0b4.png',
 'entry':ROOT.parent/'sanguo-sample/game/remote/module_battle/native/17/17af34603.2ed0d.png'}
REGIONS={
 'main':{'tab-lord':(0,932,96,1020),'tab-fort':(100,611,196,704),'tab-expedition':(102,108,200,212),'tab-challenge':(201,511,290,607),'tab-talent':(200,217,276,299),'invite':(100,317,198,416),'daily':(100,417,198,510),'notice':(100,219,198,315),'avatar-frame':(0,727,149,877),'plate':(0,877,182,932),'diamond':(247,700,289,746),'navbar':(0,0,97,725)},
 'map':{'flag':(79,0,145,99),'flag-active':(144,0,208,99),'spring':(207,0,321,108),'treasure':(244,104,357,217),'elite':(0,212,111,350),'elite-active':(117,213,228,350),'boss':(227,217,351,402)},
 'entry':{'book':(413,0,512,104),'vip':(166,321,270,426),'gift':(67,418,174,523)}}
def main():
    """以原始像素导出选定 Sprite 区域，不对原文件进行改写。"""
    OUT.mkdir(exist_ok=True);manifest={}
    for bundle,regions in REGIONS.items():
        image=Image.open(SOURCES[bundle])
        for name,rect in regions.items():
            image.crop(rect).save(OUT/(name+'.png'))
            manifest[name]={'source':str(SOURCES[bundle]),'rect':rect}
    (ROOT/'evidence/classic-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
if __name__=='__main__':main()
