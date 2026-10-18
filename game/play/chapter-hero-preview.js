'use strict';
/** 首页优先展示下一位章节解锁武将，沿用三国与原版统一映射。 */
function entry(v,beforeChapter=Infinity){const hero=require('./handbook-config').heroes.filter(h=>h.chapter>(v.progress.state.cleared||0)).sort((a,b)=>a.chapter-b.chapter)[0];if(!hero||hero.chapter>=beforeChapter)return false;const n=v.ui.node(v.root,'chapter-hero-preview',282,295,160,210);v.ui.image(n,hero.id+'-avatar.png',0,30,110,110);v.ui.text(n,hero.chapter+'章解锁\n'+hero.name,0,-60,25,'#FFE49A',160,96);require('./chapter-entry-navigation').bind(v,n,hero.chapter);return true;}
module.exports={entry};
