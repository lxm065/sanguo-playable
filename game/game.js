/** 独立入口由配置选择，本地模式不安装录制器或启动原登录。 */
if(require('./mode.config').mode==='replay')require('./replay-entry');else require('./play/boot');
