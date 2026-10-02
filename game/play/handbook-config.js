'use strict';
/** 图鉴独立于战斗名册；条目顺序、身份与解锁条件均由此表定义。 */
const rows=[
 ['1101','冰女','zhenji','甄姬','魏','谋士',1,0,'女'],
 ['1102','斧王','xuchu','许褚','魏','猛将',1,0,'男'],
 ['1103','小黑','xiahouyuan','夏侯渊','魏','神射',1,0,'男'],
 ['1104','敌法','zhaoyun','赵云','蜀','先锋',1,1,'男'],
 ['1105','小小','dianwei','典韦','魏','猛将',1,7,'男'],
 ['1106','骨法','diaochan','貂蝉','群','谋士',1,40,'女'],
 ['1207','火枪','huangzhong','黄忠','蜀','神射',2,0,'男'],
 ['1208','骨弓','taishici','太史慈','吴','神射',2,0,'男'],
 ['1209','屠夫','zhangfei','张飞','蜀','猛将',2,0,'男'],
 ['1210','冰龙','xiaoqiao','小乔','吴','谋士',2,10,'女'],
 ['1211','水人','ganning','甘宁','吴','先锋',2,19,'男'],
 ['1212','毒龙','zhangliao','张辽','魏','先锋',2,32,'男'],
 ['1313','火女','zhouyu','周瑜','吴','谋士',3,0,'男'],
 ['1314','圣骑','guanyu','关羽','蜀','猛将',3,0,'男'],
 ['1315','沙王','machao','马超','蜀','先锋',3,4,'男'],
 ['1316','风行','sunshangxiang','孙尚香','吴','神射',3,25,'女'],
 ['1318','影魔','zhangjiao','张角','群','谋士',3,50,'男'],
 ['1320','拍拍','yanliang','颜良','群','猛将',3,0,'男'],
 ['1419','蓝胖','huangyueying','黄月英','蜀','谋士',4,0,'女'],
 ['1421','潮汐','zhurong','祝融','群','神射',4,14,'女'],
 ['1425','大圣','lvbu','吕布','群','猛将',4,60,'男'],
];
const reused=['zhaoyun','huangzhong','zhangfei','guanyu'];
const portraitRegions={zhaoyun:[0.25,0.22,0.64,0.48],huangzhong:[0.18,0.29,0.64,0.48],zhangfei:[0.20,0.33,0.60,0.45],guanyu:[0.23,0.13,0.65,0.4875]};
module.exports={
 heroes:rows.map(([sourceId,sourceName,id,name,faction,role,tier,chapter,gender])=>({sourceId,sourceName,id,name,faction,role,tier,chapter,gender,unlock:id==='zhangfei'?'boss':chapter?'chapter':'initial',portrait:reused.includes(id)?id+'-drawing.png':'handbook/'+id+'.png',portraitRegion:portraitRegions[id]})),
 excluded:['刘备','孙坚','袁绍','董卓','曹操','孙权','刘表'],
 bonds:[
  {id:'wei',kind:'faction',value:'魏',name:'魏·铁壁',effect:'魏将物理防御＋{0}／＋{1}',values:[5,15]},
  {id:'shu',kind:'faction',value:'蜀',name:'蜀·同袍',effect:'全体友军每秒恢复最大生命值的{0}%／{1}%',values:[1,2]},
  {id:'wu',kind:'faction',value:'吴',name:'吴·疾战',effect:'吴将攻击速度＋{0}%／＋{1}%',values:[25,50]},
  {id:'qun',kind:'faction',value:'群',name:'群·破阵',effect:'全体敌人物理防御－{0}／－{1}',values:[5,15]},
  {id:'warrior',kind:'role',value:'猛将',name:'猛将',effect:'猛将最大生命值＋{0}%／＋{1}%',values:[8,16]},
  {id:'archer',kind:'role',value:'神射',name:'神射',effect:'神射攻击力＋{0}%／＋{1}%',values:[10,20]},
  {id:'strategist',kind:'role',value:'谋士',name:'谋士',effect:'全体敌人魔法防御－{0}／－{1}',values:[5,15]},
  {id:'vanguard',kind:'role',value:'先锋',name:'先锋',effect:'先锋暴击率＋{0}%／＋{1}%，暴击伤害＋{2}%',values:[15,30,50]},
 ],
 thresholds:[2,4],fiveStarChapter:18,
 tabs:[['heroes','武将'],['equipment','装备'],['bonds','羁绊']],
 text:{title:'图鉴',preview:'羁绊效果预览 · 尚未接入战斗',equipment:'装备图鉴暂未开放',initial:'初始收录',chapter:'通关第{0}章',boss:'击败首个BOSS并完成结算解锁',unimplemented:'仅图鉴展示，尚未接入招募',available:'已接入本地阵容',unavailable:'已接入本地阵容，尚未解锁',close:'点击空白处关闭',back:'返回图鉴',fiveStar:'通关第{0}章，全体单位可升5星',rules:'同名不同阶只计一次，主公不参与',detail:'图鉴定位与当前战斗规则分别维护。'},
 layout:{width:690,height:990,titleY:439,tabY:-426,viewportY:28,viewportHeight:716,viewportWidth:632,padding:12,columns:3,cellWidth:196,cellHeight:195,portrait:108,tierHeader:58,bondHeight:330,bondColumns:3,bondPortrait:76,bondRow:108,dragThreshold:14,font:25,smallFont:22,titleFont:34,colors:['#24903A','#3278C8','#924EC2','#C58020'],paper:'#E5D2AA',ink:'#593E2C',muted:'#816849',gold:'#D5A635'},
};
