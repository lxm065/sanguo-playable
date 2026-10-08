'use strict';
const c=require('./later-chapter-config');
/** 延迟读取图鉴，避免图鉴与小节解锁策略初始化时循环依赖。 */
function section(meta){if(meta.chapter<c.fromChapter)return null;const heroes=require('./handbook-config').heroes,available=heroes.filter(h=>h.chapter<meta.chapter),milestone=heroes.find(h=>h.chapter===meta.chapter),pool=available.filter(h=>h.tier>=2),index=((meta.chapter-c.fromChapter)*c.rotation+meta.section-1)%pool.length,hero=meta.section===c.sections&&milestone?milestone:pool[index],star=Math.max(hero.tier,c.starSteps.filter(s=>s.chapter<=meta.chapter).at(-1).star);return {chapter:meta.chapter,section:meta.section,title:hero.name+'·'+c.titles[meta.section-1],boss:hero.id,name:hero.name,star,unlock:null,generated:true,milestone:meta.section===c.sections&&milestone?.id===hero.id};}
/** 护卫来自本章以前已开放的英雄，首领在解锁章节可先作为敌人登场。 */
function enemies(s,roster){const heroes=require('./handbook-config').heroes.filter(h=>h.chapter<s.chapter&&h.id!==s.boss&&roster.some(r=>r.id===h.id)),offset=(s.chapter*c.rotation+s.section)%heroes.length;return [{heroId:s.boss,star:s.star},...Array.from({length:c.guards},(_,i)=>{const h=heroes[(offset+i)%heroes.length];return {heroId:h.id,star:Math.max(h.tier,s.star-1)};})].map((u,i)=>({...u,uid:-i-1,slot:i}));}
module.exports={section,enemies};
