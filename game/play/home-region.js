'use strict';
const c=require('./home-region-config');
/** 地区循环只改变表现，章节容量来自该地图的实际落点数。 */
function at(page){return c.regions[Math.max(0,Math.floor(page)||0)%c.regions.length];}
/** 计算地区首章，支持不同容量的地图循环。 */
function start(page){page=Math.max(0,Math.floor(page)||0);const cycle=c.regions.reduce((n,r)=>n+r.sites.length,0);return 1+Math.floor(page/c.regions.length)*cycle+c.regions.slice(0,page%c.regions.length).reduce((n,r)=>n+r.sites.length,0);}
/** 从章节反查地区页，避免固定六章导致遗漏或重复。 */
function pageFor(chapter){const cycle=c.regions.reduce((n,r)=>n+r.sites.length,0);let offset=Math.max(0,Math.floor(chapter||1)-1),page=Math.floor(offset/cycle)*c.regions.length;offset%=cycle;while(offset>=at(page).sites.length){offset-=at(page).sites.length;page++;}return page;}
/** 重玩和翻页共用永久进度边界。 */
function selected(state,page=null){const chapter=Math.max(1,state.chapter||1),last=pageFor(Math.max(chapter,(state.cleared||0)+1));return page===null?pageFor(chapter):Math.max(0,Math.min(last,Math.floor(page)||0));}
/** 背景与章节节点始终选中同一地区。 */
function current(state,page=null){return at(selected(state,page));}
module.exports={at,start,pageFor,selected,current};
