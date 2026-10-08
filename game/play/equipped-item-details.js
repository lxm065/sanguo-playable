'use strict';
/** 穿戴详情与图鉴共用属性正文；战斗中仅只读查看，卸下仍由战役事务处理。 */
function showEquippedItem(view,parent,item,refresh,readOnly=false){
 const book={host:view,ui:view.ui,cc:view.cc,modal:parent};
 return require('./equipment-catalog-view').show(book,item.id,'detail','',0,{
  equipped:true,readOnly,
  /** 卸下后刷新武将详情；失败由原页面提示，不能绕过战斗结算锁。 */
  onUnequip(){try{if(require("./equipment-refresh").equip(view,item.uid,null)){parent.getChildByName("equipment-detail-overlay")?.destroy();refresh();}}catch(error){view.notice('无法卸下',error.message);}},
 });
}
module.exports={showEquippedItem};
