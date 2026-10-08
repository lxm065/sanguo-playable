'use strict';
const c=require('./enemy-opening-config');
/** 从已完成路线统计战斗次数；同节点失败重试不消耗温和开局额度。 */
function index(state){const m=state.meta;if(!m||m.section!==c.section||!m.activeNode)return -1;const nodes=require('./route-graph').nodes(m,require('./classic-config')),node=nodes.find(n=>n.id===m.activeNode);if(!node||!c.types.includes(node.type))return -1;const done=m.route?.key===m.chapter+'-'+m.section?m.route.nodes:[],count=nodes.filter(n=>done.includes(n.id)&&c.types.includes(n.type)).length;return count<c.encounters?count:-1;}
/** 查询保护期，不修改路线或随机种子。 */
function active(state){return index(state)>=0;}
/** 装備使用首章第一节的配装门槛，避免后期章开局提前获得完整装备。 */
function reference(state){return {...state,meta:{...state.meta,chapter:c.referenceChapter,section:c.referenceSection}};}
module.exports={index,active,reference};
