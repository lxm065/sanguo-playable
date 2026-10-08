'use strict';
const fs=require('node:fs'),path=require('node:path'),sharp=require('../../analysis-work/node_modules/sharp');
const config=require('./equipment-art.config.cjs'),theme=require('../game/play/equipment-theme');
/** 生成原创器物剪影，金属和玉石材质共用视觉语言；不复用原版装备图片。 */
function svg(item,index){
 const [bg,gem]=config.palettes[index%config.palettes.length],shape=config.shapes[item.shape];if(!shape)throw Error('未知器型 '+item.shape);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.size}" height="${config.size}" viewBox="0 0 256 256"><defs><radialGradient id="bg"><stop stop-color="${bg}"/><stop offset="1" stop-color="#101923"/></radialGradient><linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#fff1b2"/><stop offset=".45" stop-color="#d4a858"/><stop offset="1" stop-color="#77502a"/></linearGradient><linearGradient id="steel" x2="1" y2="1"><stop stop-color="#e6f2ec"/><stop offset=".4" stop-color="#85adb3"/><stop offset=".55" stop-color="#cae1d8"/><stop offset="1" stop-color="#365365"/></linearGradient><radialGradient id="gem" cx=".3" cy=".25"><stop stop-color="#efffd8"/><stop offset=".3" stop-color="${gem}"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs><rect width="256" height="256" rx="15" fill="url(#bg)"/><g fill="none" stroke="#cfac62" opacity=".22" stroke-width="3"><circle cx="128" cy="128" r="105"/><circle cx="128" cy="128" r="91"/><path d="M17 60V17H60M196 17H239V60M239 196V239H196M60 239H17V196"/></g><g fill="url(#gold)" stroke="#593e27" stroke-width="4" stroke-linejoin="round">${shape}</g><rect x="12" y="200" width="45" height="44" rx="5" fill="#792d26" stroke="#d9b566" stroke-width="2"/><text x="34" y="233" text-anchor="middle" font-family="Microsoft YaHei" font-size="31" fill="#ffe7a4">${item.name[0]}</text></svg>`;
}
/** 批量渲染并备份旧展示资源，另产出联系表供人工核对38个器物。 */
async function main(){
 const root=path.resolve(__dirname,'..'),out=path.join(root,config.output),backup=path.join(root,config.backup),tiles=[];
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(backup,{recursive:true});
 let i=0;for(const [id,item]of Object.entries(theme)){
  const file=path.join(out,id+'.png'),old=path.join(backup,id+'.png');if(fs.existsSync(file)&&!fs.existsSync(old))fs.copyFileSync(file,old);
  const buffer=config.overrides?.[id]?fs.readFileSync(path.join(root,config.overrides[id])):await sharp(Buffer.from(svg(item,i))).png().toBuffer();fs.writeFileSync(file,buffer);
  tiles.push({input:await sharp(buffer).resize(128,128).toBuffer(),left:(i%8)*128,top:Math.floor(i/8)*128});i++;
 }
 await sharp({create:{width:1024,height:Math.ceil(i/8)*128,channels:4,background:'#14212b'}}).composite(tiles).png().toFile(path.join(root,config.sheet));
 fs.writeFileSync(path.join(root,'source-assets/equipment-theme-icons.json'),JSON.stringify(Object.entries(theme).map(([id,item])=>({id,name:item.name,shape:item.shape,source:config.overrides?.[id]||'tools/equipment-art.config.cjs',kind:config.sourceKinds?.[id]||(config.overrides?.[id]?'user-supplied':'procedural'),output:config.output+'/'+id+'.png',sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(out,id+'.png'))).digest('hex')})),null,2)+'\n');
 console.log('已生成 '+i+' 件装备图标（优先保留提供的原图）');
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={svg,main};
