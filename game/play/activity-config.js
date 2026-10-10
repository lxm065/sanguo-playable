'use strict';
/** 截图确认的任务及八项天赋；未知服务端费用采用明确的本地策略，集中留待校准。 */
module.exports={
 share:{title:"这把靠子龙，来一起征战三国！",imageUrl:"",sources:["menu","daily","invite","newcomer"],unavailable:"当前环境不支持微信分享，请在手机微信中打开。"},
 daily:[{id:'share',name:'分享一次',target:1},{id:'wins',name:'获得10场战斗的胜利',target:10},{id:'equipment',name:'获得10件装备',target:10},{id:'merge4',name:'合成1个4阶单位',target:1}],
 fragments:{randomItem:'101',pool:require('./sign-config').bluePool},
 rewards:{'1':2000,'8':5,'101':5},
 items:{'7':{name:'秘典',description:'用于后续技能洗练，当前保存在仓库中。'},'103':{name:'随机装备碎片',description:'领取时随机获得具体装备碎片。'},'101':{name:'随机装备碎片',description:'随机装备碎片，保存在仓库中。'}},
 invite:{targets:[1,2,3],rewards:{'101':5,'5':200,'8':5},shareRewards:{'101':5},tabs:['邀请好友','邀请新人','助力群'],shareTitle:'三国自走棋，一起征战天下！',groupImage:'',periodEnd:null},
 talent:{animation:{turns:3,fastMs:42,slowMs:175,easing:3,holdMs:1200,color:'#FFE65B',rayColor:'#F7CD5990',lineWidth:7,rayWidth:4,ringPadding:8,resultY:-300,resultRise:80,resultFont:32},cost:700,costPerLevel:100,breakMultiplier:2,orb:{radius:82,ringRadius:108,amplitude:4,waveStep:4,fill:'#17BFEF',deep:'#126EC3',rim:'#A066FF'},adLimit:3,dustCost:1,step:.02,breakEvery:8,damageReductionCap:.9,source:'八项名称、每级2%及突破条件来自原版客户端；700钻与3次广告来自截图；等级1为700钻、等级3为900钻；中间每级100钻为本地插值，突破双倍由用户确认；1军略丹为本地待校准策略。',
 entries:[['刚猛','物理伤害增加','physicalUp','7208'],['冥想','魔法伤害增加','magicUp','7204'],['壁垒','物理伤害降低','physicalDown','7201'],['专注','魔法伤害降低','magicDown','7211'],['狂怒','普攻伤害增加','attackUp','7206'],['预谋','技能伤害增加','skillUp','7202'],['坚韧','普攻伤害降低','attackDown','7213'],['意志','技能伤害降低','skillDown','7212']]},
 rewardReceipt:{pageSize:15,pageButtonY:-287,pageConfirmY:-384,fragmentMark:'碎',fragmentFont:22,fragmentInset:13,fragmentSize:28,frameWidth:570,frameColor:'#D6B574',frameThickness:2,framePadding:18,title:'获得物品',hint:'奖励已发放',columns:5,icon:88,gap:111,rowGap:113,top:65,titleY:220,buttonY:-310},
 layout:{costIconX:-40,costTextX:26,costY:-23,costIconSize:34,actionTitleY:20,actionBadgeX:133,actionBadgeY:43,singleActionX:0,leftActionX:-165,rightActionX:165,modalWidth:665,modalHeight:975,titleY:420,tabY:-413,rowTop:265,rowGap:181,rowWidth:604,rowHeight:167,iconSize:78,rewardX:-230,rewardGap:98,rewardY:-22,actionX:192,buttonWidth:188,font:28,wheelY:70,wheelRadius:225,wheelIcon:112,wheelWidth:690,wheelHeight:825},
 text:{invite:'邀请好友',daily:'日常任务',sign:'每日签到',close:'点击空白处关闭',shareUnavailable:'分享关系服务尚未接入，暂不能核验分享与邀请奖励。',newcomer:'被邀请新人通关第1章\n即可领取奖励\n\n等待邀请服务接入后同步进度',group:'助力群尚未配置',point:'三系加点规则尚未完成核对，暂不消耗天赋点。',signNote:'累计签到第9次解锁曹操\n第18次解锁孙权',signRewardNote:'签到奖表待核对，本页仅记录签到和主公解锁。'}
};
