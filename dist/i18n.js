(() => {
  'use strict';
  const supported = ['zh-Hant', 'en', 'ko', 'ja', 'vi', 'ur'];
  const defaultLanguage = 'zh-Hant';
  const preferenceKey = 'orva.language';
  const selector = document.querySelector('#site-language');
  const initialUI = JSON.parse(document.querySelector('#initial-ui').textContent);
  const cache = new Map();
  let current = defaultLanguage;
  let dictionary = initialUI;
  let requestNumber = 0;
  let retryLanguage = null;
  const textBindings = [...document.querySelectorAll('[data-i18n]')].map(el => ({
    el, key: el.getAttribute('data-i18n'),
    leading: el.textContent.match(/^\s*/)[0], trailing: el.textContent.match(/\s*$/)[0]
  }));
  const attributeBindings = ['aria-label', 'alt', 'content'].flatMap(attribute =>
    [...document.querySelectorAll(`[data-i18n-${attribute}]`)].map(el => ({el, attribute, key: el.getAttribute(`data-i18n-${attribute}`)})));
  const defaultDictionary = {...initialUI};
  textBindings.forEach(({key,el}) => {defaultDictionary[key] = el.textContent.trim();});
  attributeBindings.forEach(({key,el,attribute}) => {defaultDictionary[key] = el.getAttribute(attribute);});
  cache.set(defaultLanguage, defaultDictionary);
  const t = key => dictionary[key] || initialUI[key] || key;
  function requestedLanguage() {
    const params = new URL(location.href).searchParams;
    if (params.has('lang')) return supported.includes(params.get('lang')) ? params.get('lang') : defaultLanguage;
    try { const saved = localStorage.getItem(preferenceKey); return supported.includes(saved) ? saved : defaultLanguage; }
    catch { return defaultLanguage; }
  }
  function persist(language) { try { localStorage.setItem(preferenceKey, language); } catch { /* Private browsers may disable storage. */ } }
  function updateLinks() {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.hasAttribute('download')) return;
      const url = new URL(href, location.href);
      if (url.origin === location.origin && ['/', '/whitepaper/', '/whitepaper'].includes(url.pathname)) {
        url.searchParams.set('lang', current);
        a.setAttribute('href', url.pathname + url.search + url.hash);
      }
    });
  }
  function readingAnchor() {
    const nodes = [...document.querySelectorAll('.paper-section h2[id], .paper-section h3[id], main section[id]')];
    const threshold = (document.querySelector('.site-header')?.offsetHeight || 78) + 45 + (document.querySelector('.paper-sidebar') && innerWidth <= 900 ? 54 : 0);
    let active = null;
    for (const node of nodes) { if (node.getBoundingClientRect().top <= threshold) active = node; else break; }
    return active;
  }
  async function changeLanguage(language, {user = false, historyChange = false} = {}) {
    if (!supported.includes(language)) language = defaultLanguage;
    const request = ++requestNumber;
    const anchor = user ? readingAnchor() : null;
    selector.setAttribute('aria-busy', 'true');
    try {
      let next = cache.get(language);
      if (!next) {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) throw new Error('Language unavailable');
        next = await response.json();
        const required = [...textBindings, ...attributeBindings].map(binding => binding.key);
        if (required.some(key => typeof next[key] !== 'string')) throw new Error('Incomplete language');
        cache.set(language, next);
      }
      if (request !== requestNumber) return;
      dictionary = next; current = language;
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
      textBindings.forEach(({el,key,leading,trailing}) => {el.textContent = leading + next[key] + trailing;});
      attributeBindings.forEach(({el,key,attribute}) => el.setAttribute(attribute, next[key]));
      selector.value = language;
      persist(language);
      updateLinks();
      document.querySelector('.language-error').hidden = true;
      retryLanguage = null;
      const url = new URL(location.href);
      if (user || url.searchParams.has('lang')) {
        url.searchParams.set('lang', language);
        if (anchor && user) url.hash = anchor.id;
        if (user) history.pushState(null, '', url);
        else if (!historyChange) history.replaceState(null, '', url);
      }
      document.dispatchEvent(new CustomEvent('orva:languagechange', {detail: {language}}));
      // Text reflow must finish before restoring the chapter rather than a pixel offset.
      requestAnimationFrame(() => {
        if (request !== requestNumber) return;
        const target = anchor || (location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))));
        if (target) target.scrollIntoView({behavior: 'instant', block: 'start'});
      });
    } catch (error) {
      if (request !== requestNumber) return;
      console.warn('Language could not be loaded:', error.message);
      selector.value = current;
      retryLanguage = language;
      document.querySelector('.language-error').hidden = false;
    } finally {
      if (request === requestNumber) selector.removeAttribute('aria-busy');
    }
  }
  window.ORVA = {t, changeLanguage, get language() {return current;}};
  selector.addEventListener('change', () => changeLanguage(selector.value, {user: true}));
  document.querySelector('#language-retry').addEventListener('click', () => {
    if (retryLanguage) changeLanguage(retryLanguage, {user: true});
  });
  window.addEventListener('popstate', () => changeLanguage(requestedLanguage(), {historyChange: true}));
  changeLanguage(requestedLanguage());
})();
