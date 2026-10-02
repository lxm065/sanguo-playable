'use strict';
const fs=require('node:fs'),path=require('node:path');
const sharp=require('../../analysis-work/node_modules/sharp');
const key=process.argv[2]||'zhaoyun';
const root=path.resolve(__dirname,'..'),out=path.join(root,'game/skin-assets');
/** 将模型真实渲染帧打包为标准 Spine 3.8 附件动画，保留动作时长。 */
async function main(){
 const data=JSON.parse(fs.readFileSync(path.join(root,'source-assets',key,'animations.json'),'utf8'));
 const cell=data.config.frameSize,columns=8,rows=8,pageSize=cell*columns;
 // 用真实待机像素边界统一脚底锚点和角色高度，避免不同 MDX 体积挤占格子。
 const raw=await sharp(path.join(root,'source-assets',key,'frames',data.animations.idle.frames[0])).ensureAlpha().raw().toBuffer();
 let minX=cell,minY=cell,maxX=0,maxY=0;
 for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(raw[(y*cell+x)*4+3]>160){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const factor=(data.config.targetBodyHeight||135)/(maxY-minY+1),offsetX=-(minX+maxX-cell)/2*factor,offsetY=(maxY-cell/2)*factor;
 const skeleton={skeleton:{spine:'3.8.99',x:-cell/2,y:-cell/2,width:cell,height:cell},bones:[{name:'root'}],slots:[{name:'body',bone:'root',attachment:'idle-000'}],skins:[{name:'default',attachments:{body:{}}}],animations:{}};
 const unique=new Map(),frames=[],textures=[];let atlas='';
 for(const [name,action] of Object.entries(data.animations)){
   const timeline=[];
   action.frames.forEach((file,i)=>{
     const frameKey=file.slice(0,-4);if(!unique.has(frameKey)){unique.set(frameKey,true);frames.push(file);skeleton.skins[0].attachments.body[frameKey]={x:offsetX,y:offsetY,width:cell*factor,height:cell*factor};}
     timeline.push({time:i/data.config.fps,name:frameKey});
   });
   timeline.push({time:action.duration,name:action.frames.at(-1).slice(0,-4)});
   skeleton.animations[name]={slots:{body:{attachment:timeline}}};
 }
 for(let start=0;start<frames.length;start+=columns*rows){
   const name=key+'-'+textures.length+'.png';textures.push(name);const parts=[];
   atlas+='\n'+name+'\nsize: '+pageSize+','+pageSize+'\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\n';
   for(const [idx,file] of frames.slice(start,start+columns*rows).entries()){
     const x=idx%columns*cell,y=Math.floor(idx/columns)*cell;
     parts.push({input:path.join(root,'source-assets',key,'frames',file),left:x,top:y});
     atlas+=file.slice(0,-4)+'\n  rotate: false\n  xy: '+x+', '+y+'\n  size: '+cell+', '+cell+'\n  orig: '+cell+', '+cell+'\n  offset: 0, 0\n  index: -1\n';
   }
   await sharp({create:{width:pageSize,height:pageSize,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png().toFile(path.join(out,name));
 }
 fs.writeFileSync(path.join(out,key+'.json'),JSON.stringify(skeleton));
 fs.writeFileSync(path.join(out,key+'.atlas'),atlas);
 fs.writeFileSync(path.join(out,key+'-manifest.json'),JSON.stringify({textures,frames:frames.length,actions:Object.fromEntries(Object.entries(data.animations).map(([k,v])=>[k,{source:v.source,duration:v.duration}]))},null,2));
 console.log(JSON.stringify({frames:frames.length,textures,animations:Object.keys(skeleton.animations)}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
