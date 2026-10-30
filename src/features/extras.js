/* ===== إضافات النظام: حضور جماعي / فواتير بالاستحقاق / رسم بياني / طباعة / نسخ احتياطي ===== */

Object.assign(SC,{'جزئي':'#b7791f','مستحق':'#6B7A72'});
function printDoc(h){const d=$('#pdoc');d.innerHTML=`<div class=ph>${logo?`<img src="${logo}" alt="">`:''}<div><b>${esc(db.settings.company||'رخاء')}</b><br><small>${dm(today())}</small></div></div>${h}<div class=sigs2><div>المحاسب</div><div>المدير المسؤول</div><div>توقيع المستلم</div></div>`;document.body.classList.add('pd');print()}
addEventListener('afterprint',()=>document.body.classList.remove('pd'));

/* ---- حضور جماعي ---- */
PAGES.splice(12,0,['bulk',IC('calendar-check')+' حضور جماعي']);S.bf='';
const bw_=()=>T('Workers').filter(w=>w['كود المصنع الحالي']===S.bf&&w['الحالة']===ACT);
const bex=w=>T('Attendance').find(r=>r[CW]===w[CW]&&r[CF]===S.bf&&(r[AM]||'').slice(0,7)===S.m)||{};
const BK=[['أيام الحضور','d'],['ساعات إضافي','o'],['مكافآت / بدلات','b'],['قسط سلفة مخصوم','a'],['خصومات أخرى (جزاءات..)','x']];
PG.bulk=()=>{const ws=bw_();return mBar(`<label>المصنع <select onchange="S.bf=this.value;render()"><option value="">— اختر المصنع —</option>${T('Factories').map(f=>`<option value="${esc(f['كود المصنع'])}"${f['كود المصنع']===S.bf?' selected':''}>${esc(f[FN_])}</option>`).join('')}</select></label><button class="primary" onclick="saveBulk()">${IC('save')} حفظ الكل</button>`)
+`<div class="tw"><table class="rt"><thead><tr><th>العامل</th>${BK.map(b=>`<th>${b[0]}</th>`).join('')}</tr></thead><tbody>${ws.map((w,i)=>{const e=bex(w);return`<tr><td class="l" data-label="العامل">${esc(w[WN])}</td>${BK.map(([k,id])=>`<td data-label="${k}"><input id="b${i}${id}" type="number" step="any" min="0" style="width:90px" value="${esc(e[k]==null?'':e[k])}"></td>`).join('')}</tr>`}).join('')||`<tr><td colspan="6" class="muted">${S.bf?'مفيش عمال على رأس العمل في المصنع ده':'اختر مصنع لعرض عماله'}</td></tr>`}</tbody></table></div>`};
function saveBulk(){if(!user)return openUser();if(!S.bf)return toast('اختر المصنع','err');const rows=[];
 bw_().forEach((w,i)=>{const v=id=>$('#b'+i+id).value,e=bex(w);if(BK.every(b=>v(b[1])==='')&&!e.ID)return;
  const o=Object.assign({},e,{ID:e.ID||'ATT'+Date.now().toString(36).toUpperCase()+i,[AM]:e[AM]||S.m+'-01',[CW]:w[CW],[CF]:S.bf});BK.forEach(([k,id])=>o[k]=v(id)===''?'':+v(id));
  if(e.ID)Object.assign(e,o);else T('Attendance').push(o);rows.push(o)});
 if(!rows.length)return toast('مفيش بيانات للحفظ','err');saveLocal();post({action:'bulk',table:'Attendance',rows,user});toast(IC('check')+' تم حفظ '+rows.length+' سجل');render()}

/* ---- قسيمة الراتب ---- */
const oPay=pPay;PG.pay=()=>{const p=payroll(S.m);return oPay()+(p.length?`<div class="bar row noprint"><label>قسيمة راتب <select id="psw">${p.map((r,i)=>`<option value="${i}">${esc(r.w)} — ${esc(r.fn)}</option>`).join('')}</select></label><button onclick="printSlip()">${IC('printer')} طباعة القسيمة</button></div>`:'')};
function printSlip(){const r=payroll(S.m)[+$('#psw').value];if(!r)return;
 const L=[['أيام الحضور',r.d],['ساعات الإضافي',r.o],['الأجر الأساسي',r.base],['أجر الإضافي',r.otp],['مكافآت وبدلات',r.bonus],['إجمالي المستحق',r.gross],['خصم التأمينات',r.ins],['خصم السكن',r.hs],['خصم المواصلات',r.tr],['قسط السلفة',r.ai],['خصومات أخرى',r.od],['إجمالي الخصومات',r.td],['صافي الراتب',r.net]];
 printDoc(`<h2>قسيمة راتب — ${S.m}</h2><p><b>${esc(r.w)}</b> (${esc(r.c)}) · ${esc(r.fn)}</p><table><tbody>${L.map(([k,v])=>`<tr><td>${k}</td><td>${fn(v)}</td></tr>`).join('')}</tbody></table>`)}

