'use strict';
/** 地图表现配置独立于战斗数值；每位武将分别提供招募和已收录挑战台词。 */
module.exports={scale:1.25,heroY:0,nameY:165,font:28,nameColor:'#FFE19A',outline:'#3B2518',bubbleX:-207,bubbleY:107,bubbleWidth:230,bubbleHeight:133,bubbleFont:28,fill:'#ECD4A8',border:'#B27A3C',ink:'#4B311A',floatY:5,floatSeconds:1.1,popSeconds:.35,
 dialogue:{
  zhaoyun:{join:['常山赵子龙在此！\n胜过这杆银枪，\n便与你并肩！','欲请子龙同行，\n先让我见识\n你的胆略！'],challenge:['银枪照胆，\n再战一场！','纵有千军万马，\n子龙亦往！']},
  zhangfei:{join:['燕人张翼德！\n赢了俺，\n俺就跟你走！','敢接俺三招？\n打赢这场，\n俺认你这朋友！'],challenge:['蛇矛可不认人！\n放马过来！','上回还没尽兴！\n再战三百回合！']},
  zhouyu:{join:['且看这东风！\n破得了火阵，\n公瑾愿助一臂。','以谋略破局，\n让我见识\n你的本领。'],challenge:['琴音未歇，\n烽火已起。','兵贵神速，\n你可跟得上？']},
  yanliang:{join:['河北颜良在此！\n胜过我这刀，\n便与你并肩！','想让我服气？\n先在刀下\n站稳了！'],challenge:['刀锋所向，\n谁敢当先！','莫躲莫闪，\n痛快战一场！']},
  huangyueying:{join:['这机关可不好拆。\n破了我的阵，\n便助你出征！','再算一步，\n也许就能\n请我出山啦。'],challenge:['这次的机关，\n可换了新花样。','看准了再动，\n别踩中机关哦！']},
  taishici:{join:['弦开如满月！\n赢我一场，\n与你共赴沙场！'],challenge:['箭无虚发，\n可敢迎战！','大丈夫立世，\n当战个痛快！']},
  fallback:{join:['亮出真本事，\n我便与你同行！','此战若能胜我，\n往后并肩出征！'],challenge:['阵前见高下！','再来一场，\n此番各凭本事！']}
 },
 pedestal:{width:72,height:24,depth:15,shadowY:-19,shadowScale:1.16,shadow:'#352B2680',stone:'#414D50',stoneLight:'#798386',stoneDark:'#273436',top:'#566367',rim:'#C39850',light:'#F9D98C',inner:'#AB7B39',rimWidth:3,innerScale:.84,faceScale:.74,joints:9,jointColor:'#263438',studs:12,studRadius:2.1,runeCount:8,runeInner:.53,runeOuter:.67}
};
