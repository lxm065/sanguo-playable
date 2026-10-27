'use strict';
const data=require('./expedition-data'),names=require('./skill-name-config');
/** 按原技能顺序建立名称映射；已重做技能优先采用现行配置说明，其余只替换名称。 */
function theme(hero){const original=[...new Map(hero.tiers.flatMap(t=>t.skills).map(s=>[s.id,s.name])).entries()],map=new Map(original.map(([id,name],i)=>[id,{old:name,name:names[hero.id]?.[i]||name}]));return {...hero,tiers:hero.tiers.map(t=>({...t,skills:t.skills.map(s=>({...s,name:map.get(s.id).name,description:require('./hero-skill-config')[s.id]?.description||[...map.values()].reduce((text,n)=>text.split(n.old).join(n.name),s.description)}))}))};}
module.exports={heroes:data.heroes.map(theme).map(require('./hero-damage').apply),theme};
