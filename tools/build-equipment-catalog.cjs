'use strict';
const fs=require('node:fs'),path=require('node:path');
const theme=require('../game/play/equipment-theme');
/** 将已恢复的装备表转为包内只读图鉴数据，特殊道具与默认行不混入三类装备。 */
function build(){
 const root=path.resolve(__dirname,'../../策划资料库/原始配置');
 const read=name=>JSON.parse(fs.readFileSync(path.join(root,name+'.json'),'utf8'));
 const equipment=read('equip_cfg'),skills=read('hero_skill_cfg'),words=read('words');
 const rows=Object.entries(theme).map(([id,appearance])=>{
  const source=equipment[id],attributes=[];
  for(let i=1;i<=5;i++){const type=Number(source['ab_type'+i]),raw=Number(source['ab_prob'+i]);if(!type)continue;const value=type>100&&type<200?raw/100:[201,202].includes(type)?-raw:raw;attributes.push(String(words[22000+type]).replace('{0}',value));}
  const effects=[];for(let i=1;i<=4;i++){const skill=skills[source['skill_'+i]];if(skill)effects.push(Object.entries(theme).reduce((text,[key,value])=>text.split(equipment[key].name).join(value.name),clean(skill.des)).replace(/死亡一指/g,'朱雀焚天'));}
  return {id,...appearance,category:id.startsWith('70')?'physical':id.startsWith('71')?'magic':'support',quality:Number(source.color),unlock:{kind:Number(source.unlock_type),value:Number(source.unlock_value)},attributes,effects};
 });
 fs.writeFileSync(path.resolve(__dirname,'../game/play/equipment-catalog-data.js'),"'use strict';\n/** 三国装备图鉴基础资料，由本地恢复配置生成。 */\nmodule.exports="+JSON.stringify(rows,null,2)+';\n');
 console.log('已生成 '+rows.length+' 件装备图鉴数据');
}
/** 把原文可点击的状态解释展开成正文，去掉富文本标签，避免遗漏技能定义。 */
function clean(text){return text.replace(/<on[^>]*param="([^"|]*)\|([^"]*)"[^>]*>.*?<\/on>/g,(_,name,desc)=>name+'（'+desc+'）').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ');}
if(require.main===module)build();
module.exports={build,clean};
