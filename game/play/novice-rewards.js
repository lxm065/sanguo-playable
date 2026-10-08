'use strict';
const c=require('./novice-rewards-config'),offers=require('./expedition-config').novice;
/** 永久资源与本局武将装备分开记账，索引来自同一福利表。 */
function permanent(i){return c.permanentKinds.includes(offers[i]?.kind);}
/** 老版本没有跨局领取账本，保守封存永久奖励；新档显式创建空账本。 */
function initialize(m){if(!Array.isArray(m.state.meta.novicePermanentClaims))m.transact(()=>{m.state.meta.novicePermanentClaims=offers.map((_,i)=>i).filter(permanent);});}
/** 跳过已领永久奖励，不改变当前本局福利进度。 */
function current(m){const claimed=m.state.meta?.novicePermanentClaims||[];let index=m.state.expedition.novice;if((m.state.meta?.chapter||1)>c.maxChapter)return {index,offer:undefined};while(offers[index]&&permanent(index)&&claimed.includes(index))index++;return {index,offer:offers[index]};}
/** 与实际发奖处于同一个事务，领取失败不会留下记录。 */
function mark(m,index){if(permanent(index)){const list=m.state.meta.novicePermanentClaims;if(list.includes(index))throw Error('该永久福利已领取');list.push(index);}}
module.exports={initialize,current,mark,permanent};
