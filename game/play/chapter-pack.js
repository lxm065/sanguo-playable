'use strict';
const c=require('./chapter-pack-config');
/** 统一计算礼包顺序、章节门槛和旧档已领取状态，预览不改变存档。 */
function query(progress,chapter){const items=c.packs[chapter];if(!items)throw Error('未知章节礼包');const claimed=progress.state.claimed||[],previous=Object.keys(c.packs).map(Number).filter(n=>n<chapter),reason=claimed.includes(chapter)?'已领取':progress.state.cleared<chapter?'请先通关本章':previous.some(n=>!claimed.includes(n))?'需先领取前一章礼包':'';return {chapter,items,reason};}
/** 领取校验广告凭据并原子入库，旧存档已领记录直接沿用，不补发或重发。 */
function claim(progress,chapter,ticket){return progress.model.transact(()=>{const q=query(progress,chapter);if(q.reason)throw Error(q.reason);progress.model.consumeAd(ticket);for(const [id,count]of Object.entries(q.items))progress.add(id,count,false);progress.state.claimed.push(chapter);});}
module.exports={query,claim};
