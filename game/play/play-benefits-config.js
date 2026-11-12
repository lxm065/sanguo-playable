'use strict';
/** 官方商品、价格、有效期与核销额度由微信管理；此处只配置游戏入口及兼容策略。 */
module.exports={
 enabled:true,preload:true,minimumBaseLibrary:'3.17.2',minimumWechatVersion:'8.0.68',
 supportedPlatforms:['android'],allowSimulator:false,requestTimeoutMs:15000,
 pages:['home'],
 entry:{name:'play-benefits',x:-284,y:-165,width:112,height:107,cardY:9,cardWidth:78,cardHeight:65,
  background:'#24666B',edge:'#F3CB68',edgeHeight:4,edgeY:30,symbol:'畅',symbolY:9,symbolFont:42,
  label:'畅玩权益',labelY:-43,labelFont:25,labelWidth:140,labelHeight:40,color:'#FFFFFF'},
 text:{title:'畅玩权益',disabled:'畅玩权益暂未开放。',
  unsupported:'当前设备暂不支持畅玩权益，请使用 Android 微信 {wechat} 及以上版本。',
  outdated:'请更新微信后重试畅玩权益。',unavailable:'畅玩权益暂时不可用，请稍后重试。',
  loadFailed:'畅玩权益加载失败，请稍后重试。',showFailed:'畅玩权益暂时无法打开，请稍后重试。',
  timeout:'畅玩权益请求超时，请稍后重试。',disposed:'畅玩权益服务已关闭。',
  purchased:'畅玩权益购买成功',toastDurationMs:2500}
};
