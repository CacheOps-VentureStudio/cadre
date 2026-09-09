// Test-only dependency: jsdom 24. The shipped app remains one dependency-free HTML file.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(process.env.CADRE_TEST_HTML||path.join(__dirname,'..','index.html'),'utf8');
function boot(){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://cadre.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};}});
  assert.ok(dom.window.CADRE,'app initialized');
  return {w:dom.window,api:dom.window.CADRE,errors};
}
// Approved rosters: discovery-tier metadata only (seat counts and which free seat a squad grows). Seat text lives elsewhere.
const EXPECTED={
  'sq-vibecode':[4,null],'sq-developer':[6,null],'sq-researcher':[7,'scout'],'sq-data':[7,null],
  'sq-content':[6,'scribe'],'sq-webmaster':[5,null],'sq-professor':[5,'tutor'],'sq-brain':[5,'brain'],
  'sq-sales':[5,null],'sq-product':[5,null],'sq-ops':[5,null],'sq-design':[6,null],
  'sq-recruiter':[5,null],'sq-support':[5,null],'sq-emailadmin':[5,'email'],'sq-netadmin':[4,'netadmin']
};
// Seats that were renamed or never filed; case-insensitive, hyphen or space.
const RETIRED=/guardrail|screener|grader|publisher[- ]that/i;
const catalog=api=>[...api.CATALOG];

test('catalog lists the sixteen squads with the approved seat counts (85 total)',()=>{
  const {api,errors}=boot();
  assert.ok(Array.isArray(api.CATALOG),'CATALOG exposed on the debug object');
  assert.deepEqual(catalog(api).map(c=>c.sku),Object.keys(EXPECTED));
  for(const c of catalog(api))assert.equal(c.seats,EXPECTED[c.sku][0],c.sku+' seats');
  assert.equal(catalog(api).reduce((n,c)=>n+c.seats,0),85);
  assert.deepEqual(errors,[]);
});

test('catalog titles and blurbs name no retired seat and stay short, plain, and escapable',()=>{
  const {api}=boot();
  for(const c of catalog(api)){
    assert.ok(!RETIRED.test(c.blurb),c.sku+' blurb names a retired seat');
    assert.ok(!RETIRED.test(c.title),c.sku+' title names a retired seat');
    assert.ok(c.blurb.length>0&&c.blurb.length<300,c.sku+' blurb length');
    assert.ok(!/[<>"`]/.test(c.blurb),c.sku+' blurb contains markup characters');
    assert.ok(typeof c.title==='string'&&c.title.length>0&&c.title.length<=40,c.sku+' title');
  }
});

test('each replaces value is the approved free seat, used once, and never a required or local-only role',()=>{
  const {api}=boot();
  const roles=new Map([...api.ROLES].map(r=>[r.id,r]));
  const seen=new Set();
  for(const c of catalog(api)){
    assert.equal(c.replaces,EXPECTED[c.sku][1],c.sku+' replaces');
    if(c.replaces===null)continue;
    const r=roles.get(c.replaces);
    assert.ok(r,c.sku+' replaces unknown role '+c.replaces);
    assert.ok(!r.requiredFirst&&!r.localOnly,c.sku+' would retire a required or local-only seat');
    assert.ok(!seen.has(c.replaces),c.sku+' replaces a seat another squad already replaces');
    seen.add(c.replaces);
  }
});
