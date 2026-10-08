"use strict";
/** 尾王战使用独立阵容配置，保留章节解锁身份与普通武将属性。 */
function enemies(section,roster){if(section.generated)return require("./later-chapters").enemies(section,roster);const override=require('./chapter-difficulty-config').chapters[section.chapter]?.sections?.[section.section];section=require('./chapter-difficulty').boss(section);const config=require('./boss-encounter-config');let c=config.encounters[section.chapter+'-'+section.section]||config.defaults;if(roster&&c?.guards.some(u=>!roster.some(h=>h.id===u.heroId)))c=null;return [{heroId:section.boss,star:override?.bossStar||c?.star||section.star},...(c?.guards||[]).map(u=>({...u,star:override?.guardStar||u.star}))].map((u,i)=>({...u,uid:-i-1,slot:i}));}
module.exports={enemies};
