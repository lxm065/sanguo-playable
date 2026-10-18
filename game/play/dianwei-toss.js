'use strict';
const c=require('./dianwei-skill-config'),{distance}=require('./combat');
/** 搜索全棋盘空位，优先沿远离施法者方向抛出；仅满场时才回原格。 */
function landing(a,u,units,rules){
 const desired={x:u.x+Math.sign(u.x-a.x)*c.landing.distance,y:u.y+Math.sign(u.y-a.y|| (a.side==='ally'?1:-1))*c.landing.distance},free=[];
 for(let y=0;y<rules.rows*2;y++)for(let x=0;x<rules.columns;x++)if((x!==u.x||y!==u.y)&&!units.some(v=>v.hp>0&&v.x===x&&v.y===y))free.push({x,y});
 free.sort((p,q)=>distance(p,desired)-distance(q,desired)||distance(q,a)-distance(p,a)||p.y-q.y||p.x-q.x);
 return free[0]||{x:u.x,y:u.y};
}
/** 预占落地点并锁定飞行期行动；死亡单位原格和被其他单位预占的落点均按真实战局处理。 */
function launch(a,u,units,t,rules){const from={x:u.x,y:u.y},to=landing(a,u,units,rules),duration=rules.attackDelay;Object.assign(u,to);u.tossedUntil=Math.max(u.tossedUntil||0,t+duration);return {from,to,duration};}
/** 落地时再读取周围存活敌人，避免用起飞位置或起飞时快照结算范围伤害。 */
function impact(hit,units,t){return units.filter(u=>u.side!==hit.a.side&&u.hp>0&&(u===hit.u||distance(u,hit.toss.to)<=hit.s.radius)).map(u=>({...hit,u,toss:undefined,at:t}));}
module.exports={landing,launch,impact};
