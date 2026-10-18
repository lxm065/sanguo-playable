'use strict';
/** 原版 bone21 技能序号来自 Character._fetterEffMap；三国羁绊仅映射外观，不改规则。 */
module.exports={
 directory:'original-bonds/',binary:'bond.bin',atlas:'bond.atlas',texture:'bond.png',textureName:'bone21.png',
 originalOrder:[203,201,202,101,102,103,104,105,204,205,206,207,107,109,108,106],
 sources:{wei:201,shu:101,wu:202,qun:103,warrior:102,archer:205,strategist:203,zhenyu:105,dragon:104,vanguard:204},
 colors:['#ffffff','#67daf1','#a96b00','#66ffbc','#fe8bc9','#a2b54c','#9598b0','#018323','#3d41f2','#f5ef0e','#977fe9','#32cf57','#e9e9d9','#bf01bf','#4090fe','#fe6d01','#d70606'],
 scale:1.05,offsetY:0,staggerSeconds:1.2,flyDelaySeconds:1,flySeconds:.5,flyOffsetY:80,flySize:34,
 pulseScale:1.25,pulseSeconds:.16,cleanupSeconds:3,
};
