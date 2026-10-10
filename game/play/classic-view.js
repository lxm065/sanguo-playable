'use strict';
const {PlayView}=require('./view');
const {Progression}=require('./progression');
const {RewardedAds}=require('./ads');
const classic=require('./classic-config');
const routes=require('./route-view');
const routeConfig=require('./route-config'),loading=require('./loading-config');
const {HandbookView}=require('./handbook-view');
/** 原版结构的界面适配层；战斗渲染继续使用原本的事件播放器。 */
class ClassicView extends PlayView{
 /** 父类创建控件后，绑定共用进度服务和独立广告适配器。 */
 constructor(...args){super(...args);this.progress=this.model.progression;this.ads=new RewardedAds(wx,classic.ads);this.lordSelection=this.progress.state.lord;this.mapOffset=0;this.fortOffset=0;this.render();}
 /** 结算成功后统一回到地图，所有选将按钮共用同一个事务出口。 */
 act(operation){const pending=this.model.state.pending;try{if(this.playing)throw Error('交战中，请等待结算');operation();if(pending&&!this.model.state.pending){this.page='map';this.mapOffset=0;}}catch(error){this.message=error.message;this.render();this.notice('提示',error.message);return;}this.render();}
 /** 布阵顶部展示主公生命和局内金币；局外要塞不承担招募职责。 */
 renderBattle(){super.renderBattle();const u=this.ui,s=this.progress.state;for(const name of ['battle-header','返回','军营招募']){const n=this.root.children.find(x=>x.name===name);if(n)n.destroy();}u.box(this.root,'classic-battle-header',0,537,720,206,'#252823');u.portrait(this.root,this.progress.lord().portrait,-276,551,130,145,classic.portraitCrop);u.text(this.root,'♥'.repeat(s.hp),-119,596,32,'#E44E40',184);u.text(this.root,'上阵 '+this.model.state.units.filter(x=>x.slot>=0).length+'/'+this.model.limit(),95,596,26,'#EEE3B9',185);u.text(this.root,'金币 '+this.model.state.gold,255,596,26,'#ECD955',165);u.text(this.root,this.progress.lord().skillName+' · '+this.progress.lord().skillDescription,19,528,27,'#D2C6A0',380);u.button(this.root,'地图',277,482,130,()=>{this.page='map';this.render();},'#69552A',57);u.button(this.root,'装备',227,-509,210,()=>this.notice('装备','装备栏随战役获得装备；要塞黑市出售的装备碎片与局内金币分开保存。'),'#69552A');if(this.modal)this.modal.setSiblingIndex(this.root.children.length-1);}
 /** 在视图构造前建立进度，避免首帧误显示旧图鉴。 */
 render(){if(this.page!=='battle')require('./tutorial-voice').stop(this);require('./audio-settings').get().setScene(this.page==='battle'?'battle':this.page==='map'?'map':'home');require('./friend-rank-view').close(this);require("./merge-hints").clear(this);require("./kill-banner").clear(this);require('./battle-effects').clear(this);require('./treasure-animation').cancel(this);require("./talent-animation").cancel(this);require("./tutorial-view").cancel(this);require("./deployment-view").clear(this);if(!this.model.progression)return;this.progress=this.model.progression;if(this.playing)return;require("./lord-skill-view").cancel(this);for(const child of [...this.root.children]){child.removeFromParent();child.destroy();}this.actors.clear();this.reserveScope=null;this.modal=null;this.ui.image(this.root,'classic/overworld.png',0,0,720,1280);if(this.page==='battle'){this.renderBattle();return;}if(this.page==='map'){this.renderMap();require('./section-reward-view').show(this);require('./run-settlement-view').show(this);require('./sweep-view').show(this);return;}if(this.page==='home')this.renderHome();else if(this.page==='heroes')this.renderHeroes();else if(this.page==='camp')this.renderCamp();else if(this.page==='training')this.renderTraining();else require("./activity-view").talent(this);this.renderHeader();this.renderTabs();require('./diamond-mine-view').guide(this);require('./section-reward-view').show(this);require('./run-settlement-view').show(this);require('./sweep-view').show(this);}
 /** 打开共用图鉴弹窗，保持宿主页面与地图偏移不变。 */
 openHandbook(){if(this.handbook?.modal?.isValid)return;this.handbook=new HandbookView(this);this.handbook.open();}
 /** 使用原版纸质面板纹理而非纯色列表卡片。 */
 paper(parent,name,x,y,w,h){const n=this.ui.node(parent,name,x,y,w,h);this.ui.image(n,'classic/paper.png',0,0,w,h);return n;}
 /** 图片按钮复用原版图集形状，标签仍为可配置中文。 */
 iconButton(parent,file,label,x,y,w,h,action){const n=this.ui.node(parent,label,x,y,w,h);require('./home-ui-view').icon(this,n,file,w,h);if(label)this.ui.text(n,label,0,-h/2+7,29,'#FFFFFF',w+30,45);n.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;action();});const redKey={'日常':'daily','图鉴':'catalog','天赋':'talent','战令':'warOrder'}[label];if(redKey)require('./notification-view').badge(this,n,redKey,w/2-3,h/2-4);return n;}
 /** 顶部维持主公头像、局外钻石、邀请、日常、公告的位置。 */
 renderHeader(){const u=this.ui,p=this.progress.state;u.image(this.root,'classic/avatar-frame.png',-230,555,157,157);const avatar=u.node(this.root,'avatar',-230,555,127,127);avatar.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;require('./profile-settings-view').open(this);});const mask=avatar.addComponent(this.cc.Mask);mask.type=this.cc.Mask.Type.ELLIPSE;u.portrait(avatar,this.progress.lord().portrait,0,0,127,127,classic.portraitCrop);u.image(this.root,'classic/plate.png',-87,582,192,47);u.text(this.root,this.progress.lord().name,-87,582,30,'#E7C865',170);u.image(this.root,'classic/plate.png',-87,529,192,47);u.image(this.root,'classic/diamond.png',-150,529,38,40);u.text(this.root,p.diamonds,-67,529,28,'#E4CD58',121);[['invite','邀请',93],['daily','日常',205],['notice','公告',315]].forEach(([file,name,x])=>this.iconButton(this.root,file,name,x,555,100,103,()=>name==='日常'?require('./activity-view').daily(this):name==='邀请'?require('./activity-view').invite(this):this.notice(name,'三国远征，逐章解锁武将。')));}

 /** 底栏固定五入口，与原版左右顺序一致。 */
 renderTabs(){const u=this.ui;const bar=u.image(this.root,'classic/navbar.png',0,-580,110,720);bar.setRotationFromEuler(0,0,90);classic.tabs.forEach(([page,name],i)=>this.iconButton(this.root,['tab-lord','tab-fort','tab-expedition','tab-challenge','tab-talent'][i],name,(i-2)*143,-572,this.page===page?120:108,this.page===page?129:114,()=>{if(page==='training'){require('./challenge-view').menu(this);return;}this.page=page;this.render();}));}

 /** 主公页面按左立绘、右说明、下方4+3头像矩阵还原。 */
 renderHeroes(){const u=this.ui,id=this.lordSelection||this.progress.state.lord,l=this.progress.lord(id);u.image(this.root,l.portrait,-167,156,307,582);u.image(this.root,'classic/lord-frame.png',-167,156,340,641);const panel=this.paper(this.root,'lord-description',169,156,337,641);require('./paper-title').draw(this,panel,l.name,337,641);u.text(panel,l.description,0,176,26,'#51412D',277,140);u.text(panel,'初始生命：'+ '♥'.repeat(l.hp),0,69,27,'#882A22',290);u.text(panel,'初始金币：  '+l.coin,0,12,27,'#4C3923',290);u.box(panel,'skill',0,-135,279,222,'#D8C59E');u.text(panel,l.skillName,0,-62,29,'#5E472E',262);u.text(panel,l.skillDescription,0,-143,25,'#51412D',253,145);u.text(panel,this.progress.unlocked(id)?(id===this.progress.state.lord?'当前主公':'已解锁'):l.sign?'签到第'+l.sign+'次解锁':'第'+l.chapter+'章解锁',0,-268,27,'#CE4334',295);if(this.progress.unlocked(id)&&id!==this.progress.state.lord)u.button(panel,'选择主公',0,-268,250,()=>this.act(()=>this.progress.select(id)));
 const area=this.paper(this.root,'lord-select',0,-347,675,317);classic.lords.forEach((h,i)=>{const x=-235+(i%4)*154,y=i<4?69:-76;const n=u.node(area,'lord-'+h.id,x,y,133,128);u.portrait(n,h.portrait,0,0,120,122,classic.portraitCrop);u.box(n,'frame',0,0,134,130,'#00000000');if(!this.progress.unlocked(h.id)){u.box(n,'locked',0,0,125,122,'#111111AA',false);require('./lock-view').show(this,n);}if(id===h.id){const g=n.addComponent(this.cc.Graphics);g.strokeColor=new this.cc.Color('#FF9C25');g.lineWidth=5;g.rect(-66,-63,132,126);g.stroke();}n.on(this.cc.Node.EventType.TOUCH_END,()=>{this.lordSelection=h.id;this.render();});});}
 /** 远征首页保持地图、章节旗帜、右上解锁提示和两侧入口。 */
 /** 首页与行军路线复用同一图鉴图标、尺寸、标签和通知红点。 */
 handbookEntry(page){const c=require('./button-skin-config').handbook,p=c[page];return this.iconButton(this.root,'book','图鉴',p.x,p.y,c.width,c.height,()=>this.openHandbook());}
 renderHome(){const u=this.ui,p=this.progress.state,target=this.progress.section();require('./home-march-view').render(this);require('./friend-rank-view').entry(this);const nextLord=p.cleared>=1?classic.lords.filter(l=>l.chapter>p.cleared).sort((a,b)=>a.chapter-b.chapter)[0]:null;if(require('./diamond-mine-view').entry(this)||require('./chapter-unlock-view').entry(this)||require('./chapter-hero-preview').entry(this,nextLord?.chapter)){}else if(nextLord){u.portrait(this.root,nextLord.portrait,286,326,113,118,classic.portraitCrop);u.text(this.root,'通关第'+nextLord.chapter+'章\n解锁'+nextLord.name,280,231,26,'#FFFFFF',160,96);}else{u.image(this.root,target.boss+'-avatar.png',286,326,113,118);u.text(this.root,target.unlock?(p.unlocked.includes(target.unlock)?target.name+'已解锁':'击败BOSS\n解锁'+target.name):'击败BOSS',280,231,26,'#FFFFFF',160,96);}require('./sweep-view').home(this);this.handbookEntry('home');require('./game-club-view').render(this,'home');this.iconButton(this.root,'gift','战令',284,-443,105,107,()=>require('./war-order-view').open(this));require('./vip-view').entry(this);if(this.model.state.pending)u.button(this.root,'查看待领取战果',0,-358,342,()=>{this.page='battle';this.render();});}
 /** 创建可手势滚动且裁剪内容的容器，头栏与底栏不跟随滚动。 */
 scrollArea(name,y,height,offset,min,max,onOffset){const n=this.ui.node(this.root,name,0,y,710,height);n.addComponent(this.cc.Mask);const content=this.ui.node(n,'content',0,offset,710,height);require('./scroll-gesture').bindScroll(this.cc,n,content,{min,max,threshold:require('./route-view-config').interaction.dragThreshold,onOffset,onDrag:value=>{if(name==='route-scroll')this.mapDragged=value;if(name==='fortress-scroll')this.fortDragged=value;}});return content;}
 /** 绘制旗帜、泉水和宝藏等原版地图事件视觉，不把地图改成单按钮。 */
 marker(parent,node,x,y,active,done){const u=this.ui,c=require('./route-view-config').interaction;const n=u.node(parent,'map-'+node.id,x,y,c.hitWidth,c.hitHeight);const feedback=u.box(n,'map-pressed',0,0,c.hitWidth,c.hitHeight,c.pressedColor,false);feedback.active=false;n.on(this.cc.Node.EventType.TOUCH_START,()=>{feedback.active=true;});n.on(this.cc.Node.EventType.TOUCH_MOVE,()=>{feedback.active=false;});n.on(this.cc.Node.EventType.TOUCH_CANCEL,()=>{feedback.active=false;});if(node.type!=='boss')u.image(n,routes.markerIcon(node.type,active,done),0,0,node.type==='battle'?80:135,node.type==='battle'?120:146);if(routeConfig.labels[node.type])u.text(n,routeConfig.labels[node.type],0,-60,25,'#FFFFFF',155,40);if(active)require('./down-arrow').draw(this,n,require('./route-view-config').arrowY);n.on(this.cc.Node.EventType.TOUCH_END,()=>{feedback.active=false;if(this.mapDragged||this.enteringMap)return;this.enterMapNode(node.id);});return n;}

 /** 章节内部为长卷分叉路线；只开放当前层，BOSS 胜利后写入张飞解锁。 */
 renderMap(){
 require("./route-focus").sync(this);
 const u=this.ui,p=this.progress.state,target=this.progress.section(),nodes=this.progress.nodes(),height=Math.max(...nodes.map(n=>n.y));
 const offset=Math.max(760-height,Math.min(0,this.mapOffset||0));
 u.image(this.root,'classic/route-bg.png',0,0,720,1280);
 const content=this.scrollArea('route-scroll',-45,1110,offset,760-height,0,v=>{this.mapOffset=v;});
 for(let i=0;i<Math.ceil((height+1020)/950);i++)u.image(content,'classic/route-bg.png',0,i*950-10,720,1020);
 const visited=routes.renderRoutes(this,content,nodes);
 for(const n of nodes){const point=routes.position(n);const marker=this.marker(content,n,point.x,point.y,this.progress.accessible(n),visited.has(n.id));if(n.type==='boss'){require('./boss-map-view').render(this,marker,target,point);u.text(content,'BOSS',point.x,point.y-65,29,'#674322',190,45);}}
 routes.renderCurrent(this,content,nodes);
 require('./march-header-view').render(this);

 if(!(p.unlocked||[]).includes(target.unlock||target.boss)){const hint=require('./route-view-config').unlockPanel,panel=u.node(this.root,'unlock-label',hint.x,hint.y,hint.width,hint.height);u.image(panel,target.boss+'-avatar.png',0,hint.portraitY,hint.portraitSize,hint.portraitSize);u.text(panel,target.unlock?(p.unlocked.includes(target.unlock)?target.name+'已解锁':'击败BOSS\n解锁'+target.name):'击败BOSS',0,hint.textY,hint.font,'#FFFFFF',hint.width,hint.textHeight);}
 this.handbookEntry('map');
 
 const daily=require('./route-view-config').dailyButton;this.iconButton(this.root,'daily','日常',daily.x,daily.y,daily.width,daily.height,()=>require('./activity-view').daily(this));
 if(p.hp<=0)u.button(this.root,'生命耗尽 · 重新出征',0,-340,430,()=>this.act(()=>this.progress.restart()));
 this.warmBattleAssets();
 }
 /** 地图停留时逐个准备当前阵容，取消过期页面任务，避免点击瞬间集中解析模型。 */
 warmBattleAssets(){
 clearTimeout(this.warmTimer);const model=this.model;
 this.warmTimer=setTimeout(async()=>{const ids=[...new Set([...model.state.units.filter(u=>u.slot>=0),...model.enemies(),...model.state.units.filter(u=>u.slot<0)].map(u=>u.heroId))].filter(id=>this.assets.hasModel(id)).slice(0,loading.maxWarmHeroes);for(const id of ids){if(this.page!=='map'||this.model!==model)return;try{await this.assets.skeleton(id);}catch(e){console.warn('预载失败，可在进入战斗后重试',id);}}},loading.mapWarmDelay);
 }
 /** 点击立即给予反馈，再让出一帧完成事务及界面切换，并记录可测量的耗时。 */
 enterMapNode(id){
 if(this.enteringMap)return;this.enteringMap=true;const started=Date.now();
 this.ui.text(this.root,'正在进入…',0,-485,27,'#FFF1CF',380,55);
 setTimeout(()=>{try{const type=this.progress.enter(id);if(['battle','elite','boss',...require('./node-event-config').types].includes(type))this.page='battle';this.render();this.lastEntryTiming={id,renderMs:Date.now()-started};}catch(e){this.render();this.notice('提示',e.message);}finally{this.enteringMap=false;}},loading.sliceDelay);
 }

 /** 道具图标由矢量宝石、丹药和令牌组成，原道具 ID 作为点击键。 */
 item(parent,id,count,x,y,canClick=()=>true){const u=this.ui,gear=require("./equipment-theme")[id],it=gear?{name:gear.name+"碎片",description:"用于图鉴中的装备进阶，已开放装备穿戴后可获得强化效果。"}:classic.items[id]||require("./activity-config").items[id],n=u.box(parent,'item-'+id,x,y,86,86,'#382847');u.image(n,require('./reward-icon').file(id),0,5,72,72);u.text(n,count,0,-26,23,'#FFFFFF',80,35);n.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(canClick())this.notice(it?.name||String(id),it?.description||'暂无说明');});return n;}
 /** 要塞恢复章节礼包、仓库、黑市、矿场的竖向面板顺序。 */
 renderCamp(){require('./diamond-mine-view').focus(this);const u=this.ui,p=this.progress.state;this.progress.resetShop();const content=this.scrollArea('fortress-scroll',-27,1000,this.fortOffset||0,0,require('./diamond-mine-config').view.scrollMax,v=>this.fortOffset=v);const pack=this.paper(content,'chapter-pack',0,260,704,410);require('./fortress-decoration').title(this,pack,'章节礼包',410);u.image(pack,'classic/liubei.png',-220,-12,173,244);u.text(pack,'1章礼包',110,97,32,'#705035',340);u.text(pack,'仅限一次',110,49,25,'#89572D',330);Object.entries(classic.chapterReward).forEach(([id,n],i)=>this.item(pack,id,n,(i-1)*100+110,-23));p.claimed.includes(1)?require('./claimed-status').draw(this,pack,102,-140):u.button(pack,p.cleared>=1?'领取章节礼包':'请先通关本章',102,-140,350,()=>this.act(()=>this.progress.claimChapter(1)),'#856139');const bag=this.paper(content,'warehouse',0,-165,704,410);require('./fortress-decoration').title(this,bag,'仓库',410);require('./warehouse-view').render(this,bag);const shop=this.paper(content,'black-market',0,-620,704,450);require('./fortress-decoration').title(this,shop,'黑市商店',450);classic.shop.offers.forEach((o,i)=>{const x=(i-1)*220;u.box(shop,'offer',x,-3,207,240,'#E2D0A6');u.text(shop,classic.items[o.item].name,x,92,27,'#227FB6',200);require('./fortress-decoration').discount(this,shop,o.discount,x);this.item(shop,o.item,o.count,x,12);const buy=u.button(shop,p.bought.includes(i)?'已售罄':o.price?'':'▶ 免费',x,-90,190,()=>o.price?this.act(()=>this.progress.buy(i)):this.ad(()=>this.progress.buy(i,true)), '#846238',54);if(o.price&&!p.bought.includes(i))require('./currency-view').amount(this,buy,o.price,0,0,'shop');});u.button(shop,'▶ 刷新+3',0,-164,220,()=>this.ad(()=>this.progress.refresh(true)),'#B78416');u.text(shop,'每日0点重置',-229,-164,22,'#785133',211);u.text(shop,'剩余'+p.refreshes+'次',235,-164,24,'#527844',185);require('./diamond-mine-view').render(this,content);}
 /** 通用说明弹窗只展示已经核对的数据，不发送原服请求。 */
 notice(title,body){const m=this.overlay(),u=this.ui;const panel=this.paper(m,'notice',0,0,630,480);require('./paper-title').draw(this,panel,title,630,480);u.text(m,body,0,24,27,'#4D3B2B',552,220);u.button(m,'关闭',0,-164,244,()=>{m.destroy();this.modal=null;});}
 /** 开发广告明确要求选择完成或取消，不把点击按钮当作真实看完广告。 */
 async ad(done,after,cancel){const model=this.model,token=require('./vip').ticket(model);let completed=false;const finish=()=>{if(completed||model!==this.model)return;let ok=false;this.act(()=>{model.transact(()=>{require('./vip').recordAd(model,token);done();});ok=true;});if(ok){completed=true;after?.();}};try{const result=await this.ads.show();if(result===true){finish();return;}if(result!=='development'){cancel?.();this.notice('广告未完成','未发放奖励。');return;}const m=this.overlay(),u=this.ui;const panel=this.paper(m,'development-ad',0,0,640,430);require('./paper-title').draw(this,panel,'本地广告测试',640,430);u.text(m,'当前没有连接真实广告平台。\n仅在选择模拟完成后测试领取与刷新。',0,20,27,'#51412D',570,140);u.button(m,'模拟完整观看',-149,-121,275,()=>{finish();});u.button(m,'取消 · 不发奖',149,-121,275,()=>{cancel?.();this.render();},'#6B6655');}catch(e){cancel?.();this.notice('广告未完成',e.message);}}
 /** 签到次数独立于胜场，避免提前开放第9签和第18签主公。 */
 signPanel(){this.notice('日常签到','累计签到 '+this.progress.state.signs+' 次；第9签解锁曹操，第18签解锁孙权。');this.ui.button(this.modal,'今日签到',0,-82,245,()=>this.act(()=>this.progress.sign()));}
 /** 战斗结算后回到章节地图，不再直接生成无地图的下一场战斗。 */
 reward(){super.reward();}
}
module.exports={ClassicView};
