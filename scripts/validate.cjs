const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parseHTML} = require(path.join(process.env.ORVA_TOOL_MODULES || path.resolve('node_modules'), 'linkedom'));
const source = require('../content/source.json');
const structure = require('../content/whitepaper.structure.json');
const rawPages = require('../content/pdf-extraction.json');
const locales = ['zh-Hant', 'en', 'ko', 'ja', 'vi', 'ur'];
const read = file => fs.readFileSync(file, 'utf8');
const normalize = text => text.replace(/[\s▪]/g, '');
assert.equal(structure.pages, 20);
assert.equal(structure.blocks.filter(b => b.type === 'h2').length, 15);
assert.equal(structure.blocks.filter(b => b.type === 'table').length, 3);
assert.equal(structure.blocks.filter(b => b.type === 'figure').length, 2);
const rawText = normalize(rawPages.map(p => p.lines.map(l => l.text).join('')).join(''));
for (const block of structure.blocks.filter(b => b.key)) assert.ok(rawText.includes(normalize(source[block.key])), 'Source differs from PDF: ' + block.key);
// Cover every non-table PDF line, including paragraphs spanning page breaks.
const bodyText = normalize(structure.blocks.map(b => b.key ? (b.number || '') + source[b.key] : b.type === 'figure' ? source[structure.diagrams[b.name].caption] : '').join(''));
for (const page of rawPages) {
  let table = false;
  let beforeSection83 = page.page === 14;
  for (const line of page.lines) {
    if (page.page === 12 && /^RWA\s*类别/.test(line.text) || page.page === 13 && /^分配板块/.test(line.text) || page.page === 17 && /^风险类别/.test(line.text)) table = true;
    if (page.page === 14 && /^8\.3/.test(line.text)) beforeSection83 = false;
    if (table || beforeSection83 || /^表\s*[123]/.test(line.text)) continue;
    assert.ok(bodyText.includes(normalize(line.text)), `Missing PDF line, page ${page.page}: ${line.text}`);
  }
}
assert.deepEqual(structure.tables.map(t => t.rows.length), [4, 5, 6]);
assert.equal(structure.diagrams.flow.labels.length, 18);
assert.equal(structure.diagrams.architecture.labels.length, 14);
const formula = structure.blocks.find(b => b.type === 'formula');
const dictionaries = {};
for (const lang of locales) {
  const dict = JSON.parse(read(`dist/locales/${lang}.json`)); dictionaries[lang] = dict;
  for (const key of Object.keys(source)) {
    assert.equal(typeof dict[key], 'string', `${lang}: missing ${key}`);
    assert.ok(dict[key].trim(), `${lang}: empty ${key}`);
    assert.ok(!/\[ORVA\d+\]/.test(dict[key]), `${lang}: translation marker ${key}`);
  }
  assert.equal(dict[formula.key], source[formula.key], 'Formula must not be translated');
  for (let row = 0; row < 5; row++) assert.equal(dict[`table.allocation.${row}.1`], ['35%','25%','20%','12%','8%'][row]);
}
for (const file of ['dist/index.html', 'dist/whitepaper/index.html']) {
  const document = parseHTML(read(file)).document;
  assert.equal(document.documentElement.lang, 'zh-Hant');
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs');
  assert.equal(document.querySelectorAll('script[src="/main.js"]').length, 1, 'Duplicate menu handlers');
  assert.equal(document.querySelectorAll('#site-language option').length, 6);
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = el.getAttribute('data-i18n');
    assert.equal(el.textContent.trim(), dictionaries['zh-Hant'][key].trim(), 'Incorrect static default ' + key);
    for (const lang of locales) assert.ok(dictionaries[lang][key], `${lang}: missing rendered key ${key}`);
  }
  for (const attr of ['aria-label','alt','content']) for (const el of document.querySelectorAll(`[data-i18n-${attr}]`)) {
    const key = el.getAttribute(`data-i18n-${attr}`);
    for (const lang of locales) assert.ok(dictionaries[lang][key], `${lang}: missing attribute ${key}`);
  }
  for (const a of document.querySelectorAll('a[href^="#"]')) assert.ok(document.getElementById(a.getAttribute('href').slice(1)), 'Broken chapter link');
  for (const el of document.querySelectorAll('[src],link[href],a[href^="/"]')) {
    const url = el.getAttribute('src') || el.getAttribute('href');
    if (!url?.startsWith('/')) continue;
    const resolved = path.join('dist', url.endsWith('/') ? url + 'index.html' : url);
    assert.ok(fs.existsSync(resolved), 'Missing static file ' + resolved);
  }
  if (file.includes('whitepaper')) {
    assert.equal(document.querySelectorAll('.paper-section').length, 15);
    assert.equal(document.querySelectorAll('table').length, 3);
    assert.equal(document.querySelectorAll('figure').length, 2);
  } else assert.equal(document.querySelectorAll('a[download]').length, 0, 'Homepage should open web whitepaper');
}
console.log('PASS: full PDF body coverage, 15 chapters, 3 tables, 2 diagrams, six dictionaries, formulas, allocations, default HTML and links.');

// Exercise production language logic with real page markup and controlled storage/network.
async function languageScenario({url='https://orva.test/', saved, fail=false, blockedStorage=false}={}) {
  const {document,window:domWindow} = parseHTML(read('dist/index.html'));
  // linkedom intentionally omits the browser's HTMLSelectElement value setter.
  Object.defineProperty(document.querySelector('#site-language'),'value',{value:'zh-Hant',writable:true});
  let location = new URL(url), storage = saved;
  const events = {};
  const window = {addEventListener:(name,handler)=>{events[name]=handler;}};
  const context = {
    document, window, URL, console, Map, CustomEvent: domWindow.CustomEvent,
    get location(){return location;},
    localStorage:{getItem(){if(blockedStorage)throw Error('disabled');return storage;},setItem(_,value){if(blockedStorage)throw Error('disabled');storage=value;}},
    history:{pushState(_,__,url){location=new URL(url,location);},replaceState(_,__,url){location=new URL(url,location);}},
    requestAnimationFrame:()=>{}, innerWidth:1280,
    fetch:async url=>({ok:!fail,json:async()=>dictionaries[url.split('/').pop().replace('.json','')]})
  };
  vm.runInNewContext(read('dist/i18n.js'), context);
  await new Promise(resolve=>setImmediate(resolve));
  return {document,window,get storage(){return storage;},get location(){return location;}};
}
(async()=>{
  assert.equal((await languageScenario()).document.documentElement.lang, 'zh-Hant');
  assert.equal((await languageScenario({saved:'ja'})).document.documentElement.lang, 'ja');
  assert.equal((await languageScenario({url:'https://orva.test/?lang=ko',saved:'ja'})).document.documentElement.lang, 'ko');
  assert.equal((await languageScenario({url:'https://orva.test/?lang=invalid',saved:'en'})).document.documentElement.lang, 'zh-Hant');
  assert.equal((await languageScenario({blockedStorage:true})).document.documentElement.lang, 'zh-Hant');
  const rtl=await languageScenario({url:'https://orva.test/?lang=ur'});
  assert.equal(rtl.document.documentElement.getAttribute('dir'),'rtl');
  assert.ok(rtl.document.querySelector('.nav-paper').getAttribute('href').includes('lang=ur'));
  const failure=await languageScenario({url:'https://orva.test/?lang=en',fail:true});
  assert.equal(failure.document.documentElement.lang,'zh-Hant');
  assert.equal(failure.document.querySelector('.language-error').hidden,false);
  console.log('PASS: first visit, saved language, URL precedence, invalid URL, disabled storage, RTL, cross-page links and network failure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
