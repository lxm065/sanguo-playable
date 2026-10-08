import json,re,csv
from pathlib import Path
root=Path('evidence');d=json.loads((root/'skills-154-source.json').read_text(encoding='utf-8'));events=json.loads((root/'skills-154-events.json').read_text(encoding='utf-8'));war=(root/'war3-models-154.txt').read_text(encoding='utf-8-sig').splitlines()
packages={'zhenji':('Anivia','cryostorm|flashfrost'),'xuchu':('Garen','E_|Spin'),'xiahouyuan':('Ashe','_W_|_Q_|freeze'),'zhaoyun':('XinZhao','Q_|E_|R_'),'dianwei':('Malphite','Q_|R_'),'diaochan':('Swain','Drain|R_'),'huangzhong':('Caitlyn','R_|Headshot'),'taishici':('Varus','Q_|W_'),'zhangfei':('Blitzcrank','Q_|grab'),'xiaoqiao':('Lissandra','Q_|R_'),'ganning':('Nami','R_|Wave'),'zhangliao':('Cassiopeia','Q_|Poison'),'zhouyu':('Brand','W_|R_'),'guanyu':('Taric','Q_|R_'),'machao':('XinZhao','Q_|E_'),'sunshangxiang':('Morgana','Q_|Binding'),'zhangjiao':('Veigar','W_|R_'),'yanliang':('Udyr','Q_|R_'),'huangyueying':('Lulu','W_|E_'),'zhurong':('Nami','R_|Wave'),'lvbu':('MonkeyKing','Q_|R_')}
warpat={'zhenji':'FrostNova|FreezingBreath|Blizzard','xuchu':'Cleave|BattleRoar','xiahouyuan':'ColdArrow|Silence','zhaoyun':'Blink|ManaBurn','dianwei':'RockBolt|ThunderClap','diaochan':'LifeDrain|Drain','huangzhong':'Rifle|Mortar','taishici':'SearingArrow|Bloodlust','zhangfei':'Meat|DiseaseCloud|Abomination','xiaoqiao':'FrostNova|FrostWyrm','ganning':'CrushingWave|Tidal','zhangliao':'Poison|Venom','zhouyu':'FlameStrike|BreathOfFire|Lightning','guanyu':'HolyBolt|DivineShield','machao':'Impale','sunshangxiang':'Entangling|Ensnare','zhangjiao':'Dark|DeathAndDecay','yanliang':'WarStomp|Bloodlust','huangyueying':'FireBolt|Bloodlust','zhurong':'CrushingWave|Tidal','lvbu':'Shockwave|ThunderClap'}
lines=['# 武将技能表现核查与本地素材候选（1.0.54）','','核查日期：2026-10-07。范围：当前获取池21名武将、各阶独立技能；诸葛亮只保留旧存档兼容，不计入21名。','','## 结论','','- 11名接入独立技能调度，10名仍只有旧版主技能；不能说21名技能表现都已完成。','- 当前原生特效图集20组，均来自魔兽争霸MDX。存在效果复用、缺少独立被动反馈和多重施法提示等问题。','- 本清单以源码、资源文件存在性与高生命靶场模拟为证据；不代表每一项都已做真机视觉验收。','- 多人对战目前沿用基础事件播放器，未接上远征的 ability/status 原生技能表现链；击杀播报是另一条已经接入的链。','','## 逐技能状态','','“原生映射”表示事件键存在真实素材映射，不等于专属效果或最终美术完成；“未观察”也不等于没有逻辑，部分技能需要受控、死亡等特定条件。','','|武将|首次阶级|技能 / ID|逻辑|现有表现|靶场技能事件|','|---|---|---|---|---|---|']
rows=[]
for h in d['heroes']:
 seen=set()
 for tier in h['tiers']:
  for s in tier['skills']:
   if s['id'] in seen: continue
   seen.add(s['id']);r=d['skills'].get(s['id']);effect=r.get('effect') if r else None;native=d['effects']['map'].get(effect) if effect else None
   logic=('独立规则 '+r['kind']) if r else ('旧主技能简化规则' if s['name']==h['tiers'][0]['skills'][0]['name'] else '未接入独立规则')
   visual=('原生映射 '+effect+' → '+native) if native else ('无独立反馈（数值被动）' if r and not effect else '缺少独立表现')
   if effect in ['flameSoul','rend','multicast']:visual='规则存在，但缺少独立表现事件/渲染'
   trigger='观察到' if s['id'] in events[h['id']]['abilities'] else '未观察到独立技能ID事件'
   row=[h['name'],str(tier['star']),s['name']+' / '+s['id'],logic,visual,trigger];rows.append(row);lines.append('|'+ '|'.join(row)+'|')
