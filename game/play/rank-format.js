"use strict";
/** 累计已完成节点还原章节小节，边界显示已完成末关。 */
function progress(value,c){if(!value)return '尚未通关';const n=value-1;return '第'+(Math.floor(n/(c.sections*c.layers))+1)+'章 '+(Math.floor(n/c.layers)%c.sections+1)+'/'+c.sections+' · '+(n%c.layers+1)+'关';}
/** 两种榜单共用进度、段位和星级说明，避免主域与开放域文案漂移。 */
function label(key,value,c){if(key==='stage')return progress(value||0,c);if(value==null)return '尚未参加排位';const index=Math.min(c.ranks.length-1,Math.floor(value/c.pointsPerRank));return c.ranks[index]+' · '+(index%c.starsPerTier+1)+'星';}
module.exports={progress,label};
