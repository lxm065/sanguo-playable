'use strict';
const growth=require('./enemy-win-growth-config'),balance=require('./enemy-light-balance-config');
/** 按章节选择循环策略，阶段编号不参与选择；未配置章节沿用前期规则。 */
function forChapter(chapter){const override=(growth.chapterPolicies||[]).filter(p=>chapter>=p.fromChapter).at(-1);const relief=(balance.retryChapterPolicies||[]).filter(p=>chapter>=p.fromChapter).at(-1);return {retryFallbackMultiplier:relief?.multiplier??balance.retryFallbackMultiplier,rates:override?.rates||growth.consecutive.rates,recoveryWins:override?.recoveryWins??balance.recoveryWins};}
module.exports={forChapter};
