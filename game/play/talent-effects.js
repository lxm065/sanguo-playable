'use strict';
const tree=require('./talent-tree'),c=require('./talent-tree-config').combat,primary=require('./handbook-detail-assets').primary;
/** 主属性使用原武将表，兼容角色按法术标记归类，不根据三国职业猜测。 */
function category(hero){return primary[hero.sourceId]??(hero.magic?2:0);}
/** 将三系静态加成合并到共用面板，敌人由调用方传入空天赋快照。 */
function stats(result,unit,units,roster,levels={}){
 const v=id=>tree.value(levels,id),kind=category(result),base=(kind+1)*1000,row=Math.floor(unit.slot/c.columns),counts=[0,1,2].map(k=>units.filter(u=>category(roster.find(h=>h.id===u.heroId))===k).length);
 result.talentClass=kind;result.talentTree={...levels};
 result.attack*=1+v(base+1)+(result.magic?v(3013):v(2013))+(row===c.middleRow?v(3016):0);
 result.hp*=1+v(base+2)+v(1013)+(row===c.frontRow?v(1016):0);
 result.armor+=counts[0]*v(1006);result.magicArmor=(result.magicArmor||0)+counts[2]*v(3006);result.treeDodge=Math.min(c.maxDodge,counts[1]*v(2006));
 if(kind===1){if(unit.star>=2)result.critical+=v(2004);if(unit.star>=4)result.criticalBonus+=v(2009);if(unit.star>=5){result.haste+=v(2012);result.treeSpeedUp=v(2012);}}
 if(row===c.backRow)result.criticalBonus+=v(2016);
 return result;
}
/** 敌方减益单独施加，不把己方天赋快照交给敌人。 */
function enemies(units,levels={}){for(const u of units.filter(u=>u.side==='enemy')){u.armor-=tree.value(levels,1003);u.magicArmor-=tree.value(levels,3003);u.treeSpeedDown=tree.value(levels,2003);u.interval/=Math.max(.1,1-u.treeSpeedDown);}}
/** 读取当前战斗快照中的节点值，等级门槛按原版阶级执行。 */
function value(a,id,min=1){return a.star>=min?tree.value(a.talentTree,id):0;}
/** 智系抵抗控制的判定统一用于主动技能、装备与天赋控制。 */
function resists(a,rng){return a.talentClass===2&&value(a,3010)>0&&rng()<value(a,3010);}
/** 独立记录限层增益，到期删除对应层，不改变装备及其他技能的增益账本。 */
function stack(a,key,amount,duration,t){if(!amount)return;a.treeStacks=a.treeStacks||{};const list=a.treeStacks[key]||[];if(list.length>=c.stackMax){const old=list.shift();a.attack-=old.amount;}list.push({amount,until:t+duration});a.attack+=amount;a.treeStacks[key]=list;}
/** 每个战斗时步回收过期叠层，重复增益不永久污染攻击数值。 */
function tick(a,t){for(const [key,list]of Object.entries(a.treeStacks||{})){const expired=list.filter(e=>e.until<=t);a.attack-=expired.reduce((n,e)=>n+e.amount,0);a.treeStacks[key]=list.filter(e=>e.until>t);}}
/** 调整实际伤害并判定致命抵抗，只有有该天赋时才消费随机数。 */
function damage(a,u,amount,critical,rng,magic=a.magic){if(a.talentClass===2&&magic)amount*=1+value(a,3007,3);if(critical&&u.talentClass===0)amount*=1-value(u,1012,5);if(u.talentClass===1&&amount>=u.hp&&value(u,2010)&&rng()<value(u,2010))return Math.max(0,u.hp-1);return amount;}
/** 闪避后按敏系天赋回血，未学习的角色不会额外获得闪避。 */
function evade(a,rng,t,heal){if(!a.treeDodge||rng()>=a.treeDodge)return false;onEvade(a,t,heal);return true;}
/** 任意来源成功闪避都共享预感回血，不能只识别天赋自身的闪避。 */
function onEvade(a,t,heal){if(a.talentClass===1)heal(a,a.maxHp*value(a,2007,3),t);}
/** 命中钩子负责反伤、叠层、吸血和攻击控制；不递归触发天赋反伤。 */
function hit(a,u,amount,t,skill,critical,reflect,rng,heal,deal){
 if(reflect&&u.talentClass===0){stack(u,'strength',value(u,1015),c.strengthSeconds,t);const ratio=value(u,1007,3);if(ratio&&a.hp>0)deal(u,a,amount*ratio,t,false,false,false);}
 if(a.talentClass===2)heal(a,amount*value(a,3009,4),t);
 if(reflect&&a.talentClass===1&&critical)stack(a,'agility',value(a,2015),c.agilitySeconds,t);
 if(!reflect||skill)return;
 if(a.talentClass===2){const reduce=value(a,3012,5)*c.attackCooldownUnit;for(const id of Object.keys(a.skillTimers||{}))a.skillTimers[id]=Math.max(t,a.skillTimers[id]-reduce);}
 if(u.hp<=0)return;
 const controls=a.talentClass===0?[['disarmedUntil',1004,2],['stunnedUntil',1009,4]]:a.talentClass===2?[['silencedUntil',3004,2]]:[];
 for(const [field,id,min]of controls){const chance=value(a,id,min);if(chance&&rng()<chance&&!resists(u,rng))u[field]=Math.max(u[field]||0,t+c.controlSeconds);}
}
/** 智系主动施法叠加双攻，与原技能冷却及施法次数一致。 */
function cast(a,t){if(a.talentClass===2)stack(a,'intelligence',value(a,3015),c.intelligenceSeconds,t);}
/** 力系死亡治疗只作用于仍存活的己方单位，不能复活死者。 */
function death(a,units,t,heal){if(a.talentClass===0)for(const u of units.filter(u=>u.side===a.side&&u.hp>0))heal(u,a.maxHp*value(a,1010),t);}
module.exports={category,stats,enemies,value,resists,stack,tick,damage,evade,onEvade,hit,cast,death};
