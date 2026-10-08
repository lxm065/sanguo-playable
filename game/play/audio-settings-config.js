'use strict';
/** 音频偏好独立于战役存档，重开远征不重置玩家设置。 */
module.exports={slider:{x:25,width:225,height:20,touchHeight:70,radius:21,percentX:205,track:'#80684B',fill:'#398CAA',knob:'#FFE4A0',outline:'#665036'},storageKey:'sanguo-audio-settings-v1',defaults:{music:true,sound:true},musicFile:'skin-assets/audio/home-music.mp3',scenes:{home:'skin-assets/audio/home-music.mp3',map:'skin-assets/audio/versus.mp3',battle:'skin-assets/audio/fight.mp3'},musicVolume:.3,title:'个人信息',width:590,height:580,rows:[{key:'music',label:'音乐',y:-40},{key:'sound',label:'音效',y:-140}],on:'#517A3C',off:'#79664C'};
