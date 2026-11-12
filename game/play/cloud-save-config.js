'use strict';
/** 云存档、会话检测、容量和交互文案统一配置，协议版本独立于游戏发布版本。 */
module.exports={
 enabled:true,path:'/game/v1/subscriptions/campaign',schemaVersion:1,
 metadataKey:'sanguo.cloud.v1',ownerKey:'sanguo.cloud.owner',archiveKey:'sanguo.cloud.recovery',
 corruptKey:'sanguo.classic.v3.player.corrupt',maxSnapshotBytes:1048576,
 debounceMs:1500,retryMs:5000,maxRetryMs:30000,retryFactor:2,heartbeatMs:15000,leaseMs:45000,refreshAheadMs:120000,
 text:{connecting:'正在连接账号并核对存档',reconnecting:'本机已保存，正在自动同步',checking:'正在恢复同步',offline:'网络恢复中，进度已保留，联网后自动继续。',paused:'网络恢复中，稍后继续操作',startupRetry:'正在重新连接，进度已保留',
  replaced:'账号已在其他设备登录。当前设备已停止保存，请退出游戏。',expired:'登录已过期，请退出后重新进入；本机未同步进度已保留。',
  conflict:'云端已有不同进度，已保留本机副本。请退出后重新进入，选择需要恢复的存档。',localError:'本机存储暂不可用，已暂停操作，请退出后重试。',
  invalid:'存档不完整或版本不兼容，原数据已保留。',missing:'本机存档损坏，云端暂无可恢复记录，原数据已保留。',
  conflictTitle:'发现不同进度',cloudChoice:'恢复云端',localChoice:'保留本机',title:'存档与账号',retry:'重试',exit:'退出',sync:'同步存档',synced:'云端已同步',saving:'正在同步',pending:'本机已保存，待同步'},
 profile:{height:740,statusY:-210,buttonY:-267,buttonWidth:260,statusWidth:500,statusFont:23,buttonHeight:48,versionY:-325},
 indicator:{x:0,y:623,width:520,height:28,font:18,color:'#E7D7AF',background:'#211D17CC'},
};
