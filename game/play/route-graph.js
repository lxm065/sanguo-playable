'use strict';
const config=require('./route-config');
/** 新地图采用三条带交叉节点的路线；旧生成分支仅供迁移与回归验证。 */
function nodes(state,legacy){
 if(state.mapVersion!==config.version){const c=legacy.map,last=legacy.chapter.layers-1;return Array.from({length:last+1},(_,row)=>(row===0||row===last?[1]:[0,2]).map(lane=>({id:row+'-'+lane,row,lane,type:c.types[row],x:c.laneX[lane],y:row*c.rowSpacing}))).flat();}
 const layout=require('./route-variants').current(state);
 const result=layout.lanes.flatMap((source,lane)=>config.routes[source].map((unused,row)=>({id:row+'-'+lane,row,lane,type:config.routes[source][row===0?0:1+(row-1+layout.rotate)%(config.routes[source].length-1)],x:config.laneX[lane]*layout.spread[row%layout.spread.length]+layout.shifts[row%layout.shifts.length],y:row*config.spacing}))); 
 const row=config.routes[0].length;result.push({id:row+'-1',row,lane:1,type:'boss',x:0,y:row*config.spacing});
 require("./route-events").apply(state,result);
 const preserved=state.routeMigration;
 if(preserved?.key===state.chapter+'-'+state.section){const active=result.find(n=>n.id===preserved.id);if(active)active.type=preserved.type;}
 require('./route-events').protect(state,result);
 return result;
}
/** 图形连线与入口校验共用相邻关系，不再绘制不存在的交叉通路。 */
function connected(from,to,state){return to.row===from.row+1&&(state.mapVersion!==config.version||to.type==='boss'||from.lane===to.lane||(require('./route-variants').current(state).crossRows.includes(from.row)&&Math.abs(from.lane-to.lane)===1));}
/** 返回当前路线版本，旧档通过迁移即时启用。 */
function readyVersion(){return config.version;}
/** 按小节完成比例映射旧节点；只改路线元数据，待领取战报和经济数据保持原样。 */
function migrate(state,legacy){
 if(state.mapVersion===config.version)return;
 const oldLast=legacy.chapter.layers-1,newLast=config.routes[0].length;
 const mapRow=row=>Math.min(newLast,Math.max(0,Math.floor(row*newLast/oldLast)));
 const mapId=id=>{const [row,lane]=id.split('-').map(Number),next=mapRow(row);return next+'-'+(next===newLast?1:lane);};
 const key=state.chapter+'-'+state.section;
 if(state.activeNode){const old=nodes({...state,mapVersion:1},legacy).find(n=>n.id===state.activeNode);state.activeNode=mapId(state.activeNode);if(old)state.routeMigration={key,id:state.activeNode,type:old.type};}
 state.layer=mapRow(state.layer);
 if(state.layer===newLast)state.lane=1;
 if(state.route?.key===key)state.route.nodes=state.route.nodes.map(mapId);
 state.mapVersion=config.version;
}
module.exports={nodes,connected,readyVersion,migrate};
