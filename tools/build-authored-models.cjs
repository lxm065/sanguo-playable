'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const config=require('./authored-models.config.json'),policy=require('./battle-render-config.cjs'),{pack,bounds}=require('./render-battle-models.cjs');
const root=path.resolve(__dirname,'..');
/** 保存生成文件并创建目录，源模型始终与游戏烘焙贴图分开。 */
function save(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}
/** 将浏览器透明帧转换为 PNG 数据。 */
function png(data){return Buffer.from(data.split(',')[1],'base64');}
/** 从原创三维关节模型导出 GLB，再烘焙成游戏已有的 Spine 动画契约。 */
async function main(){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/config'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(config));}
  let file=url==='/'?path.join(__dirname,'authored-model-viewer.html'):url==='/authored-models.mjs'?path.join(__dirname,'authored-models.mjs'):url.startsWith('/three/')?path.resolve(config.threeHome,url.slice(7)):null;
  if(!file||(url.startsWith('/three/')&&!file.startsWith(path.resolve(config.threeHome)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':'text/javascript');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try {
  browser=await require(config.puppeteerHome).launch({executablePath:config.browser,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.studio);
  for(const id of process.argv.length>2?process.argv.slice(2):Object.keys(config.heroes)){
   const model=await page.evaluate(id=>studio.build(id),id),glb=Buffer.from(await page.evaluate(fps=>studio.exportGlb(fps),policy.fps));
   const modelFile='source-assets/authored-models/'+id+'.glb';save(path.join(root,modelFile),glb);
   const cameraSpan=await page.evaluate(p=>studio.fit(...p),[policy.fps,Object.values(policy.directions)]);
   const frames=[],animations={},anchors={};
   for(const direction of Object.keys(policy.directions))for(const action of Object.keys(policy.actionPatterns)){
    const duration=config.motion[action],count=Math.max(2,Math.ceil(duration*policy.fps)),key=action+'-'+direction;
    animations[key]={source:action,duration,frames:[]};
    for(let i=0;i<count;i++){
     const t=action==='dead'?i/(count-1)*duration:i/policy.fps;
     const buffer=png(await page.evaluate(p=>studio.frame(...p),[action,t,policy.directions[direction],policy.frameSize]));
     const name=key+'-'+String(i).padStart(3,'0');frames.push({name,buffer,direction});animations[key].frames.push(name);
     if(action==='idle'&&i===0)anchors[direction]=await bounds(buffer);
    }
   }
   await pack(id,frames,animations,anchors,{model:modelFile,sourceRoot:'source-assets/authored-models',sha256:crypto.createHash('sha256').update(glb).digest('hex'),meshCount:model.meshes,joints:model.joints,cameraSpan,rendering:'原创低多边形三维网格与关节动画，五方向烘焙，三方向镜像',authored:true});
   save(path.join(root,'evidence/authored-models',id+'-portrait.png'),png(await page.evaluate(p=>studio.frame(...p),['idle',0,0,config.portrait.size,true])));
   console.log(id,model.meshes+' meshes',frames.length+' frames',glb.length+' GLB bytes');
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
