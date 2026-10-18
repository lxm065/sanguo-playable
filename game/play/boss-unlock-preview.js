'use strict';
/** 永久解锁、实际获取池或当前持有任一满足时，不再展示重复招募提示。 */
function needed(model,target){
 const id=target.unlock||target.boss,state=model.state;
 if((state.meta?.unlocked||[]).includes(id))return false;
 if(state.units.some(unit=>unit.heroId===id))return false;
 if((state.expedition?.heroObtained||[]).includes(id))return false;
 return !model.availableRoster().some(hero=>hero.id===id);
}
module.exports={needed};
