"use strict";
const c=require('./war-order-config');
/** 周期键以固定时区锚点计算，边界时刻自动进入新一期。 */
function period(m){return Math.floor((m.progression.clock()-c.anchor)/c.periodMs);}
/** 查询不重置存档；旧周期进度只在后续事务中替换。 */
function state(m){const s=m.state.meta.warOrder;return s?.period===period(m)?s:{period:period(m),count:0,free:[],treasure:[],serial:0};}
/** 创建当期状态，调用者必须在存档事务内。 */
function writable(m){if(m.state.meta.warOrder?.period!==period(m))m.state.meta.warOrder={...state(m),free:[],treasure:[]};return m.state.meta.warOrder;}
/** 只记录实际新产生的四星进度，不根据打开页面时已有武将回推。 */
function record(m,count=1){writable(m).count+=count;}
/** 凭据绑定周期、行及已领取序号，避免跨周或重复回调。 */
function ticket(m,index){return {period:period(m),index,serial:state(m).serial};}
/** 单条轨道按顺序领取，普通与宝藏分别记账。 */
function available(m,index,kind){const s=state(m);return ['free','treasure'].includes(kind)&&Number.isInteger(index)&&index>=0&&index<c.targets.length&&s.count>=c.targets[index]&&!s[kind].includes(index)&&(index===0||s[kind].includes(index-1));}
/** 领取与具体随机碎片生成同事务；视频宝藏必须携带当前凭据。 */
function claim(m,index,kind,t=null){return m.transact(()=>{if(!available(m,index,kind))throw Error('请先达成进度并按顺序领取');const s=writable(m);if(kind==='treasure'&&(!t||t.period!==s.period||t.index!==index||t.serial!==s.serial))throw Error('战令请求已过期');s[kind].push(index);s.serial++;return require('./activity-rewards').grant(m,c[kind]);});}
/** 任一轨道当前可领取即提示，不清除未领取奖励。 */
function ready(m){return c.targets.some((_,i)=>available(m,i,'free')||available(m,i,'treasure'));}
/** 倒计时由同一个周期时钟计算，重开页面也不延长。 */
function remaining(m){return Math.max(0,c.anchor+(period(m)+1)*c.periodMs-m.progression.clock());}
module.exports={period,state,record,ticket,available,claim,ready,remaining};
