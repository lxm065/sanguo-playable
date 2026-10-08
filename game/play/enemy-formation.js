'use strict';
const c=require('./enemy-formation-config');
/** 只改变敌方站位，不改变抽取顺序、武将、阶级或属性；每个格子唯一。 */
function arrange(units,roster,rules){const occupied=new Set();return units.map(unit=>{const hero=roster.find(h=>h.id===unit.heroId),range=hero?.tiers?.find(t=>t.star===unit.star)?.range||hero?.range||1,order=c.rows.find(r=>range<=r.maxRange).order,columns=[...new Set([...c.columns,...Array.from({length:rules.columns},(_,i)=>i)])].filter(i=>i<rules.columns);const slot=order.flatMap(row=>columns.map(col=>row*rules.columns+col)).find(slot=>slot<rules.rows*rules.columns&&!occupied.has(slot));if(slot===undefined)throw Error('敌方阵型没有空位');occupied.add(slot);return {...unit,slot};});}
module.exports={arrange};
