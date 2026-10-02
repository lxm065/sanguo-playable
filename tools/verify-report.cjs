'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'render.config.json'),'utf8'));
const puppeteer=require(path.join(config.rendererHome,'node_modules/puppeteer-core'));
/** 验证交付报告全部本地图像可读，页签切换只展示对应证据。 */
async function main(){
 const browser=await puppeteer.launch({executablePath:config.browser,headless:true,defaultViewport:{width:1200,height:1100}});
 try{const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve(__dirname,'../'+(process.argv[2]||'本地试玩验收.html'))).href);
 await page.waitForFunction(()=>Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0));
 const tabs=await page.$$eval('button[data-view]',nodes=>nodes.map(n=>n.dataset.view));
 for(const tab of tabs){await page.click('button[data-view="'+tab+'"]');const visible=await page.$$eval('main>section',nodes=>nodes.filter(n=>!n.hidden).map(n=>n.id));if(visible.length!==1||visible[0]!==tab)throw Error('页签异常 '+tab);}
 await page.click('button[data-view="'+tabs[0]+'"]');await page.screenshot({path:path.resolve(__dirname,'../evidence/report-preview.png'),fullPage:true});
 const result={status:'PASS',tabs,images:await page.$$eval('img',nodes=>nodes.length)};
 fs.writeFileSync(path.resolve(__dirname,'../evidence/report-verification.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
