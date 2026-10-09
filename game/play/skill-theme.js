'use strict';
const data=require('./expedition-data'),names=require('./skill-name-config');
/** 以英雄原技能顺序建立ID映射，描述同步替换名称且不改数字。 */
function theme(hero){const original=[...new Map(hero.tiers.flatMap(t=>t.skills).map(s=>[s.id,s.name])).entries()],map=new Map(original.map(([id,name],i)=>[id,{old:name,name:names[hero.id]?.[i]||name}]));return {...hero,tiers:hero.tiers.map(t=>({...t,skills:t.skills.map(s=>({...s,name:map.get(s.id).name,description:[...map.values()].reduce((text,n)=>text.split(n.old).join(n.name),s.description)}))}))};}
module.exports={heroes:data.heroes.map(theme).map(require('./hero-damage').apply),theme};
