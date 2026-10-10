'use strict';
/** 装备动态效果的原版数值；同名效果不重复触发，基础属性仍可叠加。 */
module.exports={
'7003':{splash:.55},'7004':{period:15,duration:3.5,attack:35,haste:.25,hp:300,regen:30,armor:15,drain:60},'7005':{attack:-5,armor:-5,slow:.05,duration:6},'7006':{chance:.25,multiplier:2},'7007':{leech:.25,shieldCap:.5},'7008':{dodge:.3},'7009':{killAttack:20,maxStacks:10},'7010':{period:1,damage:40,gold:3},
'7102':{period:12,teamCooldown:.06,seconds:2},'7103':{period:12,stun:2},'7105':{regen:25,regenPercent:.01},'7106':{heal:60,damage:30,duration:5},'7107':{slow:.1,cooldown:.1,duration:6},'7108':{auraSlow:.25,slow:.5,duration:3},'7109':{period:13,damage:100,duration:5},'7110':{period:10,damage:500,killDamage:100,maxStacks:10},'7111':{initialCooldown:0,period:12,duration:3},'7112':{chance:.2},'7113':{magicPen:30},'7114':{chance:.2,damage:200,targets:3},
'7203':{teamAttack:.03,teamLeech:.03,teamCooldown:.03,armor:3},'7205':{regen:30},'7209':{haste:.15,maxStacks:5},'7210':{winGold:10},'7214':{...require('./chitu-config'),exclusive:require('./chitu-config').heroes},'7202':{teamCooldown:.06}
};
