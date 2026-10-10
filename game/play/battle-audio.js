"use strict";
const config=require('./battle-audio-config');
/** 播报器只消费回放事件，不参与模拟、奖励或存档。 */
class BattleAudio {
 /** 微信音频能力可注入，单通道队列避免重复创建和叠音。 */
 constructor(api,policy=config){this.policy=policy;this.counts=new Map();this.seen=new Set();this.queue=[];this.payloads=new Map();this.busy=false;this.first=false;this.audio=null;if(policy.enabled&&api?.createInnerAudioContext){this.audio=api.createInnerAudioContext();this.audio.volume=policy.volume;this.audio.obeyMuteSwitch=policy.obeyMuteSwitch;this.audio.onPlay?.(()=>this.present());this.audio.onEnded(()=>this.next());this.audio.onError(()=>{this.present();this.next();});api.onHide?.(()=>this.stop());}}
 /** 新战斗清除上一场连杀与未播放的队列。 */
 reset(){this.stop();this.counts.clear();this.seen.clear();this.first=false;}
 /** 切后台或新局立即停止，返回时不补播旧声音。 */
 stop(){this.queue=[];this.payloads.clear();this.current=null;this.busy=false;this.audio?.stop();this.onClear?.();}
 /** 顺序播放一条播报；错误同样释放队列。 */
 next(){this.busy=false;const key=this.queue.shift();if(!key||!this.audio)return;this.busy=true;this.current=this.payloads.get(key)||{key};this.payloads.delete(key);try{this.audio.src=this.policy.root+this.policy.clips[key];this.audio.play();if(!this.audio.onPlay)this.present();}catch{this.busy=false;this.queue=[];}}
 /** 仅在当前音频真正开始时展示同一份播报，防止画面提前覆盖语音。 */
 present(){if(this.current){const info=this.current;this.current=null;this.onAnnounce?.(info);}}
 /** 多杀升级替换尚未开始的低阶播报，当前音频自然播完。 */
 play(key,info={}){if(Number(key)&&this.policy.maxKillTier)key=Math.min(Number(key),this.policy.maxKillTier);if(!this.policy.clips[key])return;if(!this.audio||(this.isEnabled&&!this.isEnabled())){this.onAnnounce?.({...info,key:String(key)});return;}if(Number(key)){for(const k of this.queue.filter(k=>Number(k)))this.payloads.delete(k);this.queue=this.queue.filter(k=>!Number(k));}this.payloads.set(String(key),{...info,key:String(key)});this.queue.push(String(key));this.queue=this.queue.slice(-this.policy.maxQueue);if(!this.busy)this.next();}
 /** 只按己方同一武将的真实击杀归属计算连杀；重复死亡事件不重复播报。 */
 event(e,units){if(e.type!=='death'||this.seen.has(e.uid))return;this.seen.add(e.uid);const killer=units.find(u=>u.uid===e.actor),victim=units.find(u=>u.uid===e.uid);if(!killer||!victim||killer.side!==this.policy.killSide||victim.side===killer.side)return;const first=!this.first;if(first){this.first=true;this.play('first',{count:1,killer,victim});}const old=this.counts.get(e.actor),count=old&&e.t-old.time<=this.policy.windowSeconds?old.count+1:1;this.counts.set(e.actor,{count,time:e.t});if(count>=2)this.play(count,{count,killer,victim});return first||count>=2?{key:first?'first':String(Math.min(count,this.policy.maxKillTier)),count,killer,victim}:undefined;}
 /** 结算保留最后的最高连杀播报，再按结果播放一次。 */
 finish(result){this.play(result);}
}
/** 每个视图只创建一个播放器，避免重绘注册多份生命周期监听。 */
function get(view){const player=view.battleAudio||(view.battleAudio=require('./audio-settings').get().register(new BattleAudio(typeof wx==='undefined'?null:wx)));player.onAnnounce=info=>require('./kill-banner').show(view,info);player.onClear=()=>require('./kill-banner').clear(view);return player;}
module.exports={BattleAudio,get};
