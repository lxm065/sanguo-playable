"use strict";
const config=require('./battle-audio-config');
/** 播报器只消费回放事件，不参与模拟、奖励或存档。 */
class BattleAudio {
 /** 微信音频能力可注入，单通道队列避免重复创建和叠音。 */
 constructor(api,policy=config){this.policy=policy;this.counts=new Map();this.seen=new Set();this.queue=[];this.busy=false;this.first=false;this.audio=null;if(policy.enabled&&api?.createInnerAudioContext){this.audio=api.createInnerAudioContext();this.audio.volume=policy.volume;this.audio.obeyMuteSwitch=policy.obeyMuteSwitch;this.audio.onEnded(()=>this.next());this.audio.onError(()=>this.next());api.onHide?.(()=>this.stop());}}
 /** 新战斗清除上一场连杀与未播放的队列。 */
 reset(){this.stop();this.counts.clear();this.seen.clear();this.first=false;}
 /** 切后台或新局立即停止，返回时不补播旧声音。 */
 stop(){this.queue=[];this.busy=false;this.audio?.stop();}
 /** 顺序播放一条播报；错误同样释放队列。 */
 next(){this.busy=false;const key=this.queue.shift();if(!key||!this.audio)return;this.busy=true;try{this.audio.src=this.policy.root+this.policy.clips[key];this.audio.play();}catch{this.busy=false;this.queue=[];}}
 /** 多杀升级替换尚未开始的低阶播报，当前音频自然播完。 */
 play(key){if(Number(key)&&this.policy.maxKillTier)key=Math.min(Number(key),this.policy.maxKillTier);if(this.isEnabled&&!this.isEnabled())return;if(!this.audio||!this.policy.clips[key])return;if(Number(key))this.queue=this.queue.filter(k=>!Number(k));this.queue.push(String(key));this.queue=this.queue.slice(-this.policy.maxQueue);if(!this.busy)this.next();}
 /** 只按己方同一武将的真实击杀归属计算连杀；重复死亡事件不重复播报。 */
 event(e,units){if(e.type!=='death'||this.seen.has(e.uid))return;this.seen.add(e.uid);const killer=units.find(u=>u.uid===e.actor),victim=units.find(u=>u.uid===e.uid);if(!killer||!victim||killer.side===victim.side)return;const first=!this.first;if(first){this.first=true;this.play('first');}if(killer.side!=='ally'||victim.side!=='enemy')return first?{key:'first',count:1,killer,victim}:undefined;const old=this.counts.get(e.actor),count=old&&e.t-old.time<=this.policy.windowSeconds?old.count+1:1;this.counts.set(e.actor,{count,time:e.t});if(count>=2)this.play(count);return {count,killer,victim};}
 /** 结算保留最后的最高连杀播报，再按结果播放一次。 */
 finish(result){this.play(result);}
}
/** 每个视图只创建一个播放器，避免重绘注册多份生命周期监听。 */
function get(view){return view.battleAudio||(view.battleAudio=require('./audio-settings').get().register(new BattleAudio(typeof wx==='undefined'?null:wx)));}
module.exports={BattleAudio,get};
