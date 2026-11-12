'use strict';
const fs=require('node:fs'),path=require('node:path'),growth=require('../game/play/enemy-win-growth-config'),mechanism=require('../game/play/enemy-mechanism-budget-config'),audit=require('./route-failure-audit.cjs'),config=require('./route-failure-audit.config.json');
const output='evidence/difficulty-optimization-1.0.282';
/** 汇总对照样本，保留首败与重复视频，不能作为全体玩家概率。 */
function summarize(runs){const battles=runs.flatMap(r=>r.records).filter(r=>r.attempts.length),bosses=battles.filter(r=>r.type==='boss');return {runs:runs.length,battles:battles.length,attempts:battles.reduce((n,r)=>n+r.attempts.length,0),firstLosses:battles.filter(r=>r.attempts[0].result!=='win').length,videos:battles.reduce((n,r)=>n+r.reliefs,0),maxBossVideos:Math.max(...bosses.map(r=>r.reliefs)),bossesOver3:bosses.filter(r=>r.reliefs>3).length,blocked:runs.filter(r=>r.blocked).length};}
/** 同一当前战斗引擎、阵容和种子，只切换增长和预算策略；不接触玩家存档或广告。 */
function main(){fs.mkdirSync(output,{recursive:true});const saved=structuredClone(growth),enabled=mechanism.enabled,runs=[];try{
 for(const variant of ['previous','optimized']){
  Object.assign(growth,structuredClone(saved));mechanism.enabled=variant==='optimized';growth.transition.enabled=variant==='optimized';
  if(variant==='previous'){growth.consecutive.rates=[.20,.40,.80];growth.chapterPolicies[0].rates=[.30,.60,1.20];}
  for(const chapter of [1,3,4,8]){for(const profile of config.profiles)for(const kind of config.routes)runs.push({variant,...audit.run(chapter,profile,kind,101,{})});console.log(JSON.stringify({variant,chapter,runs:runs.length}));}
 }
 }finally{Object.assign(growth,saved);mechanism.enabled=enabled;}
 const summary=Object.fromEntries(['previous','optimized'].map(v=>[v,summarize(runs.filter(r=>r.variant===v))]));fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({assumptions:config,runs,summary}));fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));}
main();
