'use strict';
const c=require('./guanyu-jump-config');
/** 在资源装配前添加专属时间轴，复用已有帧，不修改原普攻/施法或图集。 */
function install(hero,json,manifest){
 if(hero!==c.hero)return;
 for(const direction of c.directions){const source=json.animations[c.source+'-'+direction]?.slots?.body?.attachment;if(!source)throw Error('关羽缺少攻击帧 '+direction);
  const attachment=c.poses.map(([time,index])=>{if(!source[index]?.name)throw Error('关羽缺少落刀帧 '+index);return {time,name:source[index].name};});
  const key=c.animation+'-'+direction;json.animations[key]={slots:{body:{attachment}},bones:{root:{rotate:c.posture.rotation.map(([time,angle])=>({time,angle})),scale:c.posture.scale.map(([time,x,y])=>({time,x,y}))}}};manifest.actions[key]={source:'Attack - 1 / Tryndamere crit rhythm',duration:c.poses.at(-1)[0]};
 }
}
module.exports={install};
