/** 专用QA档通过真实战斗和结算推进到首BOSS；不篡改胜负和解锁标记。 */
const p=model.progression;
let attempts=0;
while(p.state.layer<9&&p.state.section===1&&p.state.hp>0&&attempts++<30){
 let group;while((group=model.state.units.find(u=>u.star<config.maxStar&&model.state.units.filter(x=>x.heroId===u.heroId&&x.star===u.star).length===3)))model.merge(group.uid,'same');
 for(const u of model.state.units.filter(x=>x.slot>=0))model.deploy(u.uid,-1);
 model.state.units.slice().sort((a,b)=>b.star-a.star).slice(0,model.limit()).forEach((u,i)=>model.deploy(u.uid,[8,9,7,10,6,11][i]));
 const node=p.nodes().find(n=>p.accessible(n)),type=p.enter(node.id);
 if(!['battle','elite','boss'].includes(type))continue;
 model.fight();const pending=model.state.pending,choice=pending.choices.findIndex(id=>model.state.units.some(u=>u.heroId===id&&u.star===1));model.claim(pending.choices.length&&model.state.units.length<config.capacity?Math.max(0,choice):null);
}
view.page='map';view.mapOffset=-1085;view.render();
return {profile:config.storageKey,meta:p.state,units:model.state.units,pending:model.state.pending};
