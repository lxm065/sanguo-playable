'use strict';
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../../策划资料库/原始配置');
/** 保留原版非默认行，不读取账号、协议或在线响应。 */
function rows(name){return Object.values(JSON.parse(fs.readFileSync(path.join(base,name+'.json'),'utf8')));}
/** 只做显式字段转换；章节门槛与预告字段不混用。 */
function generate(){const data={dungeons:rows('dup_hero_cfg').filter(r=>+r.dup_id>0).map(r=>({id:+r.dup_id,chapter:+r.open_dup,name:r.dup_name,buff:+r.buff_type,description:r.des,lords:[r.chesser_1,r.chesser_2],banned:[r.ban_1,r.ban_2,r.ban_3,r.ban_4].map(Number).filter(Boolean),sections:Array.from({length:9},(_,i)=>r['note'+(i+1)+'_des']),templates:Array.from({length:9},(_,i)=>r['node_'+(i+1)])})),ranks:rows('jjc_rank_cfg').filter(r=>+r.lv>0).map(r=>({level:+r.lv,stars:+r.star,name:r.name}))};
 const packed={names:[],descriptions:[],lords:[],banned:[],sections:[],templates:[],dungeons:[],ranks:data.ranks};
 /** 重复字符串/列表只存一次，解码保留完整字段，避免删配置换包体。 */
 function intern(key,value){const text=JSON.stringify(value),index=packed[key].findIndex(v=>JSON.stringify(v)===text);if(index>=0)return index;packed[key].push(value);return packed[key].length-1;}
 packed.dungeons=data.dungeons.map(r=>[r.id,r.chapter,intern('names',r.name),r.buff,intern('descriptions',r.description),intern('lords',r.lords),intern('banned',r.banned),intern('sections',r.sections),intern('templates',r.templates)]);
 fs.writeFileSync(path.resolve(__dirname,'../game/play/solo-challenge-data.js'),"'use strict';\n/** 原版副本配置采用无损字典去重，所有章节与模板引用完整保留。 */\nconst data="+JSON.stringify(packed)+";\n/** 在包内恢复只读配置，不访问网络或执行动态代码。 */\nmodule.exports={dungeons:data.dungeons.map(([id,chapter,name,buff,description,lords,banned,sections,templates])=>({id,chapter,name:data.names[name],buff,description:data.descriptions[description],lords:data.lords[lords],banned:data.banned[banned],sections:data.sections[sections],templates:data.templates[templates]})),ranks:data.ranks};\n");return data;}
if(require.main===module){const data=generate();console.log('副本 '+data.dungeons.length+'；刀锋段位 '+data.ranks.length);}
module.exports={generate};
