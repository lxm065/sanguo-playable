'use strict';
/** 装备表现仅消费真实战报，数值、触发概率与控制时长仍由战斗服务决定。 */
module.exports={sheep:{size:220,y:35},silence:{size:320,y:170},cast:{'7004':{effect:'bloodlust',self:true},'7010':{effect:'flame',self:true},'7102':{effect:'mana',self:true},'7103':{effect:'stomp'},'7109':{effect:'silence'},'7110':{effect:'lightning'},'7111':{effect:'dispel'},'7114':{effect:'lightning'}},impact:{'equipment-7003':'cleave','equipment-7114':'lightning'},statuses:{stun:'stomp',armorBreak:'cleave',slow:'iceNova',shield:'shield'},duration:.7};
