'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),c=require('../game/play/qinggang-config');
/** 提供可观察的骨骼轨道，验证实际动画进度及倍速。 */
function actor(){const a={unit:{heroId:'zhaoyun'},node:{isValid:true,position:{x:0,y:0}},body:{setScale(){}},baseScale:1,alive:true,facing:'n',directional:true,manifest:require('../game/skin-assets/battle-zhaoyun-manifest.json')};a.sp={skeletonData:{},setCompleteListener(fn){this.done=fn;},setAnimation(track,key,loop){this.key=key;this.loop=loop;return this.entry={};}};return a;}
test('穿梭攻击从挥击阶段起播，持续整段，完成后才回待机，倍速一致',()=>{const motion=require('../game/play/model-animation');for(const speed of [1,2,4]){const a=actor(),duration=a.manifest.actions['skill1-n'].duration;motion.animate(a,c.attackAnimation,false,{speed,startProgress:c.attackStartProgress,duration:c.interval});assert.equal(a.sp.key,'skill1-n');assert.equal(a.sp.entry.trackTime,duration*c.attackStartProgress);assert.equal(a.sp.timeScale,duration*(1-c.attackStartProgress)/c.interval*speed);a.sp.done();assert.equal(a.sp.key,'idle-n');}});
test('位移完成不打断攻击，刀光使用可见帧并携带方向，斩数复用暴击样式',()=>{
 const native=require('../game/play/native-effects'),effects=require('../game/play/battle-effects'),text=require('../game/play/combat-text'),view=require('../game/play/qinggang-view'),old=[native.play,effects.sprite,text.show],calls=[];
 native.play=(...args)=>calls.push(['slash',...args]);effects.sprite=()=>{};text.show=(...args)=>calls.push(['text',...args]);
 try{const a=actor(),b=actor();b.node.position={x:100,y:80};const animations=[],v={speed:2,root:{},actors:new Map([[1,a],[2,b]]),position:()=>({x:80,y:80}),ui:{face(){},animate(...args){animations.push(args);}},cc:{Tween:{stopAllByTarget(){}},Vec3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},tween(){return {to(){return this;},call(fn){this.fn=fn;return this;},start(){this.fn();}};}}};
 view.move(v,a,{effect:c.effect,target:2,duration:.1});assert.deepEqual(animations.map(x=>x[1]),[c.attackAnimation]);
 for(let n=1;n<=7;n++){const e={effect:c.effect,actor:1,damage:100,slashIndex:n};assert(view.hit(v,b,e));assert(view.damageText(v,b,e));}
 assert(calls.filter(x=>x[0]==='slash').every(x=>x[2]==='bladeSweep'&&x[6].frameIndices.length===6));
 const texts=calls.filter(x=>x[0]==='text');assert.deepEqual(texts.map(x=>x[7].prefix),c.slashLabels.map(x=>x+' '));assert(texts.every(x=>x[5]===true));
 }finally{[native.play,effects.sprite,text.show]=old;}
});
test('刀光配置每一帧都含可见像素，避免把空白尾帧压进短斩击',async()=>{const sharp=require('../../analysis-work/node_modules/sharp'),m=require('../game/play/native-effect-manifest')[c.slashAsset];for(const index of c.slashFrames){const {data}=await sharp('game/skin-assets/'+m.file).extract({left:index%m.columns*m.size,top:Math.floor(index/m.columns)*m.size,width:m.size,height:m.size}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let pixels=0;for(let i=3;i<data.length;i+=4)if(data[i]>64)pixels++;assert(pixels>100,'空白刀光帧 '+index);}});
