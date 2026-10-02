'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),roster=require('../game/play/roster');
/** 对实际文件内容计算摘要，避免依赖修改时间。 */
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
/** 核对原工程、五名武将来源和图集依赖。 */
function main(){
 const original=path.resolve(root,'../__APP__.wxapkg_decrypt_unpack'),baseline=JSON.parse(fs.readFileSync(path.resolve(root,'../sanguo-sample/evidence/original-hashes.json'),'utf8'));
 for(const [file,expected] of Object.entries(baseline))if(hash(path.join(original,file))!==expected)throw Error('原工程变化 '+file);
 const heroes=[];for(const hero of roster){const dir=path.join(root,'source-assets',hero.id),source=JSON.parse(fs.readFileSync(path.join(dir,'animations.json'),'utf8')),assets=path.join(root,'game/skin-assets'),manifest=JSON.parse(fs.readFileSync(path.join(assets,hero.id+'-manifest.json'),'utf8')),skeleton=JSON.parse(fs.readFileSync(path.join(assets,hero.id+'.json'),'utf8'));
  for(const [file,entry] of Object.entries(source.dependencies)){if(hash(entry.source)!==entry.sha256)throw Error('源素材变化 '+entry.source);const copy=path.join(hero.id==='zhaoyun'?path.join(root,'source-assets'):dir,'mdx',file);if(hash(copy)!==entry.sha256)throw Error('素材副本不一致 '+copy);}
  for(const file of [...manifest.textures,hero.id+'-avatar.png',hero.id+'-drawing.png'])if(!fs.statSync(path.join(assets,file)).size)throw Error('空资源 '+file);
  for(const action of ['idle','run','skill1','skill2','dead'])if(!skeleton.animations[action])throw Error('缺少动作 '+hero.id+'/'+action);
  heroes.push({id:hero.id,name:hero.name,source:source.config.model,dependencies:Object.keys(source.dependencies).length,frames:manifest.frames,actions:Object.keys(skeleton.animations),textures:manifest.textures.length});
 }
 const result={status:'PASS',originalFilesUnchanged:Object.keys(baseline).length,heroes,totalFrames:heroes.reduce((n,h)=>n+h.frames,0)};
 fs.writeFileSync(path.join(root,'evidence/asset-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
main();
