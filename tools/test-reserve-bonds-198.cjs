'use strict';
const test=require('node:test'),a=require('node:assert/strict'),scope=require('../game/play/reserve-refresh'),{rows}=require('../game/play/bond-detail-view'),bonds=require('../game/play/handbook-config').bonds;
test('人数及加成逐档配对，未激活灰显，刺客保留共同暴伤加成',()=>{
 a.deepEqual(rows({...bonds.find(b=>b.id==='wei'),level:1}),[{text:'[2]魏将物理防御+5',active:true},{text:'[4]魏将物理防御+15',active:false}]);
 a.deepEqual(rows({...bonds.find(b=>b.id==='dragon'),level:0}).map(r=>r.active),[false,false]);
 a.equal(rows({...bonds.find(b=>b.id==='dragon'),level:1})[0].text,'[1]游龙武将闪避率+10%');
 a(rows({...bonds.find(b=>b.id==='vanguard'),level:2}).every(r=>r.text.includes('暴击伤害+50%')&&r.active));
 for(const b of bonds)for(const row of rows(b))a(!/[{}／]/.test(row.text));
});
test('多次翻页仅释放所属节点和旧演员，战场与HUD身份保持不变',()=>{
 const v={root:{children:[]},actors:new Map(),mergeHints:[]};
 const node=name=>{const n={name,isValid:true,removeFromParent(){v.root.children=v.root.children.filter(x=>x!==this);},destroy(){this.isValid=false;}};v.root.children.push(n);return n;};
 const board=node('board'),hud=node('hud'),deployed={node:board};v.actors.set(1,deployed);
 for(let i=0;i<4;i++){const before=scope.begin(v),n=node('reserve'+i);v.actors.set(10+i,{node:n});scope.end(v,before);a.equal(v.root.children.length,3);a.equal(v.actors.size,2);a.equal(v.actors.get(1),deployed);a(board.isValid&&hud.isValid);}
 const old=v.reserveScope.actors.keys().next().value;const replacement={node:board};v.actors.set(old,replacement);scope.begin(v);a.equal(v.actors.get(old),replacement);
});
