"use strict";
const fs = require('node:fs'), path = require('node:path');
const sharp = require('../../analysis-work/node_modules/sharp');
const models = require('../game/play/battle-appearance').models;
const policy = { alpha: 80, bandTop: .35, bandBottom: .8, windowHeightRatio: .36 };
/** 从待机躯干带寻找最密集的连续区域，排除伸出的细长武器；生成可复核的锚点配置。 */
async function main() {
  const root=path.resolve(__dirname,'../game/skin-assets'), result={...require('../game/play/body-center-config')};
  for(const id of (process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(models))) {
    const key='battle-'+id, skeleton=JSON.parse(fs.readFileSync(path.join(root,key+'.json')));
    const entries={}; let page;
    const lines=fs.readFileSync(path.join(root,key+'.atlas'),'utf8').split(/\r?\n/);
    for(let i=0;i<lines.length;i++) {
      if(lines[i].endsWith('.png')) page=lines[i];
      if(/^idle-(s|se|e|ne|n)-000$/.test(lines[i])) {
        const [x,y]=lines[i+2].match(/\d+/g).map(Number),[width,height]=lines[i+3].match(/\d+/g).map(Number);
        const {data,info}=await sharp(path.join(root,page)).extract({left:x,top:y,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        const density=Array(width).fill(0);
        for(let py=Math.floor(height*policy.bandTop);py<height*policy.bandBottom;py++)
          for(let px=0;px<width;px++) if(data[(py*width+px)*info.channels+3]>policy.alpha)density[px]++;
        const span=Math.min(width,Math.max(3,Math.round(height*policy.windowHeightRatio)));
        let best=0,total=-1;
        for(let start=0;start<=width-span;start++){const sum=density.slice(start,start+span).reduce((a,b)=>a+b,0);if(sum>total){total=sum;best=start;}}
        let mass=0,moment=0;for(let px=best;px<best+span;px++){mass+=density[px];moment+=(px+.5)*density[px];}
        const a=skeleton.skins[0].attachments.body[lines[i]];
        entries[lines[i].split('-')[1]]=Number(((a.x||0)+(moment/mass/width-.5)*a.width).toFixed(3));
      }
    }
    result[id]=entries;
  }
  fs.writeFileSync(path.resolve(__dirname,'../game/play/body-center-config.js'),'"use strict";\n/** 待机躯干密度标定的本地坐标；武器不参与居中。由 tools/calibrate-body-centers.cjs 生成。 */\nmodule.exports='+JSON.stringify(result,null,2)+';\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
