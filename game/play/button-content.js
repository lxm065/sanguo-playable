'use strict';
const c=require('./button-content-config');
/** 计算首行图文的居中布局，多行说明独立居中，避免图标挤压文字。 */
function layout(text,size,width){const lines=String(text).slice(c.marker.length).trimStart().split('\n'),units=Array.from(lines[0]).reduce((n,ch)=>n+(/[\x00-\x7f]/.test(ch)?c.asciiWidth:1),0),font=Math.min(size,(width-c.gap)/(units+c.iconScale*c.aspect)),iconHeight=font*c.iconScale,iconWidth=iconHeight*c.aspect,textWidth=units*font,total=iconWidth+c.gap+textWidth;return {lines,font,iconHeight,iconWidth,textWidth,total,lineHeight:size+c.lineGap};}
/** 所有按钮复用真实视频图标；普通按钮保留原有文字布局。 */
function draw(ui,parent,text,size,color,width,height){if(!String(text).startsWith(c.marker))return ui.text(parent,text,0,0,size,color,width,height);const l=layout(text,size,width),y=(l.lines.length-1)*l.lineHeight/2;ui.image(parent,c.icon,-l.total/2+l.iconWidth/2,y,l.iconWidth,l.iconHeight);const first=ui.text(parent,l.lines[0],(l.iconWidth+c.gap)/2,y,l.font,color,l.textWidth+2,l.lineHeight);first.enableWrapText=false;l.lines.slice(1).forEach((line,i)=>ui.text(parent,line,0,y-(i+1)*l.lineHeight,size,color,width,l.lineHeight));return first;}
module.exports={draw,layout};
