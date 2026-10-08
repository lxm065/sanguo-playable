"""提取原版击杀横幅和攻击音频，源文件保持只读。"""
import json,glob,subprocess,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent/'sanguo-sample/game/remote'
FFMPEG=Path(json.loads((ROOT/'tools/battle-audio-import.config.json').read_text())['ffmpeg'])
AUDIO={'melee':'hero/102D','ranged':'hero/103D','magic':'hero/101D','ice':'hero/101D_1','merge':'effect/star_up'}
REGIONS={'mark_kill':'mark','bg_atker':'attacker','bg_defer':'victim','bg_kill':'background'}
NUMBERS={6:1,7:2,10:3,5:4,11:5}
def decode(u):
    """还原 Cocos 压缩 UUID。"""
    chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    s=u[:2]
    for i in range(2,22,2):
        a,b=chars.index(u[i]),chars.index(u[i+1]);s+=f'{a>>2:x}{((a&3)<<2)|(b>>4):x}{b&15:x}'
    return '-'.join([s[:8],s[8:12],s[12:16],s[16:20],s[20:]])
def main():
    """按已核对帧区域导出，旋转帧恢复到原始方向。"""
    output=ROOT/'game/skin-assets/feedback';output.mkdir(exist_ok=True)
    source=BASE/'module_battle/native/1e/1efe8eca6.ffd6a.png';image=Image.open(source)
    frames=json.loads((BASE/'module_battle/import/0e/0efe8eca6.02190.json').read_text())[5];receipt=[]
    for index,entry in enumerate(frames):
        frame=entry[0][0];name=REGIONS.get(frame['name']) or (str(NUMBERS[index]) if index in NUMBERS else None)
        if not name:continue
        r=frame['rect'];x,y,w,h=r['x'],r['y'],r['width'],r['height'];rot=frame['rotated']
        crop=image.crop((x,y,x+(h if rot else w),y+(w if rot else h)))
        if rot:crop=crop.transpose(Image.Transpose.ROTATE_90)
        crop.save(output/(name+'.png'));receipt.append({'target':name+'.png','source':str(source),'frame':frame})
    config=json.loads(next((BASE/'audio').glob('config*.json')).read_text())
    for name,event in AUDIO.items():
        key=next(k for k,v in config['paths'].items() if v[0]==event);uid=decode(config['uuids'][int(key)]);src=next((BASE/'audio/native'/uid[:2]).glob(uid+'.mp3')) if list((BASE/'audio/native'/uid[:2]).glob(uid+'.mp3')) else next((BASE/'audio/native'/uid[:2]).glob(uid+'.*.mp3'))
        subprocess.run([str(FFMPEG),'-hide_banner','-loglevel','error','-y','-i',str(src),'-map_metadata','-1','-ac','1','-ar','24000','-b:a','48k',str(output/(name+'.mp3'))],check=True)
        receipt.append({'target':name+'.mp3','source':str(src),'event':event,'sha256':hashlib.sha256(src.read_bytes()).hexdigest()})
    (ROOT/'docs/battle-refinement/feedback-assets.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf8')
if __name__=='__main__':main()
