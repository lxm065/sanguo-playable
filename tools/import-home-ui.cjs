'use strict';
const fs=require('node:fs'),path=require('node:path'),sharp=require('../../analysis-work/node_modules/sharp');
const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(__dirname,'home-ui-import.config.json'),'utf8').replace(/^\uFEFF/,''));
/** 按每枚图标的透明格式导入，保留母版；尺寸与压缩参数来自配置。 */
async function main(){const out=path.join(root,config.output);fs.mkdirSync(out,{recursive:true});for(const item of config.icons){const dest=path.join(out,item.name+'.'+item.format),edge=item.edge||config.edge,image=sharp(path.join(root,item.source)).resize(edge,edge,{fit:'inside'});if(item.format==='png')await image.png({palette:true,colours:config.pngColors,effort:10}).toFile(dest);else await image.jpeg({quality:config.quality,mozjpeg:true}).toFile(dest);console.log(item.name,fs.statSync(dest).size);}}
main().catch(error=>{console.error(error);process.exitCode=1;});
