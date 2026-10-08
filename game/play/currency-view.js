"use strict";
const config=require('./currency-config');
/** 图标和金额整体居中，正文只承载金额，不再用菱形字符代替货币图片。 */
function amount(v,parent,value,x,y,variant='equipment'){const c={...config,...config.variants[variant]},text=String(value),width=Array.from(text).reduce((n,ch)=>n+(ch.charCodeAt(0)<128?c.asciiWidth:1)*c.font,0),total=c.iconSize+c.gap+width,n=v.ui.node(parent,'diamond-amount',x,y,total,Math.max(c.iconSize,c.font+10));v.ui.image(n,c.image,-total/2+c.iconSize/2,0,c.iconSize,c.iconSize);v.ui.text(n,text,(c.iconSize+c.gap)/2,0,c.font,c.color,width+4,c.font+12);return n;}
/** 仅展示钻石奖励图片的场景也复用同一资产配置。 */
function icon(v,parent,x,y,variant='novice'){const c={...config,...config.variants[variant]};return v.ui.image(parent,c.image,x,y,c.iconSize,c.iconSize);}
module.exports={amount,icon};
