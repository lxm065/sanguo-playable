'use strict';
const c=require('./battle-clock-config');
/** 创建与当前战场绑定的计时条，销毁战场时自然释放。 */
function create(v){v.battleClock?.node?.destroy();const node=v.ui.node(v.root,'battle-countdown',0,c.y),g=node.addComponent(v.cc.Graphics);v.battleClock={node,g};update(v,0);}
/** 使用回放时间而非额外计时器，暂停和倍速保持一致。 */
function update(v,elapsed=v.elapsed||0){const b=v.battleClock;if(!b?.node?.isValid)return;const limit=v.config.maxBattleSeconds,ratio=Math.max(0,Math.min(1,1-elapsed/limit)),g=b.g;g.clear();g.fillColor=new v.cc.Color(c.background);g.rect(-c.width/2,-c.height/2,c.width,c.height);g.fill();g.fillColor=new v.cc.Color(ratio<=c.dangerRatio?c.danger:ratio<=c.warningRatio?c.warning:c.normal);g.rect(-c.width/2,-c.height/2,c.width*ratio,c.height);g.fill();}
module.exports={create,update};
