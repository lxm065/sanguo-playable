'use strict';
/** 无敌与不可选中共用明确的释放状态，结束时一次清除，避免计时漂移。 */
function protectedUnit(unit){return !!unit.qinggangCast;}
/** 统一敌对选取资格；范围伤害还须通过伤害入口的无敌检查。 */
function targetable(unit){return unit.hp>0&&!protectedUnit(unit)&&!unit.invisibleUntil;}
module.exports={protectedUnit,targetable};
