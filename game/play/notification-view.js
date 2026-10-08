'use strict';
const c=require('./notification-config');
/** 从当前状态只读推导红点，不能因为打开页面清除尚未处理的奖励。 */
function query(v,key){const m=v.model,a=m.activities;if(!a)return false;
 if(key==='warOrder')return require('./war-order').ready(m);
 if(key==='vip')return require('./vip').ready(m);
 if(key==='daily')return a.daily().some(t=>!t.claimed&&t.count>=t.target)||!require('./sign-rewards').status(m.progression).today;
 if(key==='bonds')return require('./bond-activation-config').entries.some(e=>require('./bond-activation').ready(m,e.id)&&!require('./bond-activation').state(m).includes(e.id));
 if(key==='catalog')return query(v,'equipment')||query(v,'bonds');
 if(key==='equipment')return require('./equipment-catalog').groups(m.state).some(g=>g.items.some(i=>i.canUpgrade));
 if(key==='tree')return !m.state.pending&&a.state.talent.level>=require('./talent-tree-config').unlockLevel&&[0,1,2].some(p=>require('./talent-tree').nodes(m,p).some(q=>q.canUpgrade));
 if(key==='enhance')return !m.state.pending&&m.state.meta.diamonds>=a.cost();
 if(key==='talent'){const t=a.state.talent;if(m.state.pending)return false;return m.state.meta.diamonds>=a.cost()||(!a.canBreak()&&((a.state.day===a.day()?a.state.adUsed:0)<require('./activity-config').talent.adLimit||(m.state.meta.inventory['5']||0)>=require('./activity-config').talent.dustCost))||(t.level>=1&&(require('./talent-tree').remaining(m)>0||[0,1,2].some(p=>require('./talent-tree').nodes(m,p).some(q=>q.canUpgrade))));}
 return false;
}
/** 绘制圆形提示并注册刷新回调，位置由所属控件决定。 */
function badge(v,parent,key,x,y,ready=()=>query(v,key)){
 const n=v.ui.node(parent,'red-dot-'+key,x,y,c.radius*2,c.radius*2),g=n.addComponent(v.cc.Graphics);g.fillColor=new v.cc.Color(c.fill);g.strokeColor=new v.cc.Color(c.rim);g.lineWidth=c.lineWidth;g.circle(0,0,c.radius);g.fill();g.stroke();
 v.notificationBadges=(v.notificationBadges||[]).filter(e=>e.node.isValid);v.notificationBadges.push({node:n,ready});n.active=!!ready();return n;
}
/** 事务或子弹窗操作后局部刷新提示，不重建武将或重播动画。 */
function refresh(v){v.notificationBadges=(v.notificationBadges||[]).filter(e=>e.node.isValid);for(const e of v.notificationBadges)e.node.active=!!e.ready();}
module.exports={query,badge,refresh};
