// Test-only dependency: jsdom 24. The shipped app remains one dependency-free HTML file.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(process.env.CADRE_TEST_HTML||path.join(__dirname,'..','index.html'),'utf8');
const bytes=s=>Buffer.from(s,'utf8');
const same=(a,b)=>assert.ok(bytes(a).equals(bytes(b)),'playbook bytes diverged ('+bytes(a).length+' vs '+bytes(b).length+')');
function boot(saved){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://cadre.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
    if(saved)w.localStorage.setItem(saved.key,saved.raw);
  }});
  assert.ok(dom.window.CADRE,'app initialized');
  return {dom,w:dom.window,api:dom.window.CADRE,errors};
}
// No markdown headings: deHead() is identity on this text, so import and export can be byte-compared.
function playbook(n=6000){
  const body='Read once. Report. Stop. Continue the standing procedure without a heading.\n';
  assert.ok(n>4000&&n<=8000);
  return (body.repeat(Math.ceil(n/body.length))).slice(0,n);
}
function squad(extra={},book=playbook()){
  return {cadre_card:2,kind:'squad',preset:{sku:'sq-book',version:'1.0.0',date:'2026-09-08'},
    squad:Object.assign({title:'Synthetic review',lead:'lead'},extra),
    members:[{key:'lead',title:'Synthetic reviewer',
      role:{func:'Review the supplied packet.',duties:['Read the packet'],restrictions:['Do not send externally.'],
        dayOne:'Review the synthetic packet.',refusal:'Send the synthetic packet externally without approval.',
        refusalPass:'Refuse the action and offer a draft.',tierDefault:1,tierRecMax:1},
      seat:{callsign:'Reviewer',tier:1,persona:'straight',aim:'Check evidence',playbook:book}}]};
}
test('a 6000-character seat playbook survives import, commission, reload and owner export byte-for-byte',()=>{
  const book=playbook(6000);
  const {dom,w,api,errors}=boot();let saved,uid;
  try{
    assert.equal(book.length,6000);
    assert.equal(api.importCard(JSON.stringify(squad({},book))),true);
    uid=api.commissionSquad('sq-book',true)||api.S.agents[0].uid;
    const a=api.S.agents.find(x=>x.uid===uid);
    assert.ok(a);
    same(a.playbook,book);
    same(api.S.customRoles.find(r=>r.id===a.roleId).seatDefaults.playbook,book);
    saved={key:w.eval('LS_KEY'),raw:w.localStorage.getItem(w.eval('LS_KEY'))};
    assert.ok(saved.raw);
    assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
  const loaded=boot(saved);
  try{
    const a=loaded.api.S.agents.find(x=>x.uid===uid);
    assert.ok(a);
    same(a.playbook,book);
    const exported=loaded.w.parseAgentCard(loaded.api.buildAgentCard(a,true));
    assert.ok(exported&&exported.seat);
    same(exported.seat.playbook,book);
    assert.deepEqual(loaded.errors,[]);
  }finally{loaded.dom.window.close();}
});
test('sanitizeCardV2 drops replaces that target a required-first or local-only builtin',()=>{
  const {dom,api}=boot();
  try{
    const blocked=api.ROLES.filter(r=>r.requiredFirst||r.localOnly).map(r=>r.id);
    assert.ok(blocked.length);
    assert.ok(blocked.includes('cos'));
    for(const id of blocked){
      const c=api.sanitizeCardV2(squad({replaces:id}));
      assert.equal(c.squad.replaces,null,id+' must not be a legal replaces target');
    }
    const allowed=api.ROLES.filter(r=>!r.requiredFirst&&!r.localOnly).map(r=>r.id);
    assert.ok(allowed.includes('email'));
    assert.equal(api.sanitizeCardV2(squad({replaces:'email'})).squad.replaces,'email');
    assert.equal(api.importCard(JSON.stringify(squad({replaces:'cos'}))),true);
    assert.equal(api.S.squads[0].replaces,null);
  }finally{dom.window.close();}
});
test('library seat counts are integers from CATALOG, so renderLibrary interpolates a number',()=>{
  const {dom,api}=boot();
  try{
    assert.ok(Array.isArray(api.CATALOG)&&api.CATALOG.length);
    for(const c of api.CATALOG){
      assert.equal(typeof c.seats,'number',c.sku);
      assert.ok(Number.isInteger(c.seats),c.sku);
      assert.ok(c.seats>=1&&c.seats<=12,c.sku);
    }
    assert.match(html,/\$\{c\.seats\} seats/);
  }finally{dom.window.close();}
});
