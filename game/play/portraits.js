'use strict';
const config=require('./portrait-config');
/** 按稳定人物ID查询共享头像；未纳入本轮的人物沿用原文件。 */
function portraitFile(id){return config.entries[id]?.file||id+'-avatar.png';}
/** 将旧界面的头像路径映射到共享资源；主公、诸葛亮及非头像资源保持原路径。 */
function resolvePortraitFile(file){const match=/^([a-z]+)-avatar\.png$/.exec(file);return match?portraitFile(match[1]):file;}
module.exports={portraitFile,resolvePortraitFile};
