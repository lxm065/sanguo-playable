'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),appearance=require('../game/play/battle-appearance'),{bodyHeightRatio}=require('../game/play/unit-layout');
/** 模型必须来自重新采样的原生动作帧，像素密度足够且没有裁边。 */
test('21名武将每个方向身体至少80像素，图集完整且无动作裁边',()=>{for(const [id,entry] of Object.entries(appearance.models)){const root=path.resolve(__dirname,'../game/skin-assets'),m=JSON.parse(fs.readFileSync(path.join(root,entry.assetKey+'-manifest.json')));assert.equal(m.compacted.boundaryFrames,0,id);for(const [direction,b] of Object.entries(m.anchors))assert(b.height*bodyHeightRatio(id,direction)>=80,id+' '+direction);for(const name of m.textures)assert(fs.existsSync(path.join(root,name)),name);}});
