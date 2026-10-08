'use strict';
const c=require('./blink-view-config');
/** 闪烁移动直接落位，起点和终点各播一次原始粒子；普通移动仍走原动画。 */
function move(v,actor,event){if(event.effect!==c.effect||actor.unit.heroId!==c.hero)return false;const p=actor.node.position,q=v.position(event.x,event.y),native=require('./native-effects');v.cc.Tween.stopAllByTarget(actor.node);native.play(v,c.asset,v.root,p.x,p.y+c.offsetY,{duration:c.seconds,size:c.size});actor.node.setPosition(q.x,q.y,0);native.play(v,c.asset,v.root,q.x,q.y+c.offsetY,{duration:c.seconds,size:c.size});v.ui.animate(actor,'idle',true);return true;}
module.exports={move};
