'use strict';
const c=require('./audio-settings-config');
/** 夹取有效音量，避免存档异常向原生音频传入越界值。 */
function clamp(value){return Math.max(0,Math.min(1,Number.isFinite(value)?value:0));}
/** 两个独立音量总线，兼容上一版布尔开关存档。 */
class AudioSettings{
 /** 载入开关与音量，生命周期监听仅注册一次。 */
 constructor(api){this.api=api;let saved;try{saved=api?.getStorageSync(c.storageKey);}catch{}this.state={...c.defaults};this.levels={music:c.musicVolume,sound:1};for(const key of Object.keys(this.state)){if(typeof saved?.[key]==='boolean')this.state[key]=saved[key];if(Number.isFinite(saved?.levels?.[key]))this.levels[key]=clamp(saved.levels[key]);}this.effects=new Set();this.hidden=false;this.started=false;this.musicPlaying=false;this.scene='home';api?.onHide?.(()=>{this.hidden=true;this.sync();for(const e of this.effects)e.stop();});api?.onShow?.(()=>{this.hidden=false;this.sync();});}
 /** 首次交互创建循环音乐通道，后续打开设置不重新开始曲目。 */
 start(){this.started=true;if(!this.music&&this.api?.createInnerAudioContext){this.music=this.api.createInnerAudioContext();this.music.src=c.scenes[this.scene]||c.musicFile;this.music.loop=true;this.music.obeyMuteSwitch=true;this.music.onError?.(e=>{this.musicPlaying=false;console.warn('背景音乐播放失败',e.errMsg);});}this.sync();}
 /** 切换场景时更换曲目；同曲目重绘不停止、不从头播放，静音及后台仍受总线控制。 */
 setScene(scene){const next=c.scenes[scene]?scene:'home';if(this.scene===next)return;const previous=c.scenes[this.scene]||c.musicFile;this.scene=next;if(this.music&&previous!==c.scenes[next]){this.music.stop();this.musicPlaying=false;this.music.src=c.scenes[next];this.sync();}}
 /** 查询实际显示音量；关闭的旧开关显示为零。 */
 volume(key){return this.state[key]?this.levels[key]:0;}
 /** 同步原生通道音量；只在播放状态变化时开始或暂停。 */
 sync(){if(this.music)this.music.volume=this.volume('music');const play=this.started&&!this.hidden&&this.volume('music')>0;if(play&&!this.musicPlaying){this.music?.play();this.musicPlaying=true;}else if(!play&&this.musicPlaying){this.music?.pause();this.musicPlaying=false;}for(const p of this.effects){const gain=this.volume('sound')*(p.policy?.volume??1);if(p.audio)p.audio.volume=gain;for(const slot of p.slots||[])slot.audio.volume=gain;}}
 /** 保存用户偏好；拖动期间可只预览，到松手再写盘。 */
 save(){this.api?.setStorageSync(c.storageKey,{...this.state,levels:{...this.levels}});}
 /** 设置滑条值并即时预览，零音量停止已在播放的音效。 */
 setVolume(key,value,persist=true){if(!(key in this.state))throw Error('未知音频设置');this.levels[key]=clamp(value);this.state[key]=this.levels[key]>0;if(!this.state.sound)for(const e of this.effects)e.stop();this.sync();if(persist)this.save();}
 /** 兼容布尔开关调用，保留用户上次非零音量。 */
 set(key,value){if(!(key in this.state))throw Error('未知音频设置');this.state[key]=!!value;if(value&&!this.levels[key])this.levels[key]=key==='music'?c.musicVolume:1;if(!this.state.sound)for(const e of this.effects)e.stop();this.sync();this.save();}
 /** 注册攻击池或播报通道，新建通道立即应用当前音量。 */
 register(player){this.effects.add(player);player.isEnabled=()=>this.volume('sound')>0&&!this.hidden;this.sync();return player;}
}
let instance;
/** 每个进程复用一个偏好服务。 */
function get(){return instance||(instance=new AudioSettings(typeof wx==='undefined'?null:wx));}
module.exports={AudioSettings,get,clamp};
