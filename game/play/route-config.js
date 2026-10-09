'use strict';
/** 新路线版本；每一路10普通、2精英、1宝藏、2商人、2泉水，再汇合BOSS。 */
module.exports={opening:{section:1,row:0,type:'battle'},version:2,crossRows:[0,2,4,6,8,10,12,14,15],spacing:195,laneX:[-220,0,220],
 routes:[
 ['battle','battle','merchant','battle','elite','battle','spring','battle','treasure','battle','elite','battle','merchant','battle','spring','battle','battle'],
 ['battle','spring','battle','battle','treasure','battle','elite','battle','merchant','battle','spring','battle','battle','elite','battle','merchant','battle'],
 ['battle','battle','elite','battle','merchant','battle','battle','spring','battle','elite','battle','treasure','battle','merchant','battle','spring','battle']],
 // 本地商品策略，未声称恢复原服商品池与价格。
 merchant:{offers:[{id:'7206',price:150},{id:'7207',price:150},{id:'7208',price:200}]},
 icons:{merchant:'classic/merchant.png'},
 markerIcons:{battle:['flag','flag-active'],elite:['elite','elite-active'],merchant:['merchant','merchant-active'],spring:['spring','spring-active'],treasure:['treasure','treasure-active'],boss:['boss','boss-active']},labels:{},
};
