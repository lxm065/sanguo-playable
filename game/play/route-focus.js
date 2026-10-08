'use strict';
/** 只在小节身份变化时回到底部，普通重绘保留玩家当前滚动位置。 */
function sync(v){const p=v.progress.state,key=p.chapter+'-'+p.section;if(v.mapSectionKey!==key){v.mapSectionKey=key;v.mapOffset=0;}return key;}
/** 领取小节奖励后直接打开新的出发点；无额外存档或奖励操作。 */
function start(v){v.mapOffset=0;v.mapSectionKey=v.progress.state.chapter+'-'+v.progress.state.section;v.page='map';}
module.exports={sync,start};