lines+=['','## 重点缺口与替换顺序','','1. 张飞肉钩：已有拉人逻辑，视觉却是死亡缠绕命中；需新增可伸缩链条、钩头弹道、回收段。','2. 周瑜雷击/焰浪：已有伤害规则，但分别复用了法力冲击/火柱；应换成闪电连线和沿方向传播的火浪。','3. 黄月英多重施法：逻辑会重复结算，但没有独立“多重施法”次数反馈；焰魂、撕裂同样缺少独立状态表现。','4. 其余10名：先补齐各阶技能触发与目标规则，再接素材；仅换图集无法实现冰晶、波浪、束缚等完整玩法。','5. 甄姬冰星/冰封/暴雪、许褚旋风、太史慈火箭已有原生素材，不必再次用圆圈替代；仍需逐机检查遮挡、持续时间和尺寸。','','## 魔兽争霸：当前已使用的原始素材','','|图集键|原始模型（文件存在性）|','|---|---|']
for k,v in d['manifest'].items():
 src=[s['source'] for s in v['sources'] if s['source'].lower().endswith('.mdx')]
 lines.append('|'+k+'|'+'<br>'.join(('存在：' if Path(p).is_file() else '缺失：')+p for p in src)+'|')
lines+=['','## 各武将可优先试用的魔兽争霸/英雄联盟资源','','以下是静态候选，尚未转换、导入或验收；LoL给出精确粒子名称、源bin和已映射贴图存在数，不能把PNG贴图本身当作完整技能。']
candidates=[]
for h in d['heroes']:
 pkg,pat=packages[h['id']];pat=re.sub(r'([QWER])_',r'_\1(?:_|$)',pat);path=Path('F:/LoL-Asset-Library/catalog')/pkg/'effects.json';a=json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
 matches=[e for e in a if re.search(pat,e.get('name',''),re.I) and 'base' in e.get('name','').lower() and e.get('textures') and not re.search('indicator|range|sound|audio|emote',e.get('name',''),re.I)]
 unique={e['name']:e for e in matches};picked=list(unique.values())[:2]
 wm=[p for p in war if re.search(warpat[h['id']],p,re.I)][:3]
 lines+=['',f"### {h['name']}"]
 for p in wm:lines.append('- Warcraft III：`'+p+'`（'+('存在' if Path(p).is_file() else '缺失')+'；需离线渲染并校验依赖）')
 for e in picked:
  tex=list(e.get('textures',{}).values());exists=sum((Path('F:/LoL-Asset-Library')/str(t)).is_file() for t in tex)
  src=Path('F:/LoL-Asset-Library')/e['source'];lines.append(f"- LoL：`{e['name']}`；源 `{src}`（{'存在' if src.is_file() else '缺失'}）；映射贴图 {exists}/{len(tex)} 存在；粒子配置 `{path}`。")
  candidates.append({'hero':h['id'],'package':pkg,'name':e['name'],'source':str(src),'texturesMapped':len(tex),'texturesExist':exists})
 if not picked:lines.append('- LoL：本轮包内未筛到匹配的Base效果，不能据此认定整个库没有。')
lines+=['','## 魔兽世界：可核实的本地候选','','本地 effect-catalog.csv 有122条，raw/spells 下有43个M2；本轮在该目录未找到可直接确认的 FrostNova/Blizzard 对应模型。不要把目录名 classic-titan 当作经典法术全量库。']
wow=[('火箭/火球','spells/fireball_missile_high.m2'),('火柱命中','spells/xplosion_fire_impact.m2'),('治疗','spells/food_healeffect_base.m2'),('冰封外壳','creature/questobjects/creature_iceblock.m2'),('冰封外壳备用','creature/questobjects/creature_iceblock_sindragosa.m2')]
for role,p in wow:
 p=Path('F:/WoW-Assets/classic-titan/raw')/p;lines.append(f"- {role}：`{p}`（{'存在' if p.is_file() else '缺失'}）。")
lines+=['','M2候选需要对应版本的粒子、材质、SKIN/BLP依赖解析和离线渲染；本轮仅核实文件，不声称Cocos可直接播放。','','## 长期结构建议','','- 把技能效果配置拆成施法、弹道、命中、持续、结束五段；事件携带skillId、目标与持续时间，表现层不参与伤害结算。','- 抽取远征/多人共用的技能事件播放器，先保留各玩法领域规则；否则两个模式容易继续出现视觉功能差异。','- 用真实原生manifest替代旧几何styles覆盖测试。当前测试接受styles键或multicast特例，可能让“有配置但无画面”通过。','- 建立离线预览与真机验收表；每次只导入完成依赖校验的图集。当前微信包接近30MiB，不宜直接打包三套原始资源库。','',f'本表共 {len(rows)} 项独立技能；完整机器可读数据在 skills-154-source.json、skills-154-events.json、skills-154-candidates.json。']
(root/'武将技能特效核查-1.0.54.md').write_text('\n'.join(lines),encoding='utf-8')
(root/'skills-154-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2),encoding='utf-8')
with open(root/'武将技能特效清单-1.0.54.csv','w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['武将','首次阶级','技能','逻辑','表现','事件']);w.writerows(rows)
print('skills',len(rows),'LoL candidates',len(candidates),'report chars',sum(map(len,lines)))
