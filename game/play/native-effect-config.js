'use strict';
/** 技能映射原生特效序列，尺寸、持续策略与描绘方式均可独立调整。 */
module.exports={maxNodes:64,frameInterval:40,offsetY:20,defaultSize:170,projectileSize:130,freezeOffset:50,
 impactMap:{fireArrow:"flame",volley:"iceNova",snipe:"cleave"},
 impactSizes:{iceArrow:75,fireArrow:90,volley:75,snipe:120},
 durations:{iceNova:1.2,whirl:.9,fireArrow:.3,volley:.3,snipe:.35},
 whirlSize:280,whirlOffsetY:0,
 whirlMotion:{directions:['s','sw','w','nw','n','ne','e','se'],turnSeconds:.433,frameInterval:30,animation:'skill1'},
 levelup:{id:'levelup',size:240,offsetY:60,duration:1.867},
 sizes:{wowBlood:85,decay:155,drain:150,iceNova:260,freeze:190,blizzard:240,flame:220,heal:180,shield:160,silence:90,stomp:240,cleave:160},
 map:{iceNova:'iceNova',freeze:'freeze',blizzard:'blizzard',whirl:'whirlwind',bleed:'cleave',taunt:'roar',execute:'cleave',iceArrow:'iceNova',silence:'silence',volley:'fireArrow',manaBreak:'mana',blinkStrike:'blink',void:'mana',headshot:'cleave',shrapnel:'stomp',snipe:'fireArrow',fireArrow:'fireArrow',blink:'blink',rapid:'bloodlust',pact:'death',hook:'death',consume:'death',rot:'death',deathBlast:'death',firePillar:'flame',flameWave:'flame',flameSoul:'flame',lightning:'mana',holyHeal:'heal',cleanse:'dispel',protect:'shield',slam:'stomp',rend:'cleave',fury:'cleave',enrage:'bloodlust',ignite:'flame',bloodlust:'bloodlust',blast:'flame'},
 selfEffects:['whirl','rapid','pact','blink','enrage','taunt','protect','holyHeal'],
 castEffects:['whirl','blink','rapid','pact','enrage','taunt','holyHeal','cleanse','protect','bloodlust'],
};
