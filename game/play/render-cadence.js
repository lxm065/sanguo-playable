'use strict';
const config=require('./interaction-performance-config');
/** 菜单和备战降低绘制频率；战斗保持原刷新率，时间轴继续读取真实经过时间。 */
function apply(view){const game=view.cc?.game;if(!game)return;const rate=view.playing||view.startingBattle?config.battleFrameRate:config.idleFrameRate;if(game.frameRate!==rate)game.frameRate=rate;}
module.exports={apply};
