'use strict';
const c=require('./qinggang-config'),{targetable}=require('./combat-protection');
/** 仅真实穿戴青釭剑的赵云获得技能，重复装备不重复施法。 */
function eligible(a){return a.heroId===c.hero&&(a.equipmentRuntime||[]).some(e=>e.id===c.id);}
/** 独立装备主动技能按配置冷却发动，沉默和眩晕禁止起手。 */
function activate(a,units,t,events){
 if(!eligible(a)||a.qinggangCast||a.hp<=0||a.stunnedUntil>t||a.silencedUntil>t||t<(a.qinggangNext??c.initialCooldown)||!units.some(u=>u.side!==a.side&&targetable(u)))return false;
 a.qinggangNext=t+c.cooldown*a.cooldownFactor*(a.combatRelief?.cooldown??1);
 a.qinggangCast={next:t,left:c.hits,index:0};
 return true;
}
/** 优先交替切入目标附近的空格；棋盘拥挤时选择最近空格，不覆盖其他单位。 */
function landing(a,target,units,rules,index){
 const cells=[];
 for(let y=0;y<rules.rows*2;y++)for(let x=0;x<rules.columns;x++)if(!units.some(u=>u!==a&&u.hp>0&&u.x===x&&u.y===y))cells.push({x,y});
 const preferred=index%2?1:-1;
 cells.sort((a,b)=>(Math.abs(a.x-target.x)+Math.abs(a.y-target.y))-(Math.abs(b.x-target.x)+Math.abs(b.y-target.y))||preferred*(b.x-a.x)||a.y-b.y);
 return cells.find(p=>p.x!==a.x||p.y!==a.y)||{x:a.x,y:a.y};
}
/** 每段重新选存活敌人并排队命中；种子随机可重放，敌人清空时提前结束。 */
function tick(a,units,t,hits,events,rules,rng){
 const state=a.qinggangCast;if(!state||t<state.next)return;
 const enemies=units.filter(u=>u.side!==a.side&&targetable(u));
 if(a.hp<=0||!state.left||!enemies.length){delete a.qinggangCast;return;}
 const target=enemies[Math.floor(rng()*enemies.length)],pos=landing(a,target,units,rules,state.index);
 Object.assign(a,pos);state.left--;state.index++;state.next=+(t+Math.max(c.interval,rules.tickSeconds*2)).toFixed(4);
 events.push({type:'move',t,uid:a.uid,target:target.uid,...pos,duration:c.moveSeconds,effect:c.effect,index:state.index});
 hits.push({at:t+rules.tickSeconds,a,u:target,power:c.power,slashIndex:state.index,skill:true,critical:false,effect:c.effect,s:{physical:true}});
}
module.exports={eligible,activate,tick,landing};
