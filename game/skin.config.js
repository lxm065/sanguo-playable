/** 三国样板唯一外观配置；关闭 enabled 并重新编译可恢复原版表现。 */
module.exports = {
  enabled: true,
  themeId: 'sanguo-zhaoyun-v1',
  allowedPlatforms: ['devtools'],
  assetsRoot: 'skin-assets/',
  hero: {
    heroId: 1201, modelId: 101, camp: 1, jobId: 1001,
    name: '赵云', description: '常山赵子龙，银甲执锐，护阵破敌。',
    avatar: 'zhaoyun-avatar.png', drawing: 'zhaoyun-drawing.png',
    skeleton: 'zhaoyun.json', atlas: 'zhaoyun.atlas', manifest: 'zhaoyun-manifest.json',
    skillNames: ['龙胆', '破阵'],
  },
  resourceOverrides: {
    'icon:job/1001/spriteFrame': 'zhaoyun-avatar.png',
    'icon:hero/101/spriteFrame': 'zhaoyun-avatar.png',
    'big-img:job/1001/spriteFrame': 'zhaoyun-drawing.png',
    'big-img:job-draw/1001/spriteFrame': 'zhaoyun-drawing.png',
    'fight-img:ground/ground_3/spriteFrame': 'battle-ground.png',
  },
  words: {'英雄':'武将','要塞':'军营','远征':'征战','挑战':'演武','天赋':'军略','骑士王子':'赵云','埃文森林':'黄巾之乱','修道院':'涿郡'},
  theme: {ink:'#382C25', gold:'#BD914E', vermilion:'#8E352B', paper:'#E7D1A6', tabSymbols:['将','营','征','战','策'],tabIconY:65},
  jobPreview: {isUnlock:true,grade:0,progress:0,totalProgress:0,isOpenAwake:0,awakePiece:0,awakeRedPoint:false},
  navigation: {initialView:'home',homeTab:2,heroTab:0,y:618,width:520,height:36,itemWidth:165,fontSize:20,color:'#392B23',textColor:'#E7D1A6',items:[{label:'样板 · 首页',view:'home'},{label:'武将',view:'hero'},{label:'首战回放',view:'battle'}]},
  sample: {map:'campaign-map.png', ground:'battle-ground.png', chapterName:'黄巾之乱', chapterId:1,
    cityNames:{1:'涿郡',2:'颍川',3:'广宗',4:'下曲阳',5:'宛城',6:'汝南',7:'陈留',8:'洛阳',9:'虎牢关',10:'长安'}},
  diagnostics: {enabled:true, file:'sanguo-sample-diagnostics.json', treeFile:'sanguo-sample-tree.json', intervalMs:3000},
};
