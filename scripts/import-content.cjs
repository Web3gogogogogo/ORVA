// One-time import. Run before editing translations; never run as a deployment build.
const fs = require('node:fs');
const path = require('node:path');
const modules = process.env.ORVA_TOOL_MODULES || path.resolve('node_modules');
const {parseHTML} = require(path.join(modules, 'linkedom'));
const OpenCC = require(path.join(modules, 'opencc-js'));
const traditional = OpenCC.Converter({from:'cn',to:'tw'});
const strings = {};
function add(key, text) { strings[key] = text.trim(); return key; }
fs.mkdirSync('content', {recursive:true});
const {document} = parseHTML(fs.readFileSync('dist/index.html','utf8'));
let hi=0;
for (const el of document.querySelectorAll('*')) {
  if (['SCRIPT','STYLE'].includes(el.tagName) || el.closest('.brand-wordmark') || el.id==='year') continue;
  const bindings=[];
  [...el.childNodes].forEach((node,index)=>{
    if(node.nodeType!==3 || !/[\p{L}]/u.test(node.textContent)) return;
    const key=add('home.'+String(++hi).padStart(3,'0'),node.textContent);
    bindings.push(index+':'+key);
    const text=document.createElement('orva-text');
    text.setAttribute('data-i18n',key);
    text.textContent=node.textContent;
    node.replaceWith(text);
  });
  // A custom inline element preserves text boundaries across HTML serialization.
  for(const attr of ['aria-label','alt']){
    if(el.getAttribute(attr)) el.setAttribute('data-i18n-'+attr,add('home.'+String(++hi).padStart(3,'0'),el.getAttribute(attr)));
  }
  if(el.tagName==='META' && ['description','og:title','og:description'].includes(el.getAttribute('name')||el.getAttribute('property')))
    el.setAttribute('data-i18n-content',add('home.'+String(++hi).padStart(3,'0'),el.getAttribute('content')));
}
for(const a of document.querySelectorAll('a[download]')) {
  a.setAttribute('href','/whitepaper/'); a.removeAttribute('download');
  for(const text of a.querySelectorAll('[data-i18n]')) {const key=text.getAttribute('data-i18n');strings[key]=strings[key].replace('下载白皮书','阅读白皮书');}
}
fs.writeFileSync('content/home.template.html',document.toString());
const ui = {
  language:'语言', openMenu:'打开导航菜单', closeMenu:'关闭导航菜单',
  whitepaper:'白皮书', home:'首页', backHome:'返回首页', top:'返回顶部',
  toc:'章节导航', progress:'阅读进度', download:'下载原版 PDF（简体中文）',
  title:'ORVA Protocol 白皮书', subtitle:'由真实能源经营现金流驱动的 RWA-DeFi 协议',
  version:'版本 V1.0', source:'全文网页版 · 与原版 PDF 对照阅读',
  edition:'本网页为 ORVA 白皮书 V1.0 的全文及翻译版本。项目数据、规划及声明沿用原文，请结合原版 PDF 阅读。',
  tableScroll:'表格可横向滚动', readPaper:'阅读白皮书', original:'原版 PDF',
  loadError:'此语言暂时无法加载，请重试。', retry:'重试', section:'章节',
  figure:'图示', paperNav:'白皮书导航', closeToc:'收起目录'
};
Object.entries(ui).forEach(([k,v])=>add('ui.'+k,v));
const tables=[
  {id:'assets',caption:'表 1 ORVA 四类 RWA 资产对照',headers:['RWA 类别','锚定资产','权益含义','销毁触发条件'],rows:[
    ['气源收益权','周边零散气井产气销售净收益','对应产气量销售净收益份额','对应收益周期结束'],
    ['集输设施服务收益权','集气站集输服务费（0.1 元/立方米）','集输处理设施服务收益份额','服务结算周期完结'],
    ['储气库容使用权','3 亿立方米储气库可使用库容','对应库容夏注冬采使用权（非天然气实物）','库容使用周期到期'],
    ['天然气贸易现金流权益','贸易板块净现金流（约 1.5 亿元/年）','购销业务净收益份额','对应结算周期完结']
  ]},
  {id:'allocation',caption:'表 2 ORVA 代币分配方案',headers:['分配板块','占比','解锁规则','用途说明'],rows:[
    ['ORVA 协议国库','35%','4 年线性解锁，12 个月锁仓','DeFi 奖励池、安全审计、系统迭代、风险准备金'],
    ['实体项目数字化团队','25%','3 年线性解锁，18 个月锁仓','开江项目数字化建设、运维团队'],
    ['产业生态参与方','20%','随生态贡献逐步释放','气源方、管网、下游产业机构生态激励'],
    ['战略技术与 DeFi 合作机构','12%','2 年线性解锁，12 个月锁仓','DeFi 协议开发、生态合作伙伴'],
    ['开发者社区','8%','分批释放','DApp、合约工具开发奖励']
  ]},
  {id:'risks',caption:'表 3 风险识别与应对方案',headers:['风险类别','风险描述','应对方案'],rows:[
    ['实体现金流不及预期','开江实体项目经营不及预期，造成协议国库收入下降','RWA 发行前核验线下商业合同；定期第三方 PoR 审计；DeFi 奖励完全来源于实体协议服务收入；链上权益不承诺固定收益'],
    ['DeFi 智能合约风险','质押合约、收益流、Vault 合约漏洞','多家第三方安全审计；漏洞赏金计划；关键参数升级需 DAO+产业委员会双重审批'],
    ['预言机数据风险','实体计量、回款数据被篡改','多预言机节点交叉校验；线下审计报告哈希上链；异常数据自动拦截，拒绝触发收益分发'],
    ['监管合规风险','能源强监管行业，DeFi-RWA 容易越界','严格区分线下实体业务与链上 DeFi；DeFi 模块面向境外；境内不开展代币发行交易；RWA 仅作权益凭证'],
    ['DeFi 投机风险','短期投机用户干扰协议长期产业目标','质押合约引入时间加权 Boost 放大系数；设置提前解锁惩罚，奖励向长期锁仓参与者倾斜'],
    ['数据泄露风险','能源敏感生产数据泄露','原始生产数据链下存储，链上只上哈希；隐私计算保护商业敏感参数']
  ]}
];
for(const table of tables){
 table.caption=add('table.'+table.id+'.caption',table.caption);
 table.headers=table.headers.map((x,i)=>add('table.'+table.id+'.head.'+i,x));
 table.rows=table.rows.map((r,i)=>r.map((x,j)=>add('table.'+table.id+'.'+i+'.'+j,x)));
}
const diagrams = {
 flow: {caption:'图 1 ORVA 完整业务闭环：实体现金流 → RWA 资产层 → DeFi 协议层',
 labels:['DeFi 协议层','ORVA 质押锁仓（数量 × 期限 × 参与时间）','加权权重计算 · Boost 放大系数','收益流分发器 · 国库奖励分配','DAO 治理投票 · 产业委员会初审','协议国库（实体服务收入上链）','RWA 资产层','气源收益权','集输服务收益权','储气库容使用权','贸易现金流权益','预言机 PoR 储备证明校验','IoT 计量 · 商业合同 · 回款凭证','线下实体链路','零散气井 · 产气计量','集气站 · 净化压缩','储气库 · 管网 · 夏注冬采','下游销售 · 回款现金流']},
 architecture: {caption:'图 2 ORVA Protocol 技术架构分层',
 labels:['DApp 应用层','实体合作方门户 · ORVA-DeFi 门户（质押/奖励/治理）· 审计监管门户','API / SDK 接口层','实体系统对接 · 审计查询 · 第三方 DApp 开发接口','ORVA-DeFi 核心合约层','RWA 登记 · 质押锁仓 · RWA-Vault · 收益流分发 · Gauge 投票 · 国库 · DAO 治理','区块链底层','主网（DeFi 合约）· 联盟链（国内存证）· 跨链网关 · 分布式存储+哈希存证','可信预言机中间件层','多节点 PoR 校验 · 机构 KYC · 隐私处理（原始数据不上链）','实体感知层','井口/集气站/储气库 IoT 计量 · ERP/贸易合同/回款台账 · 第三方审计','安全基线：多轮合约审计 · 漏洞赏金 · 物理隔离','边界：DeFi 仅处理协议权益，不干预实体经营']}
};
for(const [name,d] of Object.entries(diagrams)) {d.caption=add('figure.'+name+'.caption',d.caption);d.labels=d.labels.map((s,i)=>add('figure.'+name+'.'+i,s));}
(async()=>{
 const pdfjs=await import(require('node:url').pathToFileURL(path.join(modules,'pdfjs-dist/legacy/build/pdf.mjs')).href);
 const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync('dist/assets/orva-protocol-whitepaper-v1.pdf')),useSystemFonts:true}).promise;
 const blocks=[];const pages=[];let current=null, count=0;
 const push=(type,text,page,number)=>{current={type,key:add('paper.'+String(++count).padStart(3,'0'),text),page};if(number)current.id='section-'+number.replaceAll('.','-');blocks.push(current);};
 for(let n=4;n<=doc.numPages;n++) {
  const page=await doc.getPage(n);const txt=await page.getTextContent();let rows=[];
  for(const item of txt.items){if(!item.str.trim()||item.transform[5]>780||item.transform[5]<60)continue;let row=rows.find(r=>Math.abs(r.y-item.transform[5])<3);if(!row){row={y:item.transform[5],items:[]};rows.push(row);}row.items.push({x:item.transform[4],s:item.str,h:Math.abs(item.transform[0])});}
  rows=rows.sort((a,b)=>b.y-a.y).map(r=>({...r,h:Math.max(...r.items.map(i=>i.h)), x:Math.min(...r.items.map(i=>i.x)),text:r.items.sort((a,b)=>a.x-b.x).map(i=>i.s).join('')}));
  pages.push({page:n,lines:rows.map(r=>({text:r.text,y:Math.round(r.y),x:Math.round(r.x)}))});
  let table=false;
  for(const r of rows){
   const line=r.text.trim();
   if(n===12 && /^RWA\s*类别/.test(line)){blocks.push({type:'table',name:'assets',page:n});table=true;current=null;}
   if(n===13 && /^分配板块/.test(line)){blocks.push({type:'table',name:'allocation',page:n});table=true;current=null;}
   if(n===14 && !/^8\.3/.test(line) && !blocks.some(b=>b.id==='section-8-3'))continue;
   if(n===17 && /^风险类别/.test(line)){blocks.push({type:'table',name:'risks',page:n});table=true;current=null;}
   if(table || /^表\s*[123]/.test(line))continue;
   if(/^图\s*[12]/.test(line)){blocks.push({type:'figure',name:/^图\s*1/.test(line)?'flow':'architecture',page:n});current=null;continue;}
   const heading=r.h>12 ? line.match(/^(\d+(?:\.\d+)?)\s*(.+)$/) : null;
   if(heading){push(heading[1].includes('.')?'h3':'h2',heading[2],n,heading[1]); current.number=heading[1];continue;}
   if(current?.id==='section-5' && line==='层'){strings[current.key]+='层';continue;}
   if(line.startsWith('▪')){push('li',line.replace(/^▪\s*/,''),n);continue;}
   if(line.startsWith('Vote_Reward_Weight')){push('formula',line,n);continue;}
   // PDF paragraphs begin indented, or flush-left after a heading/table.
   const isNote=n===20 && line.startsWith('本白皮书');
   if(!current || ['h2','h3','formula'].includes(current.type) || (r.x>94 && current.type!=='li') || isNote){push(isNote?'note':'p',line,n);}
   else strings[current.key]+=(/[A-Za-z0-9]$/.test(strings[current.key]) && /^[A-Za-z0-9]/.test(line)?' ':'')+line;
  }
 }
 fs.writeFileSync('content/pdf-extraction.json',JSON.stringify(pages,null,2)+'\n');
 fs.writeFileSync('content/whitepaper.structure.json',JSON.stringify({pages:doc.numPages,blocks,tables,diagrams},null,2)+'\n');
 fs.writeFileSync('content/source.json',JSON.stringify(strings,null,2)+'\n');
 fs.writeFileSync('content/zh-Hant.json',JSON.stringify(Object.fromEntries(Object.entries(strings).map(([k,v])=>[k,traditional(v)])),null,2)+'\n');
 console.log('Imported',hi,'home strings,',blocks.length,'paper blocks;',Object.keys(strings).length,'total strings.');
})();
