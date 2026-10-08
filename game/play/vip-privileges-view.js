'use strict';
const c=require('./vip-config');
/** 数值和符号统一强调，内容仍取自对应等级的原始权益表。 */
function text(row,index){const value=index===4?row.data_5/100:row['data_'+(index+1)],label=index===8?c.privileges.unavailableLabel:c.labels[index];return label.replace(/\+?\{0\}%?/,token=>'<color='+c.privileges.valueColor+'><b>'+token.replace('{0}',value)+'</b></color>');}
/** 标题和九行权益均位于固定内边距内，以独立富文本突出数值。 */
function render(v,parent,row,selected){const u=v.ui,l=c.layout,p=c.privileges,box=u.box(parent,'vip-privileges',l.bodyX,p.centerY,l.bodyWidth,p.height,p.background);u.text(box,'特权一览 · VIP'+selected,0,p.titleY,p.titleFont,p.ink,l.bodyWidth-p.padding*2,p.titleHeight);c.labels.forEach((_,i)=>{const n=u.node(box,'vip-perk-'+i,0,p.firstY-i*p.rowGap,l.bodyWidth-p.padding*2,p.rowHeight),label=n.addComponent(v.cc.RichText);label.fontSize=p.font;label.lineHeight=p.rowHeight;label.maxWidth=l.bodyWidth-p.padding*2;label.horizontalAlign=v.cc.Label.HorizontalAlign.LEFT;label.string='<color='+p.ink+'>'+text(row,i)+'</color>';});return box;}
module.exports={render,text};
