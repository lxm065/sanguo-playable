'use strict';
/** 棋组与积分永久保存，棋局仅存在于本次运行内存；也兼容清除旧版续局。 */
function snapshot(state){if(!require('./challenge-config').sessionOnly||!state?.meta?.challenge?.run)return state;return {...state,meta:{...state.meta,challenge:{...state.meta.challenge,run:null}}};}
module.exports={snapshot};
