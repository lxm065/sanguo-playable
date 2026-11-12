'use strict';
const c=require('./play-benefits-config');
/** 获取启动阶段建立的适配器；单独运行视图时仍使用同一平台单例。 */
function service(v){return v.playBenefits||require('./play-benefits').get(typeof wx==='undefined'?null:wx);}
/** 兼容性不满足时隐藏入口；配置中的坐标避开首页已有运营按钮。 */
function entry(v,page){if(!c.enabled||!c.pages.includes(page)||!service(v).availability().supported)return null;const l=c.entry,u=v.ui,n=u.node(v.root,l.name,l.x,l.y,l.width,l.height);u.box(n,'benefit-card',0,l.cardY,l.cardWidth,l.cardHeight,l.background,false);for(const y of [-l.edgeY,l.edgeY])u.box(n,'benefit-edge',0,l.cardY+y,l.cardWidth,l.edgeHeight,l.edge,false);u.text(n,l.symbol,0,l.symbolY,l.symbolFont,l.edge,l.cardWidth,l.cardHeight);u.text(n,l.label,0,l.labelY,l.labelFont,l.color,l.labelWidth,l.labelHeight);n.on(v.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;open(v);});return n;}
/** 购买结果只提示；关卡、奖励和 VIP 积分仍由原激励广告事务处理。 */
async function open(v){if(v.playBenefitsOpening)return;v.playBenefitsOpening=true;try{const result=await service(v).show();if(result==='pay_success')service(v).platform?.showToast?.({title:c.text.purchased,icon:'none',duration:c.text.toastDurationMs});}catch(error){v.notice(c.text.title,error.message,{preserve:true});}finally{v.playBenefitsOpening=false;}}
module.exports={entry,open};
