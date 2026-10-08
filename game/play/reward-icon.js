"use strict";
/** 固定货币、材料和装备统一图片映射；随机材料只用于领取前预览。 */
function file(id){return id==='1'?'classic/diamond.png':id==='7'?'equipment/7211.png':['101','102','103'].includes(id)?'classic/item-101.png':require('./equipment-theme')[id]?'equipment/'+id+'.png':'classic/item-'+id+'.png';}
module.exports={file};
