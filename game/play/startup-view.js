'use strict';
const c=require('./startup-config');
/** 绘制可独立释放的开场；资源进度由外部真实完成量驱动。 */
function show(cc,root,u){
 const visible=new Promise(resolve=>cc.director.once(cc.Director.EVENT_AFTER_DRAW,resolve));
 const host=u.node(root,'startup'),timers=[],tweens=[],started=Date.now();let closed=false,ratio=0;
 u.box(host,'startup-background',0,0,c.width,c.height,c.background,false);
 const glow=u.box(host,'startup-panel',0,70,c.width*.9,c.height*.73,c.panel,false);glow.addComponent(cc.UIOpacity).opacity=100;
 const title=u.node(host,'startup-title',0,c.titleY);u.text(title,c.title,3,-6,c.titleSize,c.ink,c.width,110);const label=u.text(title,c.title,0,0,c.titleSize,c.gold,c.width,110);label.isBold=true;const outline=label.node.addComponent(cc.LabelOutline);outline.color=new cc.Color(c.ink);outline.width=3;
 title.setScale(.7,.7,1);tweens.push(cc.tween(title).to(c.titleEntrance,{scale:new cc.Vec3(1,1,1)},{easing:'backOut'}).start());u.text(host,c.subtitle,0,c.subtitleY,27,c.white);
 const b=c.board,board=u.node(host,'startup-board',b.x,b.y),g=board.addComponent(cc.Graphics),left=-b.columns*b.cellWidth/2,top=b.rows*b.cellHeight/2;
 g.fillColor=new cc.Color(c.ink);g.rect(left,top-b.rows*b.cellHeight-b.depth,b.columns*b.cellWidth,b.rows*b.cellHeight);g.fill();
 for(let r=0;r<b.rows;r++)for(let col=0;col<b.columns;col++){g.fillColor=new cc.Color(b.colors[(r+col)%2]);g.rect(left+col*b.cellWidth,top-(r+1)*b.cellHeight,b.cellWidth-2,b.cellHeight-2);g.fill();}
 const actors=[];
 const tip=u.text(host,c.tips[0],0,c.tipY,24,c.white,c.width-50,65),status=u.text(host,c.loadingText,0,c.statusY,25,c.white);
 const track=u.box(host,'startup-track',0,c.bar.y,c.bar.width,c.bar.height,c.bar.track,true),fill=u.node(track,'startup-progress'),ink=fill.addComponent(cc.Graphics);
 const dust=u.node(host,'startup-particles'),particles=dust.addComponent(cc.Graphics);
 u.text(host,c.footer,0,c.footerY,18,c.white,c.width-40,115);
 /** 进度只前进，100%仅在调用方完成所有必要初始化后呈现。 */
 function progress(value){if(closed)return;ratio=Math.max(ratio,Math.min(1,Math.max(0,value)));ink.clear();ink.fillColor=new cc.Color(c.bar.color);if(ratio>0){ink.roundRect(-c.bar.width/2+2,-c.bar.height/2+2,(c.bar.width-4)*ratio,c.bar.height-4,6);ink.fill();}status.string=ratio===1?c.readyText:c.loadingText+' '+Math.floor(ratio*100)+'%';}
 /** 共用资源缓存；加载后才创建骨骼，避免未就绪时显示空角色。 */
 async function prepare(assets,onProgress){let done=0;await Promise.all(c.heroes.map(async(h,i)=>{await assets.skeleton(h.id,1);if(closed)return;const actor=u.actor(host,{uid:'intro-'+i,heroId:h.id,star:1,side:'ally'},h.x,h.y,h.scale,false);actors.push(actor);onProgress(++done/c.heroes.length);}));}
 /** 成功离场或启动失败时停止计时器与标题动画。 */
 function close(){if(closed)return;closed=true;timers.forEach(clearInterval);tweens.forEach(t=>t.stop());if(host.isValid)host.destroy();}
 /** 最短展示仅服务标题入场，不冒充加载百分比。 */
 async function finish(){const remaining=Math.max(0,c.minimumDisplay-(Date.now()-started));if(remaining)await new Promise(r=>setTimeout(r,remaining));progress(1);await new Promise(r=>setTimeout(r,c.exitDelay));close();}
 timers.push(setInterval(()=>{if(!host.isValid){close();return;}const elapsed=Date.now()-started;tip.string=c.tips[Math.floor(elapsed/c.tipInterval)%c.tips.length];particles.clear();particles.fillColor=new cc.Color(c.gold);for(let i=0;i<c.particleCount;i++){const x=(i*137%c.width)-c.width/2,y=((i*91+elapsed*c.particleSpeed/1000)%c.height)-c.height/2;particles.circle(x,y,c.particleRadius*(.4+.6*(i%3)/2));particles.fill();}},c.tickMs));host.on(cc.Node.EventType.NODE_DESTROYED,close);progress(0);return{visible,prepare,progress,finish,close};
}
module.exports={show};
