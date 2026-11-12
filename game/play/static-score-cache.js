'use strict';
const config=require('./interaction-performance-config');
/** 每次搜索独享有界缓存；仅缓存数值，装备 UID 不影响静态战力但仍保留真实配装。 */
function create(evaluate){const teams=new WeakMap(),values=new Map();return (units,roster,rules,equipment)=>{
 const limit=config.scoreCacheEntries;if(limit<=0)return evaluate(units,roster,rules,equipment);
 let team=teams.get(units);if(!team){team={key:JSON.stringify(units.map(({uid,...unit})=>unit)),owners:new Map(units.map((u,i)=>[u.uid,i]))};teams.set(units,team);}
 // 保留顺序、站位、成长和全部属性；归属转为队内索引，等价实例只共享数值。
 const key=team.key+JSON.stringify(equipment.map(({uid,owner,...item})=>[team.owners.has(owner)?['team',team.owners.get(owner)]:['outside',owner],item]));
 if(values.has(key))return values.get(key);
 const value=evaluate(units,roster,rules,equipment);if(values.size<limit)values.set(key,value);return value;
};}
module.exports={create};
