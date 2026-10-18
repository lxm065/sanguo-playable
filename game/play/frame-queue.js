'use strict';
/** 串行执行重资源装配，每个任务之间让出事件循环供触摸和首帧绘制。 */
class FrameQueue{
 /** 调度器可注入测试，失败任务不会阻塞队列后续任务。 */
 constructor(delay,schedule=setTimeout){this.delay=delay;this.schedule=schedule;this.tasks=[];this.running=false;}
 /** 提交装配任务和有效性检查；失效节点直接跳过，不占用后续帧。 */
 run(operation,valid=()=>true){return new Promise((resolve,reject)=>{this.tasks.push({operation,valid,resolve,reject});if(!this.running)this.next();});}
 /** 每轮只运行一个任务，避免同一微任务批次初始化所有 Spine。 */
 next(){let task=this.tasks.shift();while(task&&!task.valid()){task.resolve();task=this.tasks.shift();}if(!task){this.running=false;return;}this.running=true;this.schedule(async()=>{try{task.resolve(task.valid()?await task.operation():undefined);}catch(e){task.reject(e);}finally{this.next();}},this.delay);}
}
module.exports={FrameQueue};
