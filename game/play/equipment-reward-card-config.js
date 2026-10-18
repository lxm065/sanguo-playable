'use strict';
const event=require('./node-event-config'),spring=require('./spring-reward-config'),lord=require('./lord-skill-animation-config');
/** 场景只定义布局；品质名称、颜色及边框统一由装备展示组件提供。 */
module.exports={
 treasure:{icon:{x:0,y:require('./treasure-animation-config').itemY,size:event.layout.portrait},name:{y:167,font:27,width:event.layout.choiceWidth-20,height:45},quality:null},
 spring:{icon:{x:0,y:spring.centerY,size:spring.iconSize},name:spring.name},
 merchant:{icon:{x:0,y:12,size:76}},
 lord:{icon:{x:0,y:lord.item.y,size:lord.item.size+6},name:{y:lord.item.y+112,font:lord.item.font,width:600,height:65}},
};
