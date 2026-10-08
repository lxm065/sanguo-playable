"use strict";
const c=require('./combat-feedback-config').sound;
/** 按英雄覆盖和攻击类型选取原版攻击素材。 */
function kind(event,unit){if(!['attack','ability'].includes(event.type)||!unit)return null;const special=event.skill||event.type==='ability';return (special&&c.heroes[unit.heroId]?.skill)||(unit.magic?'magic':event.ranged||unit.range>1?'ranged':'melee');}
class AttackAudio{
 /** 小型固定播放池独立于解说声音；忙时丢弃低优先级攻击，避免爆音。 */
 constructor(api,policy=c,clock=Date.now){this.policy=policy;this.clock=clock;this.last=-Infinity;this.slots=[];if(policy.enabled&&api?.createInnerAudioContext){for(let i=0;i<policy.poolSize;i++){const audio=api.createInnerAudioContext(),slot={audio,busy:false};audio.volume=policy.volume;audio.obeyMuteSwitch=policy.obeyMuteSwitch;audio.onEnded(()=>slot.busy=false);audio.onError(()=>slot.busy=false);this.slots.push(slot);}api.onHide?.(()=>this.stop());}}
 /** 新局、结算和切后台停止残留攻击声音。 */
 stop(){for(const s of this.slots){s.audio.stop();s.busy=false;}this.last=-Infinity;}
 /** 控制每秒播放数量，允许有限并发而不截断当前声音。 */
 play(key){if(this.isEnabled&&!this.isEnabled())return;const now=this.clock();if(!key||!this.policy.files[key]||now-this.last<this.policy.minGapMs)return;const s=this.slots.find(s=>!s.busy);if(!s)return;this.last=now;s.busy=true;try{s.audio.src=this.policy.root+this.policy.files[key];s.audio.play();}catch{s.busy=false;}}
}
/** 视图复用播放池，资源不在每次攻击时重新创建。 */
function get(v){return v.attackAudio||(v.attackAudio=require('./audio-settings').get().register(new AttackAudio(typeof wx==='undefined'?null:wx)));}
module.exports={kind,AttackAudio,get};
