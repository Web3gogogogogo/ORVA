// Editorial preparation only. Production uses checked-in translations, never this service.
const fs=require('node:fs');
const path=require('node:path');
const OpenCC=require(path.join(process.env.ORVA_TOOL_MODULES || path.resolve('node_modules'),'opencc-js'));
const source=require('../content/source.json');
const labels={
 '002':'ORVA Protocol — 真实能源，可验证的权益','004':'ORVA Protocol — 真实能源，可验证的权益',
 '015':'真实能源 / 可验证的链上权益','023':'能源 RWA','025':'DeFi 基础设施','027':'真实资产','028':'可验证的流转',
 '029':'链下','030':'能源经营','031':'链上','032':'经济权益','033':'从能源到可验证的价值','034':'真实产业，支持可验证的参与',
 '035':'向下探索','037':'产业基础','042':'项目参数','043':'白皮书规划 / V1.0','055':'实体价值链',
 '059':'01 / 气源采集','062':'02 / 集输处理','065':'03 / 储气调峰','068':'04 / 贸易结算','071':'可核验的','072':'业务数据',
 '077':'预言机 / PoR','078':'链上','079':'现实世界资产层','085':'气源','091':'集输服务','097':'储气库容','103':'贸易现金流',
 '110':'ORVA 代币经济','114':'固定总量 / 不再增发','115':'规划分配','117':'白皮书','131':'加权质押','134':'投票','135':'奖励权重',
 '143':'协议收入流','148':'可验证的基础设施','154':'实体数据','156':'计量','158':'验证','160':'预言机','162':'记录','163':'结算',
 '165':'账本','169':'智能合约','171':'系统集成','175':'用户体验','178':'链上','180':'链下','182':'治理机制',
 '186':'链下 / 审查','193':'审查','194':'投票','195':'链上 / 参与','204':'条件驱动的路线图',
 '208':'0 — 12 个月','212':'13 — 24 个月','216':'25 — 48 个月','221':'风险','222':'合规',
 '227':'ORVA PROTOCOL / 真实能源，可验证的权益','239':'真实能源 / 链上权益'
};
for(const [id,text] of Object.entries(labels))source['home.'+id]=text;
fs.writeFileSync('content/source.json',JSON.stringify(source,null,2)+'\n');
const convert=OpenCC.Converter({from:'cn',to:'tw'});
fs.writeFileSync('content/zh-Hant.json',JSON.stringify(Object.fromEntries(Object.entries(source).map(([k,v])=>[k,convert(v)])),null,2)+'\n');
const entries=Object.entries(source);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function translateBatch(batch,lang){
 const q=batch.map(({i,v})=>'[ORVA'+String(i).padStart(5,'0')+']\n'+v).join('\n\n');
 for(let attempt=0;attempt<4;attempt++) {
  try {
   const response=await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl='+lang+'&dt=t&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(40000)});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json();const text=data[0].map(s=>s[0]||'').join('');
   const parts=[...text.matchAll(/\[\s*ORVA\s*(\d+)\s*\]\s*([\s\S]*?)(?=\[\s*ORVA|$)/g)];
   if(parts.length!==batch.length)throw new Error('Translation marker mismatch '+parts.length+'/'+batch.length);
   const result={};for(const m of parts){const item=batch.find(b=>b.i===Number(m[1]));if(!item||!m[2].trim())throw new Error('Invalid translation');result[item.k]=m[2].trim();}
   return result;
  }catch(error){if(attempt===3){if(batch.length>1){const middle=Math.ceil(batch.length/2);return {...await translateBatch(batch.slice(0,middle),lang),...await translateBatch(batch.slice(middle),lang)};}throw error;}await pause(1200*(attempt+1));}
 }
}
async function run(lang){
 const outputPath='content/'+lang+'.json';let result=fs.existsSync(outputPath)?JSON.parse(fs.readFileSync(outputPath,'utf8')):{};
 let batches=[],batch=[],length=0;
 entries.forEach(([k,v],i)=>{
  if(result[k])return;
  if(!/[\u3400-\u9fff]/.test(v)){result[k]=v;return;}
  if(length+v.length>1300){batches.push(batch);batch=[];length=0;}
  batch.push({k,v,i});length+=v.length;
 });if(batch.length)batches.push(batch);
 for(let i=0;i<batches.length;i++){
  Object.assign(result,await translateBatch(batches[i],lang));
  fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
  console.log(lang+': '+(i+1)+'/'+batches.length);
  await pause(150);
 }
 console.log(lang+': complete ('+Object.keys(result).length+' strings)');
}
(async()=>{for(const langs of [['en','ja'],['ko','vi'],['ur']])await Promise.all(langs.map(run));})().catch(e=>{console.error(e);process.exitCode=1;});
