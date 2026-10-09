'use strict';
const c=require('./march-header-config');
/** 标题来源于真实章节状态，图片不携带固定关卡文字。 */
function title(progress){const p=progress.state;return c.title.format.replace('{chapter}',p.chapter).replace('{section}',p.section).replace('{total}',progress.config.chapter.sections.length).replace('{title}',progress.section().title);}
/** 返回热区覆盖画面中的圆形箭头，继续使用保存退出与投降弹窗。 */
function render(v){v.ui.image(v.root,c.image,c.x,c.y,c.width,c.height);const t=c.title,label=v.ui.text(v.root,title(v.progress),t.x,t.y,t.font,t.color,t.width,t.height);label.isBold=true;label.fontFamily=t.fontFamily;label.enableWrapText=false;require('./march-back-view').render(v,c.back,false);}
module.exports={title,render};
