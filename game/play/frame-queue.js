'use strict';
/** 串行执行重资源装配，每个任务之间让出事件循环供触摸和首帧绘制。 */
class FrameQueue{
 /** 调度器可注入测试，失败任务不会阻塞队列后续任务。 */
 constructor(delay,schedule=setTimeout){this.delay=delay;this.schedule=schedule;this.tasks=[];this.running=false;}
 /** 提交独立装配任务，返回其结果并隔帧启动后续任务。 */
 run(operation){return new Promise((resolve,reject)=>{this.tasks.push({operation,resolve,reject});if(!this.running)this.next();});}
 /** 每轮只运行一个任务，避免同一微任务批次初始化所有 Spine。 */
 next(){const task=this.tasks.shift();if(!task){this.running=false;return;}this.running=true;this.schedule(async()=>{try{task.resolve(await task.operation());}catch(e){task.reject(e);}finally{this.next();}},this.delay);}
}
module.exports={FrameQueue};
