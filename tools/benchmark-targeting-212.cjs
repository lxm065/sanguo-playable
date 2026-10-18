'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),{performance}=require('node:perf_hooks'),assert=require('node:assert/strict'),current=require('../game/play/combat');
const oldModule=new Module(path.resolve('game/play/combat-before.cjs'));oldModule.filename=oldModule.id;oldModule.paths=Module._nodeModulePaths(path.dirname(oldModule.filename));oldModule._compile(fs.readFileSync('evidence/combat-before-perf-212.cjs','utf8'),oldModule.filename);const old=oldModule.exports;
const rng=current.random(1234),rules={columns:6,rows:4};
for(let sample=0;sample<1000;sample++){const units=[];for(let y=0;y<8;y++)for(let x=0;x<6;x++)if(rng()<.45)units.push({x,y,hp:100,side:rng()<.5?'ally':'enemy',range:1+Math.floor(rng()*3)});if(units.length<2)continue;const actor=units[0],targets=units.slice(1);assert.deepEqual(current.nextStep(actor,targets[0],units,rules),old.nextStep(actor,targets[0],units,rules));assert.deepEqual(current.approachStep(actor,targets[0],targets,units,rules),old.approachStep(actor,targets[0],targets,units,rules));}
const actor={x:0,y:0,hp:100,range:1,side:'ally'},targets=Array.from({length:12},(_,i)=>({x:i%6,y:5+Math.floor(i/6),hp:100,side:'enemy'})),wall=Array.from({length:6},(_,x)=>({x,y:3,hp:100})),units=[actor,...wall,...targets];
/** 固定同一堵路阵容，预热后比较搜索耗时。 */
function bench(impl){for(let i=0;i<100;i++)impl.approachStep(actor,targets[0],targets,units,rules);const start=performance.now();for(let i=0;i<3000;i++)impl.approachStep(actor,targets[0],targets,units,rules);return performance.now()-start;}
console.log(JSON.stringify({parityCases:1000,iterations:3000,beforeMs:bench(old),afterMs:bench(current)},null,2));
