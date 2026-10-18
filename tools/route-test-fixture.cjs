'use strict';
/** 事件测试定位到真实前驱，只跳过战斗，不绕过入口的连通性校验。 */
function position(p,node){const s=p.state,b=require('../game/play/branch-route').current(s),edge=b?.edges.find(e=>e[1]===node.id);s.layer=node.row;s.activeNode=null;s.lane=edge?Number(edge[0].split('-')[1]):node.lane;s.route=edge?{key:s.chapter+'-'+s.section,nodes:[edge[0]]}:null;}
/** 老版路线回归明确使用旧图，独立于新分叉图的专项验收。 */
function legacy(p){delete p.state.branchRoutes;p.state.routeEvents=null;const types=Object.fromEntries(p.nodes().map(n=>[n.id,n.type]));p.state.routeEvents={key:p.state.chapter+'-'+p.state.section,types};}
module.exports={position,legacy};
