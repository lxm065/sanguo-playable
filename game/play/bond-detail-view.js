'use strict';
const c=require('./bond-detail-config'),handbook=require('./handbook-config');
/** 每个人数门槛单列实际加成；使用已激活等级，未看视频的羁绊不会误亮。 */
function rows(bond){return (bond.thresholds||handbook.thresholds).map((count,i)=>({
 text:'['+count+']'+(c.effects[bond.id]||bond.effect).replaceAll('{value}',bond.values[i]).replaceAll('{bonus}',bond.values[2]??''),
 active:i<(bond.level||0),
}));}
/** 两种战斗共用紧凑深色羁绊浮层，空白遮罩点击关闭。 */
function show(v,bond){
 const u=v.ui,cc=v.cc,shade=u.box(v.root,'bond-detail-shade',0,0,720,1280,c.shade,false);
 const p=u.box(shade,'bond-detail-panel',0,0,c.width,c.height,c.background);
 shade.addComponent(cc.BlockInputEvents);shade.on(cc.Node.EventType.TOUCH_END,()=>{if(shade.isValid)shade.destroy();});
 p.addComponent(cc.BlockInputEvents);p.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;});
 const [symbol,color]=require('./battle-hud-config').bonds.symbols[bond.id]||[bond.symbol,bond.color];
 const icon=u.box(p,'bond-detail-icon',c.iconX,c.titleY,c.iconSize,c.iconSize,color);
 u.text(icon,symbol,0,0,c.titleFont,c.title,c.iconSize,c.iconSize);
 u.text(p,bond.name+'（'+(c.kinds[bond.kind]||'羁绊')+'）',c.textX,c.titleY,c.titleFont,c.title,c.width-100,48);
 rows(bond).forEach((row,i)=>{const label=u.text(p,row.text,0,c.rowTop-i*c.rowGap,c.font,row.active?c.active:c.inactive,c.bodyWidth,c.rowHeight);label.horizontalAlign=cc.Label.HorizontalAlign.LEFT;});
 return shade;
}
module.exports={show,rows};
