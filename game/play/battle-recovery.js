'use strict';
const policy=require('./expedition-config').pendingRewards;
/** 未播放中的持久战果优先恢复到领取页，仅调整导航，不代选、重算或重复发奖。 */
function resume(view){
  if(!policy.resumeOnRender||!view.model.state.pending||view.playing||view.startingBattle)return false;
  view.page='battle';
  return true;
}
module.exports={resume};
