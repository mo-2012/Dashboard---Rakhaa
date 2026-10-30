/* ===== شات بين شخصين (Supabase — جدول chat) =====
   كل واحد بيكتب اسمه على جهازه (زرار المستخدم فوق)، ورسايله بتظهر يمين والطرف التاني شمال */
const CH={msgs:[],tmp:[],last:0,t:0};
document.querySelector('svg[aria-hidden]').insertAdjacentHTML('beforeend','<symbol id="i-message-circle" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></symbol><symbol id="i-send" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></symbol>');
PAGES.splice(PAGES.length-1,0,['chat',IC('message-circle')+' شات']);
document.head.insertAdjacentHTML('beforeend',`<style>
.chat{display:flex;flex-direction:column;height:min(72vh,640px);min-height:380px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#fff}
.chh{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--g);color:#fff}
.chh b{display:block;font-size:15px}.chh small{opacity:.8;font-size:12px}
.chav{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:800;flex:none;border:2px solid rgba(255,255,255,.7)}
.chbox{flex:1;overflow:auto;padding:12px 10px;background:#ECE5DD;display:flex;flex-direction:column;gap:3px}
.chday{align-self:center;margin:8px 0}.chday span{background:rgba(255,255,255,.85);border-radius:10px;padding:3px 12px;font-size:12px;font-weight:700;color:#555}
.chrow{display:flex;align-items:flex-end;gap:6px}.chrow.me{justify-content:flex-start}.chrow.they{justify-content:flex-end}
.chrow.first{margin-top:6px}.chsp{width:30px;flex:none}
.chb{max-width:78%;padding:7px 11px 4px;border-radius:14px;box-shadow:0 1px 1px rgba(0,0,0,.12)}
.me .chb{background:#D9FDD3;color:#111;border-top-right-radius:4px}
.they .chb{background:#fff;color:#111;border-top-left-radius:4px}
.chtx{white-space:pre-wrap;word-break:break-word;line-height:1.7}
.chb small{display:block;text-align:end;font-size:11px;opacity:.6;margin-top:1px}
.chempty{margin:auto;text-align:center;color:#666;padding:20px}
.chf{display:flex;gap:8px;align-items:center;padding:8px 10px;background:#F0F2F5;border-top:1px solid var(--line)}
.chf input{flex:1;border-radius:22px;padding:10px 16px;border:1px solid var(--line);background:#fff;min-height:44px}
.chf button{width:44px;height:44px;border-radius:50%;padding:0;display:inline-flex;align-items:center;justify-content:center;background:var(--g);color:#fff;border:0}
</style>`);
const PAL=['#0F5A41','#1F4E79','#C55A11','#7030A0','#B00020','#00796B'];
const chCol=n=>{let h=0;for(const c of n||'')h=(h*31+c.charCodeAt(0))>>>0;return PAL[h%PAL.length]};
const chAv=(n,s=34)=>`<span class="chav" style="width:${s}px;height:${s}px;background:${chCol(n)};font-size:${Math.round(s*.45)}px">${esc((n||'?').trim().charAt(0))}</span>`;
const tm2=m=>{try{return new Date(m).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}catch(e){return''}};
const chDay=d=>{const t=new Date(),y=new Date(Date.now()-864e5);return d.toDateString()===t.toDateString()?'النهاردة':d.toDateString()===y.toDateString()?'امبارح':d.toLocaleDateString('ar-EG',{day:'numeric',month:'long'})};
const chOther=()=>{const m=CH.msgs.find(x=>x.name!==user);return m?m.name:''};
const chHead=()=>{const o=chOther(),last=[...CH.msgs].reverse().find(x=>x.name===o);
 return`${chAv(o||'؟',42)}<div style="flex:1"><b>${o?esc(o):'في انتظار الطرف التاني…'}</b><small>${o?(last?'آخر رسالة '+tm2(last.at):''):'لسه محدش تاني كتب'}</small></div><div style="text-align:end"><small>أنت</small><b style="font-size:13px">${esc(user||'—')}</b></div>${chAv(user||'؟',34)}`};
const chHtml=()=>{const all=[...CH.msgs,...CH.tmp];if(!all.length)return'<div class="chempty">مفيش رسائل لسه 👋<br>اكتب أول رسالة</div>';
 let out='',ld='',ls='';
 for(const m of all){const d=new Date(m.at),me=m.name===user;
  if(d.toDateString()!==ld){out+=`<div class="chday"><span>${chDay(d)}</span></div>`;ld=d.toDateString();ls=''}
  const first=ls!==m.name;ls=m.name;
  const b=`<div class="chb"><div class="chtx">${esc(m.text)}</div><small>${m.pending?'⏳':tm2(m.at)}</small></div>`;
  out+=`<div class="chrow ${me?'me':'they'}${first?' first':''}">${me?b:b+(first?chAv(m.name,30):'<span class="chsp"></span>')}</div>`}
 return out};
PG.chat=()=>{if(!user)setTimeout(openUser,60);setTimeout(()=>chPoll(true),0);
 return`<div class="chat"><div class="chh" id="chHd">${chHead()}</div><div class="chbox" id="chBox">${chHtml()}</div><div id="chErr" class="muted" style="padding:0 12px;font-size:12px;background:#F0F2F5"></div><div class="chf"><input id="chIn" placeholder="اكتب رسالة..." autocomplete="off" onkeydown="if(event.key==='Enter')chSend()"><button onclick="chSend()" aria-label="إرسال">${IC('send')}</button></div></div>`};
function chPaint(stick){const b=$('#chBox');if(!b)return;const near=b.scrollHeight-b.scrollTop-b.clientHeight<90||stick;b.innerHTML=chHtml();if(near)b.scrollTop=b.scrollHeight;const h=$('#chHd');if(h)h.innerHTML=chHead()}
async function chPoll(first){clearTimeout(CH.t);if(S.page!=='chat')return;const e=$('#chErr');
 if(!(window.SB&&SB.ok)){if(e)e.textContent='الشات محتاج ربط Supabase (config/config.js)';return}
 try{const m=await SB.chatList(CH.last);if(e)e.textContent='';if(m.length){CH.msgs.push(...m);CH.last=CH.msgs[CH.msgs.length-1].id;chPaint(false)}else if(first)chPaint(true)}
 catch(x){if(e)e.textContent=x.message||'الشات مش متصل'}
 CH.t=setTimeout(chPoll,2500)}
async function chSend(){if(!user)return openUser();if(!(window.SB&&SB.ok))return toast('الشات محتاج ربط Supabase','err');
 const i=$('#chIn'),text=i.value.trim();if(!text)return;i.value='';
 const t={id:'t'+Date.now(),name:user,text,at:new Date().toISOString(),pending:true};CH.tmp.push(t);chPaint(true);
 try{await SB.chatSend(user,text);await chPoll();CH.tmp=CH.tmp.filter(x=>x!==t);chPaint(true)}
 catch(x){CH.tmp=CH.tmp.filter(y=>y!==t);i.value=text;chPaint(false);toast('الإرسال فشل: '+(x.message||''),'err')}
 const n=$('#chIn');if(n)n.focus()}
