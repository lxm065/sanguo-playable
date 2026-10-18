"use strict";
const c=require('./rank-theme-config');
/** 使用游戏共用纸纹与标题，排行榜不引入独立的场景美术。 */
function backdrop(v,m,scope){v.ui.image(m,c.background,0,0,c.width,c.height);require('./paper-title').draw(v,m,scope,c.width,c.height);}
/** 绘制徽章闭合边框。 */
function polygon(g,points){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.close();g.fill();g.stroke();}
/** 页签使用现有红金按钮贴图，切换只更新外观，不改变指标规则。 */
function tab(v,m,name,index,action){const n=v.ui.node(m,name,index?c.tabX:-c.tabX,c.tabY,c.tabWidth,c.tabHeight),active=v.ui.image(n,c.activeSkin,0,0,c.tabWidth,c.tabHeight),inactive=v.ui.image(n,c.inactiveSkin,0,0,c.tabWidth,c.tabHeight),label=v.ui.text(n,name,0,0,29,c.colors.ink,c.tabWidth-30,48);n.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;action();});return {select(selected){active.active=selected;inactive.active=!selected;label.color=new v.cc.Color(selected?c.colors.activeText:c.colors.ink);label.isBold=selected;}};}
/** 操作区沿用游戏按钮，显示完整用途；节点名保持兼容原有交互。 */
function actionButton(v,m,name,index,action){const n=v.ui.button(m,c.footerLabels[name]||name,c.footerX[index],c.footerY,c.buttonWidth,action,undefined,c.buttonHeight);n.name=name;return n;}
/** 分页箭头沿用金色按钮贴图，避免另造旗帜和卷轴控件。 */
function arrow(v,m,name,right,action){const n=v.ui.button(m,right?'›':'‹',right?c.navX:-c.navX,c.navY,c.arrowWidth,action,'#846238',c.arrowHeight);n.name=name;return n;}
/** 前三名使用同源金属徽章贴图，第四名起保持普通数字。 */
function medal(v,parent,rank,x,y,size){if(rank>3)return v.ui.text(parent,String(rank),x,y,28,c.colors.ink,size,size);const badge=require('./rank-badge-config'),n=v.ui.image(parent,badge.files[rank-1],x,y,size*badge.widthRatio,size*badge.heightRatio);n.name='rank-crown';return n;}
module.exports={backdrop,tab,actionButton,arrow,medal};
