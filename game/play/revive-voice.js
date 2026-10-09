'use strict';
/** 每次战败只播一次，沿用音效开关；关闭面板销毁通道，切后台自动停止。 */
function play(v,node,p){v.reviveVoiced=v.reviveVoiced||new WeakSet();if(v.reviveVoiced.has(p)||typeof wx==='undefined'||!wx.createInnerAudioContext)return;v.reviveVoiced.add(p);const settings=require('./audio-settings').get(),audio=wx.createInnerAudioContext(),player={audio,stop(){audio.stop();}};audio.src=require('./revive-config').voice;audio.obeyMuteSwitch=true;settings.register(player);let closed=false;const close=()=>{if(closed)return;closed=true;settings.effects.delete(player);audio.stop();audio.destroy();};audio.onEnded(close);audio.onError(close);node.once(v.cc.Node.EventType.NODE_DESTROYED,close);if(player.isEnabled())audio.play();}
module.exports={play};
