'use strict';
/** 敌方相对棋盘的第0排靠近我方；按射程由前至后布阵，列序保证中线优先。 */
module.exports={columns:[2,3,1,4,0,5],rows:[{maxRange:1,order:[0,1,2]},{maxRange:99,order:[2,1,0]}]};
