'use strict';
const c=require('./battle-overtime-config');
/** 回放事件只应用一次免费加速；下一场恢复玩家选择的速度。 */
function apply(v,event){
 if(event.type!=='overtime')return false;if(v.overtimeBaseSpeed!==undefined)return true;
 v.overtimeBaseSpeed=v.speed;v.speed*=event.speedMultiplier;v.overtimeActive=true;
 for(const a of v.actors?.values?.()||[]){if(a.sp)a.sp.timeScale*=event.speedMultiplier;if(a.currentAnimation?.options)a.currentAnimation.options.speed=v.speed;}
 v.overtimeLabel=v.ui.text(v.root,c.label,0,c.y,c.font,c.color,700,36);return true;
}
/** 结算/退出不把决胜倍率带入后续备战或消耗额外加速次数。 */
function clear(v){if(v.overtimeBaseSpeed!==undefined){v.speed=v.overtimeBaseSpeed;delete v.overtimeBaseSpeed;}v.overtimeActive=false;if(v.overtimeLabel?.node?.isValid)v.overtimeLabel.node.destroy();v.overtimeLabel=null;}
module.exports={apply,clear};
