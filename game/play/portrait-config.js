'use strict';
/** 武将头像配置；来源详情、模型镜头及生成提示词见 source-assets/portrait-manifest.json。 */
const modelIds=['zhenji','xuchu','xiahouyuan','zhaoyun','dianwei','diaochan','huangzhong','zhangfei','xiaoqiao','zhangliao','zhouyu','guanyu','machao','sunshangxiang','huangyueying','zhurong','lvbu'];
const conceptIds=['taishici','ganning','zhangjiao','yanliang'];
module.exports={version:1,region:[0,0,1,1],size:512,background:'#554b39',entries:Object.fromEntries([...modelIds,...conceptIds].map(id=>[id,{file:'handbook/'+id+'.png',sourceType:modelIds.includes(id)?'model-render':'concept',modelPending:conceptIds.includes(id)}]))};
