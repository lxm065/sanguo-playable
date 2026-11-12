'use strict';
/** 原始装备7901、技能79999及客户端equipAttrsAddLayer共同确定基础与成长值。 */
module.exports={lord:'1002',id:'7901',name:'风干的香蕉',quality:{name:'赐福',color:'#F0C35A'},
 basic:{physicalAttack:20,magicAttack:20,hp:20,regen:20,armor:20},
 growth:{physicalAttack:10,magicAttack:10,hp:20,regen:2},
 fields:[['physicalAttack','物理攻击'],['magicAttack','法术攻击'],['hp','生命'],['regen','每秒生命回复'],['armor','护甲']],
 description:'通关且穿戴者存活时，物攻+10、法攻+10、生命+20、每秒生命回复+2，可无限叠加。',
 skillDescription:'开局获得赐福装备，穿戴者存活通关后可无限成长。',
 sourceName:'月亮之神的赐福',entryLine:'代表月亮，赐予你祝福！',
 // 原服高级商店价格和替换规则尚未恢复，不用本地猜测冒充原版实现。
 futureLevels:{2:{merchantChance:.2},3:{merchantChance:.2,treasureChance:.2}},
 view:{width:590,height:830,iconY:235,iconSize:132,titleY:340,bodyY:0,bodyHeight:330,font:27,buttonY:-305,closeY:-460}
};
