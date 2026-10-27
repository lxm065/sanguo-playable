'use strict';
/** 冰羽、霜鸾飞行及全身冰晶护盾的视觉参数。 */
module.exports={
  "y": 0,
  "width": 138,
  "height": 164,
  "fill": "#5CAEE925",
  "glow": [
    {
      "width": 14,
      "color": "#48BEFF18"
    },
    {
      "width": 8,
      "color": "#76DAFF40"
    },
    {
      "width": 3,
      "color": "#BDF5FFBB"
    }
  ],
  "highlight": {
    "width": 3,
    "color": "#E0FAFF99",
    "curves": [
      [
        [
          -0.75,
          -0.6
        ],
        [
          -1,
          -0.1
        ],
        [
          -0.95,
          0.52
        ],
        [
          -0.5,
          0.84
        ]
      ],
      [
        [
          0.62,
          0.75
        ],
        [
          0.96,
          0.4
        ],
        [
          1,
          -0.12
        ],
        [
          0.73,
          -0.62
        ]
      ]
    ]
  },
  "pulseSeconds": 0.4,
  "pulseScale": 1.035,
  "fan": "effects/frost-luan-fan.png",
  "bird": "effects/frost-luan.png",
  "fanSize": 100,
  "fanY": 45,
  "fanDuration": 0.5,
  "birdSize": 120,
  "birdY": 30,
  "travel": 0.4,
  "burst": "iceNova",
  "burstSize": 210,
  "burstDuration": 0.55,
  "shards": 8,
  "shardSize": 70,
  "shardDistance": 100,
  "shardDuration": 0.4,
  "color": "#A6ECFF"
};
