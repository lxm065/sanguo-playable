'use strict';
/** 同一层的两条边若左右顺序颠倒，即形成X；共用端点允许分叉、汇合。 */
function crosses(a,b,nodes){const [a0,a1]=a.map(id=>nodes.get(id)),[b0,b1]=b.map(id=>nodes.get(id));return a0.row===b0.row&&(a0.x-b0.x)*(a1.x-b1.x)<0;}
/** 在不交叉的前提下插入一条边，生成器与旧图迁移共用同一规则。 */
function add(edges,edge,nodes){if(edges.some(e=>e[0]===edge[0]&&e[1]===edge[1]))return true;if(edges.some(e=>crosses(edge,e,nodes)))return false;edges.push(edge);return true;}
/** 保留已走路径及当前选项，仅整理其他连线；补齐所有节点的出入口。 */
function repair(branch,state){const nodes=new Map(branch.nodes.map(n=>[n.id,n])),edges=[],history=state?.route?.key===state?.chapter+'-'+state?.section?state.route.nodes:[],locked=history.slice(1).map((id,i)=>[history[i],id]),last=history.at(-1)||(state?.layer>0?(state.layer-1)+'-'+state.lane:null);if(last)locked.push(...branch.edges.filter(e=>e[0]===last));for(const edge of locked)if(nodes.has(edge[0])&&nodes.has(edge[1]))add(edges,edge,nodes);
 const ordered=[...branch.edges].sort((a,b)=>Math.abs(nodes.get(a[0]).x-nodes.get(a[1]).x)-Math.abs(nodes.get(b[0]).x-nodes.get(b[1]).x));for(const edge of ordered)add(edges,edge,nodes);
 const max=Math.max(...branch.nodes.map(n=>n.row));for(let row=0;row<max;row++){const from=branch.nodes.filter(n=>n.row===row),to=branch.nodes.filter(n=>n.row===row+1);for(const n of from)if(!edges.some(e=>e[0]===n.id))for(const target of to)if(add(edges,[n.id,target.id],nodes))break;for(const n of to)if(!edges.some(e=>e[1]===n.id))for(const source of from)if(add(edges,[source.id,n.id],nodes))break;}
 return {...branch,edges,nodes:branch.nodes.map(n=>({...n,planar:true}))};}
module.exports={crosses,add,repair};
