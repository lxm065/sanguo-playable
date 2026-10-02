const snapshot=JSON.stringify(model.state);const source={page:view.page,mapOffset:view.mapOffset};view.openHandbook();
return {opened:!!view.handbook?.modal?.isValid,source,unchanged:snapshot===JSON.stringify(model.state),groups:view.handbook.book.groups().map(g=>({tier:g.tier,count:g.heroes.length})),bonds:view.handbook.book.bonds().map(b=>({name:b.name,members:b.members.map(h=>h.name)}))};
