'use strict';
/** 把本样板的诊断信息写入独立沙盒文件；不保存账号或请求正文。 */
function install(wxApi,config){
  if(!config.enabled)return;
  const fs=wxApi.getFileSystemManager(),base=wxApi.env.USER_DATA_PATH;
  const report={startedAt:new Date().toISOString(),errors:[],stage:'entry'};
  globalThis.__sampleReport=report;
  /** 持久化少量错误和换皮状态，供本地验证读取。 */
  function save(){try{const skin=globalThis.__sanguo;fs.writeFileSync(base+'/'+config.file,JSON.stringify({...report,skinReady:skin?.ready,skinErrors:skin?.errors,skinEvents:skin?.events}),'utf8');}catch(error){console.warn('[sample-diagnostics]',error.message);}}
  wxApi.onError(error=>{report.errors.push(error.message||String(error));save();});
  /** 输出当前场景的结构，不包含角色账号数据。 */
  function tree(){
    const cc=globalThis.__sanguo?.cc,scene=cc?.director.getScene();if(!scene)return;
    /** 保留界面路径与可见文字，便于验证映射是否命中。 */
    function visit(node,parent){const p=parent+'/'+node.name;return [{path:p,active:node.active,size:node.getComponent(cc.UITransform)?.contentSize,position:{x:node.position.x,y:node.position.y},sprite:node.getComponent(cc.Sprite)?.spriteFrame?.name,components:node.components?.map(c=>c.constructor.name),text:node.getComponent(cc.Label)?.string},...node.children.flatMap(child=>visit(child,p))];}
    try{fs.writeFileSync(base+'/'+config.treeFile,JSON.stringify(visit(scene,'')),'utf8');}catch(error){report.errors.push(error.message);}
  }
  setInterval(function checkpoint(){save();tree();},config.intervalMs);save();
}
module.exports={install};
