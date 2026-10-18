'use strict';
/** 首次弹窗预备延迟与图片清单，避免在点击事件内集中装配资源。 */
module.exports={maxMergeModels:3,delay:280,stepDelay:40,images:['classic/paper.png',...Object.values(require('./button-skin-config').files)]};
