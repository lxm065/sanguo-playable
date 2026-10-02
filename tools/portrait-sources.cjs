'use strict';
/** 静态头像候选配置；地图根独立解析，禁止跨地图混用同名贴图。 */
module.exports={
 assetRoot:'D:/Games/Warcraft3/ExtractedAssets/Maps',size:512,background:'#554b39',
 roots:{san:'真三国无双3_1_9dai版无CD无限蓝/自定义单位模型/模型与贴图',zhan:'四地图模型与技能图标_20260924/三国战记0.24正式版/模型与贴图',jian:'守卫剑阁降龙伏虎3.0T资源/守卫剑阁-降龙伏虎3.0T(C)1.24EMM版/模型与贴图',athena:'四地图模型与技能图标_20260924/守护雅典娜8路出怪平衡版j/模型与贴图',memory:'遗失的记忆v1.7.22-U9_1.24/自定义单位模型/模型与贴图'},
 camera:{direction:[1,.25,.04],height:.83,span:.48,time:400},
 crops:{zhenji:[.07,.03,.86],zhaoyun:[.10,.15,.8],huangzhong:[.1,.15,.8],zhangfei:[.1,.2,.7],xiaoqiao:[.1,.18,.75],zhangliao:[.1,.16,.74],machao:[.1,.15,.8],huangyueying:[.1,.12,.8],zhurong:[.1,.1,.85],lvbu:[.12,.15,.7]},
 rows:[
 ['zhenji','memory','zhenjipf.mdx',{center:[0,0,105],span:.44}],['xuchu','zhan','war3mapImported/XuChu.mdx',{center:[0,0,107]}],
 ['xiahouyuan','zhan','war3mapImported/XHY.mdx',{center:[0,0,116],distance:80}],['zhaoyun','san','units/human/Arthas/Arthas.mdx',{center:[0,0,97],distance:110}],
 ['dianwei','san','Units/Creeps/Beastmaster/Beastmaster.mdx',{center:[4,5,113],distance:115}],['diaochan','zhan','war3mapImported/DC.mdx',{center:[0,0,88],distance:72}],
 ['huangzhong','zhan','war3mapImported/moon_shin_HZ.mdx',{center:[10,0,91],distance:75}],['zhangfei','zhan','war3mapImported/moon_shin_ZF.mdx',{center:[15,0,80],distance:70}],
 ['xiaoqiao','jian','q2.mdx',{center:[0,0,108],distance:85}],['zhangliao','zhan','war3mapImported/moon_shin_ZL21.mdx',{center:[0,0,94],distance:85}],
 ['zhouyu','zhan','war3mapImported/ZhouYu.mdx',{center:[18,0,110],distance:93}],['guanyu','zhan','war3mapImported/GY.mdx',{center:[10,0,118],distance:85}],
 ['machao','zhan','war3mapImported/moon_shin_MC.mdx',{center:[12,0,88],distance:77}],['sunshangxiang','zhan','war3mapImported/SSX12.mdx',{center:[33,0,97],distance:80}],
 ['huangyueying','san','units/nightelf/Runner/Runner.mdx',{center:[0,0,87],distance:80}],['zhurong','san','units/nightelf/Huntress/Huntress.mdx',{center:[0,-4,104],distance:80}],
 ['lvbu','zhan','war3mapImported/moon_shin_LB.mdx',{center:[12,0,86],distance:80}]
 ]
};
