'use strict';
const test=require('node:test'),a=require('node:assert/strict');
test('棋组赵云展示使用正面源动作，不改变战场方向校正',()=>{const p=require('../game/play/challenge-config').deckLayout,m=require('../game/play/model-animation');const vector=p.modelFacingOverrides.zhaoyun;a.equal(m.sourceDirection('zhaoyun',m.direction(...vector)),'s');a.equal(m.sourceDirection('zhaoyun','s'),'n');a.deepEqual(p.modelFacing,[0,-1]);});
test('袁绍失败提示头像和文字在边框内且互不重叠',()=>{const p=require('../game/play/lord-skill-animation-config').missPanel;a(p.portraitX-p.portraitSize/2>-p.width/2);a(p.portraitX+p.portraitSize/2<p.textX-p.textWidth/2);a(p.textX+p.textWidth/2<p.width/2);a(p.portraitSize<p.height);});
