'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),cfg=JSON.parse(fs.readFileSync(path.resolve(__dirname,process.argv[2]||'render.config.json'),'utf8'));
const puppeteer=require(path.join(cfg.rendererHome,'node_modules/puppeteer-core'));
const key=cfg.assetKey||'zhaoyun',work=path.join(root,'source-assets',key);
const files=new Map(),used=new Map();
/** 收集同一地图路径索引，大小写归一但不跨地图补贴图。 */
function walk(dir,base){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,base);else files.set(path.relative(base,p).replace(/\\/g,'/').toLowerCase(),p);}}
walk(cfg.sourceRoot,cfg.sourceRoot);
// 只补引擎的队伍颜色、队伍光晕及地面效果索引，不引入其他地图角色贴图。
for(const relative of ['ReplaceableTextures/TeamColor','ReplaceableTextures/TeamGlow']){
 const base=path.join(cfg.teamResources,relative);walk(base,cfg.teamResources);
}
walk(path.join(cfg.splatResources,'Splats'),cfg.splatResources);
if(fs.existsSync(path.join(cfg.splatResources,'ReplaceableTextures/Splats')))walk(path.join(cfg.splatResources,'ReplaceableTextures/Splats'),cfg.splatResources);
/** 只读提供渲染所需模型，同时保存实际引用资源的来源摘要。 */
const server=http.createServer((req,res)=>{
 const u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let p;
 if(u==='/')p=path.join(__dirname,'render.html');else if(u==='/bundle.js')p=path.join(cfg.rendererHome,'viewer.bundle.js');else if(u.startsWith('/asset/'))p=files.get(u.slice(7).toLowerCase());
 if(!p){res.writeHead(404);return res.end('Missing '+u);}
 const data=fs.readFileSync(p);
 if(u.startsWith('/asset/'))used.set(u.slice(7),{source:p,sha256:crypto.createHash('sha256').update(data).digest('hex')});
 res.setHeader('Content-Type',p.endsWith('.html')?'text/html':p.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(data);
});
/** 导出原动作透明序列帧，之后由打包器制作 Spine 兼容资源。 */
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await puppeteer.launch({executablePath:cfg.browser,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],defaultViewport:{width:cfg.frameSize,height:cfg.frameSize}});
 try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const metadata=await page.evaluate(c=>api.initialize(c),cfg);fs.mkdirSync(path.join(work,'frames'),{recursive:true});
 const animations={};
 for(const [name,source] of Object.entries(cfg.actions)){
   const sequence=metadata.sequences.find(s=>s.name===source);if(!sequence)throw Error('缺失动作 '+source);
   const duration=(sequence.interval[1]-sequence.interval[0])/1000,count=Math.max(2,Math.ceil(duration*cfg.fps));
   animations[name]={source,duration,frames:[]};
   for(let i=0;i<count;i++){
     const data=await page.evaluate(({source,ms})=>api.frame(source,ms),{source,ms:Math.min(duration*1000-1,i/cfg.fps*1000)});
     const file=name+'-'+String(i).padStart(3,'0')+'.png';fs.writeFileSync(path.join(work,'frames',file),Buffer.from(data.split(',')[1],'base64'));animations[name].frames.push(file);
   }
   console.log(name,count);
 }
 for(const [relative,entry] of used){const dest=path.join(work,'mdx',relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(entry.source,dest);}
 for(const [name,head] of [[key+'-drawing.png',false],[key+'-avatar.png',true]]){
   const data=await page.evaluate(head=>api.portrait(head),head);fs.writeFileSync(path.join(root,'game/skin-assets',name),Buffer.from(data.split(',')[1],'base64'));
 }
 fs.writeFileSync(path.join(work,'animations.json'),JSON.stringify({metadata,animations,config:cfg,dependencies:Object.fromEntries(used)},null,2));
 }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
