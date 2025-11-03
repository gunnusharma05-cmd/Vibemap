const https = require('https');
const http = require('http');
const lex = new Map([
  ['amazing',3],['awesome',3],['brilliant',3],['excellent',3],['fantastic',3],['great',2],['good',2],['happy',2],['love',3],['wonderful',3],
  ['best',2],['perfect',2],['beautiful',2],['exciting',2],['incredible',3],['outstanding',3],['superb',3],['win',2],['success',2],['victory',2],
  ['terrible',-3],['awful',-3],['horrible',-3],['worst',-3],['hate',-3],['bad',-2],['sad',-2],['angry',-2],['disaster',-3],['crisis',-3],
  ['catastrophe',-3],['disgusting',-3],['fail',-2],['failure',-2],['broken',-2],['wrong',-2],['lose',-2],['loss',-2],['defeat',-2],['error',-2],
  ['like',1],['nice',1],['fine',1],['cool',1],['fun',1],['useful',1],['interesting',1],['solid',1],['enjoy',2],['pleased',2],
  ['dislike',-1],['concern',-1],['worried',-1],['issue',-1],['problem',-2],['difficult',-1],['struggle',-1],['confusing',-1],['poor',-2],['disappointing',-2],
  ['killed',-2],['dead',-2],['attack',-2],['war',-3],['threat',-2],['risk',-1],['danger',-2],['safe',1],['secure',1],['protect',1],
  ['breakthrough',3],['innovation',2],['revolutionary',3],['impressive',2],['stunning',3],['chaos',-2],['panic',-2],['fear',-2],['hope',2],['optimistic',2]
]);
const src = [
  {n:'HackerNews',u:'https://hnrss.org/frontpage'},
  {n:'BBC Tech',u:'https://feeds.bbci.co.uk/news/technology/rss.xml'},
  {n:'TechCrunch',u:'https://techcrunch.com/feed/'},
  {n:'TheVerge',u:'https://www.theverge.com/rss/index.xml'},
  {n:'ArsTech',u:'https://feeds.arstechnica.com/arstechnica/index'},
  {n:'Wired',u:'https://www.wired.com/feed/rss'},
  {n:'Slashdot',u:'https://rss.slashdot.org/Slashdot/slashdotMain'},
  {n:'Reddit Tech',u:'https://www.reddit.com/r/technology/.rss'}
];
const c = {r:'\x1b[91m',g:'\x1b[92m',b:'\x1b[94m',y:'\x1b[93m',w:'\x1b[97m',x:'\x1b[0m',B:'\x1b[1m'};
const fch = (url, tmo = 5000) => new Promise((res, rej) => {
  const lib = url.startsWith('https') ? https : http;
  const tmr = setTimeout(() => rej(new Error('timeout')), tmo);
  
  lib.get(url, {headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}}, (rsp) => {
    if (rsp.statusCode === 301 || rsp.statusCode === 302) {
      clearTimeout(tmr);
      return fch(rsp.headers.location, tmo).then(res).catch(rej);
    }
    let dat = '';
    rsp.on('data', (chk) => dat += chk);
    rsp.on('end', () => { clearTimeout(tmr); res(dat); });
  }).on('error', (err) => { clearTimeout(tmr); rej(err); });
});
const prs = (xml) => {
  const ttl = [];
  const rgx = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gi;
  let mat;
  while ((mat = rgx.exec(xml)) !== null && ttl.length < 30) {
    const txt = mat[1].trim().toLowerCase();
    if (txt && txt.length > 5 && !txt.match(/rss|feed|channel/i)) ttl.push(txt);
  }
  return ttl.slice(1);
};
const snt = (txt) => {
  const wds = txt.split(/\s+/);
  let scr = 0, cnt = 0;
  for (const wd of wds) {
    const cln = wd.replace(/[^a-z]/g, '');
    if (lex.has(cln)) { scr += lex.get(cln); cnt++; }
  }
  return cnt > 0 ? scr / cnt : 0;
};
const anl = (hdl) => {
  let tot = 0;
  for (const h of hdl) tot += snt(h);
  return hdl.length > 0 ? tot / hdl.length : 0;
};
const clr = (scr, int) => {
  const chr = int > 1.5 ? '█' : int > 0.8 ? '▓' : int > 0.4 ? '▒' : '░';
  if (scr > 0.3) return c.g + chr.repeat(5) + c.x;
  if (scr < -0.3) return c.r + chr.repeat(5) + c.x;
  if (Math.abs(scr) < 0.15) return c.b + chr.repeat(5) + c.x;
  return c.y + chr.repeat(5) + c.x;
};
const viz = (res, vol, cyc) => {
  process.stdout.write('\x1Bc');
  console.log(c.B + c.w + '╔════════════════════════════════════════════════════════╗');
  console.log('║       🌐 VIBEMAP - EMOTIONAL INTERNET RADAR        ║');
  console.log('╚════════════════════════════════════════════════════════╝' + c.x + '\n');
  
  const tim = new Date().toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const vls = vol > 1.0 ? c.r + '🔥 HIGH' : vol > 0.5 ? c.y + '⚡ ACTIVE' : c.g + '✓ CALM';
  console.log(c.w + `  ⏰ ${tim}  |  📊 ${vls}${c.x}${c.w} (${vol.toFixed(2)})  |  🔄 Cycle #${cyc}` + c.x + '\n');
  
  for (const itm of res) {
    const bar = clr(itm.sco, itm.int);
    const pad = ' '.repeat(Math.max(0, 12 - itm.nam.length));
    const arr = itm.sco > 0.3 ? c.g+'↑' : itm.sco < -0.3 ? c.r+'↓' : c.b+'→';
    const emo = itm.sco > 0.5 ? '😊' : itm.sco > 0.2 ? '🙂' : itm.sco < -0.5 ? '😢' : itm.sco < -0.2 ? '😕' : '😐';
    const alr = itm.int > 1.5 ? c.r + ' ⚠️ ' : '   ';
    console.log(`  ${emo} ${c.B}${itm.nam}${c.x}${pad} ${bar} ${arr} ${itm.sco >= 0 ? ' ' : ''}${itm.sco.toFixed(2)}${c.x}  (${itm.cnt})${alr}`);
  }
  
  const avg = res.reduce((a, i) => a + i.sco, 0) / res.length;
  const ovr = avg > 0.25 ? c.g + '🌟 POSITIVE' : avg < -0.25 ? c.r + '⚠️  NEGATIVE' : avg > 0 ? c.y + '😊 SLIGHT+' : avg < 0 ? c.y + '😕 SLIGHT-' : c.b + '⚖️  NEUTRAL';
  console.log('\n' + c.B + `  Global Mood: ${ovr}${c.x} ${c.w}(${avg >= 0 ? '+' : ''}${avg.toFixed(3)})${c.x}\n`);
  console.log(c.w + '  Press Ctrl+C to exit' + c.x + '\n');
};
const run = async () => {
  const prv = new Map();
  let cyc = 0;
  while (true) {
    cyc++;
    const prm = src.map(async (s) => {
      try {
        const dat = await fch(s.u);
        const hdl = prs(dat);
        const scr = anl(hdl);
        const old = prv.get(s.n) || scr;
        const dlt = Math.abs(scr - old);
        prv.set(s.n, scr);
        return {nam: s.n, sco: scr, cnt: hdl.length, int: dlt * 10};
      } catch (err) {
        return {nam: s.n, sco: 0, cnt: 0, int: 0};
      }
    });
    const res = await Promise.all(prm);
    const vld = res.filter(r => r.cnt > 0);
    if (vld.length > 0) {
      const vol = vld.reduce((a, i) => a + i.int, 0) / vld.length;
      viz(vld, vol, cyc);
    } else {
      console.log(c.r + '\n⚠️  All sources failed. Retrying...\n' + c.x);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
};
console.log(c.B + c.g + '\n🚀 VibeMap Initializing...' + c.x);
console.log(c.w + '   Connecting to 8 emotion streams...\n' + c.x);
setTimeout(() => run(), 1500);