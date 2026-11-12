'use strict';
const config=require('./solo-challenge-config'),rules=require('./solo-challenge-rules'),{random}=require('./combat');
/** 仅复制可序列化领域快照，调用方不能修改未提交的奖励。 */
function copy(value){return JSON.parse(JSON.stringify(value));}
/** 刀锋与副本共享局内原语，进度、货币及结算分别存于宿主原子快照。 */
class SoloChallenge{
 /** 战斗端口可注入；不使用带远征阵容闭包的宿主模拟器。 */
 constructor(model,simulate=require('./expedition-combat').simulate){this.model=model;this.simulate=simulate;}
 /** 每次从宿主读取，写盘回滚替换状态后不会持有旧引用。 */
 get state(){return this.model.state.meta.soloChallenges;}
 /** 开放取永久通关数，进行中章节或远征战果不能冒充通关。 */
 unlocked(kind){return !!config.modes[kind]&&(this.model.state.meta.cleared||0)>=config.modes[kind].chapter;}
 /** 首次进入才创建状态，不修改远征进度和未领取战果。 */
 initialize(){if(!this.state)this.model.transact(()=>{this.model.state.meta.soloChallenges={version:config.version,serial:0,arena:{stars:0,bestWins:0,played:0,run:null},dungeon:{cleared:0,played:0,run:null}};});return this;}
 /** 开放入口和所有写操作重复校验，隐藏按钮不能替代领域检查。 */
 gate(kind){if(!this.unlocked(kind))throw Error('通关第'+(config.modes[kind]?.chapter||0)+'章开放'+(config.modes[kind]?.name||'玩法'));}
 /** 已完成副本按顺序开放；菜单门槛与原表open_dup并行判断。 */
 canEnter(id){const row=rules.dungeon(id);return this.unlocked('dungeon')&&(this.model.state.meta.cleared||0)>=row.chapter&&id<=(this.state?.dungeon.cleared||0)+1;}
 /** 将模式及局号绑定到异步回调，拒绝上局广告、战报和奖励回调。 */
 token(kind){const r=this.state?.[kind]?.run;return {kind,id:r?.id,round:r?.round,section:r?.section,node:r?.node};}
 /** 不允许操作其他局、终局或指定阶段以外的数据。 */
 active(kind,phases=['prepare'],token=null){this.gate(kind);const run=this.state?.[kind]?.run;if(!run||!phases.includes(run.phase)||token&&(token.kind!==kind||token.id!==run.id||token.round!==run.round||token.section!==run.section||token.node!==run.node))throw Error('棋局状态已变化，请重新打开');return run;}
 /** 副本限制由原始角色身份过滤，不受星级变体影响。 */
 pool(run){return rules.available(this.model,run.kind==='dungeon'?rules.dungeon(run.dungeon):null);}
 /** 有种子的本地随机只推进本局，不消耗远征随机序列。 */
 sample(run,items){if(!items.length)throw Error('当前没有可用单位');return items[Math.floor(random(run.seed++)()*items.length)];}
 /** 单位星级必须在当前角色已有阶级中，不制造缺失角色或属性。 */
 grade(hero,wanted){return hero.tiers.filter(t=>t.star<=wanted).at(-1)?.star||hero.tier;}
 /** 初始金币生命来自原主公表，其他竞技经济使用集中配置。 */
 start(kind,id=null,lordId=null){this.gate(kind);this.initialize();return this.model.transact(()=>{
  const saved=this.state[kind];if(saved.run&&(!saved.run.claimed||saved.run.phase!=='finished'))throw Error('请先继续或领取当前'+config.modes[kind].name+'结算');
  const row=kind==='dungeon'?rules.dungeon(id):null;if(row&&!this.canEnter(id))throw Error('请先满足章节条件并通关前置副本');
  const choices=row?row.lords:require('./classic-config').lords.map(l=>l.id);lordId=lordId||choices.find(l=>this.model.progression.unlocked(l));
  const lord=this.model.progression.lord(lordId);if(!lord||!choices.includes(lordId)||!this.model.progression.unlocked(lordId))throw Error('请选择已解锁且符合限制的主公');
  const local=config[kind],serial=++this.state.serial,run={id:serial,kind,dungeon:row?.id||null,lord:lord.id,phase:kind==='arena'?'draft':'prepare',seed:config.seed+serial,round:1,section:1,node:0,wins:0,losses:0,experience:0,level:1,gold:kind==='arena'?local.initialGold:lord.coin,hp:kind==='arena'?local.initialHp:lord.hp,maxHp:kind==='arena'?local.initialHp:lord.hp,capacity:(kind==='arena'?local.initialCapacity:config.dungeon.startingUnits)+(config.lords.armyBonus[lord.id]||0)+(row?.buff===7?2:0),units:[],equipment:[],nextUid:1,choices:[],offers:[],pending:null,route:[],completion:null,claimed:false};
  saved.run=run;
  if(kind==='arena')this.rollChoices(run);else{const pool=this.pool(run),hero=pool.find(h=>h.id===config.dungeon.startingHero)||pool[0];for(let i=0;i<config.dungeon.startingUnits;i++)this.addHero(run,hero.id,hero.tier);this.beginSection(run);if(row.buff===3)for(let i=0;i<config.economy.openingEquipmentCount;i++)this.addEquipment(run,this.sample(run,require('./equipment-pool-config').blue));}
  if(lord.id==='1002')this.addEquipment(run,config.lords.blessingEquipment);
  this.rollOffers(run);return copy(run);
 });}
 /** 军队、装备均为局内状态，阵亡不删除养成，终局不带回远征。 */
 addHero(run,id,star){const hero=this.pool(run).find(h=>h.id===id);if(!hero)throw Error('该单位被副本禁用或尚未解锁');if(run.units.length>=run.capacity)throw Error('人口已满，请先升人口或合成');const slot=Array.from({length:this.model.rules.rows*this.model.rules.columns},(_,i)=>i).find(i=>!run.units.some(u=>u.slot===i));run.units.push({uid:run.nextUid++,heroId:id,star:this.grade(hero,star),slot});}
 /** 仅实装装备进入局内背包，领取不直接改变永久强化等级。 */
 addEquipment(run,id){run.equipment.push({uid:run.nextUid++,id,owner:null});}
 /** 三选一来自符合限制的真实获取池，不把副本禁用角色混入奖励。 */
 rollChoices(run){const pool=this.pool(run),choices=[];for(let i=0;i<config.economy.choiceCount&&pool.length;i++){const hero=this.sample(run,pool.filter(h=>!choices.includes(h.id)));choices.push(hero.id);if(choices.length===pool.length)break;}run.choices=choices;}
 /** 开局选兵和胜利选兵共用选择事务，旧局和重复回调不能重复领兵。 */
 choose(kind,index,token){return this.model.transact(()=>{const r=this.active(kind,['draft','reward'],token),id=r.choices[index];if(!id)throw Error('候选已变化');const pending=r.pending;this.addHero(r,id,pending?.heroGrade||this.pool(r).find(h=>h.id===id).tier);r.choices=[];
  if(r.phase==='draft'&&r.units.length<config.arena.initialPicks)this.rollChoices(r);else{r.phase='prepare';if(pending)this.advance(r);r.pending=null;}
 });}
 /** 满人口可放弃选兵，仍按同一事务推进；不额外发放金币。 */
 skip(kind,token){return this.model.transact(()=>{const r=this.active(kind,['reward'],token);r.choices=[];r.phase='prepare';this.advance(r);r.pending=null;});}
 /** 副本每节路线与开节赠兵一次性保存，恢复存档不重复发放。 */
 beginSection(run){const row=rules.dungeon(run.dungeon);run.route=rules.route(row,run.section,()=>random(run.seed++)());run.node=0;if(row.buff===2){const hero=this.sample(run,this.pool(run));if(run.units.length<run.capacity)this.addHero(run,hero.id,this.sample(run,config.dungeon.openingUnitGrades));else run.sectionGift={heroId:hero.id,star:this.sample(run,config.dungeon.openingUnitGrades)};}}
 /** 开节赠兵在满员时保留待领，不因恢复或重复操作生成第二份。 */
 claimGift(kind){return this.model.transact(()=>{const r=this.active(kind);if(!r.sectionGift)throw Error('没有待领取的单位');this.addHero(r,r.sectionGift.heroId,r.sectionGift.star);delete r.sectionGift;});}
 /** 商店价格和商品用途同时保存，不在界面重绘时重新抽取。 */
 rollOffers(run){const e=config.economy,row=run.kind==='dungeon'?rules.dungeon(run.dungeon):null,discount=row?.buff===1?e.shopDiscount:1;run.offers=Array.from({length:e.offerCount},(_,i)=>{
  if(row?.buff===4&&i===0)return {type:'experience',amount:e.experienceGain*e.experienceMultiplier,price:e.experiencePrice,bought:false};
  if(i===0||row?.buff===12&&i===1){const pool=this.pool(run).filter(h=>row?.buff!==12||h.tiers.some(t=>t.star===e.heroGrade)),hero=this.sample(run,pool),star=row?.buff===12?e.heroGrade:hero.tier;return {type:'hero',id:hero.id,star:this.grade(hero,star),price:e.heroPrices[hero.tier],bought:false};}
  const id=this.sample(run,require('./equipment-pool-config').blue),quality=require('./equipment-catalog-data').find(e=>e.id===id).quality;return {type:'equipment',id,price:Math.floor(e.equipmentPrices[quality]*discount),bought:false};
 });run.merchantGoldTaken=false;}
 /** 副本商店只能在商人节点购买；竞技商店在准备阶段开放。 */
 shopOpen(run){return run.kind==='arena'||run.route[run.node]==='merchant';}
 /** 扣款、容量校验和商品售罄同一事务提交，失败全部回滚。 */
  buy(kind,index,token){return this.model.transact(()=>{const r=this.active(kind,undefined,token),offer=r.offers[index];if(!this.shopOpen(r)||!offer||offer.bought)throw Error('商品已售出或当前不在商店');if(r.gold<offer.price)throw Error('金币不足');r.gold-=offer.price;if(offer.type==='hero')this.addHero(r,offer.id,offer.star);else if(offer.type==='equipment')this.addEquipment(r,offer.id);else this.experience(r,offer.amount);offer.bought=true;});}
 /** 经验沿用现有等级阈值，三倍经验只放大经验，不冒充直接升三星。 */
 experience(run,amount){run.experience+=amount;const thresholds=require('./expedition-config').experience.thresholds;while(run.level<=thresholds.length&&run.experience>=thresholds[run.level-1]){run.experience-=thresholds[run.level-1];run.level++;run.capacity=Math.min(config.economy.maxCapacity,run.capacity+1);}}
 /** 刷新明确扣除本局金币，不能以界面重开免费刷新。 */
 refresh(kind){return this.model.transact(()=>{const r=this.active(kind);if(!this.shopOpen(r)||r.gold<config.economy.refresh)throw Error('无法刷新或金币不足');r.gold-=config.economy.refresh;const taken=r.merchantGoldTaken;this.rollOffers(r);r.merchantGoldTaken=taken;});}
 /** 广告凭据绑定本局和节点，迟到或重复回调不发金币。 */
 merchantTicket(kind){const r=this.active(kind);return {...this.token(kind),section:r.section,node:r.node,ad:this.model.adTicket()};}
 /** 仅完整视频回调领取；第十类副本按原文案翻倍商人广告金币。 */
 merchantGold(kind,ticket){return this.model.transact(()=>{const r=this.active(kind,undefined,ticket);if(!this.shopOpen(r)||r.merchantGoldTaken||ticket.section!==r.section||ticket.node!==r.node)throw Error('商人奖励已变化');this.model.consumeAd(ticket.ad);r.gold+=config.economy.merchantGold*(r.kind==='dungeon'&&rules.dungeon(r.dungeon).buff===10?config.economy.merchantGoldMultiplier:1);r.merchantGoldTaken=true;});}
 /** 界面与扣款共用人口报价，避免显示价和实际消耗漂移。 */
 populationCost(run){return config.economy.population+Math.max(0,run.capacity-config.arena.initialCapacity)*config.economy.populationStep;}
 /** 人口与局内金币共用可配置增长表，额外人口不超过棋盘容量。 */
 upgrade(kind){return this.model.transact(()=>{const r=this.active(kind),e=config.economy,cost=this.populationCost(r);if(r.capacity>=Math.min(e.maxCapacity,this.model.rules.rows*this.model.rules.columns))throw Error('人口已满');if(r.gold<cost)throw Error('金币不足');r.gold-=cost;r.capacity++;});}
 /** 拖动只在己方棋盘移位或换位；禁止节点外拖动复制单位。 */
 deploy(kind,uid,slot){return this.model.transact(()=>{const r=this.active(kind),unit=r.units.find(u=>u.uid===uid);if(!unit||!Number.isInteger(slot)||slot<0||slot>=this.model.rules.rows*this.model.rules.columns)throw Error('请选择己方有效棋格');const other=r.units.find(u=>u.uid!==uid&&u.slot===slot);if(other)other.slot=unit.slot;unit.slot=slot;});}
 /** 三合同名同阶，装备保留到背包；副本禁用资格再次校验。 */
  merge(kind,uid){return this.model.transact(()=>{const r=this.active(kind);let unit=r.units.find(u=>u.uid===uid);const hero=this.pool(r).find(h=>h.id===unit?.heroId),max=(this.model.state.meta.cleared>=18?config.economy.maxStar:4);if(!hero||unit.star>=max||!hero.tiers.some(t=>t.star===unit.star+1))throw Error('该单位不能继续合成');const same=[unit,...r.units.filter(u=>u.uid!==uid&&u.heroId===unit.heroId&&u.star===unit.star)].slice(0,config.economy.mergeCount);if(same.length<config.economy.mergeCount)throw Error('需要三个同名同阶单位');const removed=new Set(same.filter(u=>u.uid!==uid).map(u=>u.uid)),old=unit.star;unit.star++;r.units=r.units.filter(u=>!removed.has(u.uid));r.equipment.forEach(e=>{if(removed.has(e.owner))e.owner=null;});if(r.lord==='1006'&&random(r.seed++)()<config.lords.returnChance&&r.units.length<r.capacity)this.addHero(r,hero.id,old);});}
 /** 穿脱只操作本局装备，任何单位的槽位不能超限。 */
 equip(kind,uid,owner){return this.model.transact(()=>{const r=this.active(kind),item=r.equipment.find(e=>e.uid===uid);if(!item||owner!==null&&!r.units.some(u=>u.uid===owner))throw Error('装备或单位不存在');if(owner!==null&&r.equipment.filter(e=>e.uid!==uid&&e.owner===owner).length>=config.economy.equipmentSlots)throw Error('该单位装备已满');item.owner=owner;});}
 /** 出售不能清空军队，返价由商店策略计算，穿戴装备回到本局背包。 */
 sell(kind,uid){return this.model.transact(()=>{const r=this.active(kind),unit=r.units.find(u=>u.uid===uid);if(!unit||r.units.length<=1)throw Error('至少保留一名单位');r.units=r.units.filter(u=>u.uid!==uid);r.equipment.forEach(e=>{if(e.owner===uid)e.owner=null;});r.gold+=Math.floor(config.economy.heroPrices[this.pool(r).find(h=>h.id===unit.heroId).tier]/2);});}
 /** 敌阵遵守本地难度配置；原服配对/阵容生成算法没有冒充恢复。 */
 enemies(run){const c=config.enemies,count=Math.min(c.maxCount,c.initialCount+Math.floor((run.round-1)/c.everyRounds)),star=Math.min(c.maxStar,1+Math.floor((run.round-1)/c.starEveryRounds)),pool=this.pool(run);return Array.from({length:count},(_,i)=>{const h=this.sample(run,pool);return {uid:-i-1,heroId:h.id,star:this.grade(h,star),slot:i};});}
 /** 保存完整战报后才能进入回放；失败回滚不会消耗主公奖励或随机数。 */
 fight(kind,token){return this.model.transact(()=>{const r=this.active(kind,undefined,token),type=kind==='arena'?'battle':r.route[r.node];if(!['battle','elite','boss'].includes(type)||!r.units.length)throw Error('请先选择战斗节点并上阵');
  const pool=this.pool(r);if(r.lord==='1005'&&r.units.length<r.capacity){const h=this.sample(r,pool);this.addHero(r,h.id,this.sample(r,[1,2]));}
  if(r.lord==='1003'&&type==='boss')this.addEquipment(r,this.sample(r,require('./equipment-pool-config').blue));
  if(r.lord==='1004'&&random(r.seed++)()<config.lords.stealChance)this.addEquipment(r,this.sample(r,require('./equipment-pool-config').blue));
  const enemies=this.enemies(r),local=config.enemies,scale=Math.min(local.maxScale,local.baseScale+(r.round-1)*local.growth),battle=this.simulate(r.units,enemies,this.model.roster,{...this.model.rules,playerTalent:{},playerTalentTree:{},playerEquipmentGrades:{},playerVip:null,playerBonds:require('./bond-activation').state(this.model)},r.seed++,scale,r.equipment);
  if(!['win','loss','draw'].includes(battle?.result))throw Error('战报无效');r.pending={id:r.id,round:r.round,battle,type};r.phase='result';return copy(battle);
 });}
 /** 战果消费与资源保存同一事务；重复领取返回false，旧局号拒绝。 */
  claim(kind,token){if(this.state?.[kind]?.run?.phase!=='result')return false;return this.model.transact(()=>{const r=this.active(kind,['result'],token),p=r.pending,win=p.battle.result==='win';if(p.id!==r.id||p.round!==r.round)throw Error('战报已过期');if(win||kind==='arena')r.gold+=config[kind].roundGold+(win&&kind==='arena'?config.arena.winGold:0);if(win){r.wins++;if(kind==='dungeon')this.experience(r,config.dungeon.roundGold);}else{r.losses++;r.hp=Math.max(0,r.hp-1);}if(!r.hp||kind==='arena'&&(r.wins>=config.arena.maxWins||r.losses>=config.arena.maxLosses)){this.complete(r);return true;}
  if(win){if(kind==='dungeon'&&p.type==='boss'){const row=rules.dungeon(r.dungeon);if(row.buff===9){r.pending={...p,heroGrade:4};}else this.addEquipment(r,this.sample(r,require('./equipment-pool-config')[row.buff===8?'blue':'purple']));r.gold+=config.dungeon.bossGold;}
   this.rollChoices(r);r.phase='reward';
  }else{r.pending=null;r.phase='prepare';if(kind==='arena'){r.round++;this.rollOffers(r);}}
  return true;
 });}
 /** 推进仅应用一次；副本九节通关后进入可恢复的总奖励页。 */
 advance(r){r.round++;if(r.kind==='arena'){this.rollOffers(r);return;}r.node++;if(r.node>=r.route.length){r.section++;if(r.section>config.dungeon.sections){this.complete(r);return;}this.beginSection(r);}if(r.route[r.node]==='merchant'){if(r.lord==='1003')this.addEquipment(r,this.sample(r,require('./equipment-pool-config').blue));this.rollOffers(r);}}
 /** 非战斗节点的金币、治疗、装备和离店与路线推进原子提交。 */
 event(kind,token){return this.model.transact(()=>{const r=this.active(kind,undefined,token);if(kind!=='dungeon')throw Error('当前没有地图事件');const type=r.route[r.node];if(type==='treasure'){r.gold+=config.economy.treasureGold;this.addEquipment(r,this.sample(r,require('./equipment-pool-config').blue));}else if(type==='spring'){r.hp=Math.min(r.maxHp,r.hp+1);if(r.lord==='1006'){const u=this.sample(r,r.units),hero=this.pool(r).find(h=>h.id===u.heroId);u.star=this.grade(hero,Math.min(config.economy.maxStar,u.star+1));}}else if(type!=='merchant')throw Error('当前为战斗节点');this.advance(r);});}
 /** 结算页保存确定奖励，尚未领取时不增加副本完成数或永久货币。 */
 complete(r){const success=r.kind==='arena'?r.wins>=config.arena.maxWins:r.section>config.dungeon.sections;r.phase='finished';r.pending=null;r.choices=[];const first=r.kind==='dungeon'&&r.dungeon>this.state.dungeon.cleared,multiplier=first?config.dungeon.firstCompletionMultiplier:1;r.completion={success,items:r.kind==='arena'?{'7':r.wins*config.arena.secretPerWin+config.arena.secretPerRun}:success?{'1':config.dungeon.completionDiamonds*multiplier}: {},first};if(r.kind==='dungeon'&&success){const id=this.sample(r,require('./equipment-pool-config').blue);r.completion.items[id]=config.dungeon.completionFragments*multiplier;}}
 /** 明确放弃独立棋局；远征生命和待领战果不变，不发放放弃奖励。 */
 abandon(kind,token){return this.model.transact(()=>{const r=this.active(kind,['prepare','draft','reward','result'],token);r.hp=0;this.complete(r);r.completion.items={};r.completion.success=false;r.abandoned=true;});}
 /** 总奖励与最高副本进度同时落盘；双击、重载和写盘失败均不会重复发奖。 */
 claimCompletion(kind,token){return this.model.transact(()=>{const r=this.active(kind,['finished'],token);if(r.claimed)return false;for(const [id,count]of Object.entries(r.completion.items))this.model.progression.add(id,count,false);const s=this.state[kind];s.played++;if(kind==='arena'){s.bestWins=Math.max(s.bestWins,r.wins);s.stars+=r.wins*config.arena.starsPerWin;}else if(r.completion.success){s.cleared=Math.max(s.cleared,r.dungeon);this.model.state.meta.heroDungeonCleared=Math.max(this.model.state.meta.heroDungeonCleared||0,s.cleared);}r.claimed=true;return true;});}
}
module.exports={SoloChallenge};
