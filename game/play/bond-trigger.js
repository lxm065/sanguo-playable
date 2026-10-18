'use strict';
const activation=require('./bond-activation'),{bonds}=require('./expedition-stats');
/** 以战斗共用算法快照实际生效羁绊及成员，不写入存档。 */
function snapshot(model,roster){
 const units=model.state.units.filter(u=>u.slot>=0);
 return bonds(units,roster,activation.state(model)).map(b=>({id:b.id,level:b.level,members:units.filter(u=>activation.member(b,roster.find(h=>h.id===u.heroId))).map(u=>u.uid)}));
}
/** 成档提高或新成员上场时整组联动；换格、撤下、普通刷新不重复触发。 */
function changes(previous,current){
 return current.filter(b=>{const old=previous.find(p=>p.id===b.id);return b.level>0&&(b.level>(old?.level||0)||b.members.some(uid=>!old?.members.includes(uid)));});
}
module.exports={snapshot,changes};
