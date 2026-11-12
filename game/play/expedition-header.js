'use strict';
/** 统一绘制主公头像、等级经验、生命、人口和金币。 */
function render(v){
 const c=require('./expedition-header-config'),u=v.ui,a=c.avatar,r=c.resources;
 const avatar=u.portrait(v.root,v.progress.lord().portrait,a.x,a.y,a.width,a.height,require('./classic-config').portraitCrop);avatar.name='battle-lord-avatar';
 if(require('./liubiao-skill').available(v.model)&&!v.playing){const p=c.skill;u.button(v.root,p.label,p.x,p.y,p.width,()=>require('./liubiao-skill-view').show(v),'#A56A22',p.height);}
 avatar.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;v.battleHud.lordDetails();});
 const e=c.experience,n=u.node(v.root,'lord-experience',e.x,e.y);
 v.battleHeader={hp:u.text(v.root,'',r.hpX,r.y,32,'#E65441',170),population:u.text(v.root,'',r.populationX,r.y,26,'#F0D36B',130),gold:u.text(v.root,'',r.goldX,r.y,26,'#F0D36B',185),level:u.text(v.root,'',c.level.x,c.level.y,c.level.font,'#EEE6D6',140),experience:n.addComponent(v.cc.Graphics)};
 n.on(v.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;v.battleHud.lordDetails();});update(v);
}
/** 资源文字原地赋值，经验有变化才重画进度条，不触碰头像和武将。 */
function update(v){
 const h=v.battleHeader,s=v.model.state;if(!h)return;
 h.hp.string='♥'.repeat(s.meta.hp);h.population.string=s.units.filter(x=>x.slot>=0).length+'/'+v.model.limit();h.gold.string='金币 '+s.gold;h.level.string='等级 '+s.expedition.level;
 const ratio=progress(s.expedition);if(h.ratio===ratio)return;h.ratio=ratio;
 const e=require('./expedition-header-config').experience,g=h.experience;g.clear();g.fillColor=new v.cc.Color(e.background);g.rect(-e.width/2,-e.height/2,e.width,e.height);g.fill();g.fillColor=new v.cc.Color(e.color);g.rect(-e.width/2,-e.height/2,e.width*ratio,e.height);g.fill();
}
/** 读取当前等级真实经验需求，升级后自然从下一等级起点继续。 */
function progress(e){return Math.max(0,Math.min(1,e.experience/require('./level-progression').cost(e.level)));}
module.exports={render,update,progress};
