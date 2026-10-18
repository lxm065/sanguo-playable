'use strict';
const c=require('./enemy-win-growth-config');
/** 只读取本次真实战报，按开场本体计算存活与血量，召唤物不抬高轻松获胜指标。 */
function metrics(battle,rules){const allies=battle.initial?.filter(u=>u.side==='ally'&&!u.summoned);
 if(!allies?.length||!Array.isArray(battle.final)||!Number.isFinite(battle.duration)||battle.duration<0||!(rules?.maxBattleSeconds>0))return null;
 const final=new Map(battle.final.map(u=>[u.uid,u]));if(allies.some(u=>!final.has(u.uid)||!Number.isFinite(final.get(u.uid).hp)||!(u.hp>0)))return null;
 const health=allies.reduce((n,u)=>n+Math.max(0,Math.min(u.hp,final.get(u.uid).hp)),0),total=allies.reduce((n,u)=>n+u.hp,0);
 return {durationRatio:battle.duration/rules.maxBattleSeconds,survivorRatio:allies.filter(u=>final.get(u.uid).hp>0).length/allies.length,healthRatio:health/total};
}
/** 轻松连胜按当前难度逐步加速，险胜小幅递增；缺失旧战报数据时用基础增幅。 */
function basePlan(value,battle,rules,baseStep){const result=metrics(battle,rules),easy=result&&result.durationRatio<=c.easy.maxDurationRatio&&result.survivorRatio>=c.easy.minSurvivorRatio&&result.healthRatio>=c.easy.minHealthRatio;
 if(easy){const streak=(value.easyStreak||0)+1,rate=Math.min(c.easy.maxRate,c.easy.firstRate+(streak-1)*c.easy.streakRate);return {kind:'easy',streak,step:Math.max(baseStep,Math.min(c.easy.maxStep,value.lastClearedDifficulty*rate)),metrics:result};}
 const narrow=result&&(result.survivorRatio<=c.narrow.maxSurvivorRatio||result.healthRatio<=c.narrow.maxHealthRatio||result.durationRatio>=c.narrow.minDurationRatio);
 return {kind:narrow?'narrow':'normal',streak:0,step:narrow?c.narrow.step:baseStep,metrics:result};
}
/** 所有正式胜利累计连胜，第4胜起使用比例增幅下限，不依赖轻松判定。 */
function plan(value,battle,rules,baseStep){const base=basePlan(value,battle,rules,baseStep),consecutiveWins=(value.consecutiveWins??value.easyStreak??0)+1,policy={...c.consecutive,rates:require('./enemy-cycle-policy').forChapter(value.chapter).rates};if(consecutiveWins<policy.fromWins)return {...base,consecutiveWins};const rate=policy.rates[Math.min(policy.rates.length-1,consecutiveWins-policy.fromWins)];return {...base,kind:'streak',battleKind:base.kind,consecutiveWins,rate,step:Math.max(base.step,value.lastClearedDifficulty*rate)};}
module.exports={metrics,plan};
