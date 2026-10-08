'use strict';
/** 图鉴分组、文案和布局，均可独立调整而不改变装备领域规则。 */
module.exports={
 feedback:{hideFragmentHint:true},
 categories:[['support','通用类'],['physical','物理类'],['magic','法术类']],
 quality:{2:{name:'精良',color:'#258EE2'},3:{name:'史诗',color:'#9E58D9'}},
 concealed:{icon:'classic/item-101.png',name:'未知装备',unobtained:'获得该装备或碎片后解锁'},text:{unavailable:'待开放',max:'已达满阶',upgrade:'装备进阶',back:'返回详情',close:'点击空白处返回图鉴',preview:'装备预览 · 暂不可获取或进阶',fragment:'碎片',upgradeTitle:'进阶激活属性',rule:'强化属性逐阶累加',noFragments:'碎片不足，可通过签到或远征奖励收集',noDiamonds:'钻石不足',pending:'领取战斗结算后可进阶'},
 layout:{columns:5,cellWidth:124,cellHeight:140,icon:94,nameFont:23,statusFont:17,header:58,gap:18,
  detailBackground:'#E5D2AA',detailWidth:560,detailHeight:970,titleY:422,iconY:324,detailIcon:112,progressY:238,
  viewportY:-43,viewportHeight:492,padding:30,font:25,lineHeight:36,sectionGap:22,
  buttonY:-364,costMessageOffset:18,costY:-419,closeY:-524,buttonWidth:330,upgradeRow:74,dragThreshold:14,
  ink:'#593E2C',muted:'#816849',paper:'#E5D2AA',gold:'#D5A635',ready:'#A83529',active:'#327D45',shade:'#15120FAA'},
};
