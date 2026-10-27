"use strict";
const {FortressBuilding}=require('./fortress-building');
/** 建筑列表沿用要塞面板注册；任一可领取或可建造升级时提醒入口。 */
function ready(progress){return [require('./diamond-mine-config'),...require('./fortress-panels-config').buildings].some(c=>{const s=new FortressBuilding(progress,c).attention();return s.claim||s.upgrade;});}
/** 单个建筑按钮使用统一红点并只读刷新状态。 */
function badge(v,node,policy,kind){const c=require('./notification-config').fortress.button;return require('./notification-view').badge(v,node,'fortress-'+kind,c.x,c.y,()=>new FortressBuilding(v.progress,policy).attention()[kind]);}
module.exports={ready,badge};
