'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const cfg=require('./wow-models.config.json'),policy=require('./battle-render-config.cjs'),{pack,bounds}=require('./render-battle-models.cjs');
const root=path.resolve(__dirname,'..'),output=path.join(root,cfg.output);
/** 创建输出目录并保存成果，不修改外部魔兽资源库。 */
function save(file,content){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
/** 从浏览器画布返回值读取真正的透明 PNG。 */
function png(url){return Buffer.from(url.split(',')[1],'base64');}
/** 启动只读渲染服务并烘焙指定模型；--preview 仅生成审阅图，不覆盖游戏资源。 */
async function main(){
 const preview=process.argv.includes('--preview'),ids=process.argv.slice(2).filter(x=>!x.startsWith('--'));if(!ids.length)ids.push(...Object.keys(cfg.heroes));
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname;
  if(u==='/config'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(cfg));}
  let file,base;
  if(u==='/')file=path.join(__dirname,'wow-model-viewer.html');else if(u==='/wow-model-studio.mjs')file=path.join(__dirname,'wow-model-studio.mjs');else if(u.startsWith('/three/')){base=path.resolve(cfg.threeHome);file=path.resolve(base,u.slice(7));}else if(u.startsWith('/asset/')){base=output;file=path.resolve(base,u.slice(7));}
  if(!file||(base&&!file.startsWith(base+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await require(cfg.puppeteerHome).launch({executablePath:cfg.browser,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.studio);
  for(const id of ids){
   const meta=await page.evaluate(id=>studio.load(id),id),fit=await page.evaluate(d=>studio.fit(d),Object.values(policy.directions));
   const movements=await page.evaluate(()=>Object.fromEntries(['idle','run','skill1','skill2','dead'].map(a=>[a,studio.movement(a)])));
   if(Object.values(movements).some(d=>!Number.isFinite(d)||d<.0001))throw Error('存在未运动的骨骼动作 '+id);
   for(const [name,action,time] of [['idle','idle',0],['attack','skill1',meta.actions.skill1.duration*.5],['death','dead',meta.actions.dead.duration]])save(path.join(root,'evidence/wow-models',id+'-'+name+'.png'),png(await page.evaluate(p=>studio.frame(...p),[action,time,cfg.previewDirection,cfg.previewSize])));
   const portrait=png(await page.evaluate(p=>studio.frame(...p),['idle',0,cfg.portraitDirection,cfg.portraitSize,true]));
   save(path.join(root,'evidence/wow-models',id+'-portrait.png'),portrait);
   if(!preview)save(path.join(output,id+'-portrait.png'),portrait);
   console.log(id,JSON.stringify({meta,fit,movements}));
   if(preview)continue;
   const glb=Buffer.from(await page.evaluate(()=>studio.exportGlb()));save(path.join(output,id+'.glb'),glb);
   const frames=[],animations={},anchors={},frameSize=cfg.frameSize;
   for(const [direction,degrees] of Object.entries(policy.directions))for(const [action,entry] of Object.entries(meta.actions)){
    const duration=Math.min(entry.duration,cfg.maxDuration[action]||Infinity),count=Math.max(2,Math.ceil(duration*cfg.fps)),key=action+'-'+direction;animations[key]={source:'M2 animation '+entry.id,duration,frames:[]};
    for(let i=0;i<count;i++){
     const time=action==='dead'?duration*i/(count-1):i/cfg.fps,buffer=png(await page.evaluate(p=>studio.frame(...p),[action,time,degrees,frameSize])),name=key+'-'+String(i).padStart(3,'0');
     frames.push({name,buffer,direction});animations[key].frames.push(name);if(action==='idle'&&i===0)anchors[direction]=await bounds(buffer);
    }
   }
   const source=JSON.parse(fs.readFileSync(path.join(output,id+'.json'),'utf8'));
   await pack(id,frames,animations,anchors,{model:cfg.output+'/'+id+'.glb',sourceModel:cfg.heroes[id].model,sourceRoot:cfg.assetRoot,dependencies:source.dependencies,sha256:crypto.createHash('sha256').update(glb).digest('hex'),fps:cfg.fps,frameSize,nativeWow:true,bones:meta.bones,movements,camera:fit,rendering:'本地魔兽M2原生蒙皮与骨骼动作、武器附件烘焙'});
   console.log(id,'installed',frames.length,'frames');
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
