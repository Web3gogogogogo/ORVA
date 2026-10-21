const fs=require('node:fs');
const path=require('node:path');
const {parseHTML}=require(path.join(process.env.ORVA_TOOL_MODULES || path.resolve('node_modules'),'linkedom'));
const structure=require('../content/whitepaper.structure.json');
const source=require('../content/source.json');
const editorial=require('./editorial.cjs');
const languages={'zh-Hant':'繁體中文',en:'English',ko:'한국어',ja:'日本語',vi:'Tiếng Việt',ur:'اردو'};
const overrides=require('../content/overrides.json');
const zh={...require('../content/zh-Hant.json'),...overrides['zh-Hant']};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const t=k=>escape(zh[k]);
const text=k=>`<orva-text data-i18n="${k}">${t(k)}</orva-text>`;
const selector=()=>`<label class="language-control"><span class="language-icon" aria-hidden="true">◎</span><span class="sr-only" data-i18n="ui.language">${t('ui.language')}</span><select id="site-language" aria-label="${t('ui.language')}" data-i18n-aria-label="ui.language">${Object.entries(languages).map(([code,name])=>`<option value="${code}" lang="${code}"${code==='zh-Hant'?' selected':''}>${name}</option>`).join('')}</select></label>`;
const error=()=>`<div class="language-error" role="alert" hidden><span data-i18n="ui.loadError">${t('ui.loadError')}</span> <button type="button" id="language-retry" data-i18n="ui.retry">${t('ui.retry')}</button></div>`;
function shared(document){
 document.documentElement.setAttribute('lang','zh-Hant');document.documentElement.setAttribute('dir','ltr');
 for(const script of [...document.querySelectorAll('script[src="main.js"],script[src="/main.js"]')])script.remove();
 for(const href of ['/i18n.css','/whitepaper.css']) {if(href==='/whitepaper.css'&&!document.body.classList.contains('whitepaper-page'))continue;const link=document.createElement('link');link.setAttribute('rel','stylesheet');link.setAttribute('href',href);document.head.append(link);}
 const ui=document.createElement('script');ui.id='initial-ui';ui.type='application/json';ui.textContent=JSON.stringify(Object.fromEntries(Object.entries(zh).filter(([k])=>k.startsWith('ui.')))).replaceAll('<','\\u003c');document.head.append(ui);
 for(const src of ['/i18n.js','/main.js']){const s=document.createElement('script');s.setAttribute('src',src);s.setAttribute('defer','');document.head.append(s);}
 document.body.insertAdjacentHTML('afterbegin',error());
 const noscript=document.createElement('noscript');noscript.innerHTML='<style>.reveal{opacity:1;transform:none}</style>';document.head.append(noscript);
}
function apply(document){
 for(const el of document.querySelectorAll('[data-i18n]')) {
  const value=zh[el.getAttribute('data-i18n')];if(value===undefined)throw Error('Missing '+el.getAttribute('data-i18n'));
  const old=el.textContent;el.textContent=(old.match(/^\s*/)?.[0]||'')+value+(old.match(/\s*$/)?.[0]||'');
 }
 for(const attr of ['aria-label','alt','content'])for(const el of document.querySelectorAll('[data-i18n-'+attr+']'))el.setAttribute(attr,zh[el.getAttribute('data-i18n-'+attr)]);
}
const home=parseHTML(fs.readFileSync('content/home.template.html','utf8')).document;
home.querySelector('title').setAttribute('data-i18n','home.004');
const metricKeys=['metric.investment','metric.processing','metric.storage','metric.pipeline'];
[...home.querySelectorAll('.metric-value')].forEach((el,i)=>{el.innerHTML=`<b>${text(metricKeys[i])}</b>`;});
home.querySelector('.nav-shell').insertAdjacentHTML('beforeend',selector());
for(const el of home.querySelectorAll('link[href],script[src],img[src]')){const attr=el.hasAttribute('src')?'src':'href';const value=el.getAttribute(attr);if(!value.startsWith('/')&&!value.includes(':'))el.setAttribute(attr,'/'+value);}
shared(home);apply(home);
fs.writeFileSync('dist/index.html','<!doctype html>\n'+home.documentElement.outerHTML.replace(/[ \t]+$/gm,'')+'\n');
const brand=`<a class="brand" href="/" aria-label="ORVA Protocol"><img src="/assets/orva-logo.png" alt="" width="38" height="38"><span class="brand-wordmark" dir="ltr">ORVA<span>PROTOCOL</span></span></a>`;
function diagram(name){
 const d=structure.diagrams[name];const l=i=>text(d.labels[i]);
 const cell=i=>`<div class="diagram-node">${l(i)}</div>`;
 let body;
 if(name==='flow')body=`<div class="diagram-label">${l(0)}</div><div class="diagram-chain">${[1,2,3,4].map(cell).join('<span class="diagram-arrow" aria-hidden="true">→</span>')}</div><div class="diagram-treasury">${l(5)}</div><div class="diagram-label">${l(6)}</div><div class="diagram-rights">${[7,8,9,10].map(cell).join('')}</div><div class="diagram-verification">${l(11)}<small>${l(12)}</small></div><div class="diagram-rise" aria-hidden="true">↑</div><div class="diagram-chain">${[14,15,16,17].map(cell).join('<span class="diagram-arrow" aria-hidden="true">→</span>')}</div><div class="diagram-label">${l(13)}</div>`;
 else body=`<div class="diagram-layers">${[0,2,4,6,8,10].map(i=>`<div class="diagram-layer"><strong>${l(i)}</strong><p>${l(i+1)}</p></div>`).join('<span class="diagram-rise" aria-hidden="true">↑</span>')}</div><div class="diagram-notes"><p>${l(12)}</p><p>${l(13)}</p></div>`;
 return `<figure class="paper-figure" id="figure-${name}"><div class="paper-diagram ${name}">${body}</div><figcaption>${text(d.caption)}</figcaption></figure>`;
}
function table(name){const d=structure.tables.find(x=>x.id===name);return `<div class="paper-table-wrap"><p class="table-hint">${text('ui.tableScroll')}</p><div class="table-scroll" tabindex="0" role="region" aria-label="${t(d.caption)}" data-i18n-aria-label="${d.caption}"><table><caption>${text(d.caption)}</caption><thead><tr>${d.headers.map(k=>`<th scope="col">${text(k)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(row=>`<tr>${row.map((k,i)=>`<${i===0?'th scope="row"':'td'}>${text(k)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;}
let article='',inSection=false,inList=false;
for(const b of structure.blocks){
 if(b.type!=='li'&&inList){article+='</ul>';inList=false;}
 if(b.type==='h2'){
  if(inSection)article+='</section>';inSection=true;
  article+=`<section class="paper-section" aria-labelledby="${b.id}"><h2 id="${b.id}"><span class="paper-number" dir="ltr">${b.number.padStart(2,'0')}</span>${text(b.key)}</h2>`;
 }else if(b.type==='h3')article+=`<h3 id="${b.id}"><span class="sub-number" dir="ltr">${b.number}</span> ${text(b.key)}</h3>`;
 else if(b.type==='li'){if(!inList){article+='<ul class="paper-list">';inList=true;}article+=`<li data-source-page="${b.page}">${text(b.key)}</li>`;}
 else if(b.type==='table')article+=table(b.name);
 else if(b.type==='figure')article+=diagram(b.name);
 else if(b.type==='formula')article+=`<div class="paper-formula" tabindex="0"><code dir="ltr">${escape(zh[b.key])}</code></div>`;
 else article+=`<p class="${b.type==='note'?'paper-note':'paper-paragraph'}" data-source-page="${b.page}">${text(b.key)}</p>`;
}
if(inList)article+='</ul>';if(inSection)article+='</section>';
const toc=structure.blocks.filter(b=>b.type==='h2'||b.type==='h3').map(b=>`<a class="toc-link ${b.type==='h3'?'toc-sub':''}" href="#${b.id}"><span class="toc-number" dir="ltr">${b.number.padStart(2,'0')}</span>${text(b.key)}</a>`).join('');
const paper=parseHTML(`<!doctype html><html lang="zh-Hant" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#07140f"><meta name="description" content="${t('ui.subtitle')}" data-i18n-content="ui.subtitle"><title data-i18n="ui.title">${t('ui.title')}</title><link rel="icon" href="/assets/orva-logo.png" type="image/png"><link rel="stylesheet" href="/styles.css"></head><body class="whitepaper-page"><a class="skip-link" href="#paper-content">${text('ui.readPaper')}</a><header class="site-header"><div class="container nav-shell">${brand}<nav class="paper-header-nav" aria-label="${t('ui.paperNav')}" data-i18n-aria-label="ui.paperNav"><a href="/">${text('ui.home')}</a><a href="/whitepaper/" aria-current="page">${text('ui.whitepaper')}</a></nav>${selector()}</div></header><main id="main"><div class="container paper-hero" id="top"><p class="eyebrow"><span class="eyebrow-mark"></span><span dir="ltr">ORVA PROTOCOL / V1.0</span></p><h1>${text('ui.title')}</h1><p class="paper-subtitle">${text('ui.subtitle')}</p><div class="paper-meta"><span>${text('ui.version')}</span><span>${text('ui.source')}</span></div><a class="paper-download" href="/assets/orva-protocol-whitepaper-v1.pdf" download="ORVA-Protocol-Whitepaper-v1.pdf">${text('ui.download')} <span aria-hidden="true">↗</span></a></div><div class="container paper-layout"><aside class="paper-sidebar"><details class="toc-panel" open><summary><span>${text('ui.toc')}</span><span class="reading-percent" dir="ltr">0%</span><span class="toc-chevron" aria-hidden="true">⌄</span></summary><progress id="reading-progress" max="100" value="0" aria-label="${t('ui.progress')}" data-i18n-aria-label="ui.progress"></progress><nav class="paper-toc" aria-label="${t('ui.toc')}" data-i18n-aria-label="ui.toc">${toc}</nav></details></aside><article id="paper-content"><div class="paper-edition">${text('ui.edition')}</div>${article}<div class="paper-end"><a href="/">← ${text('ui.backHome')}</a><a href="#top">↑ ${text('ui.top')}</a></div></article></div></main><footer class="site-footer"><div class="container footer-bottom"><span dir="ltr">© <span id="year">2026</span> ORVA Protocol</span><a href="/assets/orva-protocol-whitepaper-v1.pdf" download>${text('ui.download')}</a></div></footer></body></html>`).document;
shared(paper);apply(paper);
const paperJs=paper.createElement('script');paperJs.setAttribute('src','/whitepaper.js');paperJs.setAttribute('defer','');paper.head.append(paperJs);
fs.mkdirSync('dist/whitepaper',{recursive:true});
fs.writeFileSync('dist/whitepaper/index.html','<!doctype html>\n'+paper.documentElement.outerHTML+'\n');
fs.mkdirSync('dist/locales',{recursive:true});
for(const code of Object.keys(languages)){
 const data={...editorial(JSON.parse(fs.readFileSync('content/'+code+'.json','utf8')),code,source,structure),...overrides[code]};
 for(const key of Object.keys(zh))if(typeof data[key]!=='string'||!data[key].trim())throw Error('Missing translation '+code+' '+key);
 fs.writeFileSync('dist/locales/'+code+'.json',JSON.stringify(data)+'\n');
}
console.log('Built static homepage, complete whitepaper, and six locale files.');
