'use strict';
/** 五阶段在已有区间内的取值位置；端点固定，中间阶段均匀递进。 */
module.exports={version:11,highestLimit:{extra:1,migrateFromVersion:9,chapterPolicies:[{fromChapter:1,toChapter:3,types:['battle','elite'],extra:0}]},extraMainQuantile:0,power:{equipmentWeight:.25,maxFactor:1.15,minInterval:.1},currentTeam:{fromSection:2,minStar:1,maxStar:5},referenceChapter:2,positions:{1:0,2:.25,3:.5,4:.75,5:1},openingSection:1,openingStar:1,
 progression:{fromChapter:1,fromSection:2,countGrowth:2,promotionStart:.35,promotionFraction:.5,
  types:{battle:{extraCount:0,promotion:0},elite:{extraCount:1,promotion:.15},boss:{extraCount:2,promotion:.35}}}};
