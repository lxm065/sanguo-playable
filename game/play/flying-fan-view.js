'use strict';
const c=require('./flying-fan-config');
/** 备战预热透明扇面，复用缓存避免第一次普攻延迟出现。 */
function warm(v){if(!v.assets?.sprite)return;v.assets.sprite(c.texture).catch(()=>{});}
/** 回收单枚飞扇及残影，既不触发伤害也不播放伪命中。 */
function remove(s){for(const n of s.nodes)if(n.isValid)n.destroy();}
/** 仅小乔真实普通远程攻击替换灵力弹；技能和其他武将沿用原路由。 */
function projectile(v,a,b,skill){
 if(skill||a?.unit?.heroId!==c.hero||!a.node?.isValid||!b?.node?.isValid)return false;
 const list=v.flyingFans=(v.flyingFans||[]).filter(s=>s.nodes[0].isValid);while(list.length>=c.maxFans)remove(list.shift());
 const p=a.node.position,nodes=c.ghosts.map(()=>v.ui.image(v.root,c.texture,p.x,p.y+c.offsetY,c.size,c.size));nodes.push(v.ui.image(v.root,c.texture,p.x,p.y+c.offsetY,c.size,c.size));
 const s={nodes,alphas:nodes.map(n=>n.addComponent(v.cc.UIOpacity)),start:v.elapsed||0,duration:v.config.attackDelay,x:p.x,y:p.y+c.offsetY,target:b.node};list.push(s);pose(v,s,0);return true;
}
/** 扇面展开旋转并沿短弧飞行，残影使用同一路径的较早位置。 */
function pose(v,s,progress){const q=s.target.position,dx=q.x-s.x,dy=q.y+c.offsetY-s.y,angle=Math.atan2(dy,dx)*180/Math.PI;
 s.nodes.forEach((n,i)=>{const ghost=c.ghosts[i],p=Math.max(0,progress-(ghost?.lag||0)),scale=c.initialScale+(1-c.initialScale)*Math.min(1,p/c.unfold);n.setPosition(s.x+dx*p,s.y+dy*p+Math.sin(p*Math.PI)*c.arc);n.angle=angle+c.startAngle+c.spin*p;n.setScale(scale,scale,1);s.alphas[i].opacity=ghost?(progress<ghost.lag?0:ghost.opacity):255;});
}
/** 使用回放战斗时钟，临时倍速变更和目标移动都能同步；只在真实命中事件播放碎光。 */
function update(v){v.flyingFans=(v.flyingFans||[]).filter(s=>{const p=((v.elapsed||0)-s.start)/s.duration;if(!s.target.isValid||!s.nodes.every(n=>n.isValid)||p>=1){remove(s);return false;}pose(v,s,Math.max(0,p));return true;});}
/** 普攻命中碎冰与扇刃闪光由伤害事件驱动，闪避不会误播命中。 */
function hit(v,a,b,e){if(e.skill||a?.unit?.heroId!==c.hero||!b?.node?.isValid)return false;const native=require('./native-effects');for(const [id,size,duration]of [[c.impact,c.impactSize,c.impactDuration],[c.spark,c.sparkSize,c.sparkDuration]])native.play(v,id,b.node,0,c.offsetY,{size,duration,color:c.color});return true;}
/** 跳过、结算、退出时回收所有飞扇。 */
function clear(v){for(const s of v.flyingFans||[])remove(s);v.flyingFans=[];}
module.exports={warm,projectile,update,hit,clear};
