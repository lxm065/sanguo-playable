'use strict';
/** 仅从持久化状态读取培养加成，阵容评估和实际开战共用，不创建存档字段。 */
function snapshot(state,base){const meta=state.meta||{},talent=require('./activity-config').talent;return {...base,enemyCombatRelief:require('./enemy-relief').snapshot(state),playerVip:require('./vip').perks({state}),playerTalent:Object.fromEntries(talent.entries.map((e,i)=>[e[2],(meta.activities?.talent?.levels?.[i]||0)*talent.step])),playerTalentTree:meta.activities?.talent?.tree?.levels||{},playerBonds:require('./bond-activation').state({state}),playerEquipmentGrades:meta.equipmentGrades};}
/** 正式战斗沿用领域服务的普通天赋入口，其余培养快照与评估完全一致。 */
function rules(model,base=model.rules){const result=snapshot(model.state,base);return {...result,playerTalent:model.activities?.bonuses()||result.playerTalent};}
module.exports={rules,snapshot};
