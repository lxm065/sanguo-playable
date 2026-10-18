"use strict";
/** 参考 tryndamere_crit 的压身、跃起举刀、快速重劈、俯身收势；时间以命中点为 1。 */
module.exports={hero:'guanyu',animation:'jumpCleave',source:'skill1',directions:['s','se','e','ne','n'],
 reference:{clip:'tryndamere_crit',duration:1.0666667223,impactProgress:.5},
 poses:[[0,0],[.16,5],[.3,12],[.52,12],[.68,11],[.78,10],[.88,7],[1,6],[1.22,6],[1.4,5],[1.6,0]],
 posture:{rotation:[[0,0],[.16,-8],[.52,12],[.68,12],[1,-18],[1.22,-18],[1.6,0]],
 scale:[[0,1,1],[.16,1.06,.88],[.52,.96,1.06],[.68,.96,1.06],[1,1.08,.86],[1.22,1.08,.86],[1.6,1,1]]},
 height:64,windup:.16,ascent:.52,apex:.68,crouch:7,recovery:.6,
 easing:{rise:'quadOut',fall:'quadIn'},
 blade:'bladeSweep',bladeFrames:[0,1,2,3,4,5],bladeSize:200,
 bladeX:24,bladeTop:72,bladeBottom:22,bladeAngle:-78,bladeWidth:.85,bladeHeight:1.7,color:'#F2E6A0'};
