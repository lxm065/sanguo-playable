'use strict';
const policy=require('./challenge-config'),{random}=require('./combat');
/** 生成可序列化副本，事务外不暴露待结算战报的可写引用。 */
function copy(value){return JSON.parse(JSON.stringify(value));}
/** 挑战规则服务：复用宿主存储事务，所有局内数据仅保存在 meta.challenge。 */
class Challenge {
  /** 注入时钟与战斗端口；禁止复用远征带天赋、VIP和装备的模拟器闭包。 */
  constructor(model,config=policy,clock=()=>Date.now(),simulate=require('./expedition-combat').simulate){Object.assign(this,{model,config,clock,simulate});this.battleRoster=require("./challenge-roster").create(model.roster,config);}
  /** 每次重新读取状态，以兼容宿主事务失败后替换整个快照。 */
  get state(){return this.model.state.meta.challenge;}
  /** 已通第一章的历史记录也能开放入口，重开远征不会重新锁定。 */
  unlocked(){const m=this.model.state.meta;return Math.max(m.chapter||1,(m.cleared||0)+1)>=this.config.unlockChapter;}
  /** 挑战选棋共享图鉴解锁条件，并剔除历史兼容人物。 */
  available(){const book=new (require('./handbook').Handbook)();return this.model.roster.filter(h=>!h.legacy&&!book.status(h,this.model.state.meta,this.model.roster).locked);}
  /** 创建已解锁英雄组成的初始棋组，收录不会赠送远征棋子。 */
  defaultDeck(){return this.available().slice(0,this.config.deckSize).map(h=>h.id);}
  /** 兼容旧存档，首次打开后才增加挑战状态。 */
  initialize(){if(!this.unlocked())throw Error('第'+this.config.unlockChapter+'章开放挑战');if(!this.state)this.model.transact(()=>{this.model.state.meta.challenge={version:this.config.version,decks:Array.from({length:this.config.deckCount},()=>this.defaultDeck()),activeDeck:0,rating:0,matches:0,run:null};});if(this.state.version===this.config.legacyVersion)this.model.transact(()=>{this.state.legacyRun=this.state.run;this.state.run=null;this.state.version=this.config.version;});return this;}
  /** 只校验棋组人数、互异身份及解锁状态，不限制档位。 */
  validDeck(deck){const ids=new Set(this.available().map(h=>h.id));return Array.isArray(deck)&&new Set(deck).size===deck.length&&deck.every(id=>ids.has(id))&&deck.length===this.config.deckSize;}
  /** 棋组在开局后锁定，避免对局中改变招募池。 */
  saveDeck(index,deck){this.initialize();return this.model.transact(()=>{if(this.state.run&&this.state.run.phase!=='finished')throw Error('请先完成当前棋局');if(!Number.isInteger(index)||index<0||index>=this.config.deckCount||!this.validDeck(deck))throw Error('需选满'+this.config.deckSize+'枚已解锁且不同的棋子');this.state.decks[index]=[...deck];this.state.activeDeck=index;});}
  /** 固定种子从本局棋组生成三选一，不消费远征随机序列。 */
  roll(run,player){const rng=random(run.seed++),pool=run.deck;player.choices=Array.from({length:this.config.choiceCount},()=>pool[Math.floor(rng()*pool.length)]);}
  /** 独立开局，已有未结束对局直接恢复，不重复发开局金币。 */
  start(){this.initialize();if(this.state.run&&this.state.run.phase!=='finished')return this.state.run;return this.model.transact(()=>{const c=this.config,deck=this.state.decks[this.state.activeDeck];if(!this.validDeck(deck))throw Error('请先完成选棋');const run={id:this.state.matches+1,seed:c.seed+this.state.matches,deck:[...deck],round:1,phase:'preparation',deadline:this.clock()+c.preparationSeconds*1000,readyAt:null,nextUid:1,players:[],pending:null,ranking:null};for(let i=0;i<c.playerCount;i++){const p={id:i,name:c.names[i],hp:c.initialHp,gold:c.initialGold,population:c.initialPopulation,experience:0,refreshes:0,units:[],choices:[],equipment:[],eliminatedRound:null};this.roll(run,p);run.players.push(p);}this.state.run=run;return copy(run);});}
  /** 编辑只能发生在准备阶段，准备按钮和超时共同锁定操作。 */
  editable(){const r=this.state?.run;if(!r||r.phase!=='preparation')throw Error('请先取消准备或完成本回合结算');if(this.clock()>=r.deadline)throw Error('准备时间已到');return r;}
  /** 在当前快照查找棋子，不允许操作其他玩家的 UID。 */
  unit(player,uid){const unit=player.units.find(u=>u.uid===uid);if(!unit)throw Error('请先选择棋子');return unit;}
  /** 三选一免费获得一枚，整批同时消失，再生成需要刷新。 */
  choose(index){return this.model.transact(()=>{const r=this.editable(),p=r.players[0];if(!this.canPick(p,p.choices[index]))return false;this.pick(r,p,index);return true;});}
  /** 返回当前刷新价格，递增策略与显示共用一个配置查询。 */
  refreshCost(p=this.state.run.players[0]){const costs=this.config.refreshCosts;return costs[Math.min(p.refreshes,costs.length-1)];}
  /** 每次升人口直接增加一格容量，不再购买经验。 */
  populationCost(p=this.state.run.players[0]){return this.config.populationCosts[p.population-1]??null;}
  /** 满员仍可选择已在场且未满级的同名棋子进行自动升级。 */
  canPick(p,id){if(!p.choices.includes(id))return false;const unit=p.units.find(u=>u.heroId===id);return unit?unit.star<this.config.maxStar:p.units.length<p.population;}
  /** 自动上阵与拖动提示共用射程偏好，按配置优先级排除其他棋子占位。 */
  recommendedSlots(player,heroId,uid=null){const hero=this.model.roster.find(h=>h.id===heroId);if(!hero)return [];return this.config.deployment[hero.range>1?'ranged':'melee'].filter(slot=>!player.units.some(unit=>unit.uid!==uid&&unit.slot===slot));}
  /** 招募直接进入适合射程的空格；重复棋子升级原单位并保留UID、站位和装备。 */
  pick(run,p,index){
    if(!Number.isInteger(index)||!p.choices[index])throw Error('请先换一批棋子');
    const id=p.choices[index],existing=p.units.find(u=>u.heroId===id);
    if(existing){if(existing.star>=this.config.maxStar)throw Error('该棋子已达最高等级');existing.star++;p.choices=[];return existing.uid;}
    if(p.units.length>=p.population)throw Error('人口已满，请先升人口，或选择带↑的同名棋子升级');
    const slot=this.recommendedSlots(p,id)[0];if(slot===undefined)throw Error('棋盘已满');
    const unit={uid:run.nextUid++,heroId:id,star:this.config.initialLevel,slot};p.units.push(unit);p.choices=[];return unit.uid;
  }
  /** 刷新和递增费用原子保存；余额不足不会改变原候选。 */
  refresh(){return this.model.transact(()=>{const r=this.editable(),p=r.players[0],cost=this.refreshCost(p);if(p.gold<cost)throw Error('金币不足');p.gold-=cost;p.refreshes++;this.roll(r,p);});}
  /** 升人口立即增加一位，无额外经验条和备战栏。 */
  upgradePlayer(p){if(p.population>=this.config.maxPopulation)throw Error('已升至最大人口');const cost=this.populationCost(p);if(p.gold<cost)throw Error('金币不足');p.gold-=cost;p.population++;}
  /** 玩家与电脑共用人口购买原语。 */
  upgrade(){return this.model.transact(()=>this.upgradePlayer(this.editable().players[0]));}
  /** 仅允许棋盘内移位或换位，不能拖入备战席或通过接口下阵。 */
  deploy(uid,slot){return this.model.transact(()=>{const r=this.editable(),p=r.players[0],u=this.unit(p,uid),rules=this.model.rules;if(!Number.isInteger(slot)||slot<0||slot>=rules.rows*rules.columns)throw Error('只能在己方棋盘调整站位');const other=p.units.find(v=>v!==u&&v.slot===slot);if(other)other.slot=u.slot;u.slot=slot;});}
  /** 装备仅能穿给本局我方棋子，单人携带数量受配置限制。 */
  equip(equipmentUid,owner){return this.model.transact(()=>{const p=this.editable().players[0],e=p.equipment.find(e=>e.uid===equipmentUid);if(!e)throw Error('装备不存在');if(owner!==null){this.unit(p,owner);if(p.equipment.filter(v=>v!==e&&v.owner===owner).length>=this.config.equipmentLimit)throw Error('该棋子装备已满');}e.owner=owner;});}
  /** 短暂准备阶段允许取消；过时的准备不能撤销已经保存的战果。 */
  ready(){return this.model.transact(()=>{const r=this.editable();if(!r.players[0].units.some(u=>u.slot>=0))throw Error('请至少上阵一枚棋子');r.phase='ready';r.readyAt=this.clock()+this.config.readyDelayMs;});}
  /** 取消准备保留原倒计时，无法借反复点击延长回合。 */
  cancelReady(){return this.model.transact(()=>{const r=this.state.run;if(r.phase!=='ready'||this.clock()>=r.readyAt||this.clock()>=r.deadline)throw Error('本回合已经开始');r.phase='preparation';r.readyAt=null;});}
  /** 电脑也直接上阵或同名升级，遵守相同人口和经济规则。 */
  prepareAI(run,p){
    for(let i=0;i<this.config.aiPurchases;i++){
      let candidates=p.choices.map((id,index)=>({id,index})).filter(x=>this.canPick(p,x.id));
      if(!candidates.length&&p.population<this.config.maxPopulation&&p.gold>=this.populationCost(p)){this.upgradePlayer(p);candidates=p.choices.map((id,index)=>({id,index})).filter(x=>this.canPick(p,x.id));}
      if(candidates.length){const item=candidates[Math.floor(random(run.seed++)()*candidates.length)];this.pick(run,p,item.index);}
      const cost=this.refreshCost(p);if(i===this.config.aiPurchases-1||p.gold<cost)break;p.gold-=cost;p.refreshes++;this.roll(run,p);
    }
    p.equipment.forEach((e,i)=>{e.owner=p.units[Math.floor(i/this.config.equipmentLimit)]?.uid??null;});
  }
  /** 回合轮换配对，奇数存活时末位对阵镜像，镜像不重复扣真实玩家生命。 */
  pairs(run){const alive=run.players.filter(p=>p.hp>0);if(alive.length<=1)return [];if(alive.length===this.config.playerCount){const rounds=this.config.pairingRounds;return rounds[(run.round-1)%rounds.length].map(([a,b])=>({a,b,ghost:false}));}const offset=(run.round-1)%alive.length,rotated=alive.slice(offset).concat(alive.slice(0,offset)),pairs=[];for(let i=0;i<rotated.length;i+=2)pairs.push({a:rotated[i].id,b:(rotated[i+1]||rotated[0]).id,ghost:!rotated[i+1]});return pairs;}
  /** 时钟只触发一次保存战果；离线恢复不会跳过多个回合或重复扣心。 */
  tick(){const r=this.state?.run;if(!r)return false;if((r.phase==='preparation'&&this.clock()>=r.deadline)||(r.phase==='ready'&&(this.clock()>=r.readyAt||this.clock()>=r.deadline))){this.resolve();return true;}return false;}
  /** 保存所有配对结果后播放动画，战报持久化成功才允许结算。 */
  resolve(){return this.model.transact(()=>{const r=this.state.run;if(!['preparation','ready'].includes(r.phase))return false;const p=r.players[0];if(p.hp>0){if(!p.units.length){if(!p.choices.length)this.roll(r,p);this.pick(r,p,0);}if(!p.units.some(u=>u.slot>=0))p.units[0].slot=0;}r.players.filter(p=>p.id&&p.hp>0).forEach(p=>this.prepareAI(r,p));const reports=this.pairs(r).map(pair=>{let {a,b}=pair;if(b===0&&!pair.ghost)[a,b]=[b,a];const left=r.players[a],right=r.players[b],allies=left.units.filter(u=>u.slot>=0),enemies=right.units.filter(u=>u.slot>=0).map(u=>({...u,uid:-u.uid,equipment:right.equipment.filter(e=>e.owner===u.uid).map(e=>({...e,owner:-u.uid}))}));const battle=this.simulate(allies,enemies,this.battleRoster,{...this.model.rules,playerTalent:{},playerTalentTree:{},playerEquipmentGrades:{},playerVip:null},r.seed++,1,left.equipment);return {a,b,ghost:pair.ghost,battle};});const rewards=r.round%this.config.equipmentEvery===0?r.players.filter(p=>p.hp>0).map(p=>({player:p.id,id:this.config.equipmentPool[Math.floor(random(r.seed++)()*this.config.equipmentPool.length)]})):[];r.pending={round:r.round,reports,rewards};r.phase='result';r.readyAt=null;return true;});}
  /** 积分与名次只在终局事务内写一次，不发放远征货币。 */
  finishRun(run){const ranking=[...run.players].sort((a,b)=>b.hp-a.hp||(b.eliminatedRound||run.round)-(a.eliminatedRound||run.round)||b.units.reduce((n,u)=>n+u.star,0)-a.units.reduce((n,u)=>n+u.star,0)||a.id-b.id).map(p=>p.id),place=ranking.indexOf(0)+1,points=this.config.pointsByPlace[place-1],rating=Math.max(0,this.state.rating+points);run.ranking=ranking;run.place=place;run.points=rating-this.state.rating;run.phase='finished';run.pending=null;this.state.rating=rating;this.state.matches++;}
  /** 只在失败时扣一条生命；平局规则独立配置。 */
  lifeDamage(result){return result==='loss'?this.config.lossDamage:result==='draw'?this.config.drawDamage:0;}
  /** 消费本轮战果与装备，各真实参赛者只领取一次，终局同样领取。 */
  applyReports(r){const c=this.config,participants=new Set();for(const report of r.pending.reports){const {a,b,ghost,battle}=report;for(const [id,result]of [[a,battle.result],...(!ghost?[[b,({win:'loss',loss:'win',draw:'draw'})[battle.result]]]:[])]){const p=r.players[id];participants.add(id);p.hp=Math.max(0,p.hp-this.lifeDamage(result));if(!p.hp)p.eliminatedRound=r.round;if(result==='win')p.gold+=c.winGold;}}for(const id of participants)r.players[id].gold+=c.roundGold;if(r.round%c.equipmentEvery===0)for(const id of participants){const p=r.players[id],reward=r.pending.rewards?.find(v=>v.player===id);const item={uid:r.nextUid++,id:reward?.id||c.equipmentPool[Math.floor(random(r.seed++)()*c.equipmentPool.length)],owner:null};p.equipment.push(item);if(id===0)r.rewardNotice={uid:item.uid,id:item.id,round:r.round};}}
  /** 收下仅关闭已发放装备的通知，重载或重复点击不会再次发奖。 */
  dismissReward(){if(!this.state?.run?.rewardNotice)return false;return this.model.transact(()=>{this.state.run.rewardNotice=null;return true;});}
  /** 结算后重新开始完整30秒准备时间，奖励已在本轮事务发放。 */
  nextRound(r){const c=this.config;r.round++;r.phase='preparation';r.pending=null;r.deadline=this.clock()+c.preparationSeconds*1000;}
  /** 玩家淘汰后真实模拟剩余电脑轮战，最终排行不使用尚未结束的临时名次。 */
  finishComputers(r){while(r.players.filter(p=>p.hp>0).length>1&&r.round<this.config.maxRounds){this.nextRound(r);this.resolve();this.applyReports(r);}this.finishRun(r);}
  /** 一次性应用已保存战果，最大回合数限制保证平局也能结束。 */
  claim(){if(this.state?.run?.phase!=='result')return false;return this.model.transact(()=>{const r=this.state.run;this.applyReports(r);if(!r.players[0].hp){this.finishComputers(r);return true;}if(r.players.filter(p=>p.hp>0).length<=1||r.round>=this.config.maxRounds){this.finishRun(r);return true;}this.nextRound(r);return true;});}
  /** 主动退出只结算挑战名次；未结束棋局不能通过重开规避扣分。 */
  abandon(){if(!this.state?.run||this.state.run.phase==='finished')return false;return this.model.transact(()=>{if(this.state.run.phase==='result')this.claim();if(this.state.run.phase==='finished')return true;const r=this.state.run;r.players[0].hp=0;r.players[0].eliminatedRound=r.round;this.finishComputers(r);return true;});}
  /** 段位是本地积分查询，不冒充原服匹配分。 */
  rank(){return this.config.ranks[Math.min(this.config.ranks.length-1,Math.floor((this.state?.rating||0)/this.config.pointsPerRank))];}
}
/** 挑战存档验证允许旧档缺省，拒绝非法人口、经济、格子和悬挂装备。 */
function valid(state,roster,rules,c=policy){
  if(state===undefined)return true;
  const int=(n,min=0)=>Number.isInteger(n)&&n>=min,hero=id=>roster.find(h=>h.id===id&&!h.legacy);
  if(!state||![c.legacyVersion,c.version].includes(state.version)||!int(state.rating)||!int(state.matches)||!int(state.activeDeck)||state.activeDeck>=c.deckCount||!Array.isArray(state.decks)||state.decks.length!==c.deckCount||!state.decks.every(d=>Array.isArray(d)&&new Set(d).size===d.length&&d.every(hero)&&d.length===c.deckSize))return false;
  const r=state.run;if(r===null)return true;if(!r||!int(r.id,1)||!int(r.seed)||!int(r.round,1)||r.round>c.maxRounds||!int(r.nextUid,1)||!Number.isFinite(r.deadline)||!['preparation','ready','result','finished'].includes(r.phase)||!Array.isArray(r.players)||r.players.length!==c.playerCount||!Array.isArray(r.deck)||!r.deck.every(hero))return false;
  const legacy=state.version===c.legacyVersion;const uids=[];for(let i=0;i<r.players.length;i++){const p=r.players[i];if(p.id!==i||!int(p.hp)||p.hp>c.initialHp||!int(p.gold)||!int(p.population,1)||p.population>c.maxPopulation||!int(p.experience)||(legacy?p.experience>=(c.legacy.populationExperience[p.population-1]??1):p.experience!==0||!int(p.refreshes))||!Array.isArray(p.units)||!Array.isArray(p.choices)||![0,c.choiceCount].includes(p.choices.length)||!p.choices.every(id=>r.deck.includes(id))||!Array.isArray(p.equipment))return false;const deployed=p.units.filter(u=>u.slot>=0);if(deployed.length>p.population||new Set(deployed.map(u=>u.slot)).size!==deployed.length||(legacy?p.units.length-deployed.length>c.legacy.reserveCapacity:deployed.length!==p.units.length||new Set(p.units.map(u=>u.heroId)).size!==p.units.length))return false;for(const u of p.units){if(!int(u.uid,1)||u.uid>=r.nextUid||!hero(u.heroId)||!int(u.star,legacy?hero(u.heroId).tier:c.initialLevel)||u.star>c.maxStar||!int(u.slot,-1)||u.slot>=rules.rows*rules.columns)return false;uids.push(u.uid);}for(const e of p.equipment){if(!int(e.uid,1)||e.uid>=r.nextUid||!c.equipmentPool.includes(e.id)||(e.owner!==null&&!p.units.some(u=>u.uid===e.owner)))return false;uids.push(e.uid);}if(p.units.some(u=>p.equipment.filter(e=>e.owner===u.uid).length>c.equipmentLimit))return false;}
  if(new Set(uids).size!==uids.length)return false;
  if(r.phase==='ready'&&!Number.isFinite(r.readyAt))return false;
  if(r.phase==='result'&&(!r.pending||r.pending.round!==r.round||!Array.isArray(r.pending.reports)||!r.pending.reports.length||!r.pending.reports.every(p=>int(p.a)&&p.a<c.playerCount&&int(p.b)&&p.b<c.playerCount&&['win','loss','draw'].includes(p.battle?.result))))return false;
  if(r.phase!=='result'&&r.pending!==null)return false;
  return r.phase!=='finished'||(Array.isArray(r.ranking)&&r.ranking.length===c.playerCount&&new Set(r.ranking).size===c.playerCount&&r.ranking.every(id=>int(id)&&id<c.playerCount)&&int(r.place,1)&&r.place<=c.playerCount&&Number.isInteger(r.points));
}
module.exports={Challenge,valid};
