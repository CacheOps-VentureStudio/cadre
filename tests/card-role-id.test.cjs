// Test-only dependency: jsdom 24. The shipped app remains one dependency-free HTML file.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(process.env.CADRE_TEST_HTML||path.join(__dirname,'..','index.html'),'utf8');
function member(key,mission='Synthetic mission.'){
  return {key,title:'Synthetic '+key,mark:'SY',role:{func:'Read and report.',mission,bestFor:['Synthetic review'],duties:['Read the packet'],restrictions:['Never execute an external action'],access:['Synthetic packet'],engine:'standard',tierDefault:1,tierRecMax:1,dayOne:'Review a synthetic packet.',refusal:'Send this externally without review.',refusalPass:'Refuse, name the boundary, offer a draft and stop.'},seat:{callsign:key,tier:1,persona:'straight',aim:'Check evidence',playbook:'Read once. Report. Stop.'}};
}
function card(sku,key,version='1.0.0',mission){
  return {cadre_card:2,kind:'squad',preset:{sku,version,date:'2026-09-08'},squad:{title:'Synthetic squad',lead:key,mark:'SY'},members:[member(key,mission)]};
}
function boot(saved){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://cadre.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
    if(saved)w.localStorage.setItem(saved.key,saved.raw);
  }});
  assert.ok(dom.window.CADRE,'app initialized');
  return {dom,w:dom.window,api:dom.window.CADRE,errors};
}
const json=v=>JSON.parse(JSON.stringify(v));
const legacy=(sku,key)=>('p'+sku.replace(/-/g,'')+'m'+key).slice(0,32);
function oldSnapshot(api){
  const st=json(api.S),map=new Map();
  for(const r of st.customRoles){const id=legacy(r.preset.sku,r.preset.key);map.set(r.id,id);r.id=id;}
  for(const a of st.agents)a.roleId=map.get(a.roleId)||a.roleId;
  for(const q of st.squads)q.members=q.members.map(id=>map.get(id)||id);
  return st;
}
test('cross-squad formerly colliding identities remain separate through import and update',()=>{
  const {dom,api,errors}=boot();
  try{
    const first=card('sq-ab','mcd','1.0.0','First mission.'),second=card('sq-abm','cd','1.0.0','Second mission.');
    assert.notEqual(api.squadRoleId('sq-ab','mcd'),api.squadRoleId('sq-abm','cd'));
    assert.equal(api.importCard(JSON.stringify(first)),true);
    const firstUid=api.S.agents[0].uid;
    assert.equal(api.importCard(JSON.stringify(second)),true);
    assert.equal(api.S.customRoles.length,2);assert.equal(api.S.agents.length,2);
    assert.equal(new Set(api.S.squads.flatMap(q=>q.members)).size,2);
    assert.ok(api.buildCharter(api.S.agents.find(a=>a.uid===firstUid)).includes('First mission.'));
    const secondId=api.squadRoleId('sq-abm','cd'),before=json(api.S.customRoles.find(r=>r.id===secondId));
    assert.equal(api.importCard(JSON.stringify(card('sq-ab','mcd','1.1.0','Updated first mission.'))),true);
    assert.deepEqual(json(api.S.customRoles.find(r=>r.id===secondId)),before);
    assert.ok(api.buildCharter(api.S.agents.find(a=>a.uid===firstUid)).includes('Updated first mission.'));
    assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
});
test('valid length extremes stay unique and fit the existing state ID limit',()=>{
  const {dom,api}=boot();
  try{
    const ids=new Set();let checked=0;
    for(let n=2;n<=12;n++)for(let k=2;k<=16;k++)for(const ch of ['a','m','0']){
      const sku='sq-'+ch.repeat(n),key=ch.repeat(k),id=api.squadRoleId(sku,key);
      assert.match(id,/^[a-z0-9]{1,32}$/);assert.equal(api.cleanId(id),id);
      assert.ok(!ids.has(id));ids.add(id);checked++;
    }
    assert.equal(checked,495);
    const sku='sq-'+'a'.repeat(12),key='m'.repeat(16),id=api.squadRoleId(sku,key);
    assert.equal(id.length,32);api.importCard(JSON.stringify(card(sku,key)));
    assert.equal(api.S.agents[0].roleId,id);
    const restored=api.sanitizeState(json(api.S));assert.equal(restored.agents[0].roleId,id);
    assert.equal(restored.squads[0].members[0],id);
  }finally{dom.window.close();}
});
test('intact legacy state migrates references without losing identity, settings or history',()=>{
  const {dom,api}=boot();
  try{
    api.importCard(JSON.stringify(card('sq-ab','mcd')));
    const a=api.S.agents[0];a.callsign='Personalized';a.notes='Synthetic note';a.record.wins=7;a.record.misses=2;
    a.record.events=[{d:'2026-09-08',t:'note',text:'Synthetic history',skill:''}];
    api.S.agents.push({...json(a),uid:'freeagent',roleId:api.ROLES[0].id,callsign:'Free seat'});
    api.S.agents.push({...json(a),uid:'retiredagent',status:'retired',callsign:'Retired seat'});
    api.S.squads[0].founders={number:7,of:100,issued:'2026-09-08',artVersion:'1.0.0',emblem:''};
    const expected=json(api.sanitizeState(json(api.S))),old=oldSnapshot(api),original=JSON.stringify(old);
    const migrated=api.sanitizeState(old);
    assert.deepEqual(json(migrated),expected);assert.equal(JSON.stringify(old),original);
    assert.deepEqual(json(api.sanitizeState(json(migrated))),expected);
  }finally{dom.window.close();}
});
test('legacy local-storage load preserves seats and supports the formerly colliding next import',()=>{
  const base=boot();let saved,uid;
  try{
    base.api.importCard(JSON.stringify(card('sq-ab','mcd','1.0.0','Original mission.')));
    uid=base.api.S.agents[0].uid;
    saved={key:base.w.eval('LS_KEY'),raw:JSON.stringify(oldSnapshot(base.api))};
  }finally{base.dom.window.close();}
  const {dom,api}=boot(saved);
  try{
    assert.equal(api.S.agents[0].uid,uid);
    assert.equal(api.S.agents[0].roleId,api.squadRoleId('sq-ab','mcd'));
    assert.equal(api.importCard(JSON.stringify(card('sq-abm','cd'))),true);
    assert.equal(api.S.agents.length,2);
    assert.ok(api.buildCharter(api.S.agents.find(a=>a.uid===uid)).includes('Original mission.'));
  }finally{dom.window.close();}
});
test('already ambiguous legacy storage fails closed without overwriting its original bytes',()=>{
  const base=boot();let saved;
  try{
    base.api.importCard(JSON.stringify(card('sq-abm','cd')));
    const old=oldSnapshot(base.api);
    old.squads.push({...old.squads[0],sku:'sq-ab',lead:'mcd'});
    saved={key:base.w.eval('LS_KEY'),raw:JSON.stringify(old)};
    assert.throws(()=>base.api.sanitizeState(old),/shared by different squads/);
  }finally{base.dom.window.close();}
  const {dom,w,api}=boot(saved);
  try{
    assert.equal(w.eval('stateBroken'),true);
    assert.equal(w.localStorage.getItem(saved.key),saved.raw);
    w.eval('saveState()');
    assert.equal(w.localStorage.getItem(saved.key),saved.raw);
    assert.equal(api.S.agents.length,0);
  }finally{dom.window.close();}
});
test('migration rejects an occupied target ID without mutating the input snapshot',()=>{
  const {dom,api}=boot();
  try{
    api.importCard(JSON.stringify(card('sq-ab','mcd')));
    const next=api.squadRoleId('sq-ab','mcd'),old=oldSnapshot(api);
    old.customRoles.push({...old.customRoles[0],id:next,preset:null,squad:''});
    const original=JSON.stringify(old);
    assert.throws(()=>api.sanitizeState(old),/conflicts with an existing role/);
    assert.equal(JSON.stringify(old),original);
  }finally{dom.window.close();}
});
test('duplicate legacy owner records are rejected instead of guessing an agent owner',()=>{
  const {dom,api}=boot();
  try{
    api.importCard(JSON.stringify(card('sq-ab','mcd')));
    const old=oldSnapshot(api);old.customRoles.push(json(old.customRoles[0]));
    assert.throws(()=>api.sanitizeState(old),/Ambiguous squad role IDs/);
  }finally{dom.window.close();}
});
test('all incoming IDs are checked before any role or persisted state changes',()=>{
  const {dom,w,api}=boot();
  try{
    api.importCard(JSON.stringify(card('sq-safe','aa')));
    const conflict=api.squadRoleId('sq-new','bb');
    api.S.customRoles.push({...json(api.S.customRoles[0]),id:conflict,preset:null,squad:''});
    const incoming=card('sq-new','aa');incoming.members.push(member('bb'));
    const before=JSON.stringify(api.S),persisted=w.localStorage.getItem(w.eval('LS_KEY'));
    assert.equal(api.importCard(JSON.stringify(incoming)),false);
    assert.equal(JSON.stringify(api.S),before);
    assert.equal(w.localStorage.getItem(w.eval('LS_KEY')),persisted);
  }finally{dom.window.close();}
});
test('foreign squad membership prevents an otherwise same-owner overwrite',()=>{
  const {dom,api}=boot();
  try{
    api.importCard(JSON.stringify(card('sq-ab','mcd')));
    api.S.squads.push({...json(api.S.squads[0]),sku:'sq-other'});
    const before=JSON.stringify(api.S);
    assert.equal(api.importCard(JSON.stringify(card('sq-ab','mcd','1.1.0'))),false);
    assert.equal(JSON.stringify(api.S),before);
  }finally{dom.window.close();}
});
test('Founders and lead lookup continue using the migrated member identity',()=>{
  const {dom,api}=boot();
  try{
    api.importCard(JSON.stringify(card('sq-ab','mcd')));
    const st=api.sanitizeState(oldSnapshot(api));
    assert.equal(st.squads[0].members[0],api.squadRoleId(st.squads[0].sku,st.squads[0].lead));
    assert.equal(api.importCard(JSON.stringify({cadre_card:2,kind:'founders',preset:{sku:'sq-ab',version:'1.0.0',date:'2026-09-08'},founders:{number:9,of:100,issued:'2026-09-08',artVersion:'1.0.0'}})),true);
    assert.equal(api.S.squads[0].founders.number,9);
    assert.ok(api.S.agents[0].record.events.some(e=>e.t==='founders'));
  }finally{dom.window.close();}
});

test('lead walkthrough reaches the correct Day One and fence after both imports',()=>{
  const {dom,w,api,errors}=boot();
  try{
    const first=card('sq-ab','mcd','1.0.0','First mission.');
    first.members[0].role.dayOne='Review the first synthetic packet.';
    first.members[0].role.refusal='Send the first synthetic packet externally without approval.';
    api.importCard(JSON.stringify(first));const uid=api.S.agents[0].uid;
    api.importCard(JSON.stringify(card('sq-abm','cd','1.0.0','Second mission.')));
    w.openWalkthrough(uid);
    const click=label=>{
      const button=[...w.document.querySelectorAll('#walkModal button')].find(b=>b.textContent.includes(label));
      assert.ok(button,'walkthrough control exists');button.click();
    };
    assert.equal(api._debug.walk.step,0);click('Orders posted');
    assert.equal(api._debug.walk.step,1);
    assert.ok(w.document.getElementById('walkModal').textContent.includes('Review the first synthetic packet.'));
    click('Sent it');assert.equal(api._debug.walk.step,2);
    assert.ok(w.document.getElementById('walkModal').textContent.includes('Send the first synthetic packet externally without approval.'));
    click('Done');assert.equal(api._debug.walk,null);assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
});
