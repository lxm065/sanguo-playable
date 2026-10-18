'use strict';
const {FortressBuilding}=require('./fortress-building');
/** 保留既有矿场服务入口，通用生命周期由要塞建筑服务负责。 */
class DiamondMine extends FortressBuilding{
 /** 默认矿场策略可注入测试，不影响其他建筑。 */
 constructor(progress,config=require('./diamond-mine-config')){super(progress,config);}
}
module.exports={DiamondMine};
