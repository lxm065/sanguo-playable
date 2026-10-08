'use strict';
const c=require('./hero-unlock-config');
/** 旧档已有武将和已领取新人福利作为基线，不在加载时补播。 */
function known(m){const saved=m.state.expedition?.heroObtained;if(saved)return [...saved];const ids=m.state.units.filter(u=>c.firstAcquisition.includes(u.heroId)).map(u=>u.heroId);if(m.state.expedition?.novice>0){const offer=require('./expedition-config').novice[0];if(offer.kind==='hero'&&c.firstAcquisition.includes(offer.id))ids.push(offer.id);}return [...new Set(ids)];}
/** 在原发奖事务内记录首次获得；失败时与武将和广告凭据一起回滚。 */
function record(m,before,run){if(!m.state.expedition)return;if(run!==m.state.expedition)before=[];m.state.expedition.heroObtained=[...new Set([...before,...m.state.units.filter(u=>c.firstAcquisition.includes(u.heroId)).map(u=>u.heroId)])];}
module.exports={known,record};
