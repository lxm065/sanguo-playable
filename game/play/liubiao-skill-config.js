'use strict';
/** 两蓝换一紫来自原版；紫装权重未恢复，采用本地现有紫装池等权，独立配置便于调整。 */
module.exports={lord:'1007',required:2,blue:require('./equipment-pool-config').blue,purple:require('./equipment-pool-config').purple,
 title:'两蓝换一紫',description:'选择2件闲置蓝色装备，兑换1件随机紫色装备。已穿戴的装备请先卸下。',line:'给我两件蓝的，还你紫的！',
 view:{width:640,height:860,titleY:350,descriptionY:255,selectedY:125,selectedGap:165,columns:5,rows:2,gridY:-30,gap:110,rowGap:125,icon:82,pagerY:-245,buttonY:-340,closeY:-480,font:25,ink:'#614726',selected:'#FFE28A'}
};
