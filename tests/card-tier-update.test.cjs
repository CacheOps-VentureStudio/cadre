const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(process.env.CADRE_TEST_HTML||path.join(__dirname,'..','index.html'),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
function boot(saved){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://cadre.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
    if(saved)w.localStorage.setItem(saved.key,saved.raw);
  }});
  return {dom,w:dom.window,api:dom.window.CADRE,errors};
}
function squad(max=2,version='1.0.0',sku='sq-tier'){
  return {cadre_card:2,kind:'squad',preset:{sku,version,date:'2026-09-08'},
    squad:{title:'Synthetic review',lead:'lead'},members:[{key:'lead',title:'Synthetic reviewer',
      role:{func:'Review the supplied packet.',duties:['Read the packet'],restrictions:['Do not send externally.'],
        dayOne:'Review the synthetic packet.',refusal:'Send the synthetic packet externally without approval.',
        refusalPass:'Refuse the action and offer a draft.',tierDefault:2,tierRecMax:max},
      seat:{callsign:'Reviewer',tier:2}}]};
}
test('a lower update ceiling clamps the active seat, exports and reload to T0 with an audit event',()=>{
  const {dom,w,api,errors}=boot();let saved;
  try{
    assert.equal(api.importCard(JSON.stringify(squad())),true);
    const a=api.S.agents[0],uid=a.uid,version=a.version;
    assert.equal(a.tier,2);
    a.notes='Retain synthetic notes';a.aim='Review the packet';a.playbook='Read then report.';
    api.ensureRecord(a).wins=3;
    const before=plain(a);
    assert.equal(api.importCard(JSON.stringify(squad(0,'1.1.0'))),true);
    const updated=api.S.agents.find(a=>a.uid===uid);
    assert.equal(updated.tier,0);
    assert.equal(updated.version,version+1);
    for(const key of ['uid','callsign','notes','aim','playbook','duties','addons','persona','commissionedAt','status'])
      assert.deepEqual(plain(updated[key]),before[key],key);
    assert.equal(updated.record.wins,3);
    assert.equal(updated.record.events.filter(e=>e.t==='demote').length,1);
    assert.match(updated.record.events.find(e=>e.t==='demote').text,/T2.*T0.*1\.1\.0/);
    assert.equal(updated.record.events.filter(e=>e.t==='preset-update').length,1);
    assert.equal(JSON.parse(api.buildManifest(updated)).agent.tier,'T0');
    assert.match(api.buildCharter(updated),/T0/);
    assert.equal(w.parseAgentCard(api.buildAgentCard(updated,false)).seat.tier,0);
    saved={key:w.eval('LS_KEY'),raw:w.localStorage.getItem(w.eval('LS_KEY'))};
    assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
  const loaded=boot(saved);
  try{assert.equal(loaded.api.S.agents[0].tier,0);assert.equal(loaded.api.S.agents[0].record.events.filter(e=>e.t==='demote').length,1);}
  finally{loaded.dom.window.close();}
});
test('all tier/ceiling combinations clamp downward only and log only actual reductions',()=>{
  const {dom,api}=boot();
  try{
    for(let tier=0;tier<=4;tier++)for(let ceiling=0;ceiling<=3;ceiling++){
      const sku='sq-t'+tier+'c'+ceiling;
      api.importCard(JSON.stringify(squad(3,'1.0.0',sku)));
      const roleId=api.squadRoleId(sku,'lead'),a=api.S.agents.find(a=>a.roleId===roleId);
      a.tier=tier;const version=a.version;
      assert.equal(api.importCard(JSON.stringify(squad(ceiling,'1.1.0',sku))),true);
      const updated=api.S.agents.find(a=>a.roleId===roleId);
      assert.equal(updated.tier,Math.min(tier,ceiling),sku);
      assert.equal(updated.version,version+1);
      assert.equal(updated.record.events.filter(e=>e.t==='demote').length,tier>ceiling?1:0);
    }
  }finally{dom.window.close();}
});
test('updates leave retired and unrelated seats intact; same and older cards cannot alter tiers',()=>{
  const {dom,api}=boot();
  try{
    api.importCard(JSON.stringify(squad()));
    const retired=api.S.agents[0];retired.status='retired';
    api.commissionSquad('sq-tier',true);
    api.importCard(JSON.stringify(squad(2,'1.0.0','sq-other')));
    const retiredBefore=plain(api.S.agents.find(a=>a.uid===retired.uid));
    const otherBefore=plain(api.S.agents.find(a=>a.roleId===api.squadRoleId('sq-other','lead')));
    api.importCard(JSON.stringify(squad(0,'1.1.0')));
    assert.deepEqual(plain(api.S.agents.find(a=>a.uid===retired.uid)),retiredBefore);
    assert.deepEqual(plain(api.S.agents.find(a=>a.uid===otherBefore.uid)),otherBefore);
    assert.equal(api.S.agents.find(a=>a.roleId===retired.roleId&&a.status==='active').tier,0);
    const before=JSON.stringify(api.S);
    for(const version of ['1.1.0','1.0.0'])assert.equal(api.importCard(JSON.stringify(squad(3,version))),false);
    assert.equal(JSON.stringify(api.S),before);
  }finally{dom.window.close();}
});
test('updated lead walkthrough copies the T0 charter and completes the Day One and fence steps',()=>{
  const {dom,w,api,errors}=boot();
  try{
    api.importCard(JSON.stringify(squad()));api.importCard(JSON.stringify(squad(0,'1.1.0')));
    const a=api.S.agents[0];assert.equal(a.tier,0);w.openWalkthrough(a.uid);
    const modal=w.document.getElementById('walkModal');
    const click=label=>{const b=[...modal.querySelectorAll('button')].find(b=>b.textContent.includes(label));assert.ok(b);b.click();};
    let copied='';w.copyText=text=>{copied=text;};click('Copy charter');
    assert.equal(copied,api.buildCharter(a));assert.ok(copied.includes('T0'));
    click('Orders posted');assert.equal(api._debug.walk.step,1);
    assert.ok(modal.textContent.includes('Review the synthetic packet.'));
    click('Sent it');assert.equal(api._debug.walk.step,2);
    assert.ok(modal.textContent.includes('Send the synthetic packet externally without approval.'));
    assert.ok(modal.textContent.includes('Refuse the action and offer a draft.'));
    click('Done');assert.equal(api._debug.walk,null);assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
});