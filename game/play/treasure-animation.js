'use strict';
const c=require('./treasure-animation-config');
/** 页面重绘或离开停止旧计时，防止旧宝箱回调操作新页面。 */
function cancel(v){if(v.treasureAnimation){clearTimeout(v.treasureAnimation.timer);v.treasureAnimation=null;}}
/** 以真实宝箱上下层模拟掀盖，物品随光束浮起；未结束时隐藏领取按钮。 */
function play(v,e,cards,controls){cancel(v);const token={key:e.key,start:Date.now(),timer:null};v.treasureAnimation=token;
 /** 根据单一时钟计算抖动、掀盖和显物，切后台后也能准确收敛。 */
 const tick=()=>{if(v.treasureAnimation!==token||!cards[0].root.isValid)return;const elapsed=e.revealed?Infinity:Date.now()-token.start;let done=true;cards.forEach((a,i)=>{const t=elapsed-c.delay-i*c.stagger,opening=Math.max(0,Math.min(1,(t-c.shake)/c.open)),reveal=Math.max(0,Math.min(1,(t-c.shake-c.open)/c.reveal));done=done&&reveal===1;a.chest.angle=t>0&&t<c.shake?Math.sin(t/27)*4:0;a.lid.setPosition(0,(1-c.cut)*c.height/2+c.lift*opening);a.lid.setScale(1,1-.45*opening,1);a.lid.angle=-12*opening;a.glow.active=opening>0;a.glow.setScale(opening,opening,1);a.item.active=reveal>0;a.item.setPosition(0,c.itemY-42*(1-reveal));a.item.setScale(.55+.45*reveal,.55+.45*reveal,1);a.title.active=reveal===1;});if(done){try{if(!e.revealed)v.model.nodeEvents.revealTreasure(e.key);controls.forEach(n=>n.active=true);}catch(error){v.notice('宝藏',error.message);}v.treasureAnimation=null;}else token.timer=setTimeout(tick,c.tick);};tick();}
/** 宝箱上下层保留原像素比例，中心光柱位于箱体后、物品前的独立层。 */
function chest(v,parent){const u=v.ui,n=u.node(parent,'animated-chest',0,30),glow=u.node(n,'chest-light',0,35),g=glow.addComponent(v.cc.Graphics);g.fillColor=new v.cc.Color('#6ADFFF60');g.moveTo(-48,0);g.lineTo(-90,170);g.lineTo(90,170);g.lineTo(48,0);g.close();g.fill();g.fillColor=new v.cc.Color('#C9FFFFAA');g.ellipse(0,8,72,15);g.fill();u.image(n,'classic/chest-base.png',0,-c.height*c.cut/2,c.width,c.height*(1-c.cut));const lid=u.image(n,'classic/chest-lid.png',0,c.height*(1-c.cut)/2,c.width,c.height*c.cut);return {chest:n,lid,glow};}
module.exports={play,chest,cancel};
