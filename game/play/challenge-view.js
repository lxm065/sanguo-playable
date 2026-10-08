'use strict';
const c=require('./challenge-config'),{Challenge}=require('./challenge'),{PlayView}=require('./view');
/** 独立挑战控制器：自己的画布、计时器和回放，不替换宿主远征模型。 */
class ChallengeView {
  /** 共享美术控件和引擎，领域操作通过独立服务提交。 */
  constructor(host){this.host=host;this.cc=host.cc;this.ui=host.ui;this.assets=host.assets;this.roster=host.roster;this.config={...host.config,showAttackStatus:c.showAttackStatus,layout:{...host.config.layout,modelScale:c.ui.modelScale}};this.service=new Challenge(host.model);this.actors=new Map();this.speed=1;this.selected=null;this.message='';this.screen='menu';this.battleAudio=require('./battle-audio').get(host);this.attackAudio=require('./attack-audio').get(host);require('./kill-banner').warm(this);this.render();}
  /** 关闭浮层清理所有计时与回放；正在进行的棋局先确认结束，不支持保存续局。 */
  close(){require('./battle-effects').clear(this);if(this.service.state?.run&&this.service.state.run.phase!=='finished'){this.confirmAbandon();return;}require("./kill-banner").clear(this);require("./battle-audio").get(this).stop();require("./attack-audio").get(this).stop();clearInterval(this.timer);this.timer=null;this.playing=false;if(this.root?.isValid)this.root.destroy();if(this.host.challengeView===this)this.host.challengeView=null;require("./audio-settings").get().setScene(this.host.page==='battle'?'battle':this.host.page==='map'?'map':'home');}
  /** 错误只更新提示，不触发宿主远征的领奖和解锁动画。 */
  act(operation){const previous=new Map((this.service.state?.run?.players[0]?.units||[]).map(u=>[u.uid,u.star]));let success=false;try{operation();this.message='';success=true;}catch(error){this.message=error.message;}this.render();if(success)require('./upgrade-effects').show(this,previous,this.service.state?.run?.players[0]?.units||[]);}
  /** 重建挑战画布，控件销毁时同步终止定时回调，防止后台旧视图写盘。 */
  render(){require('./audio-settings').get().setScene(this.screen==='game'?'battle':'map');require('./battle-effects').clear(this);clearInterval(this.timer);this.timer=null;if(this.root?.isValid)this.root.destroy();this.actors.clear();this.root=this.ui.box(this.host.root,'challenge-screen',0,0,720,1280,'#100D0AD9',false);this.root.addComponent(this.cc.BlockInputEvents);const root=this.root;root.once(this.cc.Node.EventType.NODE_DESTROYED,()=>{if(this.root===root){clearInterval(this.timer);this.timer=null;}});if(this.screen==='menu')this.renderMenu();else if(this.screen==='decks')this.renderDecks();else if(this.screen==='game')this.renderGame();else this.renderLobby();if(this.message&&!(this.screen==='game'&&this.service.state?.run?.phase==='result'))this.ui.text(this.root,this.message,0,this.screen==='decks'?c.deckLayout.messageY:-612,22,'#FFE67C',690,48);}
  /** 菜单保留三项原版入口，未实现项明确说明，避免空壳冒充玩法。 */
  renderMenu(){const u=this.ui;this.root.on(this.cc.Node.EventType.TOUCH_END,()=>this.close());c.menu.forEach((entry,i)=>{const y=-215-i*121,n=this.host.paper(this.root,'challenge-'+entry.id,145,y,410,110);this.host.iconButton(n,entry.icon,'',-145,0,80,83,()=>this.open(entry.id));u.text(n,entry.title,46,22,30,'#4C3523',280,42);if(entry.id==='multiplayer')require('./challenge-rank-view').menu(this,n);else u.text(n,entry.subtitle,46,-21,21,'#6F563D',280,44);n.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;this.open(entry.id);});});u.text(this.root,'第'+c.unlockChapter+'章开放挑战',80,-111,25,'#F5DFAB',510);}
  /** 已解锁才创建存档，不修改玩家实际章节用于强开入口。 */
  open(id){if(id!=='multiplayer'){this.message=c.ui.unavailable;this.render();return;}this.act(()=>{this.service.initialize();this.screen='lobby';});}
  /** 大标题、棋盘预览和开局按钮对应原版多人对战首页。 */
  renderLobby(){const u=this.ui,s=this.service.state;u.text(this.root,c.ui.title,0,518,55,'#FFE4A4');require('./challenge-rank-view').lobby(this);u.text(this.root,c.ui.localLabel,0,393,24,'#E1D5B9');u.image(this.root,this.config.battleImage,0,89,605,540);const deck=s.decks[s.activeDeck];deck.slice(0,6).forEach((id,i)=>{const h=this.roster.find(h=>h.id===id);u.actor(this.root,{uid:i,heroId:id,star:c.initialLevel},(i%3-1)*151,145-Math.floor(i/3)*158,.8,false);});u.button(this.root,'选棋 · 棋组'+(s.activeDeck+1),-178,-229,270,()=>{this.deckIndex=s.activeDeck;this.draft=[...deck];this.deckDrafts=null;this.screen='decks';this.render();},'#796044',70);u.button(this.root,'规则',178,-229,220,()=>this.rules(), '#796044',70);this.host.paper(this.root,'challenge-start-panel',0,-394,682,218);u.text(this.root,'自选10枚棋子，加入4人棋局',0,-332,29,'#503923',640);u.button(this.root,'对战',0,-422,260,()=>this.act(()=>{this.service.start();this.screen='game';}), '#A63222',90);u.button(this.root,'关闭',0,-548,210,()=>this.close(),'#665340',62);}
  /** 显示哪些规则已核对、哪些数值是本地策略，产品内仅保留必要说明。 */
  rules(){this.dialog('对战规则','任选'+c.deckSize+'名已解锁武将，不限制档位，入局均为'+c.initialLevel+'级'+'。\n开局'+c.initialGold+'金币、'+c.initialHp+'颗心、'+c.initialPopulation+'人口。\n三选一后直接上阵，同名棋子自动升级。\n人口满时需先升人口，也可选择带↑的同名棋子。\n升人口直接增加一位；可在棋盘内拖动换位。\n每轮战败扣'+c.lossDamage+'颗心，归零淘汰。\n当前对手均为电脑，不进行真人联网匹配。');}
  /** 主动结束需用户在游戏内确认，返回大厅或关闭均结束本局，不保留续局入口。 */
  confirmAbandon(){const u=this.ui,m=u.box(this.root,'challenge-abandon',0,0,658,470,'#33271EF8');m.addComponent(this.cc.BlockInputEvents);u.text(m,'结束当前棋局？',0,145,35,'#F5D99E');u.text(m,'将按当前淘汰名次结算积分。\n退出后本局结束，不能保存或继续。',0,35,27,'#EFE0BF',600,120);u.button(m,'取消',-150,-148,240,()=>m.destroy(),'#756044',68);u.button(m,'结束并结算',150,-148,240,()=>this.act(()=>{this.service.abandon();this.screen='game';}),'#A13723',68);}
  /** 通用子弹窗不覆盖准备计时，关闭后返回原挑战屏幕。 */
  dialog(title,text){const u=this.ui,m=u.box(this.root,'challenge-dialog',0,0,700,1050,'#30271FF5');m.addComponent(this.cc.BlockInputEvents);u.text(m,title,0,442,36,'#F5D59D');u.text(m,text,0,40,27,'#F2E3C1',632,650);u.button(m,'返回',0,-442,250,()=>m.destroy());}
  /** 独立选棋页面负责上下区模型、锁头与拖动，领域服务校验解锁及配额。 */
  renderDecks(){require('./challenge-deck-view').render(this);}
  /** 棋盘坐标独立配置，战斗空间仍共用六列三排规则。 */
  position(x,y){return {x:(x-(this.config.columns-1)/2)*c.ui.boardX,y:c.ui.boardY[y]};}
  /** 拖动的释放点映射到我方格子，敌方区域永远不可放置。 */
  slotAt(point){for(let y=0;y<this.config.rows;y++)for(let x=0;x<this.config.columns;x++){const p=this.position(x,y);if(Math.abs(point.x-p.x)<c.ui.boardX/2&&Math.abs(point.y-p.y)<c.ui.slotHitHeight/2)return y*this.config.columns+x;}return null;}
  /** 清理临时推荐格子，取消拖动时也不留下旧提示。 */
  clearRecommendations(){for(const node of this.recommendationNodes||[])if(node.isValid)node.destroy();this.recommendationNodes=[];}
  /** 金色为自动上阵首选，绿色为其他推荐空位；不覆盖拖动输入。 */
  showRecommendations(unit){this.clearRecommendations();const p=this.service.state.run.players[0],slots=this.service.recommendedSlots(p,unit.heroId,unit.uid).slice(0,c.ui.recommendationCount);for(const [i,slot]of slots.entries()){const pos=this.position(slot%this.config.columns,Math.floor(slot/this.config.columns)),node=this.ui.box(this.root,'recommended-slot-'+slot,pos.x,pos.y,c.ui.boardX-8,c.ui.slotHitHeight-8,i===0?c.ui.recommendationBestColor:c.ui.recommendationColor);this.ui.text(node,i===0?'首选':'推荐',0,0,22,'#FFFFFF',95,34);this.recommendationNodes.push(node);}}
  /** 棋子单击选中，拖动松手执行同一领域布阵校验。 */
  bindUnit(actor,unit){
    const n=actor.node,E=this.cc.Node.EventType,origin={x:n.position.x,y:n.position.y};let start=null,dragged=false;
    if(unit.uid===this.selected){const ring=this.ui.box(n,'challenge-selected',0,15,94,95,'#F6D66A38');ring.setSiblingIndex(0);}
    n.on(E.TOUCH_START,e=>{e.propagationStopped=true;start=e.getUILocation();dragged=false;this.showRecommendations?.(unit);});
    n.on(E.TOUCH_MOVE,e=>{e.propagationStopped=true;if(!start)return;const p=e.getUILocation();if(Math.hypot(p.x-start.x,p.y-start.y)>c.ui.dragThreshold)dragged=true;if(dragged){const transform=this.root.getComponent(this.cc.UITransform),a=transform.convertToNodeSpaceAR(new this.cc.Vec3(start.x,start.y,0)),b=transform.convertToNodeSpaceAR(new this.cc.Vec3(p.x,p.y,0));n.setPosition(origin.x+b.x-a.x,origin.y+b.y-a.y);n.setSiblingIndex(this.root.children.length-1);}});
    n.on(E.TOUCH_CANCEL,e=>{if(e?.getEventCode&&e.getEventCode()===this.cc.Input?.EventType.TOUCH_END){n.emit(E.TOUCH_END,e);return;}this.clearRecommendations?.();start=null;n.setPosition(origin.x,origin.y);});
    n.on(E.TOUCH_END,e=>{this.clearRecommendations?.();e.propagationStopped=true;if(dragged){const p=e.getUILocation(),point=this.root.getComponent(this.cc.UITransform).convertToNodeSpaceAR(new this.cc.Vec3(p.x,p.y,0)),slot=this.slotAt(point);this.act(()=>{if(slot!==null)this.service.deploy(unit.uid,slot);else throw Error('只能在己方棋盘调整站位');});}else{this.selected=unit.uid;this.message='';this.details(unit.heroId,unit.uid);}start=null;});
  }
  /** 直接上阵界面：上方对手、中央准备、底部三选一与羁绊装备，无备战栏。 */
  renderGame(){
    const u=this.ui,r=this.service.state.run;if(r.phase==='finished'){this.renderFinal();this.rewardPopup();return;}if(r.phase==='result'){this.message='';this.play();return;}
    const p=r.players[0],pair=this.service.pairs(r).find(pair=>pair.a===0||(!pair.ghost&&pair.b===0)),enemy=pair?r.players[pair.a===0?pair.b:pair.a]:null;
    u.image(this.root,this.config.battleImage,0,0,720,1280);
    u.box(this.root,'challenge-header',0,550,720,180,'#222C27ED',false);
    u.text(this.root,enemy?.name||'等待对手',-185,574,30,'#EFE1BC',320,48);
    u.text(this.root,enemy?.hp?'♥'.repeat(enemy.hp):'',-185,528,34,'#EB6753',280,44);
    u.text(this.root,'回合 '+r.round,226,529,26,'#EFE1BC',180,42);
    this.clockLabel=u.text(this.root,'',210,582,31,'#FFE263',218,44);
    u.button(this.root,'大厅',-302,616,103,()=>this.confirmAbandon(),'#69523C',38);
    u.text(this.root,'本地电脑对局',-61,616,19,'#DBCDA9',300,30);
    u.button(this.root,'战况',83,528,109,()=>this.standings(),'#69523C',43);
    for(let y=0;y<this.config.rows*2;y++)for(let x=0;x<this.config.columns;x++){
      const pos=this.position(x,y),slot=y*this.config.columns+x,tile=u.box(this.root,'challenge-cell-'+slot,pos.x,pos.y,100,94,y<this.config.rows?'#52664A45':'#75634420',false);
      if(y<this.config.rows)tile.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(this.selected!==null)this.act(()=>this.service.deploy(this.selected,slot));});
    }
    const stats=require('./expedition-stats').stats;
    for(const unit of p.units){const pos=this.position(unit.slot%this.config.columns,Math.floor(unit.slot/this.config.columns)),values=stats(unit,p.units,this.service.battleRoster,p.equipment,this.config);const actor=u.actor(this.root,{...unit,side:'ally',hp:values.hp,maxHp:values.hp},pos.x,pos.y,c.ui.modelScale,true);this.actors.set(unit.uid,actor);this.bindUnit(actor,unit);p.equipment.filter(e=>e.owner===unit.uid).forEach((e,i)=>u.image(actor.status,'equipment/'+e.id+'.png',(i-1)*c.ui.equippedIconGap,c.ui.equippedIconY,c.ui.equippedIconSize,c.ui.equippedIconSize).name="challenge-equipped-icon");}
    if(p.units.length)u.button(this.root,r.phase==='ready'?'取消准备':'准备',0,c.ui.readyY,217,()=>this.act(()=>r.phase==='ready'?this.service.cancelReady():this.service.ready()),'#236B8C',69);
    u.text(this.root,this.selected?'拖动调整站位 · 点击装备穿戴':p.choices.length?c.choiceCount+'个选1个 · 点击直接上阵':'点击换一批生成棋子',0,c.ui.choiceTitleY,23,'#F3E5C3',670,37);
    u.box(this.root,'challenge-footer',0,c.ui.footerY,720,c.ui.footerHeight,'#302A22F2',false);
    p.choices.forEach((id,i)=>{
      const h=this.roster.find(h=>h.id===id),existing=p.units.find(unit=>unit.heroId===id),canUpgrade=existing&&existing.star<c.maxStar,x=c.ui.choiceStartX+i*c.ui.choiceGap,n=u.node(this.root,'challenge-choice-'+i,x,c.ui.choiceY,c.ui.choiceWidth,c.ui.choiceHeight);
      u.actor(n,{uid:'choice-'+i,heroId:id,star:existing?Math.min(c.maxStar,existing.star+1):c.initialLevel},0,-5,c.ui.choiceScale,false);
      u.text(n,h.name,0,c.ui.choiceNameY,25,'#ECDCAC',126,33);
      if(canUpgrade)u.text(n,'↑ 升级',0,c.ui.choiceUpgradeY,26,'#83E271',126,37);
      this.bindChoice(n,i,id);
    });
    u.button(this.root,'换一批 · '+this.service.refreshCost()+'金币',230,-349,229,()=>this.act(()=>{if(p.gold>=this.service.refreshCost())this.service.refresh();}),'#A96A20',66);
    u.text(this.root,'金币 '+p.gold,230,-397,25,'#FFE263',217,36);
    const cost=this.service.populationCost();u.button(this.root,cost===null?'升人口 · MAX':'升人口 · '+cost+'金币',230,-455,229,()=>this.act(()=>{if(cost!==null&&p.gold>=cost)this.service.upgrade();}),'#A96A20',66);
    u.text(this.root,p.units.length+'/'+p.population,230,-504,28,p.units.length>=p.population?'#F46C58':'#EEE1C1',218,39);
    const bonds=require('./expedition-stats').bonds(p.units,this.roster).filter(b=>b.count);
    u.text(this.root,'羁绊：',-300,c.ui.bondY,27,'#8BCE70',112,40);
    bonds.slice(0,5).forEach((bond,i)=>{const x=-208+i*61,n=u.box(this.root,'challenge-bond-'+bond.id,x,c.ui.bondY,54,48,bond.level?'#52754B':'#4A4D47');u.text(n,bond.value+' '+bond.count,0,0,17,'#EEE9C9',53,45);n.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;this.bondDetails(bond);});});
    u.text(this.root,'装备：',-300,c.ui.equipmentY,27,'#8BCE70',112,40);
    const gear=u.box(this.root,'challenge-equipment-bar',-86,c.ui.equipmentY,326,c.ui.equipmentHeight,'#221D18',false);
    require('./challenge-equipment-bar').render(this,gear,p.equipment);
    u.text(this.root,'♥'.repeat(p.hp),226,-557,35,'#F26C58',216,46);u.text(this.root,'我方',226,-602,26,'#EEE1C1',214,36);
    if(r.phase==='result'){this.renderResult();return;}this.updateClock();
    this.timer=setInterval(()=>{if(!this.root?.isValid)return;try{if(this.service.tick()){this.message='';this.play();}else this.updateClock();}catch(error){this.message=error.message;this.render();}},c.ui.tickMs);this.rewardPopup();
  }
  /** 装备拖动使用棋盘格命中，完整覆盖模型区域；越界放手不消耗装备。 */
  bindEquipment(node,item){
    const E=this.cc.Node.EventType;let start=null,dragged=false,ghost=null,swipe=false;
    const point=e=>{const p=e.getUILocation();return this.root.getComponent(this.cc.UITransform).convertToNodeSpaceAR(new this.cc.Vec3(p.x,p.y,0));};
    const clean=()=>{if(ghost?.isValid)ghost.destroy();ghost=null;this.clearRecommendations();};
    node.on(E.TOUCH_START,e=>{e.propagationStopped=true;start=point(e);dragged=false;swipe=false;const p=this.service.state.run.players[0];this.clearRecommendations();this.recommendationNodes=require('./equipment-recommendation-view').show(this,item,p.units,p.equipment);});
    node.on(E.TOUCH_MOVE,e=>{e.propagationStopped=true;if(!start)return;const p=point(e);if(!dragged){const intent=require('./equipment-swipe').intent(start,p,this.equipmentPager?.pages||1);if(!intent)return;dragged=true;swipe=intent==='page';}if(swipe){this.clearRecommendations();return;}if(dragged){if(!ghost)ghost=this.ui.image(this.root,'equipment/'+item.id+'.png',p.x,p.y,c.ui.equipmentIconSize,c.ui.equipmentIconSize);ghost.setPosition(p.x,p.y);}});
    /** Cocos把节点外松手转为TOUCH_CANCEL，必须依据原始事件码完成穿戴。 */
    const release=e=>{e.propagationStopped=true;if(!start)return;const p=point(e),origin=start,slot=this.slotAt(p),target=this.service.state.run.players[0].units.find(unit=>unit.slot===slot);clean();start=null;if(swipe){require('./equipment-swipe').turn(this,origin,p);return;}if(dragged){if(target)require("./challenge-equipment-refresh").equip(this,item.uid,target.uid);}else this.equipmentDetails(item);};
    node.on(E.TOUCH_END,release);
    node.on(E.TOUCH_CANCEL,e=>{if(e?.getEventCode?.()===this.cc.Input?.EventType.TOUCH_END&&e?.getEventCode){release(e);return;}start=null;clean();});
  }
  /** 模型、名字和升级箭头共用完整点击面；始终保持模型清晰，能否选择仍由人口规则决定。 */
  bindChoice(node,index,id){const p=this.service.state.run.players[0],available=this.service.canPick(p,id);const hit=this.ui.node(node,'choice-hit',0,c.ui.choiceHitY,c.ui.choiceWidth,c.ui.choiceHeight);hit.on(this.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;if(!available)return;this.act(()=>{if(this.service.state.run.phase==='preparation')this.service.choose(index);});});}
  /** 装备已在战后自动入包；展示与原版一致的获得装备、图标、名称、收下流程。 */
  rewardPopup(){const reward=this.service.state.run.rewardNotice;if(!reward)return;const u=this.ui,shade=u.box(this.root,'challenge-reward-shade',0,0,720,1280,'#00000099',false);shade.addComponent(this.cc.BlockInputEvents);const panel=this.host.paper(shade,'challenge-reward',0,0,c.ui.rewardWidth,c.ui.rewardHeight),item=require('./expedition-config').equipment.find(item=>item.id===reward.id);u.text(panel,'获得装备',0,164,37,'#644221');u.image(panel,'equipment/'+reward.id+'.png',0,43,126,126);u.text(panel,item?.name||'装备',0,-52,30,'#3A739C',550,48);u.button(panel,'收下',0,-150,235,()=>{try{this.service.dismissReward();shade.destroy();}catch(error){this.message=error.message;this.render();}},'#A63720',70);}
  /** 查看另外两名电脑与当前生命，不挤占棋盘和招募区域。 */
  standings(){this.dialog('本局战况',this.service.state.run.players.map(p=>p.name+'  '+(p.hp?'♥'.repeat(p.hp):'已淘汰')).join('\n\n'));}
  /** 倒计时读持久化截止时间，重开窗口不会获得额外准备时间。 */
  updateClock(){const r=this.service.state.run;if(this.clockLabel)this.clockLabel.string=r.phase==='ready'?'等待电脑准备':Math.max(0,Math.ceil((r.deadline-this.service.clock())/1000))+'秒';}
  /** 已保存战报可反复观看，但只有继续按钮能应用一次胜负。 */
  renderResult(){const r=this.service.state.run,report=r.pending.reports.find(p=>p.a===0),u=this.ui,m=u.box(this.root,'challenge-round-result',0,50,650,480,'#30251AF5');m.addComponent(this.cc.BlockInputEvents);const result=report?.battle.result;u.text(m,'第'+r.round+'回合 · '+(result==='win'?'获胜':result==='loss'?'战败':'平局'),0,179,36,'#F5D491');const hp=Math.max(0,r.players[0].hp-this.service.lifeDamage(result));u.text(m,'♥'.repeat(hp)+'♡'.repeat(c.initialHp-hp)+'  '+(result==='loss'?'生命 -'+c.lossDamage:'保留生命'),0,111,28,'#F08069');const reward=r.pending.rewards?.find(v=>v.player===0),item=require('./expedition-config').equipment.find(v=>v.id===reward?.id);u.text(m,'本回合装备：'+(item?.name||'随机装备 ×1'),0,-79,25,'#F5D491',610,42);u.text(m,r.pending.reports.map(p=>r.players[p.a].name+' 对 '+r.players[p.b].name+(p.ghost?'（镜像）':'')+'：'+({win:'前者胜',loss:'后者胜',draw:'平局'})[p.battle.result]).join('\n'),0,11,23,'#EEDFC0',610,110);u.button(m,'观看战斗',-150,-151,240,()=>this.play(),'#745737',68);u.button(m,'领取并继续',150,-151,240,()=>this.act(()=>{this.service.claim();this.selected=null;}),'#9F3B26',68);}
  /** 使用现有模型和事件播放器展示挑战战报，跳过不会改变结算结果。 */
  play(){if(!this.config.speedOptions.includes(this.speed))this.speed=this.config.speedOptions.at(-1);if(!require('./battle-speed-policy').unlocked(this.host.model))this.speed=1;const r=this.service.state.run;if(r.phase!=='result')return;const report=r.pending.reports.find(p=>p.a===0);if(!report)return;clearInterval(this.timer);for(const child of [...this.root.children])child.destroy();this.actors.clear();this.ui.image(this.root,this.config.battleImage,0,0,720,1280);require("./kill-banner").clear(this);require("./battle-audio").get(this).reset();require("./attack-audio").get(this).stop();require('./battle-effects').clear(this);require('./battle-effects').warm(this);this.replay=report.battle;for(const unit of this.replay.initial){const p=this.position(unit.x,unit.y);const actor=this.ui.actor(this.root,unit,p.x,p.y,c.ui.modelScale);this.actors.set(unit.uid,actor);actor.node.on(this.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;this.details(unit.heroId,unit.uid);});}this.status=this.ui.text(this.root,'第'+r.round+'回合 · 对阵'+r.players[report.b].name,0,555,28,'#FFE4B2');this.ui.button(this.root,'速度 ×'+this.speed,-170,-558,280,()=>{if(this.playing)return;const policy=require('./battle-speed-policy');if(!policy.unlocked(this.host.model)){this.host.notice(policy.config.lockedLabel,policy.config.lockedMessage);return;}this.speed=this.config.speedOptions[(this.config.speedOptions.indexOf(this.speed)+1)%this.config.speedOptions.length];this.speedLabel.string='速度 ×'+this.speed;},'#715435',72);this.speedLabel=this.root.children.find(n=>n.name==='速度 ×'+this.speed).getComponentInChildren(this.cc.Label);this.ui.button(this.root,'跳过动画',170,-558,280,()=>this.finish(),'#984129',72);this.playing=true;this.elapsed=0;this.eventIndex=0;this.lastTime=Date.now();this.timer=setInterval(()=>PlayView.prototype.tick.call(this),c.ui.replayTickMs);}
  /** 对伤害和回血更新血条，其余移动、攻击、死亡使用共用动画原语。 */
  apply(event){const kill=require("./battle-audio").get(this).event(event,this.replay?.initial||[]);require("./kill-banner").show(this,kill);const sound=require("./attack-audio");sound.get(this).play(sound.kind(event,this.replay?.initial?.find(u=>u.uid===event.uid)));if(event.type==='ability'||event.type==='status'){const a=this.actors.get(event.uid),b=this.actors.get(event.target);if(event.type==='ability'&&a){this.ui.animate(a,'skill2',false,{speed:this.speed});require('./skill-effects').ability(this,a,b,event);}if(event.type==='status'&&b)require('./skill-effects').status(this,b,event);return;}if(event.type==='death'){const actor=this.actors.get(event.uid);if(actor)require('./death-view').hide(this,actor);return;}if(event.type==='damage'){const target=this.actors.get(event.target);if(target){this.ui.health(target,event.hp);require('./battle-effects').hit(this,this.actors.get(event.actor),target,event);this.damageText(target,event.damage,event.critical,event.skill);}return;}const actor=this.actors.get(event.uid);if(event.type==='move'&&actor){const p=this.position(event.x,event.y);this.ui.face(actor,p.x-actor.node.position.x,p.y-actor.node.position.y);}if(event.type==='attack'&&actor){const target=this.actors.get(event.target);if(target)this.ui.face(actor,target.node.position.x-actor.node.position.x,target.node.position.y-actor.node.position.y);}if(event.type==='heal'){const target=this.actors.get(event.target??event.uid);if(target){this.ui.health(target,event.hp);require('./battle-effects').heal(this,target);}return;}PlayView.prototype.apply.call(this,event);}
  /** 复用远程弹道表现，不调用远征领域服务。 */
  projectile(...args){return require('./battle-effects').projectile(this,...args);}
  /** 复用飘字表现，不修改战斗数值。 */
  damageText(...args){return PlayView.prototype.damageText.apply(this,args);}
  /** 播放结束仅返回已保存的回合结果，禁止自动重复发奖。 */
  finish(){require("./kill-banner").clear(this);require("./attack-audio").get(this).stop();require("./battle-audio").get(this).finish(this.replay?.result);clearInterval(this.timer);this.timer=null;this.playing=false;this.act(()=>{this.service.claim();this.selected=null;});}
  /** 复用远征武将详情，属性与装备只读取挑战局内适配器。 */
  details(id,uid){return require('./challenge-details').unit(this,id,uid);}
  /** 点击装备打开远征同款属性页，已穿戴装备可卸下。 */
  equipmentDetails(item){return require('./challenge-details').equipment(this,item);}
  /** 装备栏空白点击打开远征同款背包，不再显示旧文字按钮列表。 */
  /** 羁绊点击显示效果与当前触发档位，不打开装备列表。 */
  bondDetails(bond){return require('./bond-detail-view').show(this,bond);}
  equipment(){return require('./challenge-details').bag(this);}
  /** 终局名次与积分展示只消费已落盘结果，不再次结算。 */
  renderFinal(){require('./challenge-settlement-view').render(this);}
}
/** 主界面入口仅创建一份控制器，旧对局可从大厅恢复。 */
function menu(host){if(host.challengeView?.root?.isValid){host.challengeView.close();return;}host.challengeView=new ChallengeView(host);}
module.exports={menu,ChallengeView};
