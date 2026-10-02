"""接入独立外观和进度端口，保留旧档，不改压缩业务包。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'game/play'
def edit(name,before,after):
    """仅替换已确认的接入点，失配时中止避免静默修改错文件。"""
    p=ROOT/name;s=p.read_text(encoding='utf-8-sig')
    if after in s:return
    if before not in s:raise ValueError(name+' 接入点未找到')
    p.write_text(s.replace(before,after),encoding='utf8')
edit('config.js',"storageKey:'sanguo.local.campaign.v2.player',storageBackupKey:'sanguo.local.campaign.v2.player.backup'","storageKey:'sanguo.classic.v3.player',storageBackupKey:'sanguo.classic.v3.player.backup'")
edit('config.js',"startingGold:300,startingSeed:1847,startingRoster:['zhaoyun','zhangfei','zhangfei','zhangfei']","startingGold:0,startingSeed:1847,startingRoster:['zhaoyun','zhaoyun','zhaoyun']")
edit('config.js',"initialDeployment:[{index:0,slot:8},{index:1,slot:14}]","initialDeployment:[]")
edit('config.js','baseDeployedLimit:3','baseDeployedLimit:2')
edit('campaign.js',"limit(){return Math.min", "limit(){if(this.hooks?.limit)return this.hooks.limit();return Math.min")
edit('campaign.js',"this.roster.filter(h=>h.id!==unit.heroId)","this.availableRoster().filter(h=>h.id!==unit.heroId)")
edit('campaign.js',"roll(){const rng=random(this.state.seed++);this.state.shop=Array.from({length:this.rules.shopSize},()=>this.roster[Math.floor(rng()*this.roster.length)].id);}","roll(){const rng=random(this.state.seed++),pool=this.availableRoster();this.state.shop=Array.from({length:this.rules.shopSize},()=>pool[Math.floor(rng()*pool.length)].id);}\n /** 可获取棋子由进度端口筛选，敌人显示不受玩家解锁限制。 */\n availableRoster(){return this.hooks?.pool?this.hooks.pool():this.roster;}")
edit('campaign.js',"enemies(){const r=", "enemies(){if(this.hooks?.enemies){const enemies=this.hooks.enemies();if(enemies)return enemies;}const r=")
edit('campaign.js',"const allies=this.state.units.filter(u=>u.slot>=0);", "this.hooks?.beforeFight?.(training);const allies=this.state.units.filter(u=>u.slot>=0);")
edit('campaign.js',"()=>this.roster[Math.floor(rng()*this.roster.length)].id):[]", "()=>{const pool=this.availableRoster();return pool[Math.floor(rng()*pool.length)].id;}):[]")
edit('campaign.js',"this.state.gold+=p.gold;this.state.battles++;", "this.hooks?.settle?.(p);this.state.gold+=p.gold;this.state.battles++;")
edit('boot.js',"{PlayView}=require('./view')", "{ClassicView:PlayView}=require('./classic-view')")
edit('boot.js',"const model=new Campaign(config,roster,storage(wx,config)),view=new PlayView(cc,root,assets,model,config,roster);", "const model=new Campaign(config,roster,storage(wx,config));require('./classic-hooks').attach(model,roster);const view=new PlayView(cc,root,assets,model,config,roster);")
print('接入完成')
