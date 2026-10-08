'use strict';
const config=require('./chapter-difficulty-config'),sections=require('./section-policy');
/** 只对显式配置的章节启用曲线映射，其他章节保留原有规则。 */
function policy(state){return config.chapters[state.meta?.chapter];}
/** 后续章节复用五小节基础曲线，英雄投放策略仍保留章节独立配置。 */
function curve(state){const c=require('./enemy-growth-config');return policy(state)||(state.meta?.chapter>=c.fromChapter?config.chapters[c.referenceChapter]:null);}
/** 战斗和详情共用敌方倍率，避免面板与实际战报强度分离。 */
function scale(state,rules){const e=state.expedition?.enemyEncounter;return e?.key===require("./enemy-budget").key(state)&&Number.isFinite(e.scale)?e.scale:breakdown(state,rules).scale;}
/** 把旧档或缺失的失败记录安全限制到配置范围。 */
function losses(state,p){const value=state.meta?.difficultyRelief?.[state.meta.chapter+'-'+state.meta.section];return Number.isFinite(value)?Math.max(0,Math.min(p.adaptive.maxLosses,Math.floor(value))):0;}
/** 只读拆解五阶段基础强度；备战区最强可上阵组合参与评估，关卡随机值固定。 */
function breakdown(state,rules){const opening=require('./enemy-opening').index(state);if(opening>=0)return {scale:Math.min(rules.enemyMaxScale,rules.enemyBaseScale+opening*rules.enemyGrowth),factor:1,randomFactor:1,reliefFactor:1,failures:policy(state)?losses(state,policy(state)):0,progress:0,opening:true};const p=curve(state),section=p?.sections?.[state.meta?.section];if(!section)return {scale:Math.min(rules.enemyMaxScale,rules.enemyBaseScale+(state.stage-1)*rules.enemyGrowth),factor:1};
 const meta=state.meta,nodes=require('./route-graph').nodes(meta,require('./classic-config')),node=nodes.find(n=>n.id===meta.activeNode),last=Math.max(...nodes.map(n=>n.row)),progress=Math.max(0,Math.min(1,(node?.row??meta.layer??0)/Math.max(1,last))),type=node?.type||'battle';
 const base=(type==='boss'?section.boss:section.start+(section.end-section.start)*progress)*(type==='elite'?p.eliteMultiplier:1)*p.statMultiplier;
 const a=p.adaptive,limit=require('./population').limit(state,rules),team=state.units.slice().sort((x,y)=>y.star-x.star).slice(0,limit),averageStar=team.length?team.reduce((sum,u)=>sum+u.star,0)/team.length:section.expectedStar;
 const rosterFactor=Math.max(a.minRoster,Math.min(a.maxRoster,1+(averageStar-section.expectedStar)*a.perStar));
 const key=[Math.min(meta.chapter,require("./enemy-growth-config").referenceChapter),meta.section,meta.activeNode||meta.layer].join(':'),seed=Array.from(key).reduce((n,ch)=>Math.imul(n,31)+ch.charCodeAt(0)|0,a.seed),randomFactor=1+(require('./combat').random(seed>>>0)()*2-1)*a.randomAmplitude,failures=losses(state,p),reliefFactor=1;
 const factor=Math.max(a.minFactor,Math.min(a.maxFactor,rosterFactor*randomFactor*reliefFactor));const growth=require("./enemy-growth").breakdown(state);return {scale:base*factor*growth.factor,growth,base,factor,averageStar,rosterFactor,randomFactor,failures,reliefFactor,type,progress};
}
/** 只在正式战果领取事务内更新缓冲，失败逐次降低，胜利逐步恢复。 */
function settle(state,pending){const p=policy(state);if(!p?.adaptive||pending.training)return;const result=pending.battle.result;if(!['win','loss','draw'].includes(result))return;const key=state.meta.chapter+'-'+state.meta.section,value=losses(state,p),next=result==='win'?Math.max(0,value-p.adaptive.winRecovery):Math.min(p.adaptive.maxLosses,value+1);if(!next&&!state.meta.difficultyRelief)return;state.meta.difficultyRelief={...state.meta.difficultyRelief,[key]:next};}

