/* رخاء ⇄ Supabase — مزامنة بدون مكتبات (fetch فقط)
   - كل الجداول في جدول واحد records(tbl,id,data) + صور المستندات tbl='_img'
   - الحفظ على الجهاز بيفضل شغال (IndexedDB) والمزامنة بتتم في الخلفية
   - لو الإعدادات فاضية: النظام بيشتغل زي الأول (data.json) */
(function(){
const C=window.SB_CFG||{},KS='sb_sess';          // C.login=false → مفيش تسجيل دخول (أي حد معاه الرابط يقدر يعدّل)
const SB=window.SB={on:!!(C.url&&C.key),ok:false,state:'',last:0};
if(!SB.on)return;
C.url=C.url.replace(/\/+$/,'');
const net=e=>e instanceof TypeError;
const setState=s=>{SB.state=s;if(typeof chip==='function')chip(s)};
let SS=null;try{SS=JSON.parse(localStorage.getItem(KS)||'null')}catch(e){}
const saveSess=s=>{SS=s;try{s?localStorage.setItem(KS,JSON.stringify(s)):localStorage.removeItem(KS)}catch(e){}};

/* ---------- auth ---------- */
async function tokenReq(grant,body){
 const r=await fetch(C.url+'/auth/v1/token?grant_type='+grant,{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const j=await r.json().catch(()=>({}));
 if(!r.ok){const m=j.error_description||j.msg||j.message||'فشل الدخول';throw new Error(/invalid login/i.test(m)?'الإيميل أو الباسورد غلط':m)}
 saveSess({at:j.access_token,rt:j.refresh_token,exp:Date.now()+(j.expires_in-60)*1000,email:(j.user||{}).email||''});
}
async function token(){
 if(!C.login)return C.key;
 if(!SS)return null;
 if(Date.now()<SS.exp)return SS.at;
 try{await tokenReq('refresh_token',{refresh_token:SS.rt});return SS.at}
 catch(e){if(net(e))return SS.at;saveSess(null);return null}
}
function loginUI(msg){return new Promise(res=>{
 const old=document.getElementById('sbLogin');if(old)old.remove();
 const m=document.createElement('div');m.id='sbLogin';m.className='modal show';
 m.innerHTML=`<div><h3 style="margin-top:0">دخول رخاء</h3><p class="muted">${msg||'ادخل بالإيميل والباسورد'}</p><input id="sbE" type="email" placeholder="الإيميل" autocomplete="username" style="margin-bottom:8px"><input id="sbP" type="password" placeholder="الباسورد" autocomplete="current-password"><div id="sbErr" style="color:#b00020;min-height:22px;margin:6px 0"></div><button class="primary" id="sbGo" style="width:100%">دخول</button></div>`;
 document.body.appendChild(m);
 const go=async()=>{const b=m.querySelector('#sbGo');b.disabled=true;
  try{await tokenReq('password',{email:m.querySelector('#sbE').value.trim(),password:m.querySelector('#sbP').value});m.remove();res()}
  catch(e){m.querySelector('#sbErr').textContent=net(e)?'مفيش اتصال بالإنترنت':e.message;b.disabled=false}};
 m.querySelector('#sbGo').onclick=go;m.querySelector('#sbP').onkeydown=e=>{if(e.key==='Enter')go()};
})}
SB.logout=()=>{saveSess(null);location.reload()};

/* ---------- REST ---------- */
async function raw(path,o={}){
 const t=await token();if(!t)throw new Error('AUTH');
 const h={apikey:C.key,'Content-Type':'application/json',...(o.headers||{})};
 if(C.login||/^eyJ/.test(C.key))h.Authorization='Bearer '+t;   // المفاتيح الجديدة (sb_publishable_...) مش JWT فمتتبعتش كـ Bearer
 const r=await fetch(C.url+'/rest/v1/'+path,{...o,headers:h});
 if(r.status===401&&C.login&&t!==C.key){saveSess(null);throw new Error('AUTH')}
 if(!r.ok){const tx=(await r.text().catch(()=>''))||String(r.status);
  throw new Error(/PGRST205|schema cache|does not exist/i.test(tx)?'الجدول مش موجود في Supabase: شغّل database/supabase-setup.sql':/row-level security|violates/i.test(tx)?'Supabase رفض الكتابة (RLS): شغّل database/supabase-setup.sql تاني في SQL Editor':/jwt|api key|apikey/i.test(tx)?'الـ key في config/config.js غلط':tx.slice(0,200))}
 return r;
}
const upsert=rs=>raw('records?on_conflict=tbl,id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rs)});
async function fetchAll(){
 const out=[];
 for(let o=0;;o+=1000){const r=await raw('records?select=tbl,id,data&tbl=neq._img&order=seq&limit=1000&offset='+o),j=await r.json();out.push(...j);if(j.length<1000)break}
 return out;
}
async function sig(){
 const r=await raw('records?select=updated_at&order=updated_at.desc&limit=1',{headers:{Prefer:'count=exact'}}),j=await r.json(),cr=r.headers.get('content-range');
 return cr?cr+'|'+((j[0]||{}).updated_at||''):'';
}

/* ---------- snapshots ---------- */
const hs=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))|0;return (h>>>0).toString(36)+'.'+s.length};
function snap(d){
 const m={};
 for(const t in TB)for(const r of (d.tables[t]||[])){if(r.ID==null)continue;m[t+'|'+r.ID]={tbl:t,id:String(r.ID),data:r}}
 m['_settings|main']={tbl:'_settings',id:'main',data:d.settings||{}};
 m['_files|all']={tbl:'_files',id:'all',data:{list:d.files||[]}};
 for(const k in m)m[k].h=hs(JSON.stringify(m[k].data));
 return m;
}
const hashes=m=>{const o={};for(const k in m)o[k]=m[k].h;return o};
const KEEP=k=>k==='_settings|main'||k==='_files|all';
function diff(base,cur){
 const up=[],del=[];
 for(const k in cur)if(base[k]!==cur[k].h)up.push(k);
 for(const k in base)if(!cur[k]&&!KEEP(k))del.push(k);
 return{up,del};
}
function fromRows(rows){
 const d={tables:{},settings:{},files:[]};for(const t in TB)d.tables[t]=[];
 for(const r of rows){
  if(r.tbl==='_settings')d.settings=r.data||{};
  else if(r.tbl==='_files')d.files=(r.data&&r.data.list)||[];
  else if(d.tables[r.tbl])d.tables[r.tbl].push(r.data);
 }
 return d;
}
function setDb(d){db.tables=d.tables;db.settings=d.settings;db.files=d.files}

/* ---------- state ---------- */
let BASE={},SIG='',ver=0,pend=false,sending=false,tm=0,polls=0;
const persist=()=>Promise.all([idbSet('sbbase',BASE),idbSet('db',db)]).catch(()=>{});

/* ---------- push (diff against last synced state) ---------- */
async function sync(){
 if(!SB.ok||sending)return;
 sending=true;
 try{
  const cur=snap(db),{up,del}=diff(BASE,cur);
  if(!up.length&&!del.length){pend=false;setState('متزامن ✓');return}
  pend=true;setState('جاري المزامنة…');
  if(del.length>50&&!confirm('هيتحذف '+del.length+' سجل من السيرفر لكل المستخدمين. متأكد؟')){
   sending=false;pend=false;await refresh(true);return}
  const by=typeof user==='string'?user:'';
  for(let i=0;i<up.length;i+=200){
   const part=up.slice(i,i+200);
   await upsert(part.map(k=>({tbl:cur[k].tbl,id:cur[k].id,data:cur[k].data,updated_by:by})));
   part.forEach(k=>BASE[k]=cur[k].h);
  }
  for(const k of del){
   const[t,...id]=k.split('|');
   await raw('records?tbl=eq.'+encodeURIComponent(t)+'&id=eq.'+encodeURIComponent(id.join('|')),{method:'DELETE'});
   delete BASE[k];
  }
  await persist();SB.last=Date.now();SIG='';
  pend=!!(()=>{const x=diff(BASE,snap(db));return x.up.length||x.del.length})();
  setState(pend?'جاري المزامنة…':'متزامن ✓');
  if(pend){sending=false;return sync()}
 }catch(e){
  if(e.message==='AUTH'){sending=false;await loginUI('انتهت الجلسة — ادخل تاني');return sync()}
  pend=true;setState(net(e)?'أوفلاين — هتتزامن لما النت يرجع':'خطأ مزامنة: '+e.message);
  if(!net(e)&&typeof toast==='function')toast('خطأ مزامنة: '+e.message,'err');
 }finally{sending=false}
}
SB.dirty=()=>{ver++;pend=true;clearTimeout(tm);tm=setTimeout(sync,800)};
SB.syncNow=async()=>{await sync();await refresh(true);if(typeof render==='function')render()};

/* ---------- pull ---------- */
async function refresh(force){
 if(!SB.ok||sending)return;
 if(!force){
  if(pend)return;
  if(typeof S!=='undefined'&&S.edit)return;
  if(document.querySelector('.modal.show'))return;
 }
 const v=ver;
 try{
  const sg=await sig();
  if(!force&&sg&&sg===SIG)return;
  const d=fromRows(await fetchAll());
  if(v!==ver)return;                 // المستخدم عدّل أثناء التحميل
  setDb(d);BASE=hashes(snap(d));SIG=sg;await persist();SB.last=Date.now();setState('متزامن ✓');
  render();
 }catch(e){if(e.message==='AUTH'){await loginUI('انتهت الجلسة — ادخل تاني');return refresh(force)}setState('أوفلاين')}
}

/* ---------- boot ---------- */
SB.start=async function(){
 if(C.login&&!await token())await loginUI();
 SB.ok=true;
 let old=null;try{old=await idbGet('sbbase')}catch(e){}
 const loc=snap(db);
 let remote;
 try{remote=await fetchAll()}catch(e){
  if(e.message==='AUTH'){await loginUI('انتهت الجلسة — ادخل تاني');return SB.start()}
  BASE=old||hashes(loc);pend=true;setState('أوفلاين — شغال على نسخة الجهاز');SB.loop();return;
 }
 const rd=fromRows(remote),rs=snap(rd);
 let up=[],del=[];
 if(old){const x=diff(old,loc);up=x.up;del=x.del}                    // تعديلات الجهاز اللي لسه ما اترفعتش
 else up=Object.keys(loc).filter(k=>KEEP(k)?(hasData(loc[k])&&!hasData(rs[k])):!rs[k]);   // أول مرة: الموجود محلياً وناقص في السيرفر
 BASE=hashes(rs);setDb(rd);
 for(const k of up){const s=loc[k];
  if(s.tbl==='_settings')db.settings=s.data;else if(s.tbl==='_files')db.files=s.data.list;
  else{const a=db.tables[s.tbl],i=a.findIndex(r=>String(r.ID)===s.id);i<0?a.push(s.data):a[i]=s.data}}
 for(const k of del){const[t,...id]=k.split('|');db.tables[t]=db.tables[t].filter(r=>String(r.ID)!==id.join('|'))}
 await persist();
 const x=diff(BASE,snap(db));pend=!!(x.up.length||x.del.length);
 if(pend)sync();else setState('متزامن ✓');
 SB.loop();
};
const hasData=s=>s.tbl==='_settings'?Object.keys(s.data).length>0:(s.data.list||[]).length>0;
let looping=false;
SB.loop=()=>{if(looping)return;looping=true;
 setInterval(()=>{if(document.hidden)return;if(pend&&!sending)sync();else refresh()},25000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 window.addEventListener('online',()=>sync());
};

/* ---------- صور المستندات (جدول records بـ tbl='_img') ---------- */
const imgLoaded=new Set();
SB.imgSet=async(id,label,d)=>{try{await upsert([{tbl:'_img',id:id+'|'+label,data:{d},updated_by:typeof user==='string'?user:''}]);return true}catch(e){toast('تعذر رفع الصورة: '+e.message,'err');return false}};
SB.imgDel=async(id,label)=>{try{await raw('records?tbl=eq._img&id=eq.'+encodeURIComponent(id+'|'+label),{method:'DELETE'})}catch(e){toast('تعذر حذف الصورة','err')}};
SB.imgLoad=async id=>{
 if(imgLoaded.has(id))return;imgLoaded.add(id);
 try{const r=await raw('records?select=id,data&tbl=eq._img&id=like.'+encodeURIComponent(id+'|*')),j=await r.json();
  if(!j.length)return;
  IMGS[id]=IMGS[id]||{};let ch=false;
  for(const x of j){const l=x.id.slice(id.length+1);if(IMGS[id][l]!==x.data.d){IMGS[id][l]=x.data.d;ch=true}}
  if(ch){idbSet('imgs',IMGS).catch(()=>{});render()}
 }catch(e){imgLoaded.delete(id)}
};

/* ---------- الشات ---------- */
SB.chatList=async since=>{
 if(!since){const j=await(await raw('chat?select=id,name,text,at&order=id.desc&limit=100')).json();return j.reverse()}
 return(await raw('chat?select=id,name,text,at&order=id&limit=200&id=gt.'+since)).json();
};
SB.chatSend=(name,text)=>raw('chat',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({name:name.slice(0,40),text:text.slice(0,2000)})});

/* ---------- فحص الاتصال ---------- */
SB.diag=async()=>{
 const L=[],t=async(n,f)=>{try{await f();L.push('✅ '+n)}catch(e){L.push('❌ '+n+' — '+(net(e)?'مفيش اتصال/الرابط غلط':e.message))}};
 L.push('الرابط: '+C.url,'نوع الـ key: '+(/^eyJ/.test(C.key)?'JWT (anon)':/^sb_publishable_/.test(C.key)?'publishable':'غير معروف — راجعه'),'تسجيل الدخول: '+(C.login?'مفعّل':'مقفول (مفتوح للجميع)'),'');
 await t('قراءة جدول records',()=>raw('records?select=id&limit=1'));
 await t('كتابة في records',()=>upsert([{tbl:'_diag',id:'t',data:{}}]));
 await t('حذف من records',()=>raw('records?tbl=eq._diag&id=eq.t',{method:'DELETE'}));
 await t('قراءة جدول chat',()=>raw('chat?select=id&limit=1'));
 await t('كتابة في chat',()=>SB.chatSend('فحص','test'));
 alert(L.join('\n'));
};

/* ---------- كارت الحالة في صفحة الملفات ---------- */
SB.card=()=>`<div class="card" style="border-inline-start:6px solid var(--g)"><b style="font-size:16px">${IC('cloud-check')} المزامنة مع Supabase</b>
<p class="muted" style="margin:8px 0">كل التعديلات بتتحفظ تلقائي وبتظهر لكل المستخدمين خلال ثواني. الحالة: <b>${SB.state||'—'}</b>${C.login&&SS&&SS.email?' · '+esc(SS.email):''}</p>
<div class="row"><button class="primary" onclick="SB.syncNow()">${IC('download')} مزامنة دلوقتي</button><button onclick="SB.diag()">فحص الاتصال</button><button onclick="publishData()">${IC('download')} نسخة احتياطية JSON</button>${C.login?'<button onclick="SB.logout()">تسجيل خروج</button>':''}</div></div>`;
})();