/* ---- فواتير المصانع: استحقاق + تسديد تلقائي من الأقدم للأحدث ---- */
function invList(){const left={};T('Payments').forEach(p=>left[p['كود المصنع']]=(left[p['كود المصنع']]||0)+N(p,'المبلغ المحصّل'));
 return invData().sort((a,b)=>a.m<b.m?-1:a.m>b.m?1:0).map(r=>{const f=by('Factories',r.fc)||{},[y,mo]=r.m.split('-').map(Number),due=addDays(new Date(Date.UTC(y,mo,0)).toISOString().slice(0,10),N(f,'مهلة السداد (يوم)')),p=Math.min(left[r.fc]||0,r.a);left[r.fc]=(left[r.fc]||0)-p;const rem=r.a-p;
  return Object.assign(r,{due,p,rem,st:rem<.005?'مسدد':due<today()?'متأخر':p>0?'جزئي':'مستحق'})}).reverse()}
function printInv(m,fc){const rs=payroll(m).filter(r=>r.f===fc),f=by('Factories',fc)||{};
 printDoc(`<h2>فاتورة توريد عمالة — ${m}</h2><p><b>${esc(f[FN_]||fc)}</b> (${esc(fc)})</p><table><thead><tr><th>العامل</th><th>أيام</th><th>إضافي</th><th>القيمة</th></tr></thead><tbody>${rs.map(r=>`<tr><td>${esc(r.w)}</td><td>${fn(r.d)}</td><td>${fn(r.o)}</td><td>${fn(r.rev)}</td></tr>`).join('')}</tbody><tfoot><tr><td>الإجمالي</td><td>${fn(sum(rs,'d'))}</td><td>${fn(sum(rs,'o'))}</td><td>${fn(sum(rs,'rev'))}</td></tr></tfoot></table>`)}
const oInv=pInv;PG.inv=()=>{const L=invList(),late=L.filter(x=>x.st==='متأخر');
 return oInv().replace(/<h3[^>]*>الفواتير الشهرية[\s\S]*$/,`<div class="cards">${K('فواتير متأخرة',late.length,late.length?'bad':'')}${K('مبلغ متأخر',fmt(late.reduce((a,x)=>a+x.rem,0)),late.length?'bad':'')}</div><h3>الفواتير الشهرية</h3><div class="tw"><table class="rt"><thead><tr><th>الشهر</th><th>المصنع</th><th>عمال</th><th>القيمة</th><th>المسدد</th><th>المتبقي</th><th>الاستحقاق</th><th>الحالة</th><th class="noprint"></th></tr></thead><tbody>${L.map(r=>`<tr><td data-label="الشهر">${r.m}</td><td class="l" data-label="المصنع">${esc(r.fn||r.fc)}</td><td data-label="عمال">${r.n}</td><td data-label="القيمة">${fmt(r.a)}</td><td data-label="المسدد">${fmt(r.p)}</td><td class="bal" data-label="المتبقي">${fmt(r.rem)}</td><td data-label="الاستحقاق">${dm(r.due)}</td><td data-label="الحالة">${cx(r.st)}</td><td class="noprint"><button class="ib" onclick="printInv('${r.m}','${esc(r.fc)}')">${IC('printer')}</button></td></tr>`).join('')||'<tr><td colspan="9" class="muted">لا توجد فواتير</td></tr>'}</tbody></table></div>`)};

