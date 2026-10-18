'use strict';
const c=require('./enemy-light-balance-config');
const {power}=require('./combat-power');
/** 将固定目标战力换算为本关生命和攻击倍率，保留异常阵容的安全边界。 */
function scaleFor(own,enemy,curve){return Math.max(c.minScale,Math.min(c.maxScale,own/Math.max(1,enemy)*curve));}
/** 纯读取本章基准与本关敌阵；后续关卡不再读取玩家当前战力。 */
function query(model,enemies){
 const state=model.state,m=state.meta;if(!m||m.section<c.fromSection)return null;
 const node=model.progression.nodes().find(n=>n.id===m.activeNode),type=require('./enemy-stage-two-opening').active(state)?c.firstBattle.coefficient:c.types[node?.type];if(type===undefined)return null;
 const cycle=require('./enemy-difficulty-cycle').current(state),sample=require('./enemy-player-baseline').query(model,cycle),reference=sample.units?sample:null;if(!cycle&&!reference?.units.length)return null;enemies=require('./enemy-stage-two-opening').strip(enemies,state);
 const own=sample.power;
 const enemy=require('./strongest-team').score(enemies,model.roster,{...model.rules,playerTalent:{},playerTalentTree:{},playerEquipmentGrades:{},playerVip:null,playerBonds:undefined},require('./enemy-equipment').collect(enemies));
 const difficulty=Math.max(c.minDifficulty,cycle?.difficulty??c.initialDifficulty),curve=type*difficulty;
 return {version:c.version,own,enemy,type,difficulty,curve,scale:scaleFor(own,enemy,curve),...(reference?{reference:{version:require('./strongest-team-config').version,population:reference.population,units:reference.units.map(u=>({uid:u.uid,heroId:u.heroId,star:u.star,slot:u.slot})),equipment:reference.equipment.map(e=>({uid:e.uid,id:e.id,owner:e.owner}))}}:{})};
}
/** 首战记录本章基准和本关倍率；旧快照只迁移一次，待领战报不变。 */
function apply(model){
 const e=model.state.expedition?.enemyEncounter;if(model.state.pending||!e||e.key!==require('./enemy-budget').key(model.state)||e.lightBalance?.version===c.version)return;
 const result=query(model,e.units);if(!result)return;e.units=require('./enemy-stage-two-opening').strip(e.units,model.state);
 const cycle=require('./enemy-difficulty-cycle').initialize(model.state,result.own);cycle.baseline=result.own;cycle.baselineVersion=c.playerBaseline.version;if(result.reference)cycle.reference=result.reference;
 e.scale=result.scale;e.lightBalance={...result,legacyRetries:e.lightBalance?.legacyRetries??(e.retries||0),legacyContinues:e.lightBalance?.legacyContinues??(e.continues||0)};delete e.calibration;
}
/** 新制视频只回退一次统一系数，普通重试不降难；沿用旧档已领取的减压。 */
function assist(model,video){
 const e=model.state.expedition?.enemyEncounter;if(!e||e.key!==require('./enemy-budget').key(model.state)||e.lightBalance?.legacyRetries===undefined||!require('./enemy-difficulty-cycle').current(model.state))return false;
 if(video){const value=require('./enemy-difficulty-cycle').relieve(model.state,e.lightBalance.type),result=e.lightBalance;result.difficulty=value.difficulty;result.curve=result.type*value.difficulty;result.scale=scaleFor(result.own,result.enemy,result.curve);e.scale=result.scale;e.retries=(e.retries||0)+1;require("./enemy-relief").grant(model.state);}
 return true;
}
module.exports={power,query,apply,assist};
