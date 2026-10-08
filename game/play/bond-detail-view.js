'use strict';
const c={width:630,height:480,titleY:159,bodyY:24,buttonY:-164,font:27,bodyWidth:552,bodyHeight:220};
/** 两种战斗共用纸质羁绊说明；内容拦截触摸，点击遮罩空白处关闭。 */
function show(v,bond){const u=v.ui,cc=v.cc,shade=u.box(v.root,'bond-detail-shade',0,0,720,1280,'#15120FDD',false),host=v.host||v,p=host.paper(shade,'bond-detail-panel',0,0,c.width,c.height);shade.addComponent(cc.BlockInputEvents);const close=()=>{if(shade.isValid)shade.destroy();};shade.on(cc.Node.EventType.TOUCH_END,close);p.addComponent(cc.BlockInputEvents);p.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;});u.text(p,bond.name,0,c.titleY,36,'#77532F');const text=bond.effect.replace(/\{(\d+)\}/g,(_,i)=>bond.values[i]??'');u.text(p,text+'\n不同武将：'+bond.count+'，当前档位：'+bond.level,0,c.bodyY,c.font,'#4D3B2B',c.bodyWidth,c.bodyHeight);u.button(p,'关闭',0,c.buttonY,244,close);return shade;}
module.exports={show};
