// Terminology corrections shared by generated output and content validation.
// Explicit per-string editorial copy in overrides.json takes precedence.
module.exports = function editorial(data, language, source, structure) {
  const output = {...data};
  for (const [key, value] of Object.entries(output)) {
    const original = source[key] || '';
    let revised = value;
    if (language === 'en') {
      if (!original.includes('股权')) revised = revised.replace(/\bequity\b/gi, 'economic rights');
      revised = revised.replace(/\bpledge lock(?:-up)? contract/gi,'staking lock-up contract')
        .replace(/\bpledged\b/g,'staked').replace(/\bpledge\b/g,'staking')
        .replace(/\bagreement treasury\b/gi,'protocol treasury')
        .replace(/\bagreed treasury\b/gi,'protocol treasury')
        .replace(/\bagreement income\b/gi,'protocol revenue')
        .replace(/\bagreement mechanism\b/gi,'protocol mechanism')
        .replace(/\bcasting\b/g,'minting')
        .replace(/gas storage warehouse/g,'gas storage facility')
        .replace(/gas storage peaking income/g,'income from seasonal gas storage')
        .replace(/summer and winter mining/g,'summer injection and winter withdrawal')
        .replace(/\bAir source\b/g,'Gas supply')
        .replace(/\boffline entities\b/g,'off-chain operating businesses')
        .replace(/\becological\b/g,'ecosystem');
    }
    if (language === 'ko') revised = revised.replace(/ORVA 프로토콜/g,'ORVA Protocol').replace(/연간 천연가스 매출액/g,'연간 천연가스 취급량');
    if (language === 'ja') revised = revised.replace(/ORVA プロトコル/g,'ORVA Protocol').replace(/天然ガスの年間売上高/g,'天然ガスの年間取扱量').replace(/ガス貯蔵の売上高/g,'ガス貯蔵の取扱量');
    if (language === 'vi') {
      revised = revised.replace(/Giao thức ORVA/g,'ORVA Protocol').replace(/Nghị định thư ORVA/g,'ORVA Protocol')
        .replace(/doanh thu khí đốt tự nhiên hàng năm/g,'khối lượng khí đốt tự nhiên luân chuyển hàng năm');
      if(!original.includes('股权'))revised=revised.replace(/vốn chủ sở hữu/gi,'quyền lợi kinh tế');
    }
    if (language === 'ur' && !original.includes('股权')) revised = revised.replace(/ایکویٹی/g,'معاشی حقوق');
    output[key] = revised;
  }
  if (['en','vi'].includes(language)) for (const block of structure.blocks.filter(b=>['h2','h3'].includes(b.type))) {
    const value=output[block.key];output[block.key]=value.charAt(0).toUpperCase()+value.slice(1);
  }
  return output;
};
