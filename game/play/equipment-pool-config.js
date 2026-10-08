"use strict";
/** 物攻、法攻与防御辅助按接近三等份配置；重复项表示抽取权重。 */
const physical=['7001','7002'],magic=['7101','7104'],support=['7201','7202','7204','7206','7207','7208','7211'];
module.exports={physical,magic,support,blue:[...physical,...physical,...physical,...magic,...magic,...magic,...support],purple:['7212','7213']};
