'use strict';
const config=require('./challenge-config'),rankView=require('./challenge-settlement-view');
/** 菜单读取持久化积分，未开始挑战时展示初始段位，不为显示而创建存档。 */
function menu(v,parent){const c=config.menuRank,rating=v.service.state?.rating||0,rank=rankView.rankInfo(rating),anchor=v.ui.node(parent,'challenge-menu-rank',c.x,c.y,120,120);anchor.setScale(c.scale,c.scale,1);rankView.medal(v,anchor,0,0,rank.color,rank.asset);v.ui.text(parent,'★'.repeat(rank.stars),c.x,c.starsY,c.font,'#D99613',110,28);v.ui.text(parent,rank.name,c.nameX,c.nameY,23,'#6F563D',190,28);v.ui.text(parent,String(rating),c.nameX,c.pointsY,21,'#6F563D',190,25);}
/** 大厅和结算使用同一段位算法，积分升降后星级同步更新。 */
function lobby(v){const rating=v.service.state?.rating||0,rank=rankView.rankInfo(rating),c=config.menuRank,stars='★'.repeat(rank.stars),starsWidth=rank.stars*c.lobbyFont,total=c.lobbyBadgeSize+c.lobbyGap*2+starsWidth+c.lobbyTextWidth,left=-total/2;if(rank.asset)v.ui.image(v.root,rank.asset,left+c.lobbyBadgeSize/2,c.lobbyBadgeY,c.lobbyBadgeSize,c.lobbyBadgeSize);v.ui.text(v.root,stars,left+c.lobbyBadgeSize+c.lobbyGap+starsWidth/2,c.lobbyBadgeY,c.lobbyFont,'#F4D490',starsWidth+2,50);v.ui.text(v.root,rank.name+' · '+rating+'分',total/2-c.lobbyTextWidth/2,c.lobbyBadgeY,c.lobbyFont,'#F4D490',c.lobbyTextWidth,50);}

module.exports={menu,lobby};
