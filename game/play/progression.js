'use strict';
/** 章节、局外物品与主公选择共享战役事务，避免两个存档发生奖励分叉。 */
class Progression{
 /** 从配置建立独立版本进度，不挪用上一版测试军资或张飞解锁状态。 */
 constructor(model,config,clock=()=>Date.now()){this.model=model;this.config=config;this.clock=clock;if(!model.state.meta)model.transact(()=>{model.state.meta={lord:config.defaultLord,hp:3,chapter:1,section:1,layer:0,lane:1,cleared:0,signs:0,lastSign:'',activeNode:null,unlocked:[...config.profile.unlockedUnits],diamonds:config.profile.diamonds,inventory:{...config.profile.inventory},claimed:[],bought:[],refreshes:config.shop.dailyAdRefreshes,shopDay:this.day(),mineLevel:0};});}
 /** 按本地日期生成日重置键，时钟可以注入测试。 */
 day(){const d=new Date(this.clock());return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');}
 /** 实时读取事务替换后的状态，禁止保存失效引用。 */
 get state(){return this.model.state.meta;}
 /** 从保留原 ID 的配置获取主公。 */
 lord(id=this.state.lord){return this.config.lords.find(x=>x.id===id);}
 /** 解锁条件直接使用原始章节和签到次数，不受战斗胜场混淆。 */
 unlocked(id){const l=this.lord(id);return !!l&&this.state.cleared>=l.chapter&&this.state.signs>=l.sign;}
 /** 只有远征未开始时允许更换主公，防止中途重置生命金币。 */
 select(id){return this.model.transact(()=>{if(!this.unlocked(id))throw Error('尚未满足解锁条件');if(this.state.layer||this.state.section>1||this.model.state.pending)throw Error('本次远征中不能切换主公');const l=this.lord(id);this.state.lord=id;this.state.hp=l.hp;this.model.state.gold=l.coin;const limit=this.model.limit();this.model.state.units.filter(u=>u.slot>=0).slice(limit).forEach(u=>{u.slot=-1;});});}
 /** 每个自然日只能签到一次；第9签和第18签分别解锁对应主公。 */
 sign(){return this.model.transact(()=>{if(this.state.lastSign===this.day())throw Error('今日已签到');this.state.lastSign=this.day();this.state.signs++;});}
 /** 生成配置化分叉节点；远端原服随机路线未在离线客户端恢复。 */
 nodes(){const c=this.config.map,last=this.config.chapter.layers-1;return Array.from({length:last+1},(_,row)=>(row===0||row===last?[1]:[0,2]).map(lane=>({id:row+'-'+lane,row,lane,type:c.types[row],x:c.laneX[lane],y:row*c.rowSpacing}))).flat();}
 /** 当前层仅接受相邻路径节点，旧节点和越层节点不可重复结算。 */
 accessible(node){return node.row===this.state.layer&&(node.row===0||node.row===this.config.chapter.layers-1||Math.abs(node.lane-this.state.lane)<=2)&&this.state.hp>0;}
 /** 地图事件入口；战斗节点只准备阵容，胜利结算才推进路线。 */
 enter(id){return this.model.transact(()=>{this.model.editable();const node=this.nodes().find(n=>n.id===id);if(!node||!this.accessible(node))throw Error('请从箭头所示节点前进');this.state.activeNode=node.id;this.state.lane=node.lane;if(node.type==='spring'){this.state.hp=Math.min(this.lord().hp,this.state.hp+1);this.advance(node);}else if(node.type==='treasure'){this.model.state.gold+=this.model.rules.winGold;this.advance(node);}return node.type;});}
 /** 成功通过 BOSS 即解锁张飞，后续选将、合成和招募池同时生效。 */
 advance(node){const s=this.state;if(node.type==='boss'){if(!s.unlocked.includes(this.config.chapter.unlockHero))s.unlocked.push(this.config.chapter.unlockHero);if(s.section===this.config.chapter.sections.length){s.cleared=Math.max(s.cleared,s.chapter);s.chapter++;s.section=1;}else s.section++;s.layer=0;s.lane=1;}else s.layer++;s.activeNode=null;}
 /** 将已保存战果应用到章节状态；调用方必须置于同一领取事务内。 */
 settle(pending){if(pending.training)return;const node=this.nodes().find(n=>n.id===this.state.activeNode);if(!node)return;if(pending.battle.result==='win')this.advance(node);else{this.state.hp=Math.max(0,this.state.hp-1);this.state.activeNode=null;}}
 /** 通章奖励保持截图中的2000钻石、100药剂、10幸运币，只发一次。 */
 claimChapter(chapter){return this.model.transact(()=>{const s=this.state;if(s.cleared<chapter)throw Error('请先通关本章');if(s.claimed.includes(chapter))throw Error('本章礼包已领取');for(const [id,count] of Object.entries(this.config.chapterReward))this.add(id,count);s.claimed.push(chapter);});}
 /** 物品以原始 ID 入库，仅外观映射改变名称。 */
 add(id,count){if(id==='1')this.state.diamonds+=count;else this.state.inventory[id]=(this.state.inventory[id]||0)+count;}
 /** 日期变化只重置黑市次数与购买标志，不创建货币奖励。 */
 resetShop(){if(this.state.shopDay!==this.day())this.model.transact(()=>{this.state.shopDay=this.day();this.state.bought=[];this.state.refreshes=this.config.shop.dailyAdRefreshes;});}
 /** 广告完成凭据只由适配器回调提供；取消、失败不能购买或刷新。 */
 buy(index,adCompleted=false){this.resetShop();return this.model.transact(()=>{const offer=this.config.shop.offers[index],s=this.state;if(!offer||s.bought.includes(index))throw Error('商品已售罄');if(offer.price===0&&!adCompleted)throw Error('完整观看广告后才能领取');if(s.diamonds<offer.price)throw Error('钻石不足');s.diamonds-=offer.price;this.add(offer.item,offer.count);s.bought.push(index);});}
 /** 离线版复用已实测三件商品，不杜撰原服未取得的随机商品池。 */
 refresh(adCompleted){this.resetShop();return this.model.transact(()=>{if(!adCompleted)throw Error('广告未完成');if(this.state.refreshes<=0)throw Error('今日刷新次数已用完');this.state.refreshes--;this.state.bought=[];});}
 /** 生命耗尽后重新开始当前章，保留局外解锁、物品与已领取礼包。 */
 restart(){return this.model.transact(()=>{this.model.editable();const meta=this.state;if(meta.hp>0)throw Error('当前远征尚未结束');const fresh=this.model.create();meta.hp=this.lord().hp;meta.section=1;meta.layer=0;meta.lane=1;meta.activeNode=null;fresh.meta=meta;fresh.gold=this.lord().coin;fresh.shop=this.model.availableRoster().slice(0,this.model.rules.shopSize).map(h=>h.id);this.model.state=fresh;});}
}
module.exports={Progression};
