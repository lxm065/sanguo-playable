'use strict';
/** 前两章表现策略：原资源、弹道、状态图标和提示布局与战斗数值分离。 */
module.exports={
 status:{size:32,silenceSize:48,gap:52,y:28,columns:5,interval:40,flashSeconds:.8,hiddenSkills:['13133','11032'],hiddenSkillsByHero:{huangzhong:['12073']}},
 badge:{font:27,width:220,y:100,rise:28,seconds:1.1,color:'#FFE39C'},
 hook:{head:'hookHead',cable:'native-effects/hookCable.png',size:85,width:12,offsetY:35,angle:-90,seconds:.6,returnRatio:.5},
 beams:{lightning:{id:'lightning',texture:'native-effects/lightningStrip.png',width:42,size:140,spacing:65,seconds:.45},flameWave:{id:'flameWave',size:190,spacing:75,seconds:.65},snipe:{id:'arrow',size:110,spacing:90,seconds:.25}},
 passive:{aura:'11014',attackAura:'11034',reduction:'11042',aim:'12073',slowAura:'13143'},
 impact:{'equipment-7003':'cleave','equipment-7114':'lightning',pact:'drain',bleed:'wowBlood',rend:'wowBlood',hook:'wowBlood',consume:'drain',rot:'decay',deathBlast:'decay',manaBreak:'manaBurn',void:'manaBurn',shrapnel:'shrapnel',lightning:'lightning',flameWave:'flameWave'},
 states:{consume:'drain',flameSoul:'flame',rend:'wowBlood',rapid:'bloodlust',enrage:'bloodlust',bloodlust:'bloodlust',protect:'shield',taunt:'roar',rot:'decay'},
 stateSkills:{flameSoul:'13133',rend:'14202',rapid:'12082',enrage:'14204',bloodlust:'14192',protect:'13144',taunt:'11023',rot:'12093',freeze:'11011',silence:'11032',bleed:'11022'},
 persistent:['aura','attackAura','reduction','aim','slowAura','rot'],
 flashStates:['rend','bleed'],
 visualDuration:3600,
};
