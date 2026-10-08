'use strict';
const c=require('./friend-rank-config');
/** 只统计已完成的路线节点；章节通关记录兼容旧档，永不使用未结算战果。 */
function score(meta){if(!meta)return 0;const chapter=Math.max(1,Math.floor(Number(meta.chapter)||1)),section=Math.max(1,Math.min(c.sections,Math.floor(Number(meta.section)||1))),layer=Math.max(0,Math.min(c.layers,Math.floor(Number(meta.layer)||0)));return Math.min(c.maxScore,Math.max(0,(chapter-1)*c.sections*c.layers+(section-1)*c.layers+layer,(Number(meta.cleared)||0)*c.sections*c.layers,Number(meta.friendRankBest)||0));}
/** 在原有事务内记录历史最高值，投降重开和存档回滚仍遵循同一事务。 */
function record(state){if(state.meta)state.meta.friendRankBest=score(state.meta);}
/** 挑战使用当前积分与已结算场次，允许降分；未参与者不创建排位成绩。 */
function snapshot(state){const meta=state?.meta,challenge=meta?.challenge;return {stage:score(meta),arena:challenge&&Number.isInteger(challenge.matches)&&challenge.matches>0?{score:Math.min(c.maxScore,Math.max(0,Math.floor(challenge.rating||0))),matches:challenge.matches}:null};}
module.exports={score,record,snapshot};
