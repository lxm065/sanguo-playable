'use strict';
/** 独立建筑配置，未恢复的经济参数在source中明确标记。 */
module.exports={
  "name": "传送门",
  "chapter": 9,
  "slots": 8,
  "levels": [
    {
      "lv": 0,
      "exp": 12500,
      "time": 10800,
      "max": 0,
      "chapter": 9
    },
    {
      "lv": 1,
      "exp": 20000,
      "time": 21600,
      "max": 1,
      "chapter": 9
    },
    {
      "lv": 2,
      "exp": 27500,
      "time": 32400,
      "max": 2,
      "chapter": 12
    },
    {
      "lv": 3,
      "exp": 35000,
      "time": 43200,
      "max": 3,
      "chapter": 15
    },
    {
      "lv": 4,
      "exp": 42500,
      "time": 54000,
      "max": 3,
      "chapter": 18
    },
    {
      "lv": 5,
      "exp": 50000,
      "time": 64800,
      "max": 4,
      "chapter": 21
    },
    {
      "lv": 6,
      "exp": 57500,
      "time": 75600,
      "max": 4,
      "chapter": 24
    },
    {
      "lv": 7,
      "exp": 65000,
      "time": 86400,
      "max": 4,
      "chapter": 27
    },
    {
      "lv": 8,
      "exp": 72500,
      "time": 97200,
      "max": 5,
      "chapter": 30
    },
    {
      "lv": 9,
      "exp": 80000,
      "time": 108000,
      "max": 5,
      "chapter": 33
    },
    {
      "lv": 10,
      "exp": 87500,
      "time": 118800,
      "max": 5,
      "chapter": 36
    },
    {
      "lv": 11,
      "exp": 95000,
      "time": 129600,
      "max": 5,
      "chapter": 39
    },
    {
      "lv": 12,
      "exp": 102500,
      "time": 140400,
      "max": 6,
      "chapter": 42
    },
    {
      "lv": 13,
      "exp": 110000,
      "time": 151200,
      "max": 6,
      "chapter": 45
    },
    {
      "lv": 14,
      "exp": 117500,
      "time": 162000,
      "max": 6,
      "chapter": 48
    },
    {
      "lv": 15,
      "exp": 125000,
      "time": 172800,
      "max": 6,
      "chapter": 51
    },
    {
      "lv": 16,
      "exp": 132500,
      "time": 183600,
      "max": 7,
      "chapter": 54
    },
    {
      "lv": 17,
      "exp": 140000,
      "time": 194400,
      "max": 7,
      "chapter": 57
    },
    {
      "lv": 18,
      "exp": 147500,
      "time": 205200,
      "max": 7,
      "chapter": 60
    },
    {
      "lv": 19,
      "exp": 155000,
      "time": 216000,
      "max": 7,
      "chapter": 63
    },
    {
      "lv": 20,
      "exp": 162500,
      "time": 226800,
      "max": 8,
      "chapter": 66
    },
    {
      "lv": 21,
      "exp": 170000,
      "time": 237600,
      "max": 8,
      "chapter": 69
    },
    {
      "lv": 22,
      "exp": 177500,
      "time": 248400,
      "max": 8,
      "chapter": 72
    },
    {
      "lv": 23,
      "exp": 185000,
      "time": 259200,
      "max": 8,
      "chapter": 75
    },
    {
      "lv": 24,
      "exp": 192500,
      "time": 270000,
      "max": 8,
      "chapter": 78
    },
    {
      "lv": 25,
      "exp": 200000,
      "time": 280800,
      "max": 8,
      "chapter": 81
    },
    {
      "lv": 26,
      "exp": 207500,
      "time": 291600,
      "max": 8,
      "chapter": 84
    },
    {
      "lv": 27,
      "exp": 215000,
      "time": 302400,
      "max": 8,
      "chapter": 87
    },
    {
      "lv": 28,
      "exp": 222500,
      "time": 313200,
      "max": 8,
      "chapter": 90
    },
    {
      "lv": 29,
      "exp": 230000,
      "time": 324000,
      "max": 8,
      "chapter": 93
    },
    {
      "lv": 30,
      "exp": 0,
      "time": 0,
      "max": 8,
      "chapter": 96
    }
  ],
  "production": {
    "seconds": 21600,
    "diamonds": 1,
    "buildSpeedSeconds": 3600,
    "productionSpeedSeconds": 3600,
    "dailyBuildSpeeds": 5,
    "dailyProductionSpeeds": 1,
    "item": "8",
    "instantProduction": true
  },
  "source": {
    "levels": "策划资料库/原始配置/fortress_cfg.json id=3",
    "production": "assets_cfg幸运币宝箱；数量1、周期6小时为本地可配置值，原服数值未恢复"
  },
  "view": {
    "panelY": -2000,
    "panelHeight": 420,
    "focusOffset": 990,
    "scrollMax": 2120,
    "tickMs": 1000,
    "previewAfterChapter": 4,
    "image": "classic/portal.png",
    "previewImage": "classic/tab-fort.png",
    "slotX": -35,
    "slotY": 67,
    "slotGapX": 95,
    "slotGapY": 95,
    "slotSize": 87,
    "columns": 4,
    "buttonY": -145,
    "guideY": -355,
    "guideArrowY": -490,
    "campGuideY": 145,
    "guideWidth": 500,
    "guideHeight": 120,
    "guideX": 75,
    "guideNpcX": -245,
    "guideNpcScale": 1.8,
    "guideArrowScale": 2,
    "progressWidth": 220,
    "progressHeight": 20,
    "progressY": -101
  },
  "text": {
    "visit": "您的要塞开启了，我们去参观一下！",
    "build": "咱的钻石矿场建好之后，咱就可以坐等收获了！",
    "previewTitle": "远征补给开启",
    "previewDescription": "钻石矿场，开采钻石源源不绝"
  },
  "rewardPreview": [
    {
      "color": "#227FD5",
      "level": 1
    },
    {
      "color": "#922BC3",
      "level": 1
    },
    {
      "color": "#EAA12D",
      "level": 1
    },
    {
      "color": "#DA2424",
      "level": 6
    }
  ],
  "stateKey": "portal",
  "legacyLevel": null,
  "guideFlag": null
};
