'use strict';
const config=require('./hero-damage-config');
/** 在展示及运行名册的共同入口覆盖定位，原始提取数据保持不动。 */
function apply(hero){const rule=config[hero.id];return rule?{...hero,...rule,tiers:hero.tiers.map(t=>({...t,...rule}))}:hero;}
/** 普攻与技能分别选择抗性；旧角色默认继续使用原伤害类型。 */
function isMagic(hero,skill=false){return !!(skill?(hero.skillMagic??hero.magic):hero.magic);}
/** 返回可获得的装备攻击加成类型，双修每种属性仅累计一次。 */
function attackTypes(hero){return hero.equipmentAttackTypes||[hero.magic?'magicAttack':'physicalAttack'];}
/** 共用面板只计装备拥有的攻击属性，不重复叠加基础攻击。 */
function equipmentAttack(hero,basic){return [...new Set(attackTypes(hero))].reduce((sum,key)=>sum+(basic[key]||0),0);}
/** 装备推荐跟随实际加成类型，而不是将普攻类型当作唯一适配条件。 */
function accepts(hero,magic){return attackTypes(hero).includes(magic?'magicAttack':'physicalAttack');}
module.exports={apply,isMagic,attackTypes,equipmentAttack,accepts};
