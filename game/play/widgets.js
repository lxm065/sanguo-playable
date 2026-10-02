'use strict';
class Widgets{
 /** 基础画布控件只负责渲染，不接触战役数据。 */
 constructor(cc,assets,colors){this.cc=cc;this.assets=assets;this.colors=colors;}
 /** 创建独立节点，继承 UI 图层。 */
 node(parent,name,x=0,y=0,w=0,h=0){const n=new this.cc.Node(name);n.layer=parent.layer;parent.addChild(n);n.setPosition(x,y);n.addComponent(this.cc.UITransform).setContentSize(w,h);return n;}
 /** 绘制金边面板，可用于按钮、卡片和模态底板。 */
 box(parent,name,x,y,w,h,color=this.colors.panel,stroke=true){const n=this.node(parent,name,x,y,w,h),g=n.addComponent(this.cc.Graphics);g.fillColor=new this.cc.Color(color);g.strokeColor=new this.cc.Color(this.colors.gold);g.lineWidth=2;g.roundRect(-w/2,-h/2,w,h,8);g.fill();if(stroke)g.stroke();return n;}
 /** 文字与图形使用不同节点，支持中文换行和固定可读字号。 */
 text(parent,text,x,y,size=25,color=this.colors.paper,width=650,height=60){const n=this.node(parent,'text',x,y,width,height),l=n.addComponent(this.cc.Label);l.string=String(text);l.fontSize=size;l.lineHeight=size+7;l.color=new this.cc.Color(color);l.horizontalAlign=this.cc.Label.HorizontalAlign.CENTER;l.verticalAlign=this.cc.Label.VerticalAlign.CENTER;l.overflow=this.cc.Label.Overflow.CLAMP;return l;}
 /** 创建带阻挡冒泡的按钮，防止模态操作误点下层棋盘。 */
 button(parent,text,x,y,w,callback,color=this.colors.red,h=62){const n=this.box(parent,text,x,y,w,h,color);this.text(n,text,0,0,24,this.colors.paper,w-12,h);n.on(this.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;callback();});return n;}
 /** 按指定显示尺寸载入本地图片，异步完成时校验节点仍有效。 */
 image(parent,file,x,y,w,h){const n=this.node(parent,file,x,y,w,h),s=n.addComponent(this.cc.Sprite);s.sizeMode=this.cc.Sprite.SizeMode.CUSTOM;this.assets.sprite(file).then(frame=>{if(n.isValid){s.spriteFrame=frame;n.getComponent(this.cc.UITransform).setContentSize(w,h);}}).catch(console.error);return n;}
 /** 使用同一立绘的头部区域生成头像，避免把整个人物压成小方块。 */
 portrait(parent,file,x,y,w,h,region){const n=this.node(parent,file,x,y,w,h),s=n.addComponent(this.cc.Sprite);s.sizeMode=this.cc.Sprite.SizeMode.CUSTOM;this.assets.texture(file).then(texture=>{if(!n.isValid)return;const frame=new this.cc.SpriteFrame();frame.texture=texture;frame.rect=new this.cc.Rect(region[0]*texture.width,region[1]*texture.height,region[2]*texture.width,region[3]*texture.height);s.spriteFrame=frame;n.getComponent(this.cc.UITransform).setContentSize(w,h);}).catch(console.error);return n;}
 /** 显示一个实际 Spine 单位，返回可重用的动画与血条句柄。 */
 actor(parent,unit,x,y,scale=1,showBars=true){const n=this.node(parent,'unit-'+unit.uid,x,y,100,120),body=this.node(n,'body');body.setScale(scale,scale,1);const sp=body.addComponent(this.cc.sp.Skeleton);if(this.assets.hasModel(unit.heroId))this.assets.skeleton(unit.heroId).then(data=>{if(!n.isValid)return;sp.skeletonData=data;sp.setAnimation(0,'idle',true);});else{this.box(body,'portrait-frame',0,64,94,112,this.colors.panel);this.image(body,unit.heroId+'-avatar.png',0,69,88,88);}const hp=this.node(n,'hp',0,147*scale,84,7),graphic=hp.addComponent(this.cc.Graphics);hp.active=showBars;const label=this.text(n,'★'.repeat(unit.star),0,165*scale,16,this.colors.gold,100,28);label.node.active=showBars;const state={node:n,body,sp,hp:graphic,label,maxHp:unit.maxHp||1,alive:true,side:unit.side};this.health(state,unit.hp??1);return state;}
 /** 只更新既有血条，不重建角色，保证攻击和移动动画连续。 */
 health(actor,hp){const g=actor.hp;g.clear();g.fillColor=new this.cc.Color('#34251F');g.rect(-42,-3.5,84,7);g.fill();g.fillColor=new this.cc.Color(hp>0?(actor.side==='enemy'?'#D96750':'#78C86D'):'#8E352B');g.rect(-42,-3.5,84*Math.max(0,hp)/actor.maxHp,7);g.fill();}
 /** 非死亡动作结束回到待机；死亡停留末帧。 */
 animate(actor,name,loop=false){if(!actor?.node.isValid||!actor.sp.skeletonData)return;actor.sp.setCompleteListener(()=>{if(actor.alive&&actor.node.isValid)actor.sp.setAnimation(0,'idle',true);});actor.sp.setAnimation(0,name,loop);}
}
module.exports={Widgets};
