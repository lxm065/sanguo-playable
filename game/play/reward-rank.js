'use strict';
const c=require('./reward-rank-config');
/** 面板与抽取共用等级概率表。 */
function weights(level){return [...c.rows.filter(r=>r.level<=level).slice(-1)[0].weights];}
/** 各候选独立抽阶，保留至少一个二阶；同一事务保存等级和英雄以便重载。 */
function roll(model){const p=model.state.pending,w=weights(model.state.expedition.level),rng=require('./combat').random(model.state.seed++);p.rewardRanks=Array.from({length:require('./expedition-config').choiceCount},()=>{let n=rng()*100;for(let i=0;i<w.length;i++){n-=w[i];if(n<0)return i+1;}return c.guaranteed;});if(!p.rewardRanks.includes(c.guaranteed))p.rewardRanks[0]=c.guaranteed;p.rewardStar=c.guaranteed;p.choices=p.rewardRanks.map(star=>model.picks(star)[0]);}
module.exports={weights,roll};
