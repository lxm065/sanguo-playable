'use strict';
const fs=require('node:fs'),path=require('node:path'),sharp=require('../../analysis-work/node_modules/sharp'),cfg=require('./wow-models.config.json');
const root=path.resolve(__dirname,'..');
/** 生成来自真实渲染帧的等高人物总览，并注明身份及原生骨骼数量。 */
async function main(){
 const width=360,height=470,parts=[],labels=[],records=[];
 for(const [i,[id,h]] of Object.entries(cfg.heroes).entries()){
  const manifest=require('../game/skin-assets/battle-'+id+'-manifest.json'),file=path.join(root,'evidence/wow-models',id+'-idle.png');
  const buffer=await sharp(file).trim().resize({width:300,height:310,fit:'inside'}).png().toBuffer(),meta=await sharp(buffer).metadata();
  parts.push({input:buffer,left:i*width+Math.round((width-meta.width)/2),top:365-meta.height});
  labels.push('<text x="'+(i*width+180)+'" y="45" font-size="30">'+h.name+'</text><text x="'+(i*width+180)+'" y="410" font-size="20">原生骨骼 '+manifest.bones+' · 五套动作</text>');
  records.push({id,name:h.name,model:h.model,weapons:h.weapons.map(w=>w.model),frames:manifest.frames,textures:manifest.textures.length,textureBytes:manifest.textures.reduce((s,f)=>s+fs.statSync(path.join(root,'game/skin-assets',f)).size,0),boundaryFrames:manifest.compacted.boundaryFrames});
 }
 const svg='<svg width="'+width*records.length+'" height="'+height+'"><g fill="#ecdcba" text-anchor="middle" font-family="Microsoft YaHei">'+labels.join('')+'</g></svg>',out=path.join(root,'docs/wow-models');fs.mkdirSync(out,{recursive:true});
 await sharp({create:{width:width*records.length,height,channels:4,background:'#242c32'}}).composite([...parts,{input:Buffer.from(svg),left:0,top:0}]).png().toFile(path.join(out,'overview.png'));
 fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify(records,null,2));console.log(records);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
