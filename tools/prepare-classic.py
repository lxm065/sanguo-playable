"""将已核对的原版配置与三国外观映射生成可审阅的本地配置。"""
import json,shutil
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'策划资料库/原始配置'
def read(name):
    """读取只读原版配置表。"""
    return json.loads((SOURCE/(name+'.json')).read_text(encoding='utf8'))
lords=[]
names=[('liubei','刘备','仁德','心怀汉室、以仁义聚英才，愿与天下英雄共扶社稷。'),('sunjian','孙坚','虎威','江东猛虎，勇冠三军，以传国之志率领江东子弟。'),('dongzhuo','董卓','雄据','据西凉而入京师，拥重兵、聚珍宝，威震诸侯。'),('yuanshao','袁绍','招揽','四世三公，门生故吏遍天下，凭声望广纳豪杰。'),('caocao','曹操','求贤','唯才是举，广发求贤令，以雄才谋定天下。'),('sunquan','孙权','制衡','承父兄基业，任贤使能，统领江东群英。'),('liubiao','刘表','文治','坐镇荆襄，礼贤下士，聚九郡物资以安一方。')]
for i,(key,name,skill,desc) in enumerate(names):
    raw=read('flag_bearer_cfg')[str(1001+i)]
    lords.append(dict(id=raw['id'],key=key,name=name,description=desc,hp=int(raw['hp']),coin=int(raw['coin']),chapter=int(raw['unlock2']),sign=int(raw['unlock1']),skillName=skill+'-1',skillDescription=raw['skill_des1'],source=raw,portrait='classic/'+key+'.png'))
cfg={'lords':lords,'defaultLord':'1001','baseArmyLimit':1,'lordArmyBonus':{'1001':1},'tabs':[['heroes','主公'],['camp','要塞'],['home','远征'],['training','挑战'],['rules','天赋']],
 'chapter':{'id':1,'name':'黄巾之乱','place':'涿郡','sections':['1/5黄巾初起','2/5乡野危机','3/5义军集结','4/5讨伐乱军','5/5平定黄巾'],'unlockHero':'zhangfei','unlockName':'张飞','bossStar':2,'layers':10},
 'profile':{'diamonds':0,'inventory':{'5':0,'8':0,'10':0},'unlockedUnits':['zhaoyun','guanyu','huangzhong','zhugeliang']},
 'items':{'1':{'name':'钻石','original':'钻石','icon':'◆','description':read('assets_cfg')['1']['desc1']},'5':{'name':'军略丹','original':'药剂','icon':'丹','description':read('assets_cfg')['5']['desc1']},'8':{'name':'招贤钱','original':'幸运币','icon':'钱','description':read('assets_cfg')['8']['desc1']},'10':{'name':'神行令','original':'加速卡','icon':'令','description':read('assets_cfg')['10']['desc1']},'7205':{'name':'赤魂玉','original':'灵魂石','icon':'玉','description':'装备碎片；合成对应装备，保留原装备属性与技能 ID。','source':read('equip_cfg')['7205']},'7211':{'name':'济世佩','original':'梅肯','icon':'佩','description':'装备碎片；合成对应装备，保留原装备属性与技能 ID。','source':read('equip_cfg')['7211']}},
 'chapterReward':{'1':2000,'5':100,'8':10},'shop':{'dailyAdRefreshes':5,'offers':[{'item':'7205','count':3,'price':2400,'discount':8},{'item':'7211','count':10,'price':0,'discount':5},{'item':'7205','count':6,'price':0,'discount':8}],'source':'2026-10-02 原版要塞实测当前三件商品；非全服完整商品池'},
 'mine':{'chapter':5,'slots':8,'source':read('fortress_cfg')['1000']},'ads':{'mode':'development','adUnitId':''},'map':{'rowSpacing':205,'laneX':[-220,0,220],'types':['battle','battle','elite','battle','spring','battle','treasure','elite','spring','boss']}}
cfg['portraitCrop']=[0.16,0.04,0.68,0.46]
(ROOT/'game/play/classic-config.js').write_text("'use strict';\n/** 原配置映射的微信模块。 */\nmodule.exports="+json.dumps(cfg,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
(ROOT/'game/play/classic.config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf8')
out=ROOT/'game/skin-assets/classic';out.mkdir(exist_ok=True)
large=json.loads((ROOT/'evidence/ui-large.json').read_text())
for idx,name in [(33,'paper'),(43,'overworld'),(21,'route-bg')]:Image.open(ROOT.parent/large[idx][0]).save(out/(name+'.png'))
Image.open(ROOT.parent/large[55][0]).crop((0,0,369,665)).save(out/'lord-frame.png')
print('配置已生成：7 位主公、6 种道具、原价黑市、首章5节')
