'use strict';
const c=require('./revive-config'),service=require('./revive');
/** 最后一命复活使用保存的截止时间，广告期间暂停，取消后接续剩余倒计时。 */
function show(v,p){const deadline=service.open(v.model,p.id),u=v.ui,m=v.overlay(),lord=v.progress.lord();u.box(m,'revive-panel',0,90,720,365,'#14343EEF',false);v.paper(m,'revive-advice',85,100,440,180);u.text(m,c.title,0,235,55,'#8ABCF0',620,80);u.portrait(m,lord.portrait,-245,94,125,150,require('./classic-config').portraitCrop);u.text(m,'♡'.repeat(lord.hp),-245,-10,35,'#537778',170,60);u.text(m,c.advice,85,100,34,'#614325',420,140);u.text(m,'调调装备和站位，再战一回！',0,-25,28,'#B4442D',640,60);const ring=u.node(m,'revive-count-ring',0,c.countY),g=ring.addComponent(v.cc.Graphics);g.strokeColor=new v.cc.Color(c.ring.color);g.lineWidth=c.ring.width;g.circle(0,0,c.ring.radius);g.stroke();const count=u.text(m,'10',0,c.countY,c.countFont,'#FFC577',200,110);let timer=null,busy=false;
 /** 停止旧计时后一次性结算并转入远征结算页。 */
 const surrender=()=>{if(busy)return;busy=true;clearInterval(timer);v.act(()=>{service.surrender(v.model,p.id);v.page='map';});};
 require('./benefit-ui').button(v,m,c.decline,-170,c.buttonY,290,surrender,'red');require('./benefit-ui').button(v,m,c.accept,170,c.buttonY,290,()=>{if(busy)return;try{service.pause(v.model,p.id);busy=true;clearInterval(timer);const ticket=v.model.adTicket();let receipt;v.ad(()=>{receipt=service.claim(v.model,p.id,ticket);},()=>require('./lord-blessing-view').show(v,receipt),()=>{service.open(v.model,p.id);v.render();});}catch(e){surrender();}},'gold');u.text(m,'额外获得2级武将',170,c.buttonY-76,27,'#FFFFFF',310,55);
 /** 依据绝对时间计时，切后台不会凭空多出十秒。 */
 const tick=()=>{if(!m.isValid){clearInterval(timer);return;}const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));count.string=String(left);if(!left)surrender();};timer=setInterval(tick,c.tickMs);m.once(v.cc.Node.EventType.NODE_DESTROYED,()=>clearInterval(timer));tick();return m;}
module.exports={show};
