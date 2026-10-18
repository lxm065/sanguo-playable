'use strict';
const defaults=require('./battle-overtime-config');
/** 允许有限时窗测试显式关闭决胜，正常游戏统一使用配置。 */
function config(rules){return {...defaults,...rules.overtime};}
/** 时间到点后进入决胜，模拟时钟仍使用战斗秒而非墙钟。 */
function active(rules,t){return config(rules).enabled&&t>=rules.maxBattleSeconds;}
/** 双方同等增伤，不改变技能冷却或单次命中的类型。 */
function damageMultiplier(rules,t){return active(rules,t)?config(rules).damageMultiplier:1;}
/** 决胜后线性削弱所有治疗，配置时长后归零，杜绝互相回血的无限循环。 */
function healingMultiplier(rules,t){return active(rules,t)?Math.max(0,1-(t-rules.maxBattleSeconds)/config(rules).healingFadeSeconds):1;}
/** 返回技术保护边界；达到边界仍未分胜负时由调用方报错而非生成败局。 */
function limit(rules){return rules.maxBattleSeconds+(config(rules).enabled?config(rules).safetySeconds:0);}
module.exports={config,active,damageMultiplier,healingMultiplier,limit};
