'use strict';
/** 技能轮廓与持续时间独立配置，尺寸采用棋盘设计坐标。 */
module.exports={iceNova:{radius:94,rays:8,life:.8,color:'#BDEFFF',edge:'#ECFFFF'},freeze:{width:68,height:108,color:'#70CCFF70',edge:'#D9FAFF'},blizzard:{radius:150,rays:12,life:1,color:'#9CDEFF',edge:'#FFFFFF'},fireArrow:{length:56,width:14,color:'#FF832B',edge:'#FFF0A1',life:.3},blink:{radius:68,rays:8,life:.7,color:'#B5A2FF',edge:'#F4DEFF'},rapid:{radius:66,rays:6,life:.7,color:'#FFA13D',edge:'#FFEAA4'},pact:{radius:74,rays:10,life:.8,color:'#94F08C',edge:'#D7FFB1'},lineWidth:4,offsetY:20};
/** 前两章技能用不同轮廓区分：冰刺、火柱、冲击、护盾、束缚与穿透线。 */
module.exports.styles={
 iceNova:{shape:'nova',color:'#9AE7FF'},blizzard:{shape:'nova',color:'#D6F5FF'},
 whirl:{shape:'ring',color:'#E9E0A9'},bleed:{shape:'slash',color:'#FF5369'},taunt:{shape:'shield',color:'#FFAE42'},execute:{shape:'slash',color:'#FFF1A7'},
 iceArrow:{shape:'arrow',color:'#A8E7FF'},silence:{shape:'seal',color:'#C1A9FF'},volley:{shape:'arrow',color:'#D6EFFF'},
 manaBreak:{shape:'slash',color:'#DA8FFF'},blinkStrike:{shape:'beam',color:'#D1A5FF'},void:{shape:'nova',color:'#C590FF'},
 headshot:{shape:'slash',color:'#FFFFC2'},shrapnel:{shape:'nova',color:'#EBC788'},snipe:{shape:'beam',color:'#FFF7BE'},
 fireArrow:{shape:'arrow',color:'#FF9146'},blink:{shape:'ring',color:'#B5A2FF'},rapid:{shape:'ring',color:'#FFE063'},pact:{shape:'ring',color:'#86F5A6'},
 hook:{shape:'beam',color:'#B2D89F'},consume:{shape:'ring',color:'#83F8A3'},rot:{shape:'ring',color:'#98EB62'},deathBlast:{shape:'nova',color:'#B3F879'},
 firePillar:{shape:'pillar',color:'#FFA245'},flameWave:{shape:'beam',color:'#FFC65A'},flameSoul:{shape:'pillar',color:'#FFB33E'},lightning:{shape:'beam',color:'#E5D5FF'},
 holyHeal:{shape:'ring',color:'#FFF3A6'},cleanse:{shape:'shield',color:'#FFF6B7'},protect:{shape:'shield',color:'#FFFFAC'},
 slam:{shape:'nova',color:'#FFD584'},rend:{shape:'slash',color:'#FF7661'},fury:{shape:'slash',color:'#FFEFC2'},enrage:{shape:'pillar',color:'#FF814C'},
 ignite:{shape:'pillar',color:'#FFA161'},bloodlust:{shape:'pillar',color:'#FFB083'},blast:{shape:'nova',color:'#FFEAB4'}
};
module.exports.common={life:.7,radius:75,width:64,height:100,lineWidth:5,rays:7};