/** 以参考章同小节的解锁进度筛选敌池，避免通关解锁反过来抬高新局开场。 */
function pool(state,roster,rank){if(require('./enemy-opening').active(state))return roster.filter(h=>!h.legacy&&h.unlock==='initial'&&h.tier<=require('./enemy-opening-config').star);const p=policy(state);if(!p)return null;const meta={chapter:p.referenceChapter,section:state.meta.section,cleared:p.referenceChapter-1},earned=sections.earned(meta);meta.unlocked=earned;return roster.filter(h=>!h.legacy&&sections.eligible(h.id,meta)&&h.tier<=Math.min(rank,rankCap(state,p))&&(h.unlock==='initial'||(h.unlock==='boss'&&earned.includes(h.id))||(h.unlock==='chapter'&&meta.cleared>=h.chapter)));}
/** 中段由低阶过渡到高阶候选，升阶节点由阶段配置控制。 */
function rankCap(state,p){const c=p.sections?.[state.meta.section];return c?.earlyMaxStar&&(state.meta.layer||0)<c.promotionRow?c.earlyMaxStar:(c?.maxStar??Infinity);}
/** 配装起点与随机种子复用参考章，第一小节留给重新合成与成长。 */
function equipmentState(state){if(require('./enemy-opening').active(state))return require('./enemy-opening').reference(state);const p=policy(state);return p?{...state,meta:{...state.meta,chapter:p.referenceChapter}}:state;}
/** 尾王阶级和护卫沿用参考小节，仅替换明确配置的章节主题武将。 */
function boss(section){const p=config.chapters[section.chapter];if(!p)return section;const reference=sections.sections.find(s=>s.chapter===p.referenceChapter&&s.section===section.section);return reference?{...reference,boss:p.bossOverrides[section.section]||reference.boss}:section;}
/** 敌将阶级随小节成长，英雄初始阶级仅作为下限；不改尾王独立编排。 */
function star(state,hero){return Math.max(hero.tier,minimum(state));}
/** 普通敌人、精英和首领护卫共享小节最低阶，避免单独编队漏掉成长。 */
function minimum(state){if(require('./enemy-opening').active(state))return require('./enemy-opening-config').star;return Math.max(...state.units.map(u=>u.star),require('./enemy-level-config').minimumBySection[state.meta?.section]||1,policy(state)?.minimumStarBySection?.[state.meta?.section]||1);}
/** 阶段基础人数叠加可用阵容规模；包括备战席但不超过人口和棋盘容量。 */
function count(state,rules,fallback,typeOverride=null){const chapter=require('./enemy-opening').active(state)?null:curve(state),p=chapter?.sections?.[state.meta?.section],detail=p?breakdown(state,rules):{},type=typeOverride||detail.type||'battle',baseline=p&&type!=='boss'?p.startCount+Math.round((p.endCount-p.startCount)*detail.progress):fallback;
 const available=Math.min(require('./population').limit(state,rules),state.units.length),offset=require('./enemy-count-config').offsets[type]??require('./enemy-count-config').offsets.battle;
 return Math.max(1,Math.min(rules.columns*rules.rows,rules.maxDeployedLimit,Math.max(require('./enemy-opening').active(state)?rules.enemyStartCount:baseline,available+offset)));
}
/** 尾王只扩充现有护卫模板；保留首领身份和所有阶级，UID及站位仍由生成流程统一分配。 */
function reinforce(state,rules,units){const target=count(state,rules,units.length,'boss');if(target<=units.length||units.length<2)return units;const guards=units.slice(1);return [...units,...Array.from({length:target-units.length},(_,i)=>({...guards[i%guards.length],uid:-(units.length+i+1),slot:units.length+i}))];}
module.exports={minimum,policy,scale,pool,equipmentState,boss,star,breakdown,settle,count,reinforce};
