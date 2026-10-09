'use strict';
/** 原版等级表与截图流程；缺失的服务端经济参数单独配置并标注来源。 */
module.exports={
  "name": "钻石矿场",
  "chapter": 5,
  "slots": 8,
  "levels": [
    {
      "lv": 0,
      "exp": 7500,
      "time": 10800,
      "max": 0,
      "chapter": 5
    },
    {
      "lv": 1,
      "exp": 15000,
      "time": 21600,
      "max": 1,
      "chapter": 5
    },
    {
      "lv": 2,
      "exp": 22500,
      "time": 32400,
      "max": 2,
      "chapter": 8
    },
    {
      "lv": 3,
      "exp": 30000,
      "time": 43200,
      "max": 3,
      "chapter": 11
    },
    {
      "lv": 4,
      "exp": 37500,
      "time": 54000,
      "max": 3,
      "chapter": 14
    },
    {
      "lv": 5,
      "exp": 45000,
      "time": 64800,
      "max": 4,
      "chapter": 17
    },
    {
      "lv": 6,
      "exp": 52500,
      "time": 75600,
      "max": 4,
      "chapter": 20
    },
    {
      "lv": 7,
      "exp": 60000,
      "time": 86400,
      "max": 4,
      "chapter": 23
    },
    {
      "lv": 8,
      "exp": 67500,
      "time": 97200,
      "max": 5,
      "chapter": 26
    },
    {
      "lv": 9,
      "exp": 75000,
      "time": 108000,
      "max": 5,
      "chapter": 29
    },
    {
      "lv": 10,
      "exp": 82500,
      "time": 118800,
      "max": 5,
      "chapter": 32
    },
    {
      "lv": 11,
      "exp": 90000,
      "time": 129600,
      "max": 5,
      "chapter": 35
    },
    {
      "lv": 12,
      "exp": 97500,
      "time": 140400,
      "max": 6,
      "chapter": 38
    },
    {
      "lv": 13,
      "exp": 105000,
      "time": 151200,
      "max": 6,
      "chapter": 41
    },
    {
      "lv": 14,
      "exp": 112500,
      "time": 162000,
      "max": 6,
      "chapter": 44
    },
    {
      "lv": 15,
      "exp": 120000,
      "time": 172800,
      "max": 6,
      "chapter": 47
    },
    {
      "lv": 16,
      "exp": 127500,
      "time": 183600,
      "max": 7,
      "chapter": 50
    },
    {
      "lv": 17,
      "exp": 135000,
      "time": 194400,
      "max": 7,
      "chapter": 53
    },
    {
      "lv": 18,
      "exp": 142500,
      "time": 205200,
      "max": 7,
      "chapter": 56
    },
    {
      "lv": 19,
      "exp": 150000,
      "time": 216000,
      "max": 7,
      "chapter": 59
    },
    {
      "lv": 20,
      "exp": 157500,
      "time": 226800,
      "max": 8,
      "chapter": 62
    },
    {
      "lv": 21,
      "exp": 165000,
      "time": 237600,
      "max": 8,
      "chapter": 65
    },
    {
      "lv": 22,
      "exp": 172500,
      "time": 248400,
      "max": 8,
      "chapter": 68
    },
    {
      "lv": 23,
      "exp": 180000,
      "time": 259200,
      "max": 8,
      "chapter": 71
    },
    {
      "lv": 24,
      "exp": 187500,
      "time": 270000,
      "max": 8,
      "chapter": 74
    },
    {
      "lv": 25,
      "exp": 195000,
      "time": 280800,
      "max": 8,
      "chapter": 77
    },
    {
      "lv": 26,
      "exp": 202500,
      "time": 291600,
      "max": 8,
      "chapter": 80
    },
    {
      "lv": 27,
      "exp": 210000,
      "time": 302400,
      "max": 8,
      "chapter": 83
    },
    {
      "lv": 28,
      "exp": 217500,
      "time": 313200,
      "max": 8,
      "chapter": 86
    },
    {
      "lv": 29,
      "exp": 225000,
      "time": 324000,
      "max": 8,
      "chapter": 89
    },
    {
      "lv": 30,
      "exp": 0,
      "time": 0,
      "max": 8,
      "chapter": 92
    }
  ],
  "production": {
    "seconds": 10800,
    "diamonds": 2000,
    "buildSpeedSeconds": 3600,
    "productionSpeedSeconds": 3600,
    "dailyBuildSpeeds": 5,
    "dailyProductionSpeeds": 5
  },
  "source": {
    "levels": "策划资料库/原始配置/fortress_cfg.json id=1",
    "preview": "foretell_cfg.json id=5",
    "guide": "words.json 22634; StrongholdItem / StrongholdPanel",
    "production": "截图6确认2000钻石；周期、加速量与次数为本地可配置规则，未取得原服服务端数值"
  },
  "view": {
    "panelY": -1100,
    "panelHeight": 420,
    "focusOffset": 990,
    "scrollMax": 1200,
    "tickMs": 1000,
    "previewAfterChapter": 4,
    "image": "classic/mine.png",
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
  ]
};
