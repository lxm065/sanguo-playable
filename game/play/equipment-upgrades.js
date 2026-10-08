'use strict';
const config=require('./equipment-upgrade-config'),base=require('./equipment-base-config');
/** 读取永久强化等级；缺失字段代表零阶，不触发旧存档写入。 */
function grade(id,grades={}){return grades[id]||0;}
/** 逐阶累计配置属性，返回副本，禁止污染共享装备定义。 */
function resolve(definition,grades={}){
 const result={...definition,basic:{...(base[definition.id]?.stats||{})}},steps=config.entries[definition.id]||[];
 result.hpPercent=definition.hpPercent||result.basic.hpPercent||0;
 for(const [key,value] of steps.slice(0,grade(definition.id,grades))){const target=config.fields[key][0]==='stats'?result.basic:result;target[key]=(target[key]||0)+value;}
 return result;
}
/** 同一配置生成强化文案，避免展示数值和战斗计算分叉。 */
function lines(id){return (config.entries[id]||[]).map(([key,value])=>{const [,name,percent]=config.fields[key];return name+'+'+Number((value*(percent?100:1)).toFixed(3))+(percent?'%':'');});}
/** 兼容旧存档并拒绝无效等级，未开放装备不能伪造强化记录。 */
function valid(grades){return grades===undefined||!!grades&&typeof grades==='object'&&!Array.isArray(grades)&&Object.entries(grades).every(([id,n])=>config.entries[id]&&Number.isInteger(n)&&n>=0&&n<=config.entries[id].length);}
/** 在共享事务中重新校验价格、章节与预期等级；失败和双击均不会重复扣款。 */
function upgrade(model,id,expectedGrade,ticket=null){
 return model.transact(()=>{
  model.editable();
  const q=require('./equipment-catalog').query(id,model.state);
  if(q.grade!==expectedGrade)throw Error('装备阶级已变化，请重新查看');
  if(!q.canUpgrade)throw Error(q.reason);
  if(require("./equipment-ad").required(q))model.consumeAd(ticket);
  const meta=model.state.meta;
  meta.inventory[id]-=q.cost.fragments;
  meta.diamonds-=q.cost.diamonds;
  if(!meta.equipmentGrades)meta.equipmentGrades={};
  meta.equipmentGrades[id]=q.grade+1;
  return q.grade+1;
 });
}
module.exports={grade,resolve,lines,valid,upgrade};
