'use strict';
const config=require('./detail-wrap-config');
/** 数值、百分比、单位及属性名作为完整词组，标点与相邻正文一起排版。 */
function tokens(text){const number='[+＋−-]?\\d+(?:\\.\\d+)?(?:[／/]\\d+(?:\\.\\d+)?)?(?:'+config.units.join('|')+')?',pattern=new RegExp('(?:(?:'+config.labels.join('|')+')\\s*[:：]?\\s*'+number+'|'+number+'|[A-Za-z]+|[\\s\\S])','gu'),parts=String(text).match(pattern)||[],result=[];let opening='';for(const part of parts){if(config.opening.includes(part)){opening+=part;continue;}if(config.closing.includes(part)&&result.length&&!opening)result[result.length-1]+=part;else if(!opening&&/^[+＋−-]?\d/.test(part)&&result.length&&/[\u3400-\u9fff]$/.test(result[result.length-1]))result[result.length-1]+=part;else{result.push(opening+part);opening='';}}if(opening)result.push(opening);return result;}
/** 用统一字宽估计保留安全边距，英文词和数字不在中间断开。 */
function weight(text){return Array.from(text).reduce((n,ch)=>n+(ch.codePointAt(0)<128?config.asciiWidth:1),0);}
/** 只在合法词组边界换行；显式段落保留，正文不删减且不缩字。 */
function wrap(text,width,font,padding=config.padding){const max=Math.max(1,width/font-padding),lines=[];for(const paragraph of String(text||'').split('\n')){let line='',used=0;for(const token of tokens(paragraph)){const size=weight(token);if(line&&used+size>max){lines.push(line);line='';used=0;}line+=token;used+=size;}lines.push(line);}return lines;}
module.exports={tokens,weight,wrap};
