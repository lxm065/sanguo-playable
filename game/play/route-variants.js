'use strict';
const c=require('./route-variants-config');
/** 章与小节确定模板，重开和重载不重抽，避免刷有利路线。 */
function choose(s){return ((Math.max(1,s.chapter||1)-1)*c.chapterStride+Math.max(1,s.section||1)-1)%c.templates.length;}
/** 老存档当前小节锁定旧路线，下一小节才启用变化。 */
function current(s){const key=s.chapter+'-'+s.section;if(!s.routeLayout)return c.templates[0];return c.templates[s.routeLayout.key===key?s.routeLayout.index:choose(s)]||c.templates[0];}
/** 首次接入记录兼容标记，不修改层数、已走节点和待领奖励。 */
function initialize(s){if(!s.routeLayout)s.routeLayout={key:s.chapter+'-'+s.section,index:s.layer||s.activeNode||s.route?.nodes?.length?0:choose(s)};}
module.exports={choose,current,initialize};
