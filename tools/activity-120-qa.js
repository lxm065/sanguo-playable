const req=GameGlobal[0].require,m=view.model;
req('play/talent-tree-view.js').close(view);
m.transact(()=>{m.activities.state.talent.points=0;m.activities.state.talent.level=1;});view.page='rules';view.render();
const center=view.root.getChildByName('talent-points'),paid=view.root.getChildByName('talent-enhance');
const result={emptyPointsDot:center.getChildByName('red-dot-tree').active,paidDot:paid.getChildByName('red-dot-enhance').active};
if(result.emptyPointsDot||!result.paidDot)throw Error('红点不符合实际可操作状态');
sample.activity120=result;return result;
