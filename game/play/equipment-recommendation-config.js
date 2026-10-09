'use strict';
/** 全量装备推荐策略；只影响提示，不限制穿戴或改变属性。 */
module.exports={
  "profiles": {
    "physical": {
      "magic": false
    },
    "meleePhysical": {
      "magic": false,
      "maxRange": 1
    },
    "archer": {
      "roles": [
        "神射"
      ],
      "magic": false
    },
    "magic": {
      "magic": true
    },
    "frontline": {
      "maxRange": 1
    },
    "magicFront": {
      "magic": true,
      "maxRange": 2
    },
    "attack": {
      "roles": [
        "神射",
        "先锋",
        "猛将"
      ]
    },
    "support": {
      "roles": [
        "猛将",
        "谋士"
      ]
    },
    "onHit": {}
  },
  "items": {
    "7001": {
      "profile": "physical",
      "reason": "普攻破甲，匹配物理攻击成长"
    },
    "7002": {
      "profile": "meleePhysical",
      "reason": "近战触发眩晕概率更高"
    },
    "7003": {
      "profile": "meleePhysical",
      "reason": "溅射仅近战有效"
    },
    "7004": {
      "profile": "meleePhysical",
      "reason": "物攻、护甲、回血及短时强化适合近战承伤输出，包含许褚"
    },
    "7005": {
      "profile": "physical",
      "reason": "物攻攻速及普攻削弱"
    },
    "7006": {
      "profile": "archer",
      "reason": "物理神射的暴击弩，避免法术攻击单位损失物攻加成"
    },
    "7007": {
      "profile": "meleePhysical",
      "reason": "战戟物攻、护甲、生命及物理吸血护盾适合近战持续作战"
    },
    "7008": {
      "profile": "archer",
      "reason": "物理神射的攻速弓，避免法术攻击单位损失物攻加成"
    },
    "7009": {
      "profile": "physical",
      "reason": "物攻与击杀叠攻"
    },
    "7010": {
      "profile": "physical",
      "reason": "物攻与闪避，持续全场伤害不限射程"
    },
    "7101": {
      "profile": "magic",
      "reason": "法攻、攻速与普攻减魔抗"
    },
    "7102": {
      "profile": "magic",
      "reason": "法攻与冷却辅助"
    },
    "7103": {
      "profile": "magic",
      "reason": "法攻法穿及定时控制"
    },
    "7104": {
      "profile": "magic",
      "reason": "法攻与全队减魔抗"
    },
    "7105": {
      "profile": "magic",
      "reason": "法攻法穿、冷却与回复"
    },
    "7106": {
      "profile": "magic",
      "reason": "法攻、冷却与治疗诅咒"
    },
    "7107": {
      "profile": "magicFront",
      "reason": "法攻与大量生命双抗，优先中近程法术单位"
    },
    "7108": {
      "profile": "magicFront",
      "reason": "法攻双抗，受击减速适合中近程法术单位"
    },
    "7109": {
      "profile": "magic",
      "reason": "法攻攻速冷却及沉默"
    },
    "7110": {
      "profile": "magic",
      "reason": "法攻法穿及定时法术伤害"
    },
    "7111": {
      "profile": "magic",
      "reason": "法攻冷却及变形控制"
    },
    "7112": {
      "profile": "magic",
      "reason": "法攻、冷却与施法刷新"
    },
    "7113": {
      "profile": "magic",
      "reason": "法攻法穿"
    },
    "7114": {
      "profile": "onHit",
      "reason": "普攻触发固定伤害闪电链，攻速收益适用于物理和法术普攻单位"
    },
    "7201": {
      "profile": "frontline",
      "reason": "受击反伤与护甲生命，优先近战承伤"
    },
    "7202": {
      "profile": "support",
      "reason": "双抗与团队攻速冷却光环，适合前排或辅助持有"
    },
    "7203": {
      "profile": "support",
      "reason": "双抗及团队增益，适合前排或辅助持有"
    },
    "7204": {
      "profile": "support",
      "reason": "生命魔抗与团队回复，适合前排或辅助持有"
    },
    "7205": {
      "profile": "frontline",
      "reason": "生命与回复，优先承伤单位"
    },
    "7206": {
      "profile": "frontline",
      "reason": "减伤格挡生命回复，优先承伤单位"
    },
    "7207": {
      "profile": "frontline",
      "reason": "减伤魔抗及回复，优先承伤单位"
    },
    "7208": {
      "profile": "physical",
      "reason": "高攻速与物理吸血，按物理攻击类型匹配"
    },
    "7209": {
      "profile": "attack",
      "reason": "连续普攻叠攻速，覆盖神射与近战普攻单位"
    },
    "7210": {
      "profile": "attack",
      "reason": "攻速、冷却及战后金币，覆盖普攻单位"
    },
    "7211": {
      "profile": "magic",
      "reason": "法攻与全队治疗，优先法术辅助单位"
    },
    "7212": {
      "profile": "frontline",
      "reason": "高生命及百分比回复减伤，优先近战承伤"
    },
    "7213": {
      "profile": "frontline",
      "reason": "护甲攻速与团队护甲，优先近战"
    },
    "7214": {
      "profile": "frontline",
      "reason": "生命回复及击杀叠加，优先近战持续作战"
    }
  }
};
