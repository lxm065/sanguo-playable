"use strict";
/** null 表示无上限；有限容量仅供显式配置的兼容模式使用。 */
function full(rules,count){return Number.isFinite(rules.capacity)&&count>=rules.capacity;}
/** 存档校验允许恰好达到上限，无上限模式保留其他阵容约束。 */
function valid(rules,count){return !Number.isFinite(rules.capacity)||count<=rules.capacity;}
module.exports={full,valid};
