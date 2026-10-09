"use strict";
/** 集中声明入口、每日限制和回访条件；次数不代表不同好友人数。 */
const inviteLimit=Math.max(...require('./activity-config').invite.targets);
module.exports={minHideMs:2000,timeoutMs:30000,scenarios:{mine:{bucket:'mine'},speed:{bucket:'speed'},daily:{bucket:'daily',limit:1},invite:{bucket:'invite',limit:inviteLimit},newcomer:{bucket:'invite',limit:inviteLimit}},text:{busy:'正在等待分享返回，请勿重复点击。',too_fast:'返回过快，本次未完成。请分享后再返回游戏。',timeout:'本次分享已超时，请重新分享。',no_hide:'未检测到离开游戏，本次未完成。',failed:'分享未完成，请重试。',unavailable:'当前环境不支持分享流程，请在手机微信中打开。',limit:'今日该分享奖励已完成。',note:'完成邀请分享领取奖励，每日最多{0}次。',newcomer:'将游戏分享给好友即可参与邀请分享奖励。\n\n按分享离开及返回流程计次，\n不核验好友人数或新人通关。'}};
