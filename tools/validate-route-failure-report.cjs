'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),config=require('./route-failure-audit.config.json');
/** 离线检查全部筛选组合的脚本渲染及图形节点，另以真实浏览器截图检查布局。 */
function main(){
 const html=fs.readFileSync(config.output+'/report.html','utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1],elements=new Map(),defaults={chapter:'1',section:'1',profile:'bare',route:'avoidElite'};
 const context={document:{getElementById(id){if(!elements.has(id))elements.set(id,{value:defaults[id]||'',innerHTML:''});return elements.get(id);}}};vm.createContext(context);vm.runInContext(script,context);let checks=0;
 for(const ch of config.chapters)for(let sec=1;sec<=5;sec++)for(const p of config.profiles)for(const r of config.routes){
  elements.get('chapter').value=ch;elements.get('section').value=sec;elements.get('profile').value=p.id;elements.get('route').value=r;vm.runInContext('render()',context);assert(elements.get('map').innerHTML.includes('<svg'));checks++;
 }
 const data=JSON.parse(fs.readFileSync(config.output+'/results-all.json')),records=data.runs.flatMap(r=>r.records).filter(r=>r.attempts.length);
 const summary={filterChecks:checks,runs:data.runs.length,battles:records.length,attempts:records.reduce((n,r)=>n+r.attempts.length,0),firstLosses:records.filter(r=>r.attempts[0].result!=='win').length,reliefs:records.reduce((n,r)=>n+r.reliefs,0),blocked:data.runs.filter(r=>r.blocked).length,chapters:config.chapters.map(ch=>{
  const runs=data.runs.filter(r=>r.chapter===ch&&r.profile==='equipped'&&r.route==='avoidElite');return {chapter:ch,first:runs.map(r=>{const n=r.records.find(r=>r.attempts.length&&r.attempts[0].result!=='win');return n?{section:n.section,row:n.row+1,type:n.type}:null;}),reliefs:runs.map(r=>r.records.reduce((n,r)=>n+r.reliefs,0))};
 })};
 assert.equal(summary.attempts,summary.battles+summary.reliefs);fs.writeFileSync(config.output+'/summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
}
main();
