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
function card(duties=['Keep','Remove','Disabled'],addons=['Optional kept','Optional removed','Optional off'],version='1.0.0',sku='sq-duty'){
 return {cadre_card:2,kind:'squad',preset:{sku,version,date:'2026-09-08'},squad:{title:'Synthetic review',lead:'lead'},
 members:[{key:'lead',title:'Synthetic reviewer',role:{func:'Review only supplied evidence.',duties,addons,
 restrictions:['Do not send externally.'],tierDefault:1,tierRecMax:1,dayOne:'Read the synthetic packet.',
 refusal:'Send the synthetic packet externally.',refusalPass:'Refuse and offer a draft.'}}]};
}
test('updated scope removes withdrawn duties, adds new required duties and preserves local choices through reload/export',()=>{
 const {dom,w,api,errors}=boot();let saved;
 try{
   api.importCard(JSON.stringify(card()));const a=api.S.agents[0],version=a.version;
   api.dropSkill(a.uid,'Disabled');
   a.addons=['Optional kept','Optional removed'];
   api.addSkills(a.uid,'Local task',false);
   api.ensureRecord(a).wins=4;api.ensureRecord(a).fires.Remove=2;
   const before=plain(a),v=a.version;
   assert.equal(api.importCard(JSON.stringify(card(['Keep','Added','Disabled'],['Optional kept','Optional off','New optional'],'1.1.0'))),true);
   const updated=api.S.agents[0];
   assert.deepEqual(plain(updated.duties),['Keep','Added','Local task']);
   assert.deepEqual(plain(updated.addons),['Optional kept']);
   assert.equal(updated.uid,before.uid);assert.equal(updated.version,v+1);assert.ok(updated.version>version);
   assert.equal(updated.record.wins,4);assert.equal(updated.record.fires.Remove,2);
   assert.ok(updated.record.events.some(e=>e.t==='scope-update'));
   assert.deepEqual(JSON.parse(api.buildManifest(updated)).agent.scope,['Keep','Added','Local task','Optional kept']);
   assert.deepEqual(plain(w.parseAgentCard(api.buildAgentCard(updated,false)).seat.duties),plain(updated.duties));
   const charter=api.buildCharter(updated);
   assert.ok(charter.includes('- Added'));assert.ok(!charter.includes('\n- Remove\n'));
   saved={key:w.eval('LS_KEY'),raw:w.localStorage.getItem(w.eval('LS_KEY'))};assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
 const loaded=boot(saved);
 try{assert.deepEqual(plain(loaded.api.S.agents[0].duties),['Keep','Added','Local task']);assert.deepEqual(plain(loaded.api.S.agents[0].addons),['Optional kept']);}
 finally{loaded.dom.window.close();}
});
test('duty/addon moves preserve selection and eliminate duplicate effective scope',()=>{
 const {dom,api}=boot();
 try{
   api.importCard(JSON.stringify(card(['Keep','Move optional','Disabled'],['Move required','Off'])));
   const a=api.S.agents[0];api.dropSkill(a.uid,'Disabled');a.addons=['Move required'];
   api.importCard(JSON.stringify(card(['Keep','Move required','Off','Keep'],['Move optional','Disabled','New optional','Keep'],'1.1.0')));
   assert.deepEqual(plain(api.S.agents[0].duties),['Keep','Move required']);
   assert.deepEqual(plain(api.S.agents[0].addons),['Move optional']);
 }finally{dom.window.close();}
});
test('local skills also added to the base survive updates and future commissioning',()=>{
 const {dom,api}=boot();
 try{
   api.importCard(JSON.stringify(card()));
   const uid=api.S.agents[0].uid;api.addSkills(uid,'Local base task',true);
   api.importCard(JSON.stringify(card(['Keep','Added'],[],'1.1.0')));
   assert.ok(api.S.agents[0].duties.includes('Local base task'));
   assert.ok(api.S.customRoles[0].duties.some(d=>d.t==='Local base task'));
   api.S.agents[0].status='retired';api.commissionSquad('sq-duty',true);
   assert.ok(api.S.agents.find(a=>a.status==='active').duties.includes('Local base task'));
 }finally{dom.window.close();}
});
test('legacy card metadata requires original-card recovery before an update',()=>{
 const {dom,w,api}=boot();
 try{
   api.importCard(JSON.stringify(card()));delete api.S.customRoles[0].preset.scope;
   api.addSkills(api.S.agents[0].uid,'Local task',false);
   assert.equal(api.importCard(JSON.stringify(card(['Keep','Added'],[],'1.1.0'))),false);
   assert.equal(api.importCard(JSON.stringify(card())),true);
   assert.equal(api.importCard(JSON.stringify(card(['Keep','Added'],[],'1.1.0'))),true);
   assert.deepEqual(plain(api.S.agents[0].duties),['Keep','Added','Local task']);
 }finally{dom.window.close();}
});
test('scope overflow rejects the complete update before any role, tier, version or storage mutation',()=>{
 const {dom,w,api}=boot();
 try{
   api.importCard(JSON.stringify(card(['Keep'],[])));
   const a=api.S.agents[0];api.addSkills(a.uid,Array.from({length:59},(_,i)=>'Local '+i).join('\n'),false);
   const incoming=card(['Keep','Added'],[],'1.1.0');incoming.members[0].role.tierRecMax=0;
   const before=JSON.stringify(api.S),stored=w.localStorage.getItem(w.eval('LS_KEY'));
   assert.equal(api.importCard(JSON.stringify(incoming)),false);
   assert.equal(JSON.stringify(api.S),before);assert.equal(w.localStorage.getItem(w.eval('LS_KEY')),stored);
 }finally{dom.window.close();}
});
test('paused seats reconcile; retired and unrelated seats stay intact; same/older updates do nothing',()=>{
 const {dom,api}=boot();
 try{
   api.importCard(JSON.stringify(card()));api.S.agents[0].status='retired';const retired=plain(api.S.agents[0]);
   api.commissionSquad('sq-duty',true);api.S.agents.find(a=>a.status==='active').status='paused';
   api.importCard(JSON.stringify(card(['Other'],[],'1.0.0','sq-other')));
   const other=plain(api.S.agents.find(a=>a.roleId===api.squadRoleId('sq-other','lead')));
   api.importCard(JSON.stringify(card(['Keep','Added'],[],'1.1.0')));
   assert.deepEqual(plain(api.S.agents.find(a=>a.status==='paused').duties),['Keep','Added']);
   assert.deepEqual(plain(api.S.agents.find(a=>a.uid===retired.uid)),retired);
   assert.deepEqual(plain(api.S.agents.find(a=>a.uid===other.uid)),other);
   const before=JSON.stringify(api.S);
   for(const version of ['1.1.0','1.0.0'])assert.equal(api.importCard(JSON.stringify(card(['Changed'],[],version))),false);
   assert.equal(JSON.stringify(api.S),before);
 }finally{dom.window.close();}
});
test('updated walkthrough copies reconciled scope and reaches the supplied refusal test',()=>{
 const {dom,w,api,errors}=boot();
 try{
   api.importCard(JSON.stringify(card()));api.importCard(JSON.stringify(card(['Keep','Added'],[],'1.1.0')));
   w.openWalkthrough(api.S.agents[0].uid);const modal=w.document.getElementById('walkModal');
   const click=label=>{const b=[...modal.querySelectorAll('button')].find(b=>b.textContent.includes(label));assert.ok(b);b.click();};
   let copied='';w.copyText=text=>{copied=text;};click('Copy charter');
   assert.ok(copied.includes('- Added'));assert.ok(!copied.includes('\n- Remove\n'));
   click('Orders posted');assert.ok(modal.textContent.includes('Read the synthetic packet.'));
   click('Sent it');assert.ok(modal.textContent.includes('Send the synthetic packet externally.'));
   assert.ok(modal.textContent.includes('Refuse and offer a draft.'));
   click('Done');assert.equal(api._debug.walk,null);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('local base and seat-only additions survive card adoption, withdrawal and reload',()=>{
 for(const alsoBase of [false,true]){
   const first=boot();let saved;
   try{
     first.api.importCard(JSON.stringify(card(['Keep'],[])));
     first.api.addSkills(first.api.S.agents[0].uid,'Local task',alsoBase);
     assert.equal(first.api.importCard(JSON.stringify(card(['Keep','Local task'],[],'1.1.0'))),true);
     saved={key:first.w.eval('LS_KEY'),raw:first.w.localStorage.getItem(first.w.eval('LS_KEY'))};
   }finally{first.dom.window.close();}
   const next=boot(saved);
   try{
     assert.equal(next.api.importCard(JSON.stringify(card(['Keep'],[],'1.2.0'))),true);
     assert.ok(next.api.S.agents[0].duties.includes('Local task'));
     assert.equal(next.api.S.customRoles[0].duties.some(d=>d.t==='Local task'),alsoBase);
   }finally{next.dom.window.close();}
 }
});
test('disabled duties stay disabled after withdrawal and reintroduction until explicitly re-added',()=>{
 const {dom,api}=boot();
 try{
   api.importCard(JSON.stringify(card(['Keep','Disabled'],[])));const uid=api.S.agents[0].uid;
   api.dropSkill(uid,'Disabled');
   assert.equal(api.importCard(JSON.stringify(card(['Keep'],[],'1.1.0'))),true);
   assert.equal(api.importCard(JSON.stringify(card(['Keep','Disabled'],[],'1.2.0'))),true);
   assert.deepEqual(plain(api.S.agents[0].duties),['Keep']);
   assert.equal(api.addSkills(uid,'Disabled',false),1);
   assert.equal(api.importCard(JSON.stringify(card(['Keep','Disabled'],[],'1.3.0'))),true);
   assert.deepEqual(plain(api.S.agents[0].duties),['Keep','Disabled']);
 }finally{dom.window.close();}
});
test('an update cannot leave an active seat empty or override its opt-out',()=>{
 const {dom,w,api}=boot();
 try{
   api.importCard(JSON.stringify(card(['Keep','Disabled'],[])));api.dropSkill(api.S.agents[0].uid,'Disabled');
   const before=JSON.stringify(api.S),stored=w.localStorage.getItem(w.eval('LS_KEY'));
   assert.equal(api.importCard(JSON.stringify(card(['Disabled'],[],'1.1.0'))),false);
   assert.equal(JSON.stringify(api.S),before);assert.equal(w.localStorage.getItem(w.eval('LS_KEY')),stored);
 }finally{dom.window.close();}
});
test('legacy original-card recovery preserves local base tasks and does not change seat authority or history',()=>{
 const {dom,w,api}=boot();
 try{
   const original=card(['Keep','Remove'],[]);
   api.importCard(JSON.stringify(original));const a=api.S.agents[0],r=api.S.customRoles[0];
   r.duties.push({t:'Legacy local base',on:true});a.duties.push('Legacy local base');
   delete r.preset.scope;delete r.preset.localScope;delete a.scopeOverrides;
   const incoming=card(['Keep','Added'],[],'1.1.0');
   const before=JSON.stringify(api.S);
   assert.equal(api.importCard(JSON.stringify(incoming)),false);assert.equal(JSON.stringify(api.S),before);
   const identity={uid:a.uid,tier:a.tier,version:a.version,record:plain(a.record),duties:plain(a.duties)};
   assert.equal(api.importCard(JSON.stringify(card(['Unrecognized'],[]))),false);assert.equal(JSON.stringify(api.S),before);
   assert.equal(api.importCard(JSON.stringify(original)),true);
   for(const [k,v] of Object.entries(identity))assert.deepEqual(plain(api.S.agents[0][k]),v,k);
   assert.equal(api.importCard(JSON.stringify(incoming)),true);
   assert.deepEqual(plain(api.S.agents[0].duties),['Keep','Added','Legacy local base']);
   assert.ok(api.S.customRoles[0].duties.some(d=>d.t==='Legacy local base'));
 }finally{dom.window.close();}
});
