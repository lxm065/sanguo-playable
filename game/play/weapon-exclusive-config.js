'use strict';
/** 专属伤害、触发与表现统一配置；基础装备效果仍由原配置负责。 */
module.exports={
 '7007':{hero:'machao',name:'虎魂熔炉',delay:2,emergency:{threshold:.2,shieldRatio:.5,cooldown:12},radius:1,healthSource:'self',healthRatio:.15,damageType:'magic',effect:'exclusive-furnace',visual:{y:0,explodeY:48,color:'#F05B40',fill:'#A6212928',width:138,height:164,glow:[{width:14,color:'#900E2814'},{width:9,color:'#A80E3030'},{width:5,color:'#BF163B65'},{width:2,color:'#DF294FBA'}],highlight:{width:3,color:'#F0536558',curves:[[[-.75,-.6],[-1,-.1],[-.95,.52],[-.5,.84]],[[.62,.75],[.96,.4],[1,-.12],[.73,-.62]]]},pulseSeconds:.4,pulseScale:1.035,explode:'flameWave',blast:'stomp',explodeSize:270,blastSize:250,explodeDuration:.55,blastDuration:.4},description:'马超专属技能【虎魂熔炉】：吸血溢出可产生护盾；生命低于20%或即将受到敌方致命伤害时，获得最大生命50%的护盾，保命盾冷却12秒。护盾蓄能2秒后若仍存在，消耗剩余护盾引爆；蓄能期间阵亡则在死亡位置立即爆炸，对周围一格（含斜角）敌人造成马超自身最大生命值15%的法术伤害。补盾不重置蓄能，同名多件不叠加'},
 '7101':{hero:'zhenji',name:'惊鸿魅惑',duration:4,initialCooldown:2,cooldown:15,travel:.3,visual:{size:34,y:58,color:'#FF67B5',outline:'#FFD3ED',lineWidth:2,animation:'skill2'},description:'甄姬专属技能【惊鸿魅惑】：向攻击距离内最近的敌方武将释放爱心妖术，使其转而普攻原阵营其他单位，持续4秒；控制期间不能主动施法。首次2秒可用，冷却15秒，同名多件不叠加'},
 '7005':{hero:'zhangfei',name:'擒敌连刺',triggerSkill:'12091',stun:3,count:5,power:1,interval:.16,effect:'exclusive-zhangba',animation:'skill1',animationStart:.25,slash:'bladeSweep',slashSize:125,slashY:42,slashColor:'#FFE5A0',description:'张飞专属技能【擒敌连刺】：丈八擒敌命中后使目标眩晕3秒，随后快速攻击同一目标5次，每次造成100%攻击力的真实伤害；目标阵亡或连击被打断时结束，同名多件不叠加'},
 '7002':{hero:'dianwei',name:'恶来护主',haste:1,duration:9,skillCooldown:9,bodyScale:1.3,iconX:44,description:'典韦专属技能【恶来护主】：友军阵亡后获得嗜血，体型增大，攻击速度提高100%，一技能冷却重新计为9秒；持续最多9秒，抛出敌人或当前目标阵亡时提前结束，重复触发只刷新'},
 '7003':{hero:'guanyu',name:'武圣追斩',power:.55,radius:1,delay:.52,effect:'exclusive-cleave',description:'关羽专属技能【武圣追斩】：任意敌将阵亡后跳劈，对倒下敌人周围一格的敌军额外造成55%攻击力的真实伤害；每次敌将阵亡均可触发'},
 '7206':{hero:'xuchu',name:'虎痴镇阵',minimumHp:1,duration:3,cooldown:12,effect:'exclusive-shield',description:'许褚专属技能【虎痴镇阵】：抵挡一次敌方致命伤害，保留1点生命并无敌3秒；期间获得实际回血则存活，否则无敌结束时阵亡；冷却从触发时起12秒，同名多件不叠加'},
 '7208':{hero:'taishici',name:'笃烈追击',chance:.25,power:1,delay:.3,effect:'exclusive-arrow',description:'太史慈专属技能【笃烈追击】：普攻命中后有25%概率追加一发大型火焰箭，造成100%攻击力的物理伤害，不触发追击连锁'},
 '7008':{hero:'huangzhong',name:'老当益壮',step:.05,maxStacks:6,description:'黄忠专属技能【老当益壮】：连续普攻命中同一目标，每次使后续普攻伤害提高5%，最多30%；更换目标重置'},
 '7104':{hero:'zhouyu',name:'运筹帷幄',openingDelay:2,bonus:.1,lingerDuration:2,lingerHaste:.05,effect:'exclusive-strategy',description:'周瑜专属技能【运筹帷幄】：开局2秒自动强化全体存活友军一次，之后每次施放主动技能再次强化；下一次伤害技能的全部伤害提高10%；消耗强化后图标保留2秒，并增加5%攻击速度，重复只刷新，不叠加'},
 visual:{slash:'cleave',slashSize:185,shield:'shield',shieldSize:175,shieldY:58,shieldColor:'#FFD34B',arrow:'fireArrow',arrowAnimation:'skill1',arrowSize:180,arrowY:44,icon:'effects/strategy-bloodlust-transparent.png',iconSize:42,iconY:52},
};
