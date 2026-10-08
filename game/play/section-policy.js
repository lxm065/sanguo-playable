'use strict';
/** 已核对的小节规则；未核实的小节不冒充已有解锁对应。 */
const sections=[
 {chapter:1,section:1,title:'黄巾初起',boss:'zhangfei',name:'张飞',star:2,unlock:'zhangfei'},
 {chapter:1,section:2,title:'黄巾袭村',boss:'zhouyu',name:'周瑜',star:3,unlock:'zhouyu'},
 {chapter:1,section:3,title:'山野伏兵',boss:'yanliang',name:'颜良',star:3,unlock:'yanliang'},
 {chapter:1,section:4,title:'林中群寇',boss:'huangyueying',name:'黄月英',star:4,unlock:'huangyueying'},
 {chapter:1,section:5,title:'平定黄巾',boss:'zhaoyun',name:'赵云',star:4,unlock:'zhaoyun'},
 {chapter:2,section:1,title:'新野报到',originalTitle:'闪金镇报道',boss:'taishici',name:'太史慈',star:3,unlock:null},
 {chapter:2,section:2,title:'江畔阻击',boss:'zhouyu',name:'周瑜',star:3,unlock:null},
 {chapter:2,section:3,title:'山道突围',boss:'yanliang',name:'颜良',star:3,unlock:null},
 {chapter:2,section:4,title:'机关营寨',boss:'huangyueying',name:'黄月英',star:4,unlock:null},
 {chapter:2,section:5,title:'新野会战',boss:'zhaoyun',name:'赵云',star:4,unlock:null},
];
/** 取得当前小节配置；后续未知小节保留既有战斗占位，但不重复宣称解锁张飞。 */
function current(meta,classic){return sections.find(s=>s.chapter===meta.chapter&&s.section===meta.section)||require("./later-chapters").section(meta)||{chapter:meta.chapter,section:meta.section,title:classic.chapter.sections[meta.section-1].replace(/^\d+\/\d+/,''),boss:classic.chapter.unlockHero,name:classic.chapter.unlockName,star:classic.chapter.bossStar,unlock:null};}
/** 只依据实际结算解锁记录判断BOSS武将能否进入获取池。 */
function eligible(id,meta){return !sections.some(s=>s.unlock===id)||(meta?.unlocked||[]).includes(id);}
/** 图鉴与战斗共享解锁条件，避免文案和实际掉落池漂移。 */
function requirement(id){return sections.find(s=>s.unlock===id);}
/** 根据已完成的小节补齐旧版漏发的解锁，不回收已有武将或改写待领取奖励。 */
function earned(meta){return [...new Set(sections.filter(s=>s.unlock&&((meta.cleared||0)>=s.chapter||meta.chapter>s.chapter||(meta.chapter===s.chapter&&meta.section>s.section))).map(s=>s.unlock))];}
/** 重开当前章回收本章BOSS的获取资格，已完成前章和非BOSS收录不受影响。 */
function resetRun(meta){const ids=sections.filter(s=>s.chapter===meta.chapter&&s.unlock).map(s=>s.unlock);meta.unlocked=meta.unlocked.filter(id=>!ids.includes(id));}
module.exports={resetRun,sections,current,eligible,requirement,earned,
 text:{pending:'结算后解锁',unlocked:'武将解锁',description:'已解锁，可通过对应阶级的奖励或合成获取。'}};
