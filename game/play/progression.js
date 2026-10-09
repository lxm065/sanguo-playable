'use strict';
const graph=require('./route-graph'),routeConfig=require('./route-config'),sectionPolicy=require('./section-policy');
/** 章节、局外物品与主公选择共享战役事务，避免两个存档发生奖励分叉。 */
class Progression{
 /** 从配置建立独立版本进度，不挪用上一版测试军资或张飞解锁状态。 */
 constructor(model,config,clock=()=>Date.now()){this.model=model;this.config=config;this.clock=clock;if(!model.state.meta)model.transact(()=>{model.state.meta={novicePermanentClaims:[],mapVersion:routeConfig.version,lord:config.defaultLord,hp:3,chapter:1,section:1,layer:0,lane:1,cleared:0,signs:0,lastSign:'',activeNode:null,unlocked:[...config.profile.unlockedUnits],diamonds:config.profile.diamonds,inventory:{...config.profile.inventory},claimed:[],bought:[],refreshes:config.shop.dailyAdRefreshes,shopDay:this.day(),mineLevel:0};});if(!this.state.routeLayout)model.transact(()=>require('./route-variants').initialize(this.state));if(this.state.mapVersion!==routeConfig.version)model.transact(()=>{graph.migrate(this.state,config);});if(this.state.section===1&&this.state.layer===0&&!this.state.activeNode&&!this.state.sectionReward&&!this.state.runReward&&!model.state.pending&&model.state.wins===0&&model.state.expedition?.level===1&&sectionPolicy.sections.some(s=>s.chapter===this.state.chapter&&s.unlock&&this.state.unlocked.includes(s.unlock)))model.transact(()=>sectionPolicy.resetRun(this.state));if(this.state.routeEvents?.key!==this.state.chapter+'-'+this.state.section)model.transact(()=>require("./route-events").initialize(model));const missing=sectionPolicy.earned(this.state).filter(id=>!this.state.unlocked.includes(id));if(missing.length)model.transact(()=>{this.state.unlocked.push(...missing);});}
 /** 小节BOSS、名称和解锁目标由同一份规则提供。 */
 section(){return sectionPolicy.current(this.state,this.config);}
 /** 按本地日期生成日重置键，时钟可以注入测试。 */
 day(){const d=new Date(this.clock());return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');}
 /** 实时读取事务替换后的状态，禁止保存失效引用。 */
 get state(){return this.model.state.meta;}
 /** 从保留原 ID 的配置获取主公。 */
 lord(id=this.state.lord){return this.config.lords.find(x=>x.id===id);}
 /** 解锁条件直接使用原始章节和签到次数，不受战斗胜场混淆。 */
 unlocked(id){const l=this.lord(id);return !!l&&this.state.cleared>=l.chapter&&this.state.signs>=l.sign;}
 /** 只有远征未开始时允许更换主公，防止中途重置生命金币。 */
 select(id){return this.model.transact(()=>{if(!this.unlocked(id))throw Error('尚未满足解锁条件');if(this.state.layer||this.state.section>1||this.model.state.pending||this.state.sectionReward||this.state.runReward)throw Error('本次远征中不能切换主公');const l=this.lord(id);this.state.lord=id;this.state.hp=l.hp;this.model.state.gold=l.coin;const limit=this.model.limit();this.model.state.units.filter(u=>u.slot>=0).slice(limit).forEach(u=>{u.slot=-1;});});}
 /** 每个自然日只能签到一次；第9签和第18签分别解锁对应主公。 */
 sign(){return require('./sign-rewards').claim(this);}
 /** 生成配置化分叉节点；远端原服随机路线未在离线客户端恢复。 */
 nodes(){return graph.nodes(this.state,this.config); }
 /** 当前层仅接受相邻路径节点，旧节点和越层节点不可重复结算。 */
 accessible(node){const s=this.state;if(node.row!==s.layer||s.hp<=0)return false;if(s.activeNode)return node.id===s.activeNode;if(s.mapVersion!==routeConfig.version)return true;const last=s.route?.key===s.chapter+'-'+s.section?s.route.nodes.slice(-1)[0]:null;const lane=last&&Number(last.split('-')[0])===s.layer-1?Number(last.split('-')[1]):s.lane;return node.row===0||graph.connected({row:s.layer-1,lane},node,s);}
 /** 地图事件入口；战斗节点只准备阵容，胜利结算才推进路线。 */
 enter(id){return this.model.transact(()=>{this.model.editable();if(this.state.sectionReward||this.state.runReward)throw Error('请先领取通关奖励或远征结算奖励');const node=this.nodes().find(n=>n.id===id);if(!node||!this.accessible(node))throw Error('请从箭头所示节点前进');this.state.activeNode=node.id;this.state.lane=node.lane;if(this.model.nodeEvents&&require('./node-event-config').types.includes(node.type)){this.model.nodeEvents.enter(node);return node.type;}this.state.nodeEvent=null;require("./talent-economy").enter(this.model,node);if(node.type==='merchant'){if(this.state.merchant?.node!==node.id)this.state.merchant={node:node.id,bought:[]};}if(node.type==='spring'){this.state.hp=Math.min(this.lord().hp,this.state.hp+1);this.advance(node);}else if(node.type==='treasure'){this.model.state.gold+=this.model.rules.winGold;this.advance(node);}require('./lord-preparation').prepare(this.model);return node.type;});}
 /** 成功通过 BOSS 即解锁张飞，后续选将、合成和招募池同时生效。 */
 advance(node){require('./route-resources').initialize(this.model);require('./route-resources').record(this.model,node);const s=this.state;const key=s.chapter+'-'+s.section;if(s.route?.key!==key)s.route={key,nodes:[]};if(!s.route.nodes.includes(node.id))s.route.nodes.push(node.id);if(node.type==='boss'){s.sectionReward={key,items:s.section===this.config.chapter.sections.length?require('./sweep').chapterReward(s.chapter):{...(require('./journey-config').sectionRewards[key]||require('./journey-config').sectionReward)},unlock:this.section().unlock,newUnlock:!!this.section().unlock&&!s.unlocked.includes(this.section().unlock),resetChapter:s.section===this.config.chapter.sections.length};require('./section-loot').prepare(this.model,s.sectionReward);const hero=this.section().unlock;if(hero&&!s.unlocked.includes(hero))s.unlocked.push(hero);if(s.section===this.config.chapter.sections.length){s.cleared=Math.max(s.cleared,s.chapter);s.chapter++;s.section=1;}else s.section++;s.layer=0;s.lane=1;s.route=null;s.mapVersion=routeConfig.version;s.merchant=null;}else s.layer++;s.activeNode=null;if(node.type==='boss')require("./route-events").initialize(this.model);}
 /** 将已保存战果应用到章节状态；调用方必须置于同一领取事务内。 */
 settle(pending){if(pending.training)return;const node=this.nodes().find(n=>n.id===this.state.activeNode);if(!node)return;if(pending.battle.result==='win')this.advance(node);else{this.state.hp=Math.max(0,this.state.hp-1);this.state.activeNode=null;}}
 /** 通关奖励普通与双倍互斥；领取后才开始下一章的新一局。 */
 claimSection(key,ticket=null){return this.model.transact(()=>{this.model.editable();const reward=this.state.sectionReward;if(!reward||reward.key!==key)throw Error('通关奖励已领取或已变化');if(ticket)this.model.consumeAd(ticket);else this.model.state.expedition.adSerial++;for(const [id,count]of Object.entries(require('./sweep').withoutBonus(reward.items)))this.add(id,count*(ticket?2:1));this.state.sectionReward=null;if(reward.resetChapter){this.state.lastClearReward={chapter:Number(reward.key.split('-')[0]),items:{...reward.items}};const meta=this.state,fresh=this.model.create();meta.hp=this.lord().hp;meta.nodeEvent=null;fresh.meta=meta;fresh.seed=this.model.state.seed;fresh.gold=this.lord().coin;this.model.state=fresh;this.model.roll();}require('./section-loot').grant(this.model,reward,ticket?2:1);return true;});}
 /** 商人购买仅扣本局金币；重复购买或过期节点不能再次发货。 */
 buyMerchant(index){return this.model.transact(()=>{this.model.editable();const s=this.state,offer=routeConfig.merchant.offers[index],node=this.nodes().find(n=>n.id===s.activeNode);if(node?.type!=='merchant'||!offer||s.merchant?.node!==node.id)throw Error('当前不在商人处');if(s.merchant.bought.includes(index))throw Error('商品已购买');if(this.model.state.gold<offer.price)throw Error('金币不足');if(!this.model.addEquipment)throw Error('装备系统不可用');this.model.state.gold-=offer.price;this.model.addEquipment(offer.id);s.merchant.bought.push(index);});}
 /** 离开商人完成当前事件，保持金币和装备在同一事务。 */
 leaveMerchant(){return this.model.transact(()=>{this.model.editable();if(this.state.sectionReward||this.state.runReward)throw Error('请先领取通关奖励或远征结算奖励');const node=this.nodes().find(n=>n.id===this.state.activeNode);if(node?.type!=='merchant')throw Error('当前不在商人处');this.advance(node);this.state.merchant=null;});}
 /** 通章奖励保持截图中的2000钻石、100药剂、10幸运币，只发一次。 */
 claimChapter(chapter){return this.model.transact(()=>{const s=this.state;if(s.cleared<chapter)throw Error('请先通关本章');if(s.claimed.includes(chapter))throw Error('本章礼包已领取');for(const [id,count] of Object.entries(this.config.chapterReward))this.add(id,count);s.claimed.push(chapter);});}
 /** 物品以原始 ID 入库，仅外观映射改变名称。 */
 add(id,count,vipBonus=true){const amount=id==='1'&&vipBonus?require('./vip').diamonds(this.model,count):count;if(id==='1')this.state.diamonds+=amount;else this.state.inventory[id]=(this.state.inventory[id]||0)+amount;return amount;}
 /** 日期变化只重置黑市次数与购买标志，不创建货币奖励。 */
 resetShop(){if(this.state.shopDay!==this.day())this.model.transact(()=>{this.state.shopDay=this.day();this.state.bought=[];this.state.refreshes=this.config.shop.dailyAdRefreshes;});}
 /** 广告完成凭据只由适配器回调提供；取消、失败不能购买或刷新。 */
 buy(index,adCompleted=false){this.resetShop();return this.model.transact(()=>{const offer=this.config.shop.offers[index],s=this.state;if(!offer||s.bought.includes(index))throw Error('商品已售罄');if(offer.price===0&&!adCompleted)throw Error('完整观看广告后才能领取');if(s.diamonds<offer.price)throw Error('钻石不足');s.diamonds-=offer.price;this.add(offer.item,offer.count);s.bought.push(index);});}
 /** 离线版复用已实测三件商品，不杜撰原服未取得的随机商品池。 */
 refresh(adCompleted){this.resetShop();return this.model.transact(()=>{if(!adCompleted)throw Error('广告未完成');if(this.state.refreshes<=0)throw Error('今日刷新次数已用完');this.state.refreshes--;this.state.bought=[];});}
 /** 保存退出只提交当前快照，保留阵容、当前节点和未领取战果。 */
 saveExit(){return this.model.transact(()=>true);}
 /** 玩家主动投降放弃本局战果，重开当前章，局外成长与仓库保持不变。 */
 surrender(){return require('./run-settlement').surrender(this);}
 /** 生命耗尽后重新开始当前章，保留局外解锁、物品与已领取礼包。 */
 restart(){return this.model.transact(()=>{this.model.editable();const meta=this.state;if(meta.runReward)throw Error('请先领取结算奖励');if(meta.hp>0)throw Error('当前远征尚未结束');const fresh=this.model.create();meta.hp=this.lord().hp;meta.section=1;meta.layer=0;meta.lane=1;meta.activeNode=null;meta.route=null;meta.mapVersion=routeConfig.version;meta.merchant=null;meta.nodeEvent=null;sectionPolicy.resetRun(meta);fresh.meta=meta;fresh.gold=this.lord().coin;fresh.shop=this.model.availableRoster().slice(0,this.model.rules.shopSize).map(h=>h.id);this.model.state=fresh;require("./route-events").initialize(this.model,true);});}
}
module.exports={Progression};
