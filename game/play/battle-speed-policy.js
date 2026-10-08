'use strict';
const config={unlockChapter:0,lockedLabel:'通关第二章开启',lockedMessage:'通关第二章后开放倍速功能。',hint:{x:-35,y:-605,font:18,color:'#E8D4AA',width:220,height:30}};
/** 所有战斗入口共用永久通关进度，已有加速卡也不能绕过解锁。 */
function unlocked(model){return Number(model.state.meta.cleared||0)>=config.unlockChapter;}
/** 在事务扣卡前校验开放条件。 */
function assertUnlocked(model){if(!unlocked(model))throw Error(config.lockedMessage);}
module.exports={config,unlocked,assertUnlocked};
