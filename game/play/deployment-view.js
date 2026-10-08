'use strict';
const c=require('./deployment-hints');
/** 只读计算可落格及推荐空格；人数已满时备战武将仍可交换已有棋子。 */
function query(model,unit){const r=model.rules,h=model.roster.find(h=>h.id===unit.heroId),range=h?.tiers?.find(t=>t.star===unit.star)?.range||h?.range||1,order=c.ranges.find(rule=>range<=rule.max).rows,rows={front:r.rows-1,middle:Math.floor((r.rows-1)/2),back:0},full=model.state.units.filter(u=>u.slot>=0).length>=model.limit(),cells=Array.from({length:r.rows*r.columns},(_,slot)=>{const occupant=model.state.units.find(u=>u.slot===slot&&u.uid!==unit.uid);return {slot,row:Math.floor(slot/r.columns),empty:!occupant,legal:unit.slot>=0||!full||!!occupant};}),preferred=order.map(name=>rows[name]).find(row=>cells.some(p=>p.row===row&&p.legal&&p.empty));return cells.map(p=>({...p,recommended:p.legal&&p.empty&&p.row===preferred}));}
/** 清理拖动提示节点，松手、取消或重绘不会留下推荐框。 */
function clear(v){v.deploymentHints?.destroy();v.deploymentHints=null;}
/** 拖动开始时绘制己方合法格，推荐文字不改变实际落子和交换行为。 */
function show(v,unit){clear(v);const n=v.ui.node(v.root,'deployment-hints');v.deploymentHints=n;for(const cell of query(v.model,unit).filter(p=>p.legal)){const p=v.position(cell.slot%v.config.columns,cell.row),box=v.ui.node(n,'hint-'+cell.slot,p.x,p.y),g=box.addComponent(v.cc.Graphics);g.strokeColor=new v.cc.Color(c.color);g.fillColor=new v.cc.Color(c.fill);g.lineWidth=c.width;const w=v.config.layout.boardHitWidth-c.inset,h=v.config.layout.boardHitHeight-c.inset;g.roundRect(-w/2,-h/2,w,h,12);g.fill();g.stroke();if(cell.recommended)v.ui.text(box,c.text,0,0,c.font,c.color,w,h);}return n;}
module.exports={query,show,clear};
