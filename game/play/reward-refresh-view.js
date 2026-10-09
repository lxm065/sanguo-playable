'use strict';
const c=require('./reward-refresh-config');
/** 货币充足时用真实招贤钱图标替代名称；领取与扣费仍交给原回调。 */
function button(v,parent,coins,remaining,action){const l=c.layout,paid=coins>=c.cost,n=v.ui.button(parent,paid?'':c.video+' · 剩余'+remaining+'次',0,l.y,l.width,action,l.color,l.height);if(paid){v.ui.image(n,require('./reward-icon').file(c.item),l.iconX,0,l.iconSize,l.iconSize);v.ui.text(n,c.caption.replace('{count}',coins),l.textX,0,l.font,l.textColor,l.textWidth,l.height);}return n;}
module.exports={button};
