'use strict';
const c=require('./march-background-config');
/** 只依当前章节选图，重玩旧章和恢复存档保持一致。 */
function file(chapter){return c.files[Math.floor((Math.max(1,Number(chapter)||1)-1)/c.chaptersPerMap)%c.files.length];}
/** 相邻背景上下镜像，使拼接边缘相同；路线与关卡仍由原模块绘制。 */
function render(ui,parent,chapter,height){for(let i=0;i<Math.ceil((height+c.tileHeight)/c.tileHeight);i++){const n=ui.image(parent,file(chapter),0,i*c.tileHeight+c.baseY,c.width,c.tileHeight);if(c.mirrorAlternating&&i%2)n.setScale(1,-1,1);}}
module.exports={file,render};
