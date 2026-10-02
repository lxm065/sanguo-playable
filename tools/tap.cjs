'use strict';
const fs=require('node:fs'),path=require('node:path');
const viewport=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../evidence/viewport.json'),'utf8'));
const {call}=require('./devtool.cjs');
/** 在经过截图确认的模拟器坐标上点击，坐标来自命令参数。 */
function main(){const [x,y]=process.argv.slice(2).map(Number);if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('用法: tap.cjs x y');console.log(call('automation_game_action',{action:'tap',x,y,'coordinate-space':'image','image-width':viewport.imageWidth,'image-height':viewport.imageHeight}));}
main();
