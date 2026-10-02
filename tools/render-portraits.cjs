'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),settings=require('./render.config.json'),sources=require('./portrait-sources.cjs');
const output=path.join(root,'evidence/portrait-candidates');
/** 索引指定地图的资源；原文件始终只读。 */
function index(dir,base,map){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())index(file,base,map);else map.set(path.relative(base,file).replace(/\\/g,'/').toLowerCase(),file);}}
/** 从原始三维模型渲染一张静态头肩图；不导出或修改任何动画资源。 */
async function main(){
 fs.mkdirSync(output,{recursive:true});let files=new Map(),used=new Map();
 const server=http.createServer((req,res)=>{const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=url==='/'?path.join(__dirname,'render.html'):url==='/bundle.js'?path.join(settings.rendererHome,'viewer.bundle.js'):files.get(url.slice(7).toLowerCase());if(!file){res.writeHead(404);return res.end('missing '+url);}const data=fs.readFileSync(file);if(url.startsWith('/asset/'))used.set(url.slice(7),{source:file,sha256:crypto.createHash('sha256').update(data).digest('hex')});res.end(data);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await require(path.join(settings.rendererHome,'node_modules/puppeteer-core')).launch({executablePath:process.env.PORTRAIT_BROWSER||settings.browser,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],defaultViewport:{width:sources.size,height:sources.size}}).catch(error=>{server.close();throw error;});
 try{for(const [id,mapKey,model,cameraOverride={}] of sources.rows){if(process.argv[2]&&!process.argv.slice(2).includes(id))continue;files=new Map();used=new Map();const sourceRoot=path.join(sources.assetRoot,sources.roots[mapKey]);index(sourceRoot,sourceRoot,files);for(const relative of ['ReplaceableTextures/TeamColor','ReplaceableTextures/TeamGlow'])index(path.join(settings.teamResources,relative),settings.teamResources,files);const page=await browser.newPage();try{
 await page.goto('http://127.0.0.1:'+server.address().port);const cfg={...settings,sourceRoot,model,frameSize:sources.size,omitTeamGlow:true,omitSceneEvents:true,portraitOnly:true};const metadata=await page.evaluate(config=>api.initialize(config),cfg);
 const camera={...sources.camera,...cameraOverride,crop:sources.crops[id]||[0,0,1]};
 const rendered=await page.evaluate(({camera,background})=>{
  // 只对静态预览停用粒子和拖尾，避免特效遮挡头像。
  let low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
  const idle=parser.sequences.find(s=>/^stand(\s|$)/i.test(s.name))||parser.sequences[0];api.frame(idle.name,camera.time);
  for(const [gi,g] of parser.geosets.entries()){
   if(inst.geosetColors[gi]?.[3]<.1)continue;
   const groups=[];let offset=0;for(const count of g.matrixGroups){groups.push(Array.from(g.matrixIndices.slice(offset,offset+count)));offset+=count;}
   for(let i=0;i<g.vertices.length;i+=3){const ids=groups[g.vertexGroups[i/3]]||[],v=Array.from(g.vertices.slice(i,i+3)),p=[0,0,0];
    for(const id of ids){const m=inst.nodes[id].worldMatrix;for(let k=0;k<3;k++)p[k]+=(m[k]*v[0]+m[k+4]*v[1]+m[k+8]*v[2]+m[k+12])/ids.length;}
    for(let k=0;k<3;k++){low[k]=Math.min(low[k],ids.length?p[k]:v[k]);high[k]=Math.max(high[k],ids.length?p[k]:v[k]);}
   }
  }
  const height=high[2]-low[2],center=[(low[0]+high[0])/2,(low[1]+high[1])/2,low[2]+height*camera.height],distance=camera.distance||height*camera.span/(2*Math.tan(Math.PI/8));
  if(camera.center)center.splice(0,3,...camera.center);const d=camera.direction,length=Math.hypot(...d);
  scene.camera.perspective(Math.PI/4,1,.1,10000);scene.camera.moveToAndFace(center.map((v,k)=>v+d[k]/length*distance),center,[0,0,1]);
  viewer.updateAndRender(0);
  const dest=document.createElement('canvas');dest.width=dest.height=canvas.width;const ctx=dest.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,dest.width,dest.height);const [cx,cy,side]=camera.crop;ctx.drawImage(canvas,cx*canvas.width,cy*canvas.height,side*canvas.width,side*canvas.height,0,0,dest.width,dest.height);
  const heads=parser.bones.filter(b=>/head|neck/i.test(b.name)).map(b=>{const v=parser.pivotPoints[b.objectId],m=inst.nodes[b.objectId].worldMatrix;return {name:b.name,position:[0,1,2].map(k=>m[k]*v[0]+m[k+4]*v[1]+m[k+8]*v[2]+m[k+12])};});
  return {image:dest.toDataURL('image/png'),bounds:{low,high},heads,camera,sequence:idle.name};
 },{camera,background:sources.background});
 fs.writeFileSync(path.join(output,id+'.png'),Buffer.from(rendered.image.split(',')[1],'base64'));delete rendered.image;fs.writeFileSync(path.join(output,id+'.json'),JSON.stringify({id,sourceRoot,model,metadata,...rendered,dependencies:Object.fromEntries(used)},null,2));console.log(id+' OK');
 }catch(error){console.error(id+' '+error.message);process.exitCode=1;}finally{await page.close();}}}finally{await browser.close();server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
