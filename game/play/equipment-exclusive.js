'use strict';
const c=require('./equipment-exclusive-config'),march=require('./chitu-config');
/** 专属资格仅用于额外技能，禁止限制装备原特殊技能。 */
function active(id,heroId){return !!c.items[id]?.includes(heroId);}
/** 返回额外技能设计与实现状态；待设计数值的技能不生成战斗实例。 */
function skill(id){const ids=c.items[id];if(!ids)return null;if(id===march.id)return {implemented:true,name:march.name,description:march.description};const [name,summary]=require('./equipment-exclusive-text')[id];return {implemented:false,name,description:ids.map(id=>c.names[id]).join('、')+'专属技能【'+name+'】：'+summary};}
module.exports={active,skill};
