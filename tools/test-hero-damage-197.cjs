'use strict';
const test=require('node:test'),a=require('node:assert/strict'),roster=require('../game/play/expedition-roster'),types=require('../game/play/hero-damage'),stats=require('../game/play/expedition-stats').stats,rules=require('../game/play/config'),recommend=require('../game/play/equipment-recommendations').heroIds;
test('四名武将各阶与多人名册使用同一定位，原始提取表不改写',()=>{
 const challenge=require('../game/play/challenge-roster').create(roster,require('../game/play/challenge-config'));
 for(const list of [roster,challenge])for(const [id,magic,skillMagic] of [['zhangjiao',true,true],['ganning',false,false],['zhaoyun',false,true],['zhangliao',false,true]]){
  const h=list.find(h=>h.id===id);a.equal(h.magic,magic);a.equal(h.skillMagic,skillMagic);for(const t of h.tiers){a.equal(t.magic,magic);a.equal(t.skillMagic,skillMagic);}
 }
 a.equal(require('../game/play/expedition-data').heroes.find(h=>h.id==='zhangjiao').tiers[0].magic,false);
});
test('双修装备分别和同时真实增加攻击面板，张角甘宁只获得对应攻击属性',()=>{
 for(const [id,physical,magic] of [['zhaoyun',70,60],['zhangliao',70,60],['zhangjiao',0,60],['ganning',70,0]]){
  const h=roster.find(h=>h.id===id),u={uid:1,heroId:id,star:h.tier,slot:0};
  const read=ids=>stats(u,[u],roster,ids.map((id,i)=>({uid:i+1,id,owner:1})),rules).attack;
  const base=read([]);a.equal(read(['7001'])-base,physical,id);a.equal(read(['7101'])-base,magic,id);a.equal(read(['7001','7101'])-base,physical+magic,id);
 }
 a(recommend('7001').includes('zhaoyun'));a(!recommend('7001').includes('ganning'));a(!recommend('7001').includes('zhangjiao'));
 a.deepEqual(recommend('7101'),['zhouyu','zhugeliang']);a(!recommend('7101').includes('ganning'));
});
/** 使用真实张辽技能和极高生命靶验证抗性分流，不依赖纯函数自证。 */
function battle(armor,magicArmor){
 const target={...roster.find(h=>h.id==='xuchu'),id:'target',skills:[],hp:100000,attack:1,armor,magicArmor,tiers:null};
 return require('../game/play/expedition-combat').simulate([{uid:1,heroId:'zhangliao',star:3,slot:0}],[{uid:-1,heroId:'target',star:1,slot:0}],[...roster,target],{...rules,criticalChance:0,maxBattleSeconds:20},123,1,[]).events.filter(e=>e.type==='damage'&&e.actor===1);
}
test('张辽实战普攻吃护甲、技能吃魔抗，两种伤害均实际出现',()=>{
 const plain=battle(0,0),armor=battle(1000,0),resist=battle(0,1000);
 for(const skill of [false,true]){
  const read=events=>events.find(e=>!!e.skill===skill);const base=read(plain);a(base,skill?'缺少技能':'缺少普攻');
  a.equal(base.damageType,skill?'magic':'physical');
  a(read(skill?resist:armor).damage<base.damage/2);
  a.equal(read(skill?armor:resist).damage,base.damage);
 }
});
