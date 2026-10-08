'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{Expedition}=require('../game/play/expedition'),{attach}=require('../game/play/classic-hooks'),roster=require('../game/play/expedition-roster'),config=require('../game/play/config'),vip=require('../game/play/vip'),policy=require('../game/play/battle-speed-policy');
/** 内存存档覆盖旧档加速标记，不触碰真实玩家进度。 */
function fixture(){const m=new Expedition(config,roster,{read:()=>null,write:()=>{}});attach(m,roster);return m;}
test('新档立即开放倍速并赠10次，同场激活标记避免重复扣次',()=>{const m=fixture();assert.equal(m.state.meta.inventory['10'],10);assert.equal(policy.unlocked(m),true);vip.useSpeed(m);vip.useSpeed(m);assert.equal(m.state.meta.inventory['10'],9);});
test('第二章通关后允许倍速，同场切换仅扣一张卡',()=>{const m=fixture();m.state.meta.cleared=2;m.state.meta.inventory['10']=5;assert(policy.unlocked(m));vip.useSpeed(m);vip.useSpeed(m);assert.equal(m.state.meta.inventory['10'],4);});
test('原版肉钩与腐烂原始文件保持来源哈希一致',()=>{const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),receipt=require('../evidence/original-zhangfei-sources.json');for(const [name,r]of Object.entries(receipt)){const data=fs.readFileSync(path.join(__dirname,'../game/skin-assets/original-zhangfei',name));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),r.sha256);}});
