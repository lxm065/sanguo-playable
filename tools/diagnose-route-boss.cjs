'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),audit=require('./route-failure-audit.cjs'),config=require('./route-failure-audit.config.json');
const root='game/play/',req=id=>require('../'+root+id),out=path.resolve(config.output,'boss-diagnosis');
/** 汇总实际战报伤害、治疗和最后存活者，伤害事件含过量伤害，不能与生命直接相减。 */
function summarize(b){
 const lookup=new Map(b.initial.map(u=>[u.uid,u])),sides={ally:{damage:0,skillDamage:0,healing:0,status:{},units:[]},enemy:{damage:0,skillDamage:0,healing:0,status:{},units:[]}};
 for(const e of b.events){const from=lookup.get(e.actor),to=lookup.get(e.target);if(e.type==='damage'&&from){sides[from.side].damage+=e.damage;if(e.skill)sides[from.side].skillDamage+=e.damage;}if(e.type==='heal'&&to)sides[to.side].healing+=e.amount||0;if(e.type==='status'&&to)sides[to.side].status[e.effect]=(sides[to.side].status[e.effect]||0)+1;}
 for(const u of b.initial){const final=b.final.find(f=>f.uid===u.uid);sides[u.side].units.push({uid:u.uid,hero:u.heroId,star:u.star,maxHp:u.hp,attack:u.attack,remaining:final?.hp||0,damage:b.events.filter(e=>e.type==='damage'&&e.actor===u.uid).reduce((n,e)=>n+e.damage,0),deathAt:b.events.find(e=>e.type==='death'&&e.uid===u.uid)?.t??null});}
 for(const side of Object.values(sides)){side.alive=side.units.filter(u=>u.remaining>0).length;side.hp=side.units.reduce((n,u)=>n+u.remaining,0);side.initialHp=side.units.reduce((n,u)=>n+u.maxHp,0);}
 return {result:b.result,duration:b.duration,...sides};
}
/** 重放原路线，完整保存Boss每次尝试及之前胜场，严格核对原报告数字。 */
function main(){
 fs.mkdirSync(out,{recursive:true});const original=JSON.parse(fs.readFileSync(config.output+'/results-all.json')),hash=crypto.createHash('sha256');
 for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.js')).sort())hash.update(f).update(fs.readFileSync(root+f));assert.equal(hash.digest('hex'),original.sourceHash);
 const cases=[];
 for(const seed of config.seeds){let lastWin=null;const captures=[];
  const run=audit.run(4,config.profiles.find(p=>p.id==='equipped'),'avoidElite',seed,{},(m,record,result,battleSeed)=>{
   if(record.section===4&&record.type==='boss')captures.push({seed:battleSeed,state:structuredClone(m.state),summary:summarize(result),battle:result,previousWin:lastWin});
   if(result.result==='win')lastWin={section:record.section,node:record.node,type:record.type,scale:m.state.expedition.enemyEncounter.scale,lightBalance:structuredClone(m.state.expedition.enemyEncounter.lightBalance),summary:summarize(result)};
  });
  const expected=original.runs.find(r=>r.chapter===4&&r.profile==='equipped'&&r.route==='avoidElite'&&r.seed===seed).records.find(r=>r.section===4&&r.type==='boss');
  const actual=run.records.find(r=>r.section===4&&r.type==='boss');assert.deepEqual(actual,expected);
  fs.writeFileSync(out+'/seed-'+seed+'-raw.json',JSON.stringify(captures));cases.push({seed,attempts:captures.map(c=>({seed:c.seed,curve:c.state.expedition.enemyEncounter.lightBalance.curve,scale:c.state.expedition.enemyEncounter.scale,cycle:c.state.expedition.difficultyCycle,previousWin:c.previousWin,summary:c.summary}))});
 }
 fs.writeFileSync(out+'/summary.json',JSON.stringify(cases,null,2));console.log(JSON.stringify(cases));
}
main();
