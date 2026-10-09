'use strict';
/** 穿戴只刷新背包、状态徽章与团队增益，保留角色节点和动画进度。 */
function refresh(view){if(view.model.state.meta?.equipmentTutorial?.done)require("./equipment-tutorial-view").clear(view);if(view.refreshEquipment){view.refreshEquipment();return;}if(!view.battleHud){view.render();return;}view.battleHud.renderEquipment();for(const unit of view.model.state.units){const actor=view.actors.get(unit.uid),old=actor?.status.getChildByName('equipped-icons');if(old){old.removeFromParent();old.destroy();}view.battleHud.renderEquipped(unit);}for(const node of [...view.root.children])if(node.name.startsWith('team-buff-')){node.removeFromParent();node.destroy();}require('./team-equipment-buffs').render(view);require('./notification-view').refresh(view);}
/** 所有穿戴入口共用事务及轻量刷新，失败保留当前战场。 */
function equip(view,item,owner){try{if(view.playing)throw Error('交战中，请等待结算');view.model.equip(item,owner);refresh(view);return true;}catch(e){view.notice('提示',e.message);return false;}}
module.exports={refresh,equip};
