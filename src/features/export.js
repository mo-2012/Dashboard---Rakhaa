/* ===== تصدير Excel منسّق (للعميل / للإدارة / نسخة كاملة) ===== */
const IC=n=>`<svg class=i><use href=#i-${n}></use></svg>`;
const XC={g:'FF0F5A41',g2:'FF0A4230',gold:'FFC9A24B',g3:'FFE7F0EB',zb:'FFF7F5EE',ln:'FFD9D3C3',mut:'FF6B7A72'};
const fill=a=>({type:'pattern',pattern:'solid',fgColor:{argb:a}}),thin={style:'thin',color:{argb:XC.ln}},bd={top:thin,bottom:thin,left:thin,right:thin};
function dlX(buf,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download=name.replace(/[\\/:*?"<>|]/g,'_');document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
function newWB(){const wb=new ExcelJS.Workbook();wb.creator=db.settings.company||'رخاء';wb.created=new Date();return wb}
const PS={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9};
function banner(wb,ws,title,sub,n){
 [1,2,3].forEach(r=>ws.mergeCells(r,1,r,n));
 const a=ws.getCell(1,1);a.value=db.settings.company||'رخاء';a.font={size:20,bold:true,color:{argb:'FFFFFFFF'}};a.fill=fill(XC.g);a.alignment={vertical:'middle',horizontal:'right',indent:1};ws.getRow(1).height=40;
 const b=ws.getCell(2,1);b.value=title;b.font={size:14,bold:true,color:{argb:XC.g2}};b.fill=fill('FFE6CB86');b.alignment={vertical:'middle',horizontal:'right',indent:1};ws.getRow(2).height=26;
 const c=ws.getCell(3,1);c.value=(sub?sub+'  ·  ':'')+'تاريخ التصدير '+dm(today());c.font={size:10,color:{argb:XC.mut}};c.alignment={horizontal:'right',indent:1};
 if(logo){try{const id=wb.addImage({base64:logo,extension:'png'});ws.addImage(id,{tl:{col:Math.max(0,n-1.8),row:0.12},ext:{width:105,height:34}})}catch(e){}}}
const CFS={r:{font:{color:{argb:'FF9C0006'},bold:true},fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFC7CE'}}},y:{font:{color:{argb:'FF7A5200'},bold:true},fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFEB9C'}}},g:{font:{color:{argb:'FF006100'},bold:true},fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFC6EFCE'}}}};
/* o: num[] أعمدة أرقام، sum[] أعمدة إجمالي (صيغة SUM)، stat عمود حالة، scale عمود تدرّج لوني، neg عمود يتلوّن أحمر لو سالب */
function tbl(wb,name,title,head,rows,o){o=o||{};const n=head.length,ws=wb.addWorksheet(name.slice(0,31),{views:[{rightToLeft:true,state:'frozen',ySplit:4,showGridLines:false}],properties:{tabColor:{argb:o.tab||XC.g}},pageSetup:Object.assign({printTitlesRow:'4:4'},PS)});
 banner(wb,ws,title,o.sub,Math.max(n,4));const hr=ws.getRow(4);hr.height=28;
 head.forEach((h,i)=>{const c=hr.getCell(i+1);c.value=h;c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill=fill(XC.g2);c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border=bd});
 const val=v=>v&&v.formula?v.result:v;
 rows.forEach((r,ri)=>{const row=ws.getRow(5+ri);r.forEach((v,i)=>{const c=row.getCell(i+1);c.value=v===''||v==null?null:v;c.border=bd;c.alignment={horizontal:'center',vertical:'middle'};if(o.num&&o.num.includes(i))c.numFmt='#,##0.00';if(ri%2)c.fill=fill(XC.zb)})});
 const last=4+rows.length;
 if(o.sum&&rows.length){const tr=ws.getRow(last+1);tr.height=24;for(let i=0;i<n;i++){const c=tr.getCell(i+1);c.fill=fill(XC.g);c.font={bold:true,color:{argb:'FFFFFFFF'}};c.alignment={horizontal:'center',vertical:'middle'};c.border=bd}
  tr.getCell(1).value='الإجمالي';o.sum.forEach(i=>{const L=ws.getColumn(i+1).letter;tr.getCell(i+1).value={formula:`SUM(${L}5:${L}${last})`,result:rows.reduce((a,r)=>a+(+val(r[i])||0),0)};tr.getCell(i+1).numFmt='#,##0.00'})}
 if(rows.length){const rg=i=>{const L=ws.getColumn(i+1).letter;return`${L}5:${L}${last}`};
  if(o.stat!=null&&o.stat>=0)ws.addConditionalFormatting({ref:rg(o.stat),rules:[['متأخر','r'],['منتهي','r'],['ينتهي قريباً','y'],['جزئي','y'],['مستحق','y'],['مسدد','g'],['ساري','g']].map(([t,k],i)=>({type:'containsText',operator:'containsText',text:t,priority:i+1,style:CFS[k]}))});
  if(o.scale!=null)ws.addConditionalFormatting({ref:rg(o.scale),rules:[{type:'colorScale',priority:20,cfvo:[{type:'min'},{type:'max'}],color:[{argb:'FFFFFFFF'},{argb:'FFE6CB86'}]}]});
  if(o.neg!=null)ws.addConditionalFormatting({ref:rg(o.neg),rules:[{type:'cellIs',operator:'lessThan',priority:21,formulae:['0'],style:{font:{color:{argb:'FFB3392F'},bold:true}}}]});
  ws.autoFilter={from:{row:4,column:1},to:{row:4,column:n}}}
 head.forEach((h,i)=>ws.getColumn(i+1).width=Math.min(45,Math.max(10,String(h).length+4,...rows.slice(0,300).map(r=>String(val(r[i])==null?'':val(r[i])).length+3))));
 ws.headerFooter.oddFooter='&Cصفحة &P من &N';return ws}
function chartPNG(D,la,lb){try{const c=document.createElement('canvas');c.width=700;c.height=270;const x=c.getContext('2d');if(!x)return null;
 x.fillStyle='#fff';x.fillRect(0,0,700,270);const mx=Math.max(1,...D.flatMap(d=>[d.a,d.b||0])),bw=lb?34:56;x.font='13px Tahoma,Arial';x.textAlign='center';
 D.forEach((d,i)=>{const X=50+i*(600/D.length)+(600/D.length-(lb?2*bw+6:bw))/2,h=d.a/mx*170;x.fillStyle='#C9A24B';x.fillRect(X,215-h,bw,h);if(lb){const h2=d.b/mx*170;x.fillStyle='#0F5A41';x.fillRect(X+bw+6,215-h2,bw,h2)}x.fillStyle='#6B7A72';x.fillText(d.l,X+(lb?bw+3:bw/2),236)});
 x.fillStyle='#14231D';x.font='bold 14px Tahoma,Arial';x.textAlign='right';x.fillText(la+(lb?'  (ذهبي)  /  '+lb+'  (أخضر)':''),690,24);return c.toDataURL('image/png')}catch(e){return null}}
function kpiSheet(wb,name,title,sub,kp,chart){const ws=wb.addWorksheet(name,{views:[{rightToLeft:true,showGridLines:false}],properties:{tabColor:{argb:XC.gold}},pageSetup:PS});for(let i=1;i<=8;i++)ws.getColumn(i).width=17;banner(wb,ws,title,sub,8);
 kp.forEach(([l,v,f,bad],i)=>{const r=5+Math.floor(i/4)*3,c=1+(i%4)*2;ws.mergeCells(r,c,r,c+1);ws.mergeCells(r+1,c,r+1,c+1);const a=ws.getCell(r,c),b=ws.getCell(r+1,c);a.value=l;a.font={size:10,color:{argb:XC.mut}};a.alignment={horizontal:'center'};b.value=v;b.font={size:16,bold:true,color:{argb:bad?'FFB3392F':XC.g}};b.alignment={horizontal:'center',vertical:'middle'};if(f)b.numFmt=f;ws.getRow(r+1).height=30;
  [a,b].forEach(x=>{x.fill=fill(XC.g3);x.border={left:{style:'medium',color:{argb:XC.gold}},right:thin,top:thin,bottom:thin}})});
 if(chart){const id=wb.addImage({base64:chart,extension:'png'});ws.addImage(id,{tl:{col:0.2,row:5+Math.ceil(kp.length/4)*3},ext:{width:700,height:270}})}return ws}
const M2=(m,k)=>{const [y,o]=m.split('-').map(Number),d=new Date(Date.UTC(y,o-1-k,1));return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)};
async function save(wb,name){dlX(await wb.xlsx.writeBuffer(),name)}
const fail=e=>toast(IC('triangle-alert')+' '+(e&&e.message||e),'err');
/* ---- تصدير عادي لأي جدول (يستبدل القديم) ---- */
async function xl(name,head,rows,num){try{await loadXL();const wb=newWB();tbl(wb,name,name,head,rows,{num,sum:/^رواتب/.test(name)?num:null,stat:head.findIndex(h=>/حالة|^الحالة/.test(h))});await save(wb,name+'.xlsx');toast(IC('check')+' تم التصدير')}catch(e){fail(e)}}
/* ---- حزمة العميل (مصنع) ---- */
function stmtRows(fc){const ev=[];invList().filter(x=>x.fc===fc).forEach(x=>{const [y,mo]=x.m.split('-').map(Number);ev.push([new Date(Date.UTC(y,mo,0)).toISOString().slice(0,10),'فاتورة توريد عمالة '+x.m,x.a,0])});
 T('Payments').filter(p=>p['كود المصنع']===fc).forEach(p=>ev.push([p['التاريخ']||'','تحصيل'+(p['ملاحظات']?' - '+p['ملاحظات']:''),0,N(p,'المبلغ المحصّل')]));
 ev.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);let b=0;return ev.map((e,i)=>{b+=e[2]-e[3];return[dm(e[0]),e[1],e[2],e[3],{formula:i?`E${4+i}+C${5+i}-D${5+i}`:`C5-D5`,result:b}]})}
async function exportClient(fc,m,o){try{await loadXL();const f=by('Factories',fc);if(!f)return toast('اختر المصنع','err');const wb=newWB(),p=payroll(m).filter(r=>r.f===fc),cur=invList().find(x=>x.fc===fc&&x.m===m),F=fSum().F[fc]||{i:0,c:0},fname=f[FN_]||fc,sub=fname+' — شهر '+m;
 if(o.sum)kpiSheet(wb,'الملخص','ملخص التوريد — '+fname,sub,[['عدد العمال',p.length],['أيام العمل',sum(p,'d'),'#,##0.##'],['ساعات الإضافي',sum(p,'o'),'#,##0.##'],['قيمة فاتورة الشهر',sum(p,'rev'),'#,##0.00'],['المسدد من الفاتورة',cur?cur.p:0,'#,##0.00'],['المتبقي من الفاتورة',cur?cur.rem:0,'#,##0.00',cur&&cur.rem>0],['تاريخ الاستحقاق',cur?dm(cur.due):'-'],['حالة الفاتورة',cur?cur.st:'-'],['إجمالي رصيد المصنع',F.i-F.c,'#,##0.00',F.i-F.c>0]],chartPNG([5,4,3,2,1,0].map(k=>({l:M2(m,k).slice(2),a:sum(payroll(M2(m,k)).filter(r=>r.f===fc),'rev')})),'قيمة الفواتير آخر 6 شهور'));
 if(o.att){const rate=N(f,'سعر اليوم للعامل (ج.م)'),ot=N(f,'سعر ساعة الإضافي (ج.م)');tbl(wb,'كشف الحضور','كشف حضور العمالة — '+fname,['م','كود العامل','اسم العامل','الوظيفة','أيام الحضور','ساعات إضافي','سعر اليوم','سعر ساعة الإضافي','القيمة'],p.map((r,i)=>{const w=by('Workers',r.c)||{};return[i+1,r.c,r.w,w['الوظيفة']||'',r.d,r.o,rate,ot,{formula:`E${5+i}*G${5+i}+F${5+i}*H${5+i}`,result:r.rev}]}),{sub,num:[4,5,6,7,8],sum:[4,5,8],scale:8})}
 if(o.stm)tbl(wb,'كشف الحساب','كشف حساب — '+fname,['التاريخ','البيان','مدين (فاتورة)','دائن (تحصيل)','الرصيد'],stmtRows(fc),{sub,num:[2,3,4],sum:[2,3],neg:null,tab:XC.gold});
 if(o.wk){const ws=T('Workers').filter(w=>w['كود المصنع الحالي']===fc&&w['الحالة']===ACT);tbl(wb,'العمال','العمالة الحالية — '+fname,['م','كود العامل','الاسم','الوظيفة','تاريخ التعيين'].concat(o.nid?['الرقم القومي']:[]),ws.map((w,i)=>[i+1,w[CW],w[WN],w['الوظيفة']||'',dm(w['تاريخ التعيين'])].concat(o.nid?[String(w['الرقم القومي']||'')]:[])),{sub})}
 if(!wb.worksheets.length)return toast('اختر قسم واحد على الأقل','err');await save(wb,`عميل_${fname}_${m}.xlsx`);toast(IC('check')+' تم تجهيز ملف العميل')}catch(e){fail(e)}}
/* ---- تقرير الإدارة / نسخة كاملة ---- */
async function exportMgmt(m,raw){try{await loadXL();const wb=newWB(),p=payroll(m),{F}=fSum(),inv=invList(),a=alerts(),sub='شهر '+m,
 ex=T('Expenses').filter(r=>(r['التاريخ']||'').slice(0,7)===m).reduce((s,r)=>s+N(r,'المبلغ'),0),mg=sum(p,'mg'),out=Object.values(F).reduce((s,x)=>s+x.i-x.c,0),adv=T('Workers').reduce((s,w)=>s+advBal(w[CW]),0);
 kpiSheet(wb,'لوحة الإدارة','لوحة الإدارة — '+m,sub,[['إيراد المصانع',sum(p,'rev'),'#,##0.00'],['مستحقات العمال',sum(p,'gross'),'#,##0.00'],['صافي الرواتب',sum(p,'net'),'#,##0.00'],['الهامش',mg,'#,##0.00',mg<0],['مصروفات الشهر',ex,'#,##0.00'],['صافي ربح الشهر',mg-ex,'#,##0.00',mg-ex<0],['المتبقي على المصانع',out,'#,##0.00',out>0],['سلف على العمال',adv,'#,##0.00']],chartPNG([5,4,3,2,1,0].map(k=>{const q=payroll(M2(m,k));return{l:M2(m,k).slice(2),a:sum(q,'rev'),b:sum(q,'gross')}}),'إيراد المصانع','المستحقات'));
 tbl(wb,'الرواتب','كشف الرواتب — '+m,PH.map(h=>h[0]),p.map(r=>PH.map(([,k])=>r[k])),{sub,num:PH.map((_,i)=>i).slice(2),sum:PH.map((_,i)=>i).slice(2),neg:16,scale:14});
 tbl(wb,'الفواتير','فواتير المصانع',['الشهر','المصنع','عمال','أيام','إضافي','القيمة','المسدد','المتبقي','الاستحقاق','الحالة'],inv.map(r=>[r.m,r.fn||r.fc,r.n,r.d,r.o,r.a,r.p,r.rem,dm(r.due),r.st]),{num:[5,6,7],sum:[5,6,7],stat:9,scale:5,tab:XC.gold});
 tbl(wb,'ملخص المصانع','ملخص المصانع — '+m,['المصنع','عمال','أيام','الإيراد','المستحقات','الهامش','المتبقي'],T('Factories').map(f=>{const c=f['كود المصنع'],q=p.filter(r=>r.f===c);return[f[FN_],T('Workers').filter(w=>w['كود المصنع الحالي']===c&&w[ 'الحالة']===ACT).length,sum(q,'d'),sum(q,'rev'),sum(q,'gross'),sum(q,'mg'),F[c]?F[c].i-F[c].c:0]}),{sub,num:[3,4,5,6],sum:[1,2,3,4,5,6],neg:5,scale:3});
 tbl(wb,'التنبيهات','تنبيهات الانتهاء',['النوع','الاسم','رقم','الانتهاء','الأيام المتبقية','الحالة'],a.map(x=>[x.ty,x.who,x.what,dm(x.d),x.n,x.n<0?'منتهي':'ينتهي قريباً']),{stat:5,tab:'FFB3392F'});
 tbl(wb,'أرصدة السلف','أرصدة السلف على العمال',['كود العامل','العامل','الرصيد'],T('Workers').map(w=>[w[CW],w[WN],advBal(w[CW])]).filter(r=>r[2]),{num:[2],sum:[2],scale:2});
 if(raw)for(const t in TB){if(!T(t).length)continue;const c=TB[t],exk=Object.keys(CALC[t]?CALC[t](T(t)[0]||{}):{}).filter(k=>k!=='ملف');tbl(wb,c.t,c.t,c.cols.map(x=>x[0]).concat(exk),T(t).map(r=>{const q=CALC[t]?CALC[t](r):{};return c.cols.map(x=>r[x[0]]).concat(exk.map(k=>q[k]==null?'':String(q[k])))}),{num:c.cols.map((x,i)=>x[1]==='n'?i:-1).filter(i=>i>=0),tab:'FF6B7A72'})}
 await save(wb,(raw?'نسخة_كاملة_':'تقرير_الإدارة_')+m+'.xlsx');toast(IC('check')+' تم التصدير')}catch(e){fail(e)}}
