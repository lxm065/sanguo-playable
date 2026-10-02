'use strict';
const config=require('./handbook-config');
/** 只读图鉴查询：不持有存档写接口，也不改变战斗名册。 */
class Handbook{
 /** 注入图鉴配置，便于独立验证名单、条件和文案。 */
 constructor(data=config){this.config=data;}
 /** 返回指定武将；未知身份拒绝借用其他人物作为替代。 */
 hero(id){const hero=this.config.heroes.find(h=>h.id===id);if(!hero)throw Error('未知图鉴武将：'+id);return hero;}
 /** 按最低阶分组，每个武将只出现在一组。 */
 groups(){return [1,2,3,4].map(tier=>({tier,heroes:this.config.heroes.filter(h=>h.tier===tier)}));}
 /** 从唯一武将表生成羁绊成员，不维护第二份容易漂移的名单。 */
 bonds(){return this.config.bonds.map(b=>({...b,members:this.config.heroes.filter(h=>h[b.kind]===b.value),description:this.format(b.effect,b.values)}));}
 /** 将配置中的占位符替换成展示值，不执行任意表达式。 */
 format(text,values){return text.replace(/\{(\d+)\}/g,(_,i)=>String(values[i]));}
 /** 展示设计解锁条件，初始收录不意味着开局赠送。 */
 condition(hero){const t=this.config.text;return hero.unlock==='boss'?t.boss:hero.chapter?this.format(t.chapter,[hero.chapter]):t.initial;}
 /** 区分图鉴解锁规划和当前真实可用性，旧玩家不被图鉴操作降级。 */
 status(hero,meta,roster){const integrated=roster.some(h=>h.id===hero.id),owned=(meta.unlocked||[]).includes(hero.id);const meetsCondition=hero.unlock==='boss'?owned:hero.chapter===0||(meta.cleared||0)>=hero.chapter;return {integrated,locked:!meetsCondition&&!owned,available:integrated&&owned,label:!integrated?this.config.text.unimplemented:owned?this.config.text.available:this.config.text.unavailable};}
 /** 按不同身份计算预览档位，忽略主公、未知单位与同名升阶重复项。 */
 preview(bondId,units){const b=this.bonds().find(x=>x.id===bondId);if(!b)throw Error('未知羁绊');const members=new Set(b.members.map(h=>h.id));const count=new Set(units.filter(u=>members.has(u.heroId)).map(u=>u.heroId)).size;return {count,threshold:this.config.thresholds.filter(n=>count>=n).pop()||0};}
}
module.exports={Handbook};
