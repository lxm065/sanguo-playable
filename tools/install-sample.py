"""仅在独立副本接入换皮与本地资源，原主分包保留摘要。"""
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'game'
SOURCE=ROOT.parent/'__APP__.wxapkg_decrypt_unpack'

def main():
    """重复执行可更新接入点；不修改原版任何文件。"""
    settings=json.loads((SOURCE/'src/settings.51118.json').read_text(encoding='utf-8'))
    settings['assets']['server']=''
    settings['assets']['remoteBundles']=[]
    for bundle in (GAME/'remote').iterdir():
        target=GAME/'assets'/bundle.name
        shutil.copytree(bundle,target,dirs_exist_ok=True)
        scripts=GAME/'src/bundle-scripts'/bundle.name
        if scripts.is_dir():
            for script in scripts.glob('*.js'):
                shutil.copy2(script,target/script.name)
    (GAME/'src/settings.51118.json').write_text(json.dumps(settings,ensure_ascii=False),encoding='utf-8')
    entry=(SOURCE/'game.js').read_text(encoding='utf-8')
    entry="require('./sample-diagnostics').install(wx, require('./skin.config').diagnostics);\n"+entry
    (GAME/'game.js').write_text(entry,encoding='utf-8')
    shutil.copy2(ROOT.parent/'traffic-captures/official-replay.jsonl',GAME/'replay-data/official-replay.txt')
    replay=(SOURCE/'traffic-recorder.config.js').read_text(encoding='utf-8').replace('http://usr/traffic-recordings/official-replay.jsonl','replay-data/official-replay.txt')
    (GAME/'traffic-recorder.config.js').write_text(replay,encoding='utf-8')
    mainfile=(SOURCE/'subpackages/main/game.js').read_text(encoding='utf-8')
    marker='require("../../offline-preview").install('
    if mainfile.count(marker)!=1:
        raise ValueError('原版接入点不唯一，停止注入')
    hook='require("../../skin-adapter").install({App:App,HeroModel:HeroModel,Character:Character,MainScene:MainScene,JobPanel:JobPanel,MapChapter:MapChapter,MapCity:MapCity,MapPanel:MapPanel,BagHero:BagHero,HeroAniStateEnum:HeroAniStateEnum,BattleData:BattleData,FightData:FightData,EmbattleInfo:EmbattleInfo,RoleData:RoleData,UIId:UIId,GameEvents:GameEvents,ViewZOrder:ViewZOrder,loadEngine:function(){return System.import("cc")}}),'
    (GAME/'subpackages/main/game.js').write_text(mainfile.replace(marker,hook+marker),encoding='utf-8')
    private=json.loads((GAME/'project.private.config.json').read_text(encoding='utf-8'))
    private['projectname']='三国换皮样板-本地回放'
    private['setting']['compileHotReLoad']=False
    (GAME/'project.private.config.json').write_text(json.dumps(private,ensure_ascii=False,indent=2),encoding='utf-8')
    print('样板接入完成；资源路径为本地 assets，战报读取包内录制。')

if __name__=='__main__':
    main()
