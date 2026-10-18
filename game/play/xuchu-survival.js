'use strict';
const c=require('./weapon-exclusive-config')['7206'];
/** 无敌只屏蔽伤害，仍可被选中、行动和接受治疗。 */
function invulnerable(a,t){return a.hp>0&&a.xuchuSurvival?.until>t;}
/** 普通容量护盾已抵扣后，拦截敌方致命伤害并保留配置生命值。 */
function intercept(source,a,amount,t,events,effect){
 if(a.hp<=0||amount<a.hp||source.side===a.side||effect==='healthLoss'||!require('./weapon-exclusive').active(a,'7206')||t<(a.xuchuSurvivalNext||0))return amount;
 a.xuchuSurvival={until:t+c.duration,healed:false,source:source.uid};a.xuchuSurvivalNext=t+c.cooldown;
 events.push({type:'equipment',t,uid:a.uid,target:a.uid,id:'7206',exclusive:true,duration:c.duration});
 return Math.max(0,a.hp-c.minimumHp);
}
/** 仅记录无敌窗口内真正增加的生命，零治疗、盾量及过期治疗均不算救活。 */
function healed(a,gain,t){if(gain>0&&invulnerable(a,t))a.xuchuSurvival.healed=true;}
/** 到期先撤销状态；未被治疗者走统一死亡回调，避免重复击杀或漏发奖励。 */
function tick(a,t,die){const state=a.xuchuSurvival;if(!state||t<state.until)return;delete a.xuchuSurvival;if(a.hp>0&&!state.healed)die(a,state.source,t);}
module.exports={invulnerable,intercept,healed,tick};
