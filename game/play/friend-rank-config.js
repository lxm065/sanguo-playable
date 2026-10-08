'use strict';
/** 主域与开放数据域共用的排行榜协议；发布时生成独立 JS 配置。 */
module.exports={channel:'sanguo-friend-rank-v1',key:'stage',scope:'scope.WxFriendInteraction',
 metrics:{stage:{key:'stage',title:'关卡排行'},arena:{key:'arena',title:'挑战排位'}},ranks:require('./challenge-config').ranks,pointsPerRank:require('./challenge-config').pointsPerRank,starsPerTier:require('./challenge-config').settlement.starsPerTier,
 sections:require('./classic-config').chapter.sections.length,layers:require('./route-config').routes[0].length+1,
 maxScore:2147483647,timeoutMs:12000,fps:12,width:640,height:960,pageSize:6,
 entry:{image:'home-ui/leaderboard.png',iconSize:108,labelY:-53,x:-275,y:340,width:110,height:112},panel:{width:680,height:1120,listWidth:556,listHeight:834,listY:-6,titleY:493,titleFont:34,tabsY:443,tabOffset:145,tabWidth:264,tabHeight:48,navY:-461,navOffset:213,navWidth:174,navHeight:56,closeY:-524,closeWidth:254,closeHeight:57},
 table:{headerY:42,rowTop:72,rowGap:112,rowHeight:102,rankX:42,avatarX:85,avatarY:19,avatarSize:64,nameX:174,nameY:43,nameWidth:245,nameFont:27,detailY:78,detailFont:21,scoreX:610,scoreY:48,scoreFont:28,pageY:800,ownY:855,rankY:897,errorY:938},
 colors:{paper:'#E8D7AE',ink:'#543B27',gold:'#C99128',row:'#F6E7C6',self:'#FFE4A0'},
 labels:{title:'好友排行榜',metric:'远征最高进度',empty:'暂无好友成绩，邀请好友一起远征',loading:'正在读取微信好友成绩…',readError:'好友成绩读取失败，请点击刷新',uploadError:'成绩同步失败，请点击刷新重试',selfError:'个人信息暂不可用',syncReadError:'云端历史成绩读取失败，未覆盖记录'}};
