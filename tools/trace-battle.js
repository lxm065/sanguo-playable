sample.validationTrace=[];
const original=api.HeroModel.prototype.switchHeroState;
/** 开发验收只记录动画调用参数，完整转发原方法。 */
api.HeroModel.prototype.switchHeroState=function traceState(state){if(this.__sanguoSelected)sample.validationTrace.push({at:Date.now(),state,name:api.HeroAniStateEnum[state],args:Array.from(arguments)});return original.apply(this,arguments);};
return {installed:true,errors:sample.errors};
