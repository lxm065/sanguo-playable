'use strict';
const c=require('./diamond-mine-config'),layout=c.view,{DiamondMine}=require('./diamond-mine');
/** 每次从当前模型取进度，避免重开章节后引用旧存档。 */
function service(v){return new DiamondMine(v.progress);}
/** 格式化绝对时间差，后台恢复不依赖累计帧数。 */
function time(seconds){seconds=Math.max(0,Math.ceil(seconds));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');}
/** 第四章之后展示原版第五章矿场预告，不覆盖前面的装备与武将预告。 */
function entry(v){const p=v.progress.state;if(p.cleared<layout.previewAfterChapter||p.cleared>=c.chapter)return false;const n=v.ui.node(v.root,'mine-preview',284,295,154,215);v.ui.image(n,c.view.previewImage,0,32,110,110);v.ui.text(n,c.chapter+'章解锁\n钻石矿场',0,-58,25,'#FFE49A',160,96);n.on(v.cc.Node.EventType.TOUCH_END,()=>preview(v));return true;}
/** 弹窗空白可关闭，纸面阻断冒泡避免误触确认。 */
function panel(v,name,title){const m=v.overlay(),p=v.paper(m,name,0,0,620,580);p.addComponent(v.cc.BlockInputEvents);require('./paper-title').draw(v,p,title,620,580);m.on(v.cc.Node.EventType.TOUCH_END,()=>v.render());v.ui.text(m,'点击空白处关闭',0,-335,28,'#FFFFFF',600);return p;}
/** 复刻远征补给预告文案与要塞建筑图标。 */
function preview(v){const p=panel(v,'mine-unlock-preview','通关预告'),u=v.ui;u.text(p,'通关第 '+c.chapter+' 章解锁',0,180,34,'#65462B',560);u.text(p,c.text.previewTitle,0,115,30,'#65462B',560);u.image(p,layout.previewImage,0,-20,210,210);u.text(p,c.text.previewDescription,0,-200,29,'#65462B',570);}
/** 展示真实等级表的消费和时间，取消不会消耗钻石。 */
function confirm(v){const s=service(v).status(),u=v.ui,p=panel(v,'mine-build-confirm',s.level?'工坊升级':'工坊解锁');u.text(p,'产出奖励',0,172,35,'#65462B',540);c.rewardPreview.forEach((reward,i)=>{const x=(i-1.5)*125,n=u.box(p,'mine-reward-preview-'+i,x,65,104,104,reward.color);u.image(n,'classic/event-chest.png',0,0,80,80);u.text(n,reward.level>s.level+1?reward.level+'级\n解锁':'new',0,reward.level>s.level+1?0:35,23,'#FFFFFF',100,70);});const level=c.levels[s.level];u.text(p,'解锁消耗    ◆ '+v.progress.state.diamonds+'/'+level.exp+'\n解锁耗时       '+time(level.time),0,-75,29,'#65462B',555,105);u.button(p,s.level?'升级':'解锁',0,-210,250,()=>v.act(()=>service(v).start()),'#B72B12',74);}
/** 保留原版对话与金色跳动箭头，人物使用当前三国教学角色。 */
function dialogue(v,parent,y,text){const u=v.ui,t=require('./tutorial-config'),root=u.node(parent,'mine-guide',0,y);u.box(root,'mine-guide-dialogue',layout.guideX,0,layout.guideWidth,layout.guideHeight,'#E8CDA0');u.text(root,text,layout.guideX+15,0,29,'#52351F',layout.guideWidth-40,layout.guideHeight-10);u.actor(root,{uid:-9998,heroId:t.hero,star:1,side:'enemy'},layout.guideNpcX,-55,layout.guideNpcScale,false);return root;}
/** 章节奖励关闭后显示要塞入口指引；切页销毁节点同时停止箭头动画。 */
function guide(v){if(v.modal||v.page!=='home'||!service(v).guide())return;dialogue(v,v.root,layout.guideY,c.text.visit);require('./tutorial-voice').play(v,'mineVisit');const target=v.ui.node(v.root,'mine-guide-tab',-143,layout.guideArrowY);require('./down-arrow').draw(v,target,0).setScale(layout.guideArrowScale,layout.guideArrowScale,1);target.on(v.cc.Node.EventType.TOUCH_END,()=>{v.page='camp';v.render();});}
/** 自动把矿场滚入可见区域，普通滚动不会反复归位。 */
function focus(v){if(service(v).guide()&&!v.mineGuideFocused){v.fortOffset=layout.focusOffset;v.mineGuideFocused=true;}}
/** 广告绑定当前建造凭据，取消不产生消费或加速。 */
function buildSpeed(v){if(v.fortDragged)return;const mine=service(v),token=mine.ticket('build');v.ad(()=>mine.speed(token,true));}
/** 分享只采用既有离开返回软校验，不声称已验证分享成功。 */
function productionSpeed(v){if(v.fortDragged)return;const mine=service(v),token=mine.ticket('production'),model=v.model;if(!v.shareService)v.shareService=new(require('./share-service').ShareService)(typeof wx==='undefined'?null:wx);v.shareService.request('mine',result=>{if(model!==v.model)return;if(result.ok)v.act(()=>mine.speed(token,true));else v.notice('分享未完成',require('./share-scenarios').text[result.reason]||'请重试');});}
/** 统一绘制建造与章节进度条，值来自实际进度而非显示用假计数。 */
function bar(v,parent,ratio){const width=layout.progressWidth;v.ui.box(parent,'mine-progress-bg',-230,layout.progressY,width,layout.progressHeight,'#454442');const fill=v.ui.box(parent,'mine-progress-fill',-230-width/2+width*Math.max(0,Math.min(1,ratio))/2,layout.progressY,Math.max(1,width*Math.max(0,Math.min(1,ratio))),layout.progressHeight,'#64A922');return fill;}
/** 绘制两排八格、建造倒计时、升级门槛与生产领取入口。 */
function render(v,content){const mine=service(v),s=mine.status(),u=v.ui,p=v.progress.state,n=v.paper(content,'diamond-mine',0,layout.panelY,704,layout.panelHeight);require('./fortress-decoration').title(v,n,c.name+'  Lv'+s.level,layout.panelHeight);u.image(n,layout.image,-230,0,210,225);for(let i=0;i<c.slots;i++){const slot=u.box(n,'mine-slot-'+i,layout.slotX+(i%layout.columns)*layout.slotGapX,layout.slotY-Math.floor(i/layout.columns)*layout.slotGapY,layout.slotSize,layout.slotSize,i<s.ready?'#C82D12':'#454442');if(i<s.ready){u.image(slot,'classic/diamond.png',0,6,58,58);u.text(slot,c.production.diamonds,0,-29,22,'#FFFFFF',85);}else if(i<c.levels[s.level].max)u.text(slot,'开采中',0,0,19,'#E8CDA0',85);else require('./lock-view').show(v,slot);}
 if(p.cleared<c.chapter){u.text(n,'通关第'+c.chapter+'章解锁  '+Math.min(p.cleared,c.chapter)+'/'+c.chapter,35,layout.buttonY,28,'#65462B',560);return;}
 if(s.build){bar(v,n,1-(s.build.end-v.progress.clock())/(s.build.end-s.build.start));const seconds=(s.build.end-v.progress.clock())/1000;n.mineCountdown=u.text(n,time(seconds),-230,-75,27,'#FFFFFF',230);u.button(n,'▶ 加速',-230,layout.buttonY,190,()=>buildSpeed(v),'#B78416');}
 else if(!s.level){u.button(n,'解锁',115,layout.buttonY,200,()=>{if(!v.fortDragged)confirm(v);},'#B72B12');if(mine.guide()){dialogue(v,n,layout.campGuideY,c.text.build);require('./tutorial-voice').play(v,'mineBuild');const arrow=u.node(n,'mine-unlock-arrow',115,layout.buttonY+70);require('./down-arrow').draw(v,arrow,0).setScale(layout.guideArrowScale,layout.guideArrowScale,1);}}
 else{const next=c.levels[s.level+1];if(next&&p.cleared>=next.chapter)u.button(n,'升级',-230,layout.buttonY,180,()=>{if(!v.fortDragged)confirm(v);},'#B72B12');else {bar(v,n,next?p.cleared/next.chapter:1);u.text(n,next?'通关'+next.chapter+'章可升级\n'+Math.min(p.cleared,next.chapter)+'/'+next.chapter:'已满级',-230,-75,23,'#65462B',235,90);}}
 if(s.level){u.button(n,'分享加速',5,layout.buttonY,185,()=>productionSpeed(v),'#B78416');const claim=u.button(n,'领取',230,layout.buttonY,180,()=>{if(v.fortDragged)return;v.act(()=>{const amount=mine.claim();v.message='领取钻石 '+amount;});},'#B72B12');if(s.ready)u.box(claim,'mine-ready-dot',80,25,18,18,'#EF493C');}
 const deadline=s.build?.end||(s.level&&s.ready<c.levels[s.level].max?s.nextAt:null);if(deadline){const timer=setInterval(()=>{if(!n.isValid){clearInterval(timer);return;}if(n.mineCountdown)n.mineCountdown.string=time((deadline-v.progress.clock())/1000);if(v.progress.clock()>=deadline&&!v.modal&&!v.fortDragged){clearInterval(timer);v.render();}},layout.tickMs);n.on(v.cc.Node.EventType.NODE_DESTROYED,()=>clearInterval(timer));}}
module.exports={entry,preview,confirm,render,guide,focus,time};
