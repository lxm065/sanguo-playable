"use strict";
/** 仅收敛附件几何数值的小数尾部；保留动作时间、帧名和所有像素。 */
function normalize(data,precision){const copy=JSON.parse(JSON.stringify(data));if(!Number.isInteger(precision))return copy;for(const skin of copy.skins||[])for(const slot of Object.values(skin.attachments||{}))for(const a of Object.values(slot))for(const key of ['x','y','width','height'])if(typeof a[key]==='number')a[key]=(Number(a[key].toFixed(precision)) || 0);return copy;}
module.exports={normalize};
