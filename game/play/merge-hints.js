"use strict";
const c=require('./combat-feedback-config').merge;
/** 场上与备战席共同统计同身份同阶单位，满阶不再提示。 */
function eligible(model){const groups=new Map();for(const u of model.state.units){const k=u.heroId+':'+u.star;groups.set(k,(groups.get(k)||0)+1);}return new Set(model.state.units.filter(u=>u.star<model.maxRank()&&groups.get(u.heroId+':'+u.star)>=model.rules.mergeCount).map(u=>u.uid));}
/** 页面切换、开始战斗和重绘时释放所有提示动画。 */
function clear(v){for(const x of v.mergeHints||[]){for(const target of x.targets)v.cc.Tween.stopAllByTarget(target);if(x.node.isValid)x.node.destroy();}v.mergeHints=[];}
/** 高亮框、跳动箭头和可合成文字同时标记可点击单位，不拦截触摸。 */
function show(v){clear(v);if(v.playing||v.model.state.pending)return;const ids=eligible(v.model),u=v.ui,cc=v.cc;for(const id of ids){const a=v.actors.get(id);if(!a?.node.isValid)continue;const n=u.node(a.node,'merge-hint'),box=u.node(n,'merge-glow',0,c.y),g=box.addComponent(cc.Graphics);g.fillColor=new cc.Color(c.fill);g.strokeColor=new cc.Color(c.line);g.lineWidth=3;g.roundRect(-c.width/2,-c.height/2,c.width,c.height,12);g.fill();g.stroke();n.setSiblingIndex(0);const alpha=box.addComponent(cc.UIOpacity);const arrow=u.text(n,c.arrow,0,c.arrowY,c.font+12,c.color,90,52).node;const label=a.unit.slot<0?null:u.text(n,c.label,0,-c.height/2,c.font,c.color,c.width+20,40).node;for(const node of [arrow,label].filter(Boolean)){const outline=node.addComponent(cc.LabelOutline);outline.color=new cc.Color(c.outline);outline.width=3;}cc.tween(alpha).repeatForever(cc.tween().to(c.pulse,{opacity:65}).to(c.pulse,{opacity:255})).start();cc.tween(arrow).repeatForever(cc.tween().by(c.pulse,{position:new cc.Vec3(0,c.bounce,0)}).by(c.pulse,{position:new cc.Vec3(0,-c.bounce,0)})).start();v.mergeHints.push({node:n,targets:[alpha,arrow]});}}
module.exports={eligible,show,clear};
