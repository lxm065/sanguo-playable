"use strict";
const config=require('./game-club-config');
/** 游戏圈入口固定在图鉴上方，彩色圆形图案不依赖外部图片。 */
function render(v,page){if(!config.enabled||!config.pages.includes(page))return;const l=config.layout[page],c=config.icon,n=v.ui.node(v.root,'game-club',l.x,l.y,l.width,l.height),g=n.addComponent(v.cc.Graphics);g.fillColor=new v.cc.Color(c.background);g.strokeColor=new v.cc.Color(c.border);g.lineWidth=c.rim;g.circle(0,0,c.radius+c.rim);g.fill();g.stroke();c.colors.forEach((color,i)=>{const a=i*Math.PI*2/c.colors.length,b=(i+1)*Math.PI*2/c.colors.length;g.fillColor=new v.cc.Color(color);g.moveTo(Math.cos(a)*c.inner,Math.sin(a)*c.inner);g.lineTo(Math.cos(a)*c.radius,Math.sin(a)*c.radius);g.lineTo(Math.cos(b)*c.radius,Math.sin(b)*c.radius);g.close();g.fill();});v.ui.text(n,'游戏圈',0,c.labelY,c.font,c.labelColor,l.width+20,40);n.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;open(v);});return n;}
/** 由用户点击触发原生页面；错误只提示，不改变阵容、奖励或存档。 */
function open(v){if(!v.gameClubService)v.gameClubService=new (require('./game-club-service').GameClubService)(typeof wx==='undefined'?null:wx);return v.gameClubService.open().catch(error=>v.notice('游戏圈',error.message));}
module.exports={render,open};
