'use strict';
/** 路线模板仅改变事件顺序、地形排布和交叉口，保持每路事件总量与BOSS层一致。 */
module.exports={eventSeed:170031,sectionsPerChapter:5,chapterStride:2,templates:[
 {name:'三路会师',rotate:0,lanes:[0,1,2],crossRows:[0,2,4,6,8,10,12,14,15],shifts:[0],spread:[1]},
 {name:'山谷曲径',rotate:3,lanes:[2,0,1],crossRows:[1,4,7,10,13,15],shifts:[-25,20,35,-15],spread:[1,.9,.85,.95]},
 {name:'双翼迂回',rotate:6,lanes:[1,2,0],crossRows:[0,3,6,9,12,15],shifts:[0,25,0,-25],spread:[.78,.9,1,.9]},
 {name:'峡口争渡',rotate:9,lanes:[2,1,0],crossRows:[2,5,8,11,14,15],shifts:[20,-20],spread:[1,.88,.74,.88]},
 {name:'连营推进',rotate:12,lanes:[1,0,2],crossRows:[0,1,5,6,10,11,14,15],shifts:[-30,-10,15,30,0],spread:[.85,.92,1,.92]}
]};
