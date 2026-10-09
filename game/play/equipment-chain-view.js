'use strict';
const c=require('./equipment-chain-config');
/** 只连接本次真实受击目标，旧战报缺少名单时仅显示其已知目标。 */
function links(event){let from=event.uid;return [...new Set(event.targets||[event.target])].filter(id=>id!==undefined&&id!==event.uid).map(to=>{const pair={from,to};from=to;return pair;});}
/** 每次触发共用一个时钟，按战斗倍速依次亮起并跟随单位，销毁后清理计时器。 */
function show(v,event){const pairs=links(event).map(p=>({a:v.actors.get(p.from),b:v.actors.get(p.to)})).filter(p=>p.a?.node.isValid&&p.b?.node.isValid);if(!pairs.length)return;v.equipmentChains=(v.equipmentChains||[]).filter(n=>n.isValid);while(v.equipmentChains.length>=c.maxActive)v.equipmentChains.shift().destroy();const root=v.ui.node(v.root,'equipment-lightning-chain');v.equipmentChains.push(root);const beams=pairs.map(p=>{const n=v.ui.image(root,c.texture,0,0,1,c.width),alpha=n.addComponent(v.cc.UIOpacity);n.active=false;return {...p,n,alpha};});let elapsed=0,last=Date.now();
 /** 每跳使用真实当前位置，不额外造成命中或延迟领域伤害。 */
 function tick(){if(!root.isValid)return;const now=Date.now();elapsed+=(now-last)/1000*(v.speed||1);last=now;if(elapsed>c.seconds+(beams.length-1)*c.hopDelay){root.destroy();return;}beams.forEach((b,i)=>{const t=elapsed-i*c.hopDelay;b.n.active=t>=0&&t<c.seconds&&b.a.node.isValid&&b.b.node.isValid;if(!b.n.active)return;const p=b.a.node.position,q=b.b.node.position,dx=q.x-p.x,dy=q.y-p.y;b.n.setPosition((p.x+q.x)/2,(p.y+q.y)/2+c.offsetY);b.n.angle=Math.atan2(dy,dx)*180/Math.PI;b.n.getComponent(v.cc.UITransform).setContentSize(Math.max(1,Math.hypot(dx,dy)),c.width);b.alpha.opacity=(c.pulseBase+c.pulseRange*Math.abs(Math.sin(t*c.pulseHz)))*Math.min(1,(c.seconds-t)/(c.seconds*(1-c.fadeStart)));});}
 const timer=setInterval(tick,c.tickMs);root.once(v.cc.Node.EventType.NODE_DESTROYED,()=>clearInterval(timer));tick();return root;}
module.exports={links,show};
