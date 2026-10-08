'use strict';
const c=require('./skill-timing-config');
/** 图鉴及运行名册共享计时覆写，不修改保留溯源的原始导出。 */
function tier(t){return {...t,skills:t.skills.map(s=>({...s,...(c[s.id]||{})}))};}
module.exports={tier};
