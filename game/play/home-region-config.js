'use strict';
/** 地图原生建筑与章节锚点配置；baked建筑复用底图，不重复叠加。 */
module.exports={
  "outline": "#322C1E",
  "outlineWidth": 2,
  "regions": [
    {
      "name": "中原河谷",
      "file": "classic/home-central.png",
      "sites": [
        {
          "x": -128,
          "y": 219,
          "settlement": "village",
          "baked": true
        },
        {
          "x": -230,
          "y": 30,
          "settlement": "village"
        },
        {
          "x": 56,
          "y": 83,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 155,
          "y": -46,
          "settlement": "village",
          "baked": true
        },
        {
          "x": -50,
          "y": -120,
          "settlement": "village"
        },
        {
          "x": 60,
          "y": -280,
          "settlement": "city"
        },
        {
          "x": -238,
          "y": -167,
          "settlement": "city",
          "baked": true
        },
        {
          "x": -294,
          "y": 43,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 10,
          "y": 469,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 250,
          "y": 436,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 146,
          "y": 136,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 300,
          "y": -2,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 326,
          "y": 361,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 146,
          "y": 477,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 243,
          "y": -255,
          "settlement": "city",
          "baked": true
        },
        {
          "x": -160,
          "y": -372,
          "settlement": "village",
          "baked": true
        }
      ]
    },
    {
      "name": "北境雪关",
      "file": "classic/home-north.png",
      "sites": [
        {
          "x": -177,
          "y": -277,
          "settlement": "village"
        },
        {
          "x": 90,
          "y": -293,
          "settlement": "city"
        },
        {
          "x": -100,
          "y": -110,
          "settlement": "village"
        },
        {
          "x": -60,
          "y": 120,
          "settlement": "village"
        },
        {
          "x": 104,
          "y": 57,
          "settlement": "city"
        },
        {
          "x": 26,
          "y": 257,
          "settlement": "village"
        },
        {
          "x": 180,
          "y": 185,
          "settlement": "city"
        },
        {
          "x": -243,
          "y": -427,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 267,
          "y": -512,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 291,
          "y": 343,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 6,
          "y": 528,
          "settlement": "city",
          "baked": true
        }
      ]
    },
    {
      "name": "江南湖泽",
      "file": "classic/home-lakes.png",
      "sites": [
        {
          "x": -95,
          "y": 210,
          "settlement": "village"
        },
        {
          "x": 123,
          "y": 98,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 180,
          "y": -110,
          "settlement": "village"
        },
        {
          "x": 15,
          "y": -300,
          "settlement": "city"
        },
        {
          "x": -261,
          "y": -159,
          "settlement": "city",
          "baked": true
        },
        {
          "x": -149,
          "y": 58,
          "settlement": "village",
          "baked": true
        },
        {
          "x": -173,
          "y": 465,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 304,
          "y": 317,
          "settlement": "city",
          "baked": true
        },
        {
          "x": 172,
          "y": 188,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 155,
          "y": -36,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 182,
          "y": -163,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 45,
          "y": -335,
          "settlement": "village",
          "baked": true
        },
        {
          "x": -170,
          "y": -249,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 5,
          "y": -465,
          "settlement": "village",
          "baked": true
        },
        {
          "x": -15,
          "y": 410,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 72,
          "y": 423,
          "settlement": "village",
          "baked": true
        },
        {
          "x": 96,
          "y": 165,
          "settlement": "village",
          "baked": true
        },
        {
          "x": -322,
          "y": 348,
          "settlement": "village",
          "baked": true
        }
      ]
    }
  ],
  "settlements": {
    "city": {
      "file": "classic/chapter-city.png",
      "width": 116,
      "height": 90
    },
    "village": {
      "file": "classic/chapter-village.png",
      "width": 100,
      "height": 78
    }
  },
  "status": {
    "x": 35,
    "y": 39,
    "flagWidth": 30,
    "flagHeight": 40,
    "completeWidth": 37,
    "completeHeight": 37,
    "battleWidth": 29,
    "battleHeight": 29,
    "edgePadding": 24
  },
  "viewport": {
    "y": 0,
    "width": 720,
    "height": 1280,
    "mapWidth": 720,
    "mapHeight": 1280,
    "min": -300,
    "max": 300,
    "dragThreshold": 14,
    "hint": "上下拖动地图，探索更多城池",
    "hintY": -303,
    "tileOffsets": [
      -1,
      0,
      1
    ]
  },
  "hit": {
    "width": 84,
    "height": 90
  },
  "label": {
    "width": 122,
    "xLimit": 285,
    "progressLimit": 210
  }
};