/* ---- لوحة التحكم: رسم 6 شهور + ملخص المصانع ---- */
const pm=(m,k)=>{const [y,o]=m.split('-').map(Number),d=new Date(Date.UTC(y,o-1-k,1));return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)};
const oDash=pDash;PG.dash=()=>{const D=[5,4,3,2,1,0].map(k=>{const m=pm(S.m,k),p=payroll(m);return{m,rev:sum(p,'rev'),pay:sum(p,'gross')}}),mx=Math.max(1,...D.flatMap(x=>[x.rev,x.pay]));
 const bars=D.map((x,i)=>{const X=20+i*95,a=x.rev/mx*130,b=x.pay/mx*130;return`<rect x="${X}" y="${150-a}" width="26" height="${a}" rx="4" fill="#C9A24B"/><rect x="${X+30}" y="${150-b}" width="26" height="${b}" rx="4" fill="#0F5A41"/><text x="${X+28}" y="168" text-anchor="middle" font-size="11" fill="#6B7A72">${x.m.slice(2)}</text>`}).join('');
 const p=payroll(S.m),{F}=fSum(),fs=T('Factories').map(f=>{const c=f['كود المصنع'],q=p.filter(r=>r.f===c);return`<tr><td class="l">${esc(f[FN_])}</td><td>${T('Workers').filter(w=>w['كود المصنع الحالي']===c&&w['الحالة']===ACT).length}</td><td>${fn(sum(q,'d'))}</td><td>${fn(sum(q,'rev'))}</td><td>${fn(sum(q,'gross'))}</td><td>${fn(sum(q,'mg'))}</td><td class="bal">${fn(F[c]?F[c].i-F[c].c:0)}</td></tr>`}).join('');
 return oDash()+`<div class="card"><b>${IC('chart-column')} آخر 6 شهور <span class="muted">— إيراد المصانع (ذهبي) مقابل المستحقات (أخضر)</span></b><svg viewBox="0 0 590 176" style="width:100%;max-height:220px;margin-top:8px">${bars}</svg></div><h3>${IC('factory')} ملخص المصانع (${S.m})</h3><div class="tw"><table><thead><tr><th>المصنع</th><th>عمال</th><th>أيام</th><th>الإيراد</th><th>المستحقات</th><th>الهامش</th><th>المتبقي</th></tr></thead><tbody>${fs||'<tr><td colspan="7" class="muted">لا توجد بيانات</td></tr>'}</tbody></table></div>`};

/* ---- نسخة احتياطية ---- */
const oSet=pSet;PG.settings=()=>oSet()+`<div class="card"><b>${IC('download')} نسخة احتياطية</b><p class="muted">حمّل نسخة كاملة من البيانات، أو ارفع نسخة قديمة لدمجها.</p><div class="row"><button onclick="backup()">${IC('download')} تحميل نسخة (JSON)</button><input type="file" accept=".json" style="flex:1;min-width:200px" onchange="restore(event)"></div></div>`;
function backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({v:1,settings:db.settings,tables:db.tables})],{type:'application/json'}));a.download='rakhaa-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function restore(ev){const f=ev.target.files[0];ev.target.value='';if(!f)return;if(!user)return openUser();if(!confirm('هيتم دمج النسخة مع البيانات الحالية على الجهاز. متأكد؟'))return;
 f.text().then(x=>{const d=JSON.parse(x);let n=0;for(const t in TB){const rs=(d.tables||{})[t]||[];rs.forEach(o=>{const i=T(t).findIndex(r=>r.ID===o.ID);i<0?T(t).push(o):T(t)[i]=o});if(rs.length){post({action:'bulk',table:t,rows:rs,user});n+=rs.length}}saveLocal();render();toast(IC('check')+' تم دمج '+n+' سجل')}).catch(()=>toast(IC('triangle-alert')+' ملف غير صالح','err'))}

/* شاشة بداية واضحة لو مفيش بيانات */
{const oD=PG.dash;PG.dash=()=>{const empty=!['Workers','Factories','Drivers','Vehicles'].some(t=>T(t).length);
 return(empty?`<div class="card" style="border-inline-start:4px solid var(--gold);text-align:center;padding:22px 16px"><div style="font-size:18px;font-weight:800;color:var(--g)">أهلاً بيك في رخاء 👋</div><p class="muted" style="margin:8px 0 14px">مفيش بيانات لسه. ابدأ برفع ملف Excel بتاعك (أو نزّل النموذج وعبّيه)، وبعدها هتلاقي كل حاجة منظمة في الأقسام.</p><button class="primary" onclick="go('files')">${IC('file-up')} ابدأ برفع ملف</button></div>`:'')+oD()}}
