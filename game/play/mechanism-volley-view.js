'use strict';
const defaults=require('./mechanism-volley-config'),native=require('./native-effects');
/** 使用装备原造型的透明贴图；独立子节点校正插画朝向，不扭曲武器比例。 */
function bow(v,n,c){const sprite=v.ui.image(n,c.weapon.file,0,0,c.weapon.size,c.weapon.size);sprite.angle=-c.weapon.forwardAngle;return sprite;}
/** 三把实体连弩从施法者身侧展开，柔和光阵衬托金属和木质结构。 */
function deploy(v,a,e,c){
 const root=v.ui.node(a.node,'mechanism-volley-'+e.cast,0,0);root.setSiblingIndex(0);
 const ring=v.ui.node(root,'mechanism-ring',0,c.ringY),g=ring.addComponent(v.cc.Graphics);
 g.strokeColor=new v.cc.Color(c.ringColor);g.lineWidth=c.ringWidth;g.ellipse(0,0,c.ringRx,c.ringRy);g.stroke();
 const nodes=c.offsets.map(([x,y],i)=>{
  const n=v.ui.node(root,'floating-crossbow',0,0);bow(v,n,c);n.angle=c.weapon.restAngles[i];n.setScale(c.deployScale,c.deployScale,1);
  v.cc.tween(n).to((c.deploySeconds??require('./weapon-exclusive-config')['7006'].deploy)/v.speed,{position:new v.cc.Vec3(x,y,0),scale:new v.cc.Vec3(c.scale,c.scale,1)},{easing:'cubicOut'}).start();return n;
 });
 native.play(v,c.charge,a.node,0,c.ringY,{size:c.chargeSize,duration:c.chargeSeconds,color:c.cyan});
 const all=v.mechanismVolleys||(v.mechanismVolleys=new Map());all.set(e.uid+':'+e.cast,{root,nodes,opacity:root.addComponent(v.cc.UIOpacity),uid:e.uid,config:c,until:e.t+e.duration});
}
/** 真实发射事件驱动弩臂后坐、双色拖尾及指向目标的弩箭，不提前产生伤害。 */
function cast(v,e,style=defaults){
 const c=v.mechanismVolleys?.get(e.uid+':'+e.cast)?.config||style;
 const a=v.actors.get(e.uid);if(!a?.node?.isValid||a.alive===false)return;
 if(e.phase==='deploy'){deploy(v,a,e,c);return;}
 const b=v.actors.get(e.target);if(!b?.node?.isValid)return;
 const shot=v.mechanismVolleys?.get(e.uid+':'+e.cast),n=shot?.nodes[e.bow],offset=c.offsets[e.bow];if(!offset)return;
 const center={x:a.node.position.x+offset[0],y:a.node.position.y+offset[1]},q={x:b.node.position.x,y:b.node.position.y+c.arrowY},radians=Math.atan2(q.y-center.y,q.x-center.x),angle=radians*180/Math.PI,dx=Math.cos(radians),dy=Math.sin(radians);
 const p={x:center.x+dx*c.weapon.muzzleOffset*c.scale,y:center.y+dy*c.weapon.muzzleOffset*c.scale};
 if(n?.isValid){
  v.cc.Tween.stopAllByTarget(n);n.angle=angle;n.setPosition(...offset);n.setScale(c.scale,c.scale,1);
  v.cc.tween(n).to(c.recoilSeconds/v.speed,{position:new v.cc.Vec3(offset[0]-dx*c.recoilDistance,offset[1]-dy*c.recoilDistance,0)}).to(c.recoilSeconds/v.speed,{position:new v.cc.Vec3(...offset,0)}).start();
 }
 native.play(v,c.muzzle,v.root,p.x,p.y,{size:c.muzzleSize,duration:c.muzzleSeconds,color:c.gold});
 for(const [id,size,widthRatio,heightRatio,color]of [[c.trail,c.trailSize,c.trailWidth,c.trailHeight,c.cyan],[c.arrow,c.arrowSize,c.arrowWidth,c.arrowHeight,c.gold]])native.play(v,id,v.root,p.x,p.y,{size,duration:e.duration,widthRatio,heightRatio,color,angle,travel:q,followTarget:b.node,targetOffsetY:c.arrowY});
}
/** 命中位置独立爆光，只有真实命中事件才播放。 */
function hit(v,target){const c=defaults;for(const [id,size,duration,color]of [[c.impact,c.impactSize,c.impactSeconds,c.gold],[c.hitGlow,c.hitGlowSize,c.hitGlowSeconds,c.cyan]])native.play(v,id,target.node,0,c.arrowY,{size,duration,color});}
/** 统一停止展开及后坐补间，死亡和回放结束不会残留机关。 */
function remove(v,key){const state=v.mechanismVolleys?.get(key);if(!state)return;for(const n of [state.root,...state.nodes,...state.nodes.flatMap(n=>n.children||[])])v.cc.Tween.stopAllByTarget(n);if(state.root.isValid)state.root.destroy();v.mechanismVolleys.delete(key);}
/** 使用战斗时钟到期，支持中途切换倍速和决胜加速。 */
function update(v){for(const [key,s]of v.mechanismVolleys||[])if(v.elapsed>=s.until)remove(v,key);else if(s.opacity)s.opacity.opacity=Math.round(255*Math.min(1,(s.until-v.elapsed)/(s.config||defaults).fade));}
/** 死亡只回收本人的机关，其他黄月英和已发出的弹道继续播放。 */
function death(v,uid){for(const [key,s]of v.mechanismVolleys||[])if(s.uid===uid)remove(v,key);}
/** 离场回收全部机关节点。 */
function clear(v){for(const key of [...(v.mechanismVolleys?.keys()||[])])remove(v,key);}
module.exports={cast,hit,update,death,clear};
