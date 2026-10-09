'use strict';
const policy=require('./tutorial-config').voice;
/** 教学语音每局每步骤只播一次，重绘不重播；切换步骤立即停止前一句。 */
class TutorialVoice{
 /** 注入平台接口，通道复用并受音效总开关管理。 */
 constructor(api){this.policy=policy;this.seen=new WeakMap();this.audio=api?.createInnerAudioContext?.();if(this.audio){this.audio.obeyMuteSwitch=true;this.audio.onError?.(()=>this.stop());}}
 /** 停止语音但保留已提示步骤，避免返回界面反复提示。 */
 stop(){this.audio?.stop();}
 /** 只在真正显示对应教学时播放；静音时不补播过期提示。 */
 play(model,kind){const clip=policy.clips[kind];if(!clip){this.stop();return;}const run=model.state?.expedition?.tutorialRunId||0;let record=this.seen.get(model);if(!record||record.run!==run){record={run,steps:new Set()};this.seen.set(model,record);}const seen=record.steps;if(seen.has(kind))return;seen.add(kind);this.stop();if(!this.audio||this.isEnabled&&!this.isEnabled())return;this.audio.src=clip;this.audio.play();}
}
/** 每个视图只注册一次音频通道，保持音量和切后台行为一致。 */
function play(v,kind){if(!v.tutorialVoice)v.tutorialVoice=require('./audio-settings').get().register(new TutorialVoice(typeof wx==='undefined'?null:wx));v.tutorialVoice.play(v.model,kind);}
/** 页面离开教学场景后不继续播放。 */
function stop(v){v.tutorialVoice?.stop();}
module.exports={TutorialVoice,play,stop};
