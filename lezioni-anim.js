/* Wagabondo: animazioni delle lezioni di addestramento.
   Ogni lezione è una piccola scena (cane, persona, mano, premio) descritta da una sequenza di fotogrammi chiave.
   Uso: AllDogsAnim.mount(contenitore, nomeCane) trasforma ogni <div data-anim="id"> in un'animazione. */
(function(){
"use strict";
const W=360,H=200,G=170,NS="http://www.w3.org/2000/svg";
const DOG="#c98a4b",DOGD="#94612f",DOG2="#9ea3ae",DOG2D="#737985",SKIN="#f0c39d",SKIND="#d9a47c",PANTS="#3d4558",TREAT="#7a4a1e",TOY="#e0533d",INK="#2a1d14";
const R2D=Math.PI/180;

/* ---------- pose del cane (coordinate locali, cane rivolto a destra, terra = 0) ---------- */
// H anca, S spalla, hd testa rispetto alla spalla, L zampe anteriori e R posteriori [zampa x,y, ginocchio x,y], ta angolo della coda
const POSE={
 stand:{H:[-28,-48],S:[24,-50],hd:[16,-22],L:[[22,0,24,-24],[30,0,30,-24]],R:[[-30,0,-26,-24],[-22,0,-18,-24]],ta:-50},
 sit:{H:[-20,-16],S:[12,-52],hd:[14,-22],L:[[16,0,15,-26],[22,0,21,-26]],R:[[2,0,0,-14],[8,0,6,-14]],ta:8},
 down:{H:[-26,-14],S:[14,-18],hd:[14,-20],L:[[44,0,30,-6],[50,0,34,-4]],R:[[-6,0,-12,-4],[-2,0,-8,-6]],ta:8},
 bow:{H:[-26,-48],S:[16,-16],hd:[18,-8],L:[[44,0,30,-6],[50,0,34,-4]],R:[[-30,0,-26,-24],[-22,0,-18,-24]],ta:-70},
 back:{H:[-26,-13],S:[14,-14],hd:[16,-2],L:[[26,-46,22,-30],[32,-42,28,-28]],R:[[-18,-44,-24,-30],[-12,-40,-18,-26]],ta:10},
 sniff:{H:[-28,-48],S:[24,-46],hd:[20,16],L:[[22,0,24,-22],[30,0,30,-22]],R:[[-30,0,-26,-24],[-22,0,-18,-24]],ta:-40}
};
/* ---------- persona (coordinate locali, rivolta in avanti = +x) ---------- */
const PST={hip:[0,-64],sh:[2,-114],hd:[4,-128],kn:[2,-32],ft:[0,0]};
const PCR={hip:[-12,-38],sh:[24,-74],hd:[32,-86],kn:[18,-30],ft:[2,0]};
const PSI={hip:[-8,-44],sh:[-2,-94],hd:[0,-108],kn:[16,-44],ft:[18,0]};
const ARM=32;
const L2=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
function pGeo(pc,ps){const o={};for(const k in PST)o[k]=L2(L2(PST[k],PCR[k],pc),PSI[k],ps);return o}

const DEF={d:100,dp:"stand",dsx:1,dy:0,drot:0,head:0,dwalk:0,ws:1,wag:.4,dm:"",muz:0,paw:0,dz:0,
 p:200,pf:-1,pc:0,ps:0,py:0,pwalk:0,h1:null,s1:"fist",h2:null,s2:"fist",leash:0,slack:.6,scroll:0,
 mat:null,bowl:null,water:0,door:null,open:0,curb:null,stairs:null,hurd:null,hh:0,bask:null,box:null,
 cat:null,catw:0,od:null,odsx:1,odw:0,crumbs:null,bench:null,toy:null,ty:0,bg:"casa"};
const TRANS=["say","dsay","fx","c","t","lin"];

/* ---------- utilità ---------- */
function lerp(a,b,e){
 if(typeof a==="number"&&typeof b==="number")return a+(b-a)*e;
 if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length)return a.map((x,i)=>lerp(x,b[i],e));
 if(a&&b&&typeof a==="object"&&typeof b==="object"&&!Array.isArray(a)){const o={};for(const k in b)o[k]=lerp(a[k],b[k],e);return o}
 return b;
}
const sgn=v=>v<0?-1:1;
const rot=(p,deg)=>{const c=Math.cos(deg*R2D),s=Math.sin(deg*R2D);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c]};
const f1=n=>Math.round(n*10)/10;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* punto del cane in coordinate del mondo; head=true se il punto è nel sistema della testa */
function dogPt(S,g,p,head){
 let q=p;
 if(head){const r=rot(p,S.head);q=[g.S[0]+g.hd[0]+r[0],g.S[1]+g.hd[1]+r[1]]}
 const sc=1-.12*S.dz,dir=sgn(S.dsx);
 return[S.d+dir*sc*q[0],G+S.dy-8*S.dz+sc*q[1]];
}
function frontPaw(g){return[(g.L[0][0]+g.L[1][0])/2,0]}
function doorHandle(S){const w=56*(1-S.open*.85);return[S.door-28+w-7,G-62]}

/* risolve un bersaglio della mano in coordinate locali della persona [avanti, su] */
function resolveHand(v,S,back){
 const pg=pGeo(S.pc,S.ps);
 if(v==null)return[pg.sh[0]+(back?-4:5)+12*S.pc,pg.sh[1]+58-28*S.pc];
 if(Array.isArray(v)&&typeof v[0]==="number")return v.slice();
 const g=POSE[S.dp],dir=sgn(S.dsx);let w;
 const toL=w=>[(w[0]-S.p)*sgn(S.pf),w[1]-G-S.py];
 if(Array.isArray(v)){
  if(v[0]==="w")return toL([v[1],G+v[2]]);
  if(v[0]==="n"){const n=dogPt(S,g,[18,2],true);return toL([n[0]+dir*v[1],n[1]+v[2]])}
 }
 switch(v){
  case"nose":{const n=dogPt(S,g,[18,2],true);w=[n[0]+dir*7,n[1]+2];break}
  case"nosef":{const n=dogPt(S,g,[18,2],true);w=[n[0]+dir*16,n[1]];break}
  case"palm":{const n=dogPt(S,g,[18,2],true);w=[n[0]+dir*12,n[1]];break}
  case"palmfar":{const n=dogPt(S,g,[18,2],true);w=[n[0]+dir*34,n[1]];break}
  case"above":{const n=dogPt(S,g,[-6,-20],true);w=n;break}
  case"head":{const n=dogPt(S,g,[-2,-14],true);w=n;break}
  case"ear":{const n=dogPt(S,g,[-4,-4],true);w=n;break}
  case"ground":{const f=frontPaw(g);w=dogPt(S,g,[f[0]+6,-6]);break}
  case"groundf":{const f=frontPaw(g);w=dogPt(S,g,[f[0]+16,-6]);break}
  case"shoulder":w=dogPt(S,g,[g.S[0]-6,g.S[1]-10]);break;
  case"paw":w=dogPt(S,g,[g.L[0][0]+2,-6]);break;
  case"chest":w=dogPt(S,g,[g.S[0]+18,g.S[1]+12]);break;
  case"collar":w=dogPt(S,g,[g.S[0]+g.hd[0]*.45,g.S[1]+g.hd[1]*.45]);break;
  case"handle":w=doorHandle(S);break;
  case"eyes":return[pg.hd[0]+14,pg.hd[1]+2];
  case"mouthP":return[pg.hd[0]+12,pg.hd[1]+6];
  default:return[pg.sh[0]+5,pg.sh[1]+58];
 }
 return toL(w);
}
function resolve(S){
 const R={};for(const k in S)if(k!=="h1"&&k!=="h2")R[k]=S[k];
 R.dg=JSON.parse(JSON.stringify(POSE[S.dp]||POSE.stand));
 R.h1r=resolveHand(S.h1,S,false);R.h2r=resolveHand(S.h2,S,true);
 return R;
}
function compile(sc,name){
 const nm=(name||"").trim()||"Fido";
 let S=Object.assign({},DEF,sc.init||{});
 let a=resolve(S),segs=[],cap="";
 for(const k of sc.k){
  const n=Object.assign({},S);for(const x in k)if(!TRANS.includes(x))n[x]=k[x];
  const b=resolve(n);
  if(k.c)cap=k.c;
  const fix=s=>s&&String(s).replace(/\{n\}/g,nm);
  segs.push({t:k.t||1,a,b,say:fix(k.say),dsay:k.dsay,fx:k.fx,cap:fix(cap),lin:k.lin});
  S=n;a=b;
 }
 return segs;
}

/* ---------- disegno ---------- */
function dogSVG(st,T,o){
 o=o||{};
 const g=st.dg,c=o.c||DOG,dk=o.dk||DOGD;
 let L=g.L.map(a=>a.slice()),R=g.R.map(a=>a.slice());
 const wk=o.walk!=null?o.walk:st.dwalk,ws=st.ws||1;
 if(wk>0.01){[L,R].forEach((arr,j)=>arr.forEach((p,i)=>{const ph=T*ws*9+(i?Math.PI:0)+(j?Math.PI/2:0);p[0]+=Math.sin(ph)*7*wk;p[1]-=Math.max(0,Math.cos(ph))*4*wk;p[2]+=Math.sin(ph)*3*wk;p[3]-=Math.max(0,Math.cos(ph))*3*wk}))}
 if(st.paw>0.01&&!o.other){const S=g.S;L[0]=lerp(L[0],[S[0]+20,S[1]+14,S[0]+12,S[1]+8],st.paw)}
 const H=g.H,S=g.S,hp=[S[0]+g.hd[0],S[1]+g.hd[1]];
 const wag=o.wag!=null?o.wag:st.wag;
 const ta=(g.ta+Math.sin(T*14)*wag*16)*R2D,td=[-Math.cos(ta),Math.sin(ta)];
 const tip=[H[0]+td[0]*24,H[1]+td[1]*24],tc=[H[0]+td[0]*12+td[1]*5,H[1]+td[1]*12-td[0]*5];
 const leg=(J,p,col)=>`<path d="M${f1(J[0])} ${f1(J[1])}Q${f1(p[2])} ${f1(p[3])} ${f1(p[0])} ${f1(p[1]-2)}" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
 let s="";
 s+=leg(S,L[1],dk)+leg(H,R[1],dk);
 s+=`<path d="M${f1(H[0])} ${f1(H[1])}Q${f1(tc[0])} ${f1(tc[1])} ${f1(tip[0])} ${f1(tip[1])}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
 s+=`<line x1="${f1(H[0])}" y1="${f1(H[1])}" x2="${f1(S[0])}" y2="${f1(S[1])}" stroke="${c}" stroke-width="25" stroke-linecap="round"/>`;
 s+=leg(S,L[0],c)+leg(H,R[0],c);
 s+=`<line x1="${f1(S[0])}" y1="${f1(S[1])}" x2="${f1(hp[0])}" y2="${f1(hp[1])}" stroke="${c}" stroke-width="13" stroke-linecap="round"/>`;
 s+=`<g transform="translate(${f1(hp[0])} ${f1(hp[1])}) rotate(${f1(o.other?0:st.head)})">`;
 s+=`<circle r="11.5" fill="${c}"/><ellipse cx="10" cy="4" rx="9.5" ry="6" fill="${c}"/><circle cx="18.6" cy="2.4" r="2.9" fill="${INK}"/><circle cx="4.5" cy="-3.2" r="1.9" fill="${INK}"/>`;
 s+=`<path d="M-3 -9q-10 3-6 16q7 1 9-12z" fill="${dk}"/>`;
 if(!o.other&&st.dm==="toy")s+=`<circle cx="15" cy="10" r="6" fill="${TOY}"/><path d="M10 8q5 3 10 0" stroke="#fff" stroke-width="1.2" fill="none"/>`;
 if(!o.other&&st.muz>.05)s+=`<g opacity="${f1(Math.min(1,st.muz))}"><rect x="1" y="-5.5" width="23" height="16" rx="7" fill="none" stroke="#3a3f4b" stroke-width="2"/><path d="M8 -5v16M15 -5v16" stroke="#3a3f4b" stroke-width="1.4"/><path d="M2 -2q-6-6-14-6" stroke="#3a3f4b" stroke-width="1.6" fill="none"/></g>`;
 s+=`</g>`;
 const sc=(o.sc||1)*(1-.12*(o.other?0:st.dz));
 const x=o.x!=null?o.x:st.d,y=o.y!=null?o.y:G+st.dy-8*st.dz,sx=o.sx!=null?o.sx:st.dsx,r=o.other?0:st.drot;
 return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(sx*sc*100)/100} ${f1(sc*100)/100}) rotate(${f1(r)} 0 -24)"${st.dz>.5&&!o.other?' opacity=".9"':""}>${s}</g>`;
}
function ik(sh,t){
 let dx=t[0]-sh[0],dy=t[1]-sh[1],d=Math.hypot(dx,dy)||1;const mx=ARM*2-.5;
 let T=t;if(d>mx){T=[sh[0]+dx/d*mx,sh[1]+dy/d*mx];dx=T[0]-sh[0];dy=T[1]-sh[1];d=mx}
 const h=Math.sqrt(Math.max(0,ARM*ARM-d*d/4)),m=[(sh[0]+T[0])/2,(sh[1]+T[1])/2],n=[-dy/d,dx/d];
 const e1=[m[0]+n[0]*h,m[1]+n[1]*h],e2=[m[0]-n[0]*h,m[1]-n[1]*h];
 return{el:e1[1]>e2[1]?e1:e2,T};
}
function handSVG(sh,x,y){
 const X=f1(x),Y=f1(y);
 switch(sh){
  case"treat":return `<circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/><circle cx="${f1(x+5)}" cy="${f1(y-3)}" r="3.4" fill="${TREAT}"/>`;
  case"palm":return `<rect x="${f1(x-2.5)}" y="${f1(y-10)}" width="7" height="17" rx="3.5" fill="${SKIN}" stroke="${SKIND}" stroke-width="1"/>`;
  case"palmt":return `<rect x="${f1(x-2.5)}" y="${f1(y-10)}" width="7" height="17" rx="3.5" fill="${SKIN}" stroke="${SKIND}" stroke-width="1"/><circle cx="${f1(x+6)}" cy="${f1(y-1)}" r="3.4" fill="${TREAT}"/>`;
  case"bowl":return `<path d="M${f1(x-12)} ${f1(y+1)}h26l-5 9h-16z" fill="#4a7bd0"/><circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/>`;
  case"toy":return `<circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/><circle cx="${f1(x+6)}" cy="${f1(y-2)}" r="6" fill="${TOY}"/>`;
  case"bottle":return `<rect x="${f1(x-4)}" y="${f1(y-16)}" width="9" height="22" rx="3" fill="#5aa7e6" stroke="#2f6fa6" stroke-width="1.2"/><circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/>`;
  case"muzzle":case"muzzlet":return `<circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/><g transform="translate(${f1(x+5)} ${f1(y-6)})"><rect width="20" height="14" rx="6" fill="none" stroke="#3a3f4b" stroke-width="2"/><path d="M7 0v14M13 0v14" stroke="#3a3f4b" stroke-width="1.4"/>${sh==="muzzlet"?`<circle cx="15" cy="8" r="3" fill="${TREAT}"/>`:""}</g>`;
  case"whistle":return `<rect x="${f1(x+2)}" y="${f1(y-3)}" width="11" height="5" rx="2" fill="#c7ccd6" stroke="#6b7180"/><circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/>`;
  default:return `<circle cx="${X}" cy="${Y}" r="5.5" fill="${SKIN}"/>`;
 }
}
function personSVG(st,T){
 const g=pGeo(st.pc,st.ps);let kn=[g.kn.slice(),g.kn.slice()],ft=[g.ft.slice(),g.ft.slice()];
 if(st.pwalk>.01){for(let i=0;i<2;i++){const ph=T*(st.ws||1)*7+(i?Math.PI:0);ft[i][0]+=Math.sin(ph)*12*st.pwalk;ft[i][1]-=Math.max(0,Math.cos(ph))*5*st.pwalk;kn[i][0]+=Math.sin(ph)*7*st.pwalk}}
 else{ft[1][0]-=5;kn[1][0]-=3}
 const legS=(i,col)=>`<polyline points="${f1(g.hip[0])},${f1(g.hip[1])} ${f1(kn[i][0])},${f1(kn[i][1])} ${f1(ft[i][0])},${f1(ft[i][1]-4)}" stroke="${col}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${f1(ft[i][0]+5)}" cy="${f1(ft[i][1]-3)}" rx="8" ry="4" fill="#262a33"/>`;
 const arm=(t,shape,back)=>{const r=ik(g.sh,t),o=back?"opacity=\".85\"":"";
  return `<g ${o}><line x1="${f1(g.sh[0])}" y1="${f1(g.sh[1])}" x2="${f1(r.el[0])}" y2="${f1(r.el[1])}" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"/><line x1="${f1(r.el[0])}" y1="${f1(r.el[1])}" x2="${f1(r.T[0])}" y2="${f1(r.T[1])}" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>${handSVG(shape,r.T[0],r.T[1])}</g>`};
 const hd=g.hd;
 let s="";
 s+=arm(st.h2r,st.s2,true);
 s+=legS(1,"#2f3546");
 s+=`<line x1="${f1(g.hip[0])}" y1="${f1(g.hip[1])}" x2="${f1(g.sh[0])}" y2="${f1(g.sh[1])}" stroke="var(--accent)" stroke-width="24" stroke-linecap="round"/>`;
 s+=legS(0,PANTS);
 s+=`<circle cx="${f1(hd[0])}" cy="${f1(hd[1])}" r="12" fill="${SKIN}"/><path d="M${f1(hd[0]-12)} ${f1(hd[1]+2)}A12 12 0 0 1 ${f1(hd[0]+11)} ${f1(hd[1]-5)}L${f1(hd[0]-1)} ${f1(hd[1]-4)}Z" fill="#4a3426"/><circle cx="${f1(hd[0]+6.5)}" cy="${f1(hd[1]-.5)}" r="1.7" fill="${INK}"/><path d="M${f1(hd[0]+5)} ${f1(hd[1]+6)}q3 2 6 0" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
 s+=arm(st.h1r,st.s1,false);
 return `<g transform="translate(${f1(st.p)} ${f1(G+st.py)}) scale(${f1(st.pf*100)/100} 1)">${s}</g>`;
}
function handWorld(st,h){return[st.p+st.pf*h[0],G+st.py+h[1]]}
function headWorld(st){const g=pGeo(st.pc,st.ps);return[st.p+st.pf*g.hd[0],G+st.py+g.hd[1]]}
function dogHeadW(st){return dogPt(Object.assign({},st,{head:0}),st.dg,[0,0],true)}

function bubble(x,y,txt,dog){
 const w=Math.max(30,txt.length*7.6+18),bx=Math.min(W-w-4,Math.max(4,x-w/2)),by=y-26;
 const tx=Math.min(bx+w-10,Math.max(bx+10,x));
 return `<g><rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="22" rx="11" fill="var(--surface)" stroke="${dog?"#94612f":"var(--accent)"}" stroke-width="1.6"/><path d="M${f1(tx-5)} ${f1(by+21)}l5 7l5-7z" fill="var(--surface)" stroke="${dog?"#94612f":"var(--accent)"}" stroke-width="1.6" stroke-linejoin="round"/><rect x="${f1(tx-6)}" y="${f1(by+18)}" width="12" height="3" fill="var(--surface)"/><text x="${f1(bx+w/2)}" y="${f1(by+15.5)}" text-anchor="middle" style="font:700 13px var(--body,sans-serif)" fill="var(--ink)">${esc(txt)}</text></g>`;
}
function heart(x,y,sc,op){return `<path transform="translate(${f1(x)} ${f1(y)}) scale(${f1(sc*100)/100})" d="M0 4C-8-3-6-10 0-6C6-10 8-3 0 4z" fill="#e0457b" opacity="${f1(op*100)/100}"/>`}

function bgSVG(st,off){
 let s="";const bg=st.bg;
 s+=`<rect width="${W}" height="${H}" fill="var(--accent-soft)"/>`;
 if(bg==="casa"){
  s+=`<rect x="24" y="22" width="62" height="50" rx="4" fill="var(--surface)" opacity=".75"/><path d="M55 22v50M24 47h62" stroke="var(--line)" stroke-width="3"/>`;
  s+=`<rect x="0" y="${G-8}" width="${W}" height="8" fill="rgba(140,100,60,.18)"/>`;
  s+=`<rect x="0" y="${G}" width="${W}" height="${H-G}" fill="rgba(160,115,65,.32)"/>`;
 }else if(bg==="parco"){
  for(const [x,r] of [[38,26],[318,30],[270,18]])s+=`<rect x="${x-3}" y="${G-40}" width="6" height="40" fill="rgba(120,85,50,.55)"/><circle cx="${x}" cy="${G-48-r*.4}" r="${r}" fill="rgba(70,150,80,.45)"/>`;
  s+=`<rect x="0" y="${G}" width="${W}" height="${H-G}" fill="rgba(70,150,70,.35)"/>`;
 }else if(bg==="strada"){
  for(const [x,w,h] of [[0,60,110],[64,48,80],[250,56,120],[310,50,90]])s+=`<rect x="${x}" y="${G-h}" width="${w}" height="${h}" fill="rgba(120,130,150,.22)"/>`;
  s+=`<rect x="0" y="${G}" width="${W}" height="${H-G}" fill="rgba(130,135,150,.35)"/>`;
 }else if(bg==="monti"){
  s+=`<path d="M0 ${G}L70 ${G-90}L130 ${G-30}L200 ${G-110}L290 ${G-20}L360 ${G-70}V${G}Z" fill="rgba(110,125,150,.25)"/><path d="M182 ${G-88}L200 ${G-110}L218 ${G-88}Z" fill="rgba(255,255,255,.6)"/>`;
  s+=`<rect x="0" y="${G}" width="${W}" height="${H-G}" fill="rgba(150,120,80,.32)"/>`;
 }
 // segni sul terreno che scorrono quando si cammina
 const o=((off%45)+45)%45;
 for(let x=-45+o;x<W+45;x+=45)s+=`<path d="M${f1(x)} ${G+12}h10M${f1(x+22)} ${G+22}h7" stroke="rgba(0,0,0,.14)" stroke-width="2" stroke-linecap="round"/>`;
 return s;
}
function propsBack(st,T){
 let s="";
 if(st.door!=null){const x=st.door,w=56*(1-st.open*.85);
  s+=`<rect x="${x-34}" y="${G-132}" width="68" height="132" fill="rgba(140,100,60,.18)"/><rect x="${x-28}" y="${G-126}" width="56" height="126" fill="rgba(90,170,90,.35)"/>`;
  s+=`<rect x="${f1(x-28)}" y="${G-126}" width="${f1(w)}" height="126" fill="#a0714a" stroke="#7a5333" stroke-width="2"/><circle cx="${f1(x-28+w-7)}" cy="${G-62}" r="3.2" fill="#e6c36a"/>`;
 }
 if(st.bench!=null){const x=st.bench;s+=`<rect x="${x-34}" y="${G-46}" width="68" height="7" rx="2" fill="#8a5a2b"/><rect x="${x-30}" y="${G-40}" width="5" height="40" fill="#6d4522"/><rect x="${x+25}" y="${G-40}" width="5" height="40" fill="#6d4522"/>`}
 if(st.curb!=null){const x=st.curb;s+=`<rect x="-10" y="${G}" width="${f1(Math.max(0,x+10))}" height="${H-G}" fill="rgba(60,64,75,.55)"/>`;for(let i=x-14;i>-40;i-=22)s+=`<rect x="${f1(i-12)}" y="${G+6}" width="12" height="20" fill="rgba(255,255,255,.75)"/>`;s+=`<rect x="${f1(x-3)}" y="${G-3}" width="7" height="10" fill="#b8bcc6"/>`}
 if(st.stairs!=null){const x=st.stairs;s+=`<path d="M${x} ${G}V${G-10}H${x-30}V${G-20}H${x-60}V${G-30}H-10V${G}Z" fill="rgba(150,150,160,.55)" stroke="rgba(90,90,100,.6)" stroke-width="1.5"/>`}
 if(st.od!=null){s+=dogSVG(st,T,{other:1,x:st.od,y:G-16,sx:st.odsx,sc:.72,c:DOG2,dk:DOG2D,walk:st.odw,wag:.5})}
 if(st.cat!=null){const x=st.cat,b=Math.sin(T*10)*2*st.catw;s+=`<g transform="translate(${f1(x)} ${G-10})" fill="#7d8597"><ellipse cx="0" cy="-12" rx="15" ry="8"/><circle cx="-16" cy="-20" r="7"/><path d="M-22-25l2-8 4 6zM-14-26l3-8 3 7z"/><path d="M14-14q10-4 8-20" stroke="#7d8597" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M-10 -6v${f1(6+b)}M-5-6v${f1(6-b)}M7-6v${f1(6-b)}M11-6v${f1(6+b)}" stroke="#7d8597" stroke-width="3" stroke-linecap="round"/><circle cx="-19" cy="-21" r="1.2" fill="#222"/></g>`}
 if(st.mat!=null)s+=`<rect x="${f1(st.mat-45)}" y="${G-4}" width="90" height="6" rx="3" fill="#d65c7a"/>`;
 if(st.crumbs!=null)for(const dx of [0,9,17])s+=`<circle cx="${f1(st.crumbs+dx)}" cy="${G-2.5}" r="2.6" fill="${TREAT}"/>`;
 if(st.box!=null)s+=`<rect x="${f1(st.box-12)}" y="${G-26}" width="30" height="26" fill="#c9a06a" stroke="#9a7444" stroke-width="1.5"/><path d="M${f1(st.box-12)} ${G-26}l6-6h30l-6 6" fill="#d8b27e" stroke="#9a7444" stroke-width="1.2"/>`;
 return s;
}
function propsFront(st){
 let s="";
 if(st.bowl!=null){const x=st.bowl;s+=`<path d="M${f1(x-14)} ${G-11}h28l-5 11h-18z" fill="#4a7bd0"/>`;if(st.water>.02)s+=`<rect x="${f1(x-12)}" y="${G-11}" width="24" height="3" rx="1.5" fill="#9fd3ff" opacity="${f1(st.water)}"/>`}
 if(st.toy!=null)s+=`<circle cx="${f1(st.toy)}" cy="${f1(G-6-st.ty)}" r="6" fill="${TOY}"/>`;
 if(st.bask!=null){const x=st.bask;s+=`<path d="M${x-22} ${G-24}h44l-5 24h-34z" fill="#b98a4f" stroke="#8a6232" stroke-width="1.5"/><path d="M${x-20} ${G-16}h40M${x-19} ${G-8}h38" stroke="#8a6232" stroke-width="1.2"/>`}
 if(st.hurd!=null){const x=st.hurd,hh=st.hh;s+=`<path d="M${x-30} ${G}l6-14 6 14zM${x+24} ${G}l6-14 6 14z" fill="#f28c28"/><line x1="${x-34}" y1="${f1(G-3-hh)}" x2="${x+36}" y2="${f1(G-3-hh)}" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>`}
 return s;
}
function fxSVG(st,seg,p){
 let s="";const fx=seg.fx;if(!fx)return s;
 const hw=dogHeadW(st),nose=dogPt(st,st.dg,[18,2],true),dir=sgn(st.dsx);
 if(fx==="heart"){s+=heart(hw[0]-dir*4,hw[1]-22-p*14,1.6,1-p*.6);s+=heart(hw[0]+dir*10,hw[1]-14-p*20,1.1,Math.max(0,.9-p))}
 else if(fx==="check"){s+=`<g transform="translate(${f1(nose[0]+dir*8)} ${f1(nose[1]-16)})" opacity="${f1(1-p*.4)}"><circle r="8" fill="var(--ok)"/><path d="M-4 0l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>`}
 else if(fx==="sniff"){for(let i=0;i<3;i++){const q=(p*3+i/3)%1;s+=`<circle cx="${f1(nose[0]+dir*(6+q*14))}" cy="${f1(nose[1]-4-q*8+i*3)}" r="${f1(1.6+q)}" fill="var(--muted)" opacity="${f1(1-q)}"/>`}}
 else if(fx==="look"){const e=dogPt(st,st.dg,[4.5,-3.2],true),pe=headWorld(st);s+=`<line x1="${f1(e[0])}" y1="${f1(e[1])}" x2="${f1(pe[0])}" y2="${f1(pe[1])}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 4" opacity="${f1(Math.min(1,p*2))}"/>`}
 else if(fx==="waves"){const m=handWorld(st,st.h1r),d=-sgn(st.pf);for(let i=0;i<3;i++){const q=(p*2+i/3)%1;const r=8+q*26;s+=`<path d="M${f1(m[0]-d*r)} ${f1(m[1]-r*.7)}q${f1(-d*r*.45)} ${f1(r*.7)} 0 ${f1(r*1.4)}" stroke="var(--accent)" stroke-width="2.2" fill="none" opacity="${f1(1-q)}"/>`}}
 else if(fx==="drops"){for(let i=0;i<3;i++){const q=(p*2+i/3)%1;s+=`<circle cx="${f1(nose[0]+dir*(2+i*4))}" cy="${f1(nose[1]-q*12)}" r="1.8" fill="#5aa7e6" opacity="${f1(1-q)}"/>`}}
 else if(fx==="pour"){const m=handWorld(st,st.h1r);s+=`<path d="M${f1(m[0])} ${f1(m[1]-14)}Q${f1(m[0]-6)} ${f1(m[1])} ${f1(st.bowl||m[0])} ${G-10}" stroke="#5aa7e6" stroke-width="3" fill="none" stroke-dasharray="4 3" stroke-dashoffset="${f1(-p*40)}"/>`}
 else if(fx==="zzz"){for(let i=0;i<3;i++){const q=(p+i/3)%1;s+=`<text x="${f1(hw[0]-dir*6+q*10)}" y="${f1(hw[1]-14-q*22)}" style="font:700 ${11+i*2}px var(--body,sans-serif)" fill="var(--muted)" opacity="${f1(1-q)}">z</text>`}}
 return s;
}
function leashSVG(st){
 if(st.leash<.5)return"";
 const h=handWorld(st,st.h1r),c=dogPt(st,st.dg,[st.dg.S[0]+st.dg.hd[0]*.45,st.dg.S[1]+st.dg.hd[1]*.45]);
 const mx=(h[0]+c[0])/2,my=Math.max(h[1],c[1])+st.slack*Math.min(46,Math.abs(h[0]-c[0])*.5+8);
 return `<path d="M${f1(h[0])} ${f1(h[1])}Q${f1(mx)} ${f1(my)} ${f1(c[0])} ${f1(c[1])}" stroke="#e0662a" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="2.6" fill="#e0662a"/>`;
}
function sceneSVG(st,seg,p,T,off){
 let s=bgSVG(st,off)+propsBack(st,T);
 const dog=dogSVG(st,T),per=personSVG(st,T);
 s+=st.dz>.5?dog+per:per+dog;
 s+=propsFront(st)+leashSVG(st)+fxSVG(st,seg,p);
 if(seg.say){const h=headWorld(st);s+=bubble(h[0],h[1]-12,seg.say)}
 if(seg.dsay){const h=dogHeadW(st);s+=bubble(h[0],h[1]-14,seg.dsay,true)}
 return s;
}

/* ---------- le lezioni ---------- */
const BR=(o)=>[{t:.45,say:"Bravo!",wag:1.3},Object.assign({t:.6,h1:"nose",s1:"treat",say:"Bravo!",wag:1.3},o||{}),{t:.5,s1:"fist",fx:"heart",wag:1.4}];
const BR2=(o)=>[{t:.45,say:"Bravo!",wag:1.3},Object.assign({t:.6,h2:"nose",s2:"treat",say:"Bravo!",wag:1.3},o||{}),{t:.5,s2:"fist",fx:"heart",wag:1.4}];
const WALKL={d:150,dsx:-1,p:218,pf:-1,leash:1,slack:1,dwalk:1,pwalk:1,scroll:1};
const SC={
bravo:{init:{pc:.5},k:[
 {t:1.2,c:"Tieni pronti premietti piccolissimi",h1:[30,-80],s1:"treat"},
 {t:.9,c:"Di' «Bravo!» con voce allegra…",say:"Bravo!",wag:1.2},
 {t:.7,c:"…e subito dopo dagli il premio",h1:"nose",wag:1.2},
 {t:.6,s1:"fist",fx:"heart",wag:1.4},{t:.7,h1:null,wag:.6},
 {t:1,c:"Ripeti 10 volte, con una pausa tra una volta e l'altra",h1:[30,-80],s1:"treat"},
 {t:.8,say:"Bravo!",wag:1.2},{t:.7,h1:"nose",wag:1.3},{t:.6,s1:"fist",fx:"heart",wag:1.4},
 {t:1.4,c:"Presto, quando sente «Bravo!», si gira verso di te",h1:null,head:-18,wag:1}]},
nome:{init:{dsx:-1,dp:"sniff",head:50,d:110},k:[
 {t:1.3,c:"Aspetta che non ti stia guardando",fx:"sniff"},
 {t:1,c:"Di' il suo nome una volta sola, allegro",say:"{n}!"},
 {t:.9,c:"Appena gira la testa verso di te…",dsx:1,dp:"stand",head:-8,wag:1},
 ...BR({c:"…«Bravo!» e premio",pc:.5}),{t:1,h1:null,pc:0}]},
guardami:{init:{pc:.15},k:[
 {t:1.1,c:"Tieni il premio vicino ai tuoi occhi",h1:"eyes",s1:"treat"},
 {t:1.2,c:"Quando ti guarda negli occhi…",head:-26,fx:"look"},
 ...BR({c:"…«Bravo!» e premio",pc:.5,head:-8}),
 {t:.9,c:"Poi aspetta qualche secondo in più prima del «Bravo!»",h1:"eyes",s1:"treat",pc:.15},
 {t:1.6,head:-26,fx:"look"},...BR({pc:.5,head:-8}),{t:.7,h1:null,pc:0}]},
seduto:{init:{pc:.5},k:[
 {t:1.1,c:"Tieni un premio davanti al suo naso",h1:"nose",s1:"treat"},
 {t:1.4,c:"Alzalo piano sopra la testa, verso la nuca",h1:"above",dp:"sit",head:-28},
 {t:.4,c:"Appena il sedere tocca terra: «Bravo!» e premio",say:"Bravo!"},
 {t:.6,h1:"nose",head:-10,say:"Bravo!"},{t:.5,s1:"fist",fx:"heart",wag:1.3},
 {t:.9,c:"Poi di' «Seduto» un attimo prima del gesto",h1:null,dp:"stand",head:0,pc:.4},
 {t:.7,say:"Seduto"},{t:1,h1:"above",s1:"treat",dp:"sit",head:-24},
 ...BR({head:-10}),{t:.7,h1:null}]},
libero:{init:{dp:"sit",pc:.2},k:[
 {t:.9,c:"Chiedi «Seduto» e premialo",say:"Seduto"},{t:.6,h1:"nose",s1:"treat",pc:.5},{t:.5,s1:"fist",fx:"heart"},{t:.5,h1:null,pc:.1},
 {t:1,c:"Di' «Libero!» e fai un passo indietro",say:"Libero!",p:232,pwalk:1},
 {t:1,c:"Quando si alza e ti segue: festa!",pwalk:0,dp:"stand",d:132,dwalk:1,wag:1.5},
 {t:.4,dwalk:0},{t:.9,h1:"head",pc:.5,fx:"heart",wag:1.5},{t:.8,h1:null,pc:0}]},
terra:{init:{dp:"sit",pc:.6,p:188},k:[
 {t:1.1,c:"Parti da seduto, con un premio davanti al naso",h1:"nose",s1:"treat"},
 {t:1.3,c:"Abbassalo piano fino a terra, tra le zampe",h1:"ground",head:40,pc:1},
 {t:1.3,c:"…poi allontanalo un pochino lungo il pavimento",h1:"groundf",dp:"down",head:12},
 ...BR({head:0}),{t:1,h1:null,pc:.4}]},
tocca:{init:{pc:.5},k:[
 {t:1.1,c:"Mostra il palmo aperto vicino al suo naso",h1:"palm",s1:"palm"},
 {t:.9,c:"Quando lo tocca col naso…",d:105,fx:"check"},
 {t:.4,say:"Bravo!",d:100},{t:.7,c:"…«Bravo!» e premio con l'altra mano",h2:"nose",s2:"treat",say:"Bravo!"},{t:.5,s2:"fist",fx:"heart",wag:1.3},{t:.5,h2:null},
 {t:.9,c:"Poi sposta la mano un po' più in là: ti segue",h1:"palmfar"},
 {t:1,d:125,fx:"check",dwalk:.6},{t:.3,dwalk:0},...BR2(),{t:.7,h1:null,h2:null}]},
vieni1:{init:{d:28,head:50,dp:"sniff"},k:[
 {t:1.1,c:"In casa, a due passi da lui",fx:"sniff"},
 {t:1,c:"Chiamalo allegro e abbassati",say:"{n}, vieni!",pc:.7,dp:"stand",head:-5},
 {t:1.4,c:"Quando arriva…",d:100,dwalk:1,ws:1.3,wag:1.5},{t:.3,dwalk:0},
 ...BR({c:"…«Bravo!» e premio: è sempre una festa"}),
 {t:.8,c:"Toccagli il collare mentre mangia",h1:"collar"},{t:.8,h1:null,pc:0}]},
resta1:{init:{dp:"sit",pc:.2},k:[
 {t:1.1,c:"Chiedi «Seduto», poi mostra il palmo: «Resta»",say:"Resta",h1:[36,-92],s1:"palm"},
 {t:1,c:"Conta 1 secondo…",say:"1…"},
 ...BR({c:"…«Bravo!» e premio mentre è ancora seduto",pc:.5}),
 {t:.7,h1:[36,-92],s1:"palm",pc:.2,say:"Resta"},
 {t:1.5,c:"Poi 2, 3, 5 secondi",say:"1… 2… 3…"},...BR({pc:.5}),
 {t:.8,c:"Alla fine «Libero!»",h1:null,pc:0,say:"Libero!"},{t:.8,dp:"stand",wag:1.4}]},
porta:{init:{door:60,p:128,pc:.3,d:150,dsx:-1,dp:"sit"},k:[
 {t:1.1,c:"Mano sulla maniglia: se sta fermo, «Bravo!»",h1:"handle"},{t:.5,say:"Bravo!"},
 {t:1,c:"Apri di pochi centimetri",open:.25,h1:"handle"},
 {t:.8,c:"Se si alza, richiudi con calma",dp:"stand",d:136,open:0,h1:"handle"},
 {t:.9,c:"Aspetta che si risieda",dp:"sit",d:150},
 {t:1.3,c:"Riapri piano: se resta seduto, «Bravo!»",open:.85,h1:"handle"},{t:.5,say:"Bravo!",wag:1.2},
 {t:.9,c:"Uscite solo quando dici «Libero!»",say:"Libero!",h1:null},
 {t:1.4,dp:"stand",d:22,dwalk:1,wag:1.3},{t:.4,dwalk:0}]},
ciotola:{init:{dp:"sit",h1:[30,-122],s1:"bowl"},k:[
 {t:1,c:"Con la ciotola in mano, chiedi «Seduto»",say:"Seduto"},
 {t:1.3,c:"Abbassala piano",h1:[40,-74],pc:.4},
 {t:.7,c:"Se si alza, rialzala",dp:"stand",d:106,h1:[30,-122],pc:0},
 {t:.9,c:"Aspetta che si risieda da solo",dp:"sit",d:100},
 {t:1.4,c:"Poi appoggiala a terra",h1:["w",152,-10],pc:1},{t:.4,s1:"fist",bowl:152},
 {t:.8,c:"Aspetta un secondo, poi «Libero!»",h1:null,pc:.2},{t:.6,say:"Libero!"},
 {t:1,c:"Ora può mangiare",dp:"sniff",head:55,wag:1.3},{t:1.2,fx:"heart",wag:1.3}]},
lascia:{init:{dm:"toy",pc:.4,wag:1},k:[
 {t:1.2,c:"Mentre ha il gioco in bocca…"},
 {t:1,c:"…metti un premio buonissimo davanti al naso",h1:"nosef",s1:"treat"},
 {t:.6,c:"Quando lo molla: «Bravo!» e premio",dm:"",toy:150,say:"Bravo!"},
 {t:.6,h1:"nose",say:"Bravo!"},{t:.5,s1:"fist",fx:"heart"},
 {t:.8,c:"Poi ridagli il gioco: mollare non vuol dire perderlo",h1:null},
 {t:.8,h2:["w",150,-8],pc:.9},{t:.3,toy:null,s2:"toy"},{t:.8,h2:"nose"},
 {t:.4,s2:"fist",dm:"toy",wag:1.5},{t:.7,h2:null,pc:.4}]},
nontoccare:{init:{pc:.8},k:[
 {t:1.1,c:"Premio nella mano chiusa: lascia che annusi",h1:"nose",s1:"fist"},
 {t:1.5,c:"Non aprire la mano",fx:"sniff",head:8,d:103},
 {t:1,c:"Appena si allontana…",head:-14,d:93},
 ...BR2({c:"…«Bravo!» e premio dall'ALTRA mano",h1:[20,-64]}),
 {t:1.1,h1:null,h2:null,pc:.4,c:"Poi aggiungi la parola «Lascialo»"}]},
saluto:{init:{p:330,pwalk:1,d:105,wag:1.5},k:[
 {t:1.4,c:"Torni a casa e lui ti salta addosso",p:215},
 {t:.6,pwalk:0,drot:-36,dy:-6,d:150,wag:2},
 {t:1,c:"Girati di lato e stai zitto",pf:1},
 {t:.8,drot:0,dy:0,d:118},
 {t:.9,c:"Appena ha le quattro zampe a terra…",pf:-1},
 {t:1,c:"…abbassati e salutalo con calma",pc:.7,h1:"head",fx:"heart",wag:1.3},
 {t:.9,fx:"heart",wag:1.3},{t:.6,h1:null,pc:0}]},
posto:{init:{mat:118,d:40,p:205},k:[
 {t:1,c:"Metti il tappetino a terra"},
 {t:1.3,c:"Quando ci sale sopra…",d:110,dwalk:1},{t:.3,dwalk:0},
 ...BR({c:"…«Bravo!» e premio sul tappetino",pc:.6}),
 {t:.6,h1:null,pc:.3},
 {t:1.1,c:"Poi aspetta che si sdrai sopra",dp:"down"},
 ...BR({pc:1}),{t:.9,c:"Aggiungi la parola «Posto» e allunga il tempo",h1:null,pc:.3}]},
manipola:{init:{pc:.6},k:[
 {t:1,c:"Tocca una spalla per un secondo",h1:"shoulder"},{t:.3,h1:null},...BR2(),{t:.3,h2:null},
 {t:1,c:"Poi un orecchio",h1:"ear"},{t:.3,h1:null},...BR2(),{t:.3,h2:null},
 {t:1,c:"Poi una zampa: ogni tocco, un premio",h1:"paw",pc:1},{t:.3,h1:null},...BR2(),{t:.6,h2:null,pc:.6}]},
museruola:{init:{pc:.6,h1:[30,-72],s1:"muzzle"},k:[
 {t:1.1,c:"Mostra la museruola: premialo se la annusa",h1:"nosef",fx:"sniff"},
 ...BR2(),{t:.4,h2:null},
 {t:1,c:"Metti un premio in fondo: ci infila il muso da solo",s1:"muzzlet",h1:"nosef"},
 {t:.7,d:104,fx:"sniff"},{t:.3,s1:"fist",muz:1,h1:[26,-72]},
 {t:.5,say:"Bravo!",wag:1.2},
 {t:1.3,c:"Allunga il tempo piano piano, sempre con premi",fx:"heart",wag:1.2},
 {t:.9,c:"Toglila prima che si agiti",muz:0,d:100,h1:"nosef",s1:"muzzle"},{t:.5,h1:[30,-72]}]},
guinz:{init:Object.assign({bg:"strada"},WALKL),k:[
 {t:1.8,c:"Guinzaglio morbido, a forma di U: va benissimo"},
 ...BR2(),{t:.5,h2:null},
 {t:1.1,c:"Se tira…",d:106,slack:0,drot:5},
 {t:.9,c:"…fermati come un albero",pwalk:0,dwalk:0,scroll:0},
 {t:1,c:"Quando torna e il guinzaglio si allenta…",dsx:1,d:130,drot:0,slack:1,dwalk:1},
 {t:.6,dsx:-1,d:150},{t:.2,dwalk:0},...BR2(),
 {t:1.5,c:"…«Bravo!», premio, e ripartite insieme",h2:null,pwalk:1,dwalk:1,scroll:1}]},
piede:{init:Object.assign({bg:"strada",d:190,h2:[16,-74],s2:"treat"},WALKL,{d:178}),k:[
 {t:1.2,c:"Tieni i premi nella mano dalla sua parte"},
 {t:1.2,c:"Fai 2 passi: se è accanto alla gamba…"},
 ...BR2({c:"…«Bravo!» e premio vicino alla gamba"}),{t:.5,h2:[16,-74],s2:"treat"},
 {t:1.8,c:"Poi 3, 5, 10 passi prima del premio"},...BR2(),{t:.5,h2:[16,-74],s2:"treat"}]},
girati:{init:Object.assign({bg:"parco"},WALKL),k:[
 {t:1.4,c:"Camminate tranquilli"},
 {t:.9,c:"Di' «Andiamo!» allegro e gira dall'altra parte",say:"Andiamo!",pf:1,scroll:0},
 {t:1.3,c:"Quando ti segue…",dsx:1,d:250,scroll:-1},
 ...BR2({c:"…«Bravo!» e premio"}),{t:1.3,h2:null}]},
marciapiede:{init:Object.assign({bg:"strada",curb:-60},WALKL),k:[
 {t:2.8,c:"Arrivate al bordo del marciapiede",curb:88,lin:1},
 {t:.6,c:"Fermati e chiedi «Seduto»",pwalk:0,dwalk:0,scroll:0,say:"Seduto"},
 {t:.7,dp:"sit"},...BR2(),
 {t:.9,c:"Poi «Andiamo» e attraversate",h2:null,say:"Andiamo",dp:"stand"},
 {t:2,dwalk:1,pwalk:1,d:40,p:100}]},
incroci:{init:{bg:"parco",d:165,dsx:-1,p:212,leash:1,slack:1,od:-50,odsx:1,odw:1},k:[
 {t:1.4,c:"Vedi un cane lontano: prima che il tuo reagisca…",od:30},
 {t:.8,c:"…«Guardami» e premio",say:"Guardami",dsx:1,head:-20},
 ...BR2({pc:.5,head:-8}),
 {t:2.2,c:"Tieni una distanza a cui resta tranquillo",od:400,h2:null,pc:0,head:-18,lin:1},
 {t:.8,c:"Più avanti accorcerai la distanza",dsx:-1,head:0,odw:0}]},
cibostrada:{init:Object.assign({bg:"strada",crumbs:-40},WALKL),k:[
 {t:2.4,c:"Passate vicino a qualche crocchetta a terra",crumbs:90,lin:1},
 {t:.7,c:"Se allunga il muso…",dp:"sniff",head:55,pwalk:0,dwalk:0,scroll:0},
 {t:.7,c:"…«Lascialo» con voce calma",say:"Lascialo"},
 {t:.6,dp:"stand",head:-12,dsx:1},...BR2({pc:.4}),
 {t:.6,dsx:-1,h2:null,pc:0,head:0},
 {t:1.8,c:"…e lo superate insieme",pwalk:1,dwalk:1,scroll:1,crumbs:240,lin:1}]},
vieni2:{init:{bg:"parco",d:40,dsx:-1,head:55,dp:"sniff",p:262,leash:1,slack:.25},k:[
 {t:1.3,c:"Lunghina di 5-10 metri, in un prato tranquillo",fx:"sniff"},
 {t:.9,c:"Chiamalo con voce allegra",say:"{n}, vieni!",pc:.6},
 {t:.5,dsx:1,dp:"stand",head:0},
 {t:1.6,c:"Corre da te: festa grande!",d:160,dwalk:1,ws:1.6,wag:1.6,slack:1},
 {t:.3,dwalk:0},...BR2(),{t:.5,h2:"nose",s2:"treat"},{t:.4,s2:"fist",fx:"heart",wag:1.5},
 {t:1.2,h2:null,pc:0,c:"Se non viene, non ripetere: allontanati correndo"}]},
resta2:{init:{dp:"sit",pc:.2},k:[
 {t:1,c:"«Resta» con il palmo",say:"Resta",h1:[36,-92],s1:"palm"},
 {t:.9,c:"Un passo indietro…",p:230,pwalk:1,h1:null},{t:.9,c:"…e torna da lui",p:200},
 {t:.1,pwalk:0},...BR({pc:.5}),
 {t:.9,h1:[36,-92],s1:"palm",say:"Resta",pc:.2},
 {t:1.2,c:"Poi due, poi tre passi",p:285,pwalk:1,h1:null},{t:1.2,p:200},{t:.1,pwalk:0},...BR({pc:.5}),
 {t:.8,say:"Libero!",h1:null,pc:0,c:"Torna sempre tu da lui, poi «Libero!»"},{t:.7,dp:"stand",wag:1.4}]},
piano:{init:Object.assign({bg:"monti",scroll:1.6,ws:1.7,slack:.4},WALKL,{scroll:1.6}),k:[
 {t:1.5,c:"In discesa va di corsa"},
 {t:1,c:"Rallenta tu e di' «Piano», con voce calma",say:"Piano…",scroll:.5,ws:.6},
 {t:1,c:"Appena rallenta anche lui…",slack:1},
 ...BR2(),{t:1.5,h2:null,c:"…«Bravo!» e continuate piano"}]},
lato:{init:{bg:"monti",d:165,dsx:-1,p:212},k:[
 {t:1.1,c:"Sul sentiero stretto, il cane va dal lato sicuro"},
 {t:1,c:"Con un premio, guidalo dietro le tue gambe",h2:"nose",s2:"treat",pc:.4},
 {t:1.4,c:"…fino all'altro lato",d:258,dsx:1,dz:1,dwalk:1,h2:[-24,-66]},
 {t:.5,dsx:-1},{t:1.2,d:172,dwalk:1},{t:.2,dwalk:0},
 ...BR2(),{t:1.1,h2:null,pc:0,c:"Poi aggiungi la parola «Lato»"}]},
gradini:{init:{bg:"parco",stairs:150,d:200,dsx:-1,p:262},k:[
 {t:1,c:"Inizia con 2-3 gradini bassi"},
 {t:1,c:"Un gradino alla volta: «Piano»",say:"Piano",d:160,dy:-6,dwalk:1,p:228,pwalk:1},
 {t:.2,dwalk:0,pwalk:0},...BR2({pc:.5}),
 {t:1,say:"Piano",d:128,dy:-16,dwalk:1,h2:null,pc:0,p:196,pwalk:1},
 {t:.2,dwalk:0,pwalk:0},...BR2({pc:.5}),
 {t:1.2,h2:null,pc:0,c:"Se salta o corre, torna indietro di un gradino"}]},
borraccia:{init:{bg:"monti",pc:.6,h1:[26,-72],s1:"bottle"},k:[
 {t:1,c:"Porta la ciotola pieghevole e l'acqua"},
 {t:1,c:"Appoggiala e versa un po' d'acqua",bowl:152,h1:["w",168,-36]},
 {t:1,water:1,fx:"pour"},{t:.6,h1:[26,-72],pc:.3},
 {t:1.5,c:"Offrigliela spesso, prima che abbia sete",dp:"sniff",head:55,fx:"drops"},
 {t:1.3,c:"Così non beve dalle pozzanghere",fx:"drops"},{t:.6,dp:"stand",head:0,wag:1.2,water:.3}]},
stop:{init:{bg:"parco",d:30,dsx:1,p:290,dwalk:1,ws:1.3},k:[
 {t:1.3,c:"Parti da vicino, poi aumenta la distanza",d:120},
 {t:.6,c:"Mano alzata: «Terra!»",say:"Terra!",h1:[22,-158],s1:"palm",dwalk:0},
 {t:.7,dp:"down"},{t:.5,say:"Bravo!",c:"Si sdraia anche lontano da te: «Bravo!»"},
 {t:1.3,c:"Vai tu da lui a dargli il premio",p:205,pwalk:1,h1:null,s1:"fist"},
 {t:.2,pwalk:0},{t:.7,h1:"nose",s1:"treat",pc:1},{t:.5,s1:"fist",fx:"heart"},
 {t:1,h1:null,pc:0,c:"Un comando di sicurezza: vicino a strade e dirupi"}]},
fischio:{init:{bg:"parco",d:30,dsx:-1,dp:"sniff",head:55,p:262},k:[
 {t:1.1,c:"Prima a casa: fischio e subito un premio speciale",fx:"sniff"},
 {t:.6,h1:"mouthP",s1:"whistle"},
 {t:1.1,c:"Sempre lo stesso suono: tre colpi corti",fx:"waves"},
 {t:.6,dsx:1,dp:"stand",head:-5,dsay:"!"},
 {t:1.6,c:"Arriva di corsa: premio buonissimo",d:160,dwalk:1,ws:1.6,wag:1.6,h1:null,s1:"fist"},
 {t:.3,dwalk:0},...BR({pc:.7}),{t:.5,s1:"treat",h1:"nose"},{t:.4,s1:"fist",fx:"heart"},{t:.8,h1:null,pc:0}]},
animali:{init:{bg:"parco",cat:36,d:165,dsx:-1,p:212,leash:1,slack:.8},k:[
 {t:1.2,c:"Vedi un animale lontano"},
 {t:.7,dsay:"!",head:-10,c:"Prima che reagisca…"},
 {t:.8,say:"Guardami",dsx:1,head:-20,c:"…«Guardami» e premio"},
 ...BR2({pc:.5,head:-8}),
 {t:1.8,cat:-60,catw:1,h2:null,pc:0,head:-16,c:"Resta a una distanza a cui riesce a guardarti"},
 {t:.7,catw:0,head:0}]},
relax:{init:{bg:"monti",bench:262,p:264,ps:1,mat:182,d:182,wag:.3},k:[
 {t:1.1,c:"Alla sosta, metti a terra il suo tappetino"},
 {t:1.2,c:"Aspetta che si sdrai, senza chiedere niente",dp:"down"},
 {t:.9,c:"Lascia cadere un premio tra le zampe, con calma",h1:"nose",s1:"treat"},
 {t:.5,s1:"fist",fx:"heart"},{t:.6,h1:null},
 {t:1.4,c:"Quando appoggia la testa, si sta rilassando",head:28,fx:"zzz",wag:0},
 {t:1.5,fx:"zzz",c:"Allunga piano il tempo della sosta"}]},
cerca:{init:{dp:"sit",d:96,box:268,p:196},k:[
 {t:1.1,c:"Fallo sedere: vede che nascondi un premio",pf:1,h1:["w",262,-10],s1:"treat",pc:.9},
 {t:.4,s1:"fist"},{t:.7,pf:-1,h1:null,pc:0},
 {t:.8,say:"Cerca!",c:"Poi «Cerca!» con voce allegra"},
 {t:1.7,dp:"stand",d:206,dwalk:1,dz:1,c:"Annusa e trova il premio da solo"},
 {t:.9,dp:"sniff",head:55,dwalk:0,fx:"sniff"},
 {t:1,fx:"heart",wag:1.6,c:"Trovato! Stanca la testa più di una corsa"},
 {t:.9,c:"Poi nascondilo in posti un po' più difficili",dp:"stand",head:0}]},
mano:{init:{pc:.7},k:[
 {t:1.1,c:"Premio in una mano, chiudile tutte e due",h1:["n",10,-10],h2:["n",10,10]},
 {t:1.3,c:"Annusa e tocca quella giusta…",head:22,fx:"sniff"},
 {t:.5,say:"Bravo!",c:"…«Bravo!» e apri quella mano"},{t:.5,s2:"palmt"},{t:.5,s2:"palm",fx:"heart",head:0,wag:1.4},
 {t:1,h1:null,h2:null,s2:"fist",c:"Se sbaglia, apri l'altra mano: è vuota. Riprova"}]},
zampa:{init:{dp:"sit",pc:.7},k:[
 {t:1.1,c:"Premio nella mano chiusa, all'altezza del petto",h1:"chest"},
 {t:1,c:"Quando alza la zampa per prenderlo…",paw:1},
 {t:.4,say:"Bravo!"},{t:.5,s1:"palmt",c:"…«Bravo!» e apri la mano"},{t:.4,s1:"palm",fx:"heart"},{t:.6,paw:0,h1:null,s1:"fist"},
 {t:1.1,c:"Poi tendi la mano aperta e di' «Zampa»",say:"Zampa",h1:"chest",s1:"palm"},
 {t:.8,paw:1},...BR2(),{t:.6,paw:0,h1:null,h2:null}]},
riporto:{init:{bg:"parco",d:170,dsx:1,p:262,h1:[22,-82],s1:"toy",pc:.2},k:[
 {t:.8,c:"Lancia il gioco molto vicino",h1:[28,-124]},
 {t:.3,s1:"fist",toy:220,ty:56},
 {t:1,toy:80,ty:0,dsx:-1,d:132,dwalk:1,ws:1.5,h1:null,pc:0},
 {t:.5,dp:"sniff",head:55,dwalk:0},{t:.3,toy:null,dm:"toy",dp:"stand",head:0},
 {t:.6,c:"Quando lo prende, chiamalo allegro…",say:"Porta!",dsx:1},
 {t:1.2,c:"…e fai un passo indietro",d:200,dwalk:1,p:292,pwalk:1},{t:.2,dwalk:0,pwalk:0},
 {t:.7,c:"Scambia il gioco con un premio",h1:"nose",s1:"treat",pc:.7},
 {t:.4,dm:"",s1:"toy",fx:"heart",wag:1.5},{t:.9,h1:[22,-82],pc:.2,c:"Poi lo rilanci: il gioco continua"}]},
giro:{init:{pc:.5},k:[
 {t:1.1,c:"Premio vicino al naso",h1:"nose",s1:"treat"},
 {t:1.1,c:"Disegna un cerchio largo e lento…",dsx:-1,d:96,h1:[60,-50]},
 {t:1.1,dsx:1,d:100,h1:"nose"},
 ...BR({c:"Quando chiude il giro: «Bravo!»"}),
 {t:.9,h1:null,c:"Fallo girare in tutti e due i sensi"}]},
inchino:{init:{pc:.7,p:192},k:[
 {t:1.1,c:"Cane in piedi, premio davanti al naso",h1:"nose",s1:"treat"},
 {t:1.4,c:"Portalo giù, verso terra, vicino alle zampe",h1:"groundf",dp:"bow",head:10,pc:1},
 {t:.5,say:"Bravo!",c:"Petto giù e sedere in alto: «Bravo!»"},
 {t:.6,h1:"nose",say:"Bravo!"},{t:.5,s1:"fist",fx:"heart"},
 {t:1,dp:"stand",head:0,h1:null,pc:.5,c:"Bastano 1-2 secondi: è anche un buon allungamento"}]},
salto:{init:{bg:"parco",hurd:150,d:60,p:300},k:[
 {t:1,c:"Appoggia una scopa a terra"},
 {t:1.6,c:"Fallo passare sopra camminando",d:230,dwalk:1,lin:1},{t:.2,dwalk:0},
 ...BR({pc:.6}),
 {t:1.3,h1:null,pc:0,dsx:-1,d:60,dwalk:1},{t:.4,dsx:1,dwalk:0},
 {t:.8,c:"Poi alzala di pochi centimetri",hh:12},
 {t:.7,d:110,dwalk:1},{t:.45,d:165,dy:-26,drot:-14,dwalk:0,lin:1},{t:.45,d:225,dy:0,drot:0,lin:1},
 ...BR({pc:.6,c:"Salta: «Bravo!» e premio"}),{t:.6,h1:null,pc:0}]},
riordina:{init:{bask:95,p:42,pf:1,d:230,dsx:-1,dm:"toy",dwalk:1},k:[
 {t:1.3,c:"Mettiti accanto alla cesta: arriva col gioco…",d:150},{t:.3,dwalk:0},
 {t:.7,say:"Lascia",c:"…mano sopra la cesta: «Lascia»",h1:["w",100,-52],s1:"palm",pc:.4},
 {t:.4,dm:"",toy:96,ty:26},{t:.4,ty:8},
 ...BR({c:"Il gioco cade dentro: «Bravo!» e premio",pc:.5}),
 {t:1.1,h1:null,pc:0,c:"Poi allontanati dalla cesta, un passo alla volta"}]},
rotola:{init:{dp:"down",pc:.9,p:196},k:[
 {t:1.1,c:"Parti da «Terra», premio vicino al naso",h1:"nose",s1:"treat"},
 {t:1,c:"Portalo verso la sua spalla: si gira su un fianco",h1:"shoulder",head:-30},
 {t:1,c:"…pancia all'aria…",dp:"back",head:20,h1:"nose"},
 {t:1,c:"…e torna giù dall'altra parte",dp:"down",head:0,h1:"nose"},
 ...BR(),{t:.9,h1:null,c:"Solo su un prato o un tappeto morbido"}]}
};
const FALLBACK={init:{pc:.5},k:[{t:1.2,c:"Poco alla volta, con calma",h1:[30,-80],s1:"treat"},...BR(),{t:1,h1:null}]};

/* ---------- player ---------- */
const players=new Set();let raf=0,last=0;
const reduce=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function ease(e){return e<.5?2*e*e:1-2*(1-e)*(1-e)}
class Player{
 constructor(el,id,name){
  this.el=el;this.segs=compile(SC[id]||FALLBACK,name);
  this.total=this.segs.reduce((a,s)=>a+s.t,0)+1.3;this.t=0;this.T=0;this.off=0;this.vis=false;this.paused=reduce;this.cap=null;
  el.innerHTML=`<div class="la"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Animazione della lezione"></svg><button type="button" class="la-pp" aria-label="Pausa">❚❚</button><p class="la-cap" aria-live="off"></p></div>`;
  this.svg=el.querySelector("svg");this.capEl=el.querySelector(".la-cap");this.btn=el.querySelector(".la-pp");
  const tog=()=>{this.paused=!this.paused;this.sync();if(!this.paused)kick()};
  this.btn.onclick=e=>{e.preventDefault();tog()};this.svg.onclick=tog;
  this.sync();this.draw(0);
  if("IntersectionObserver" in window){this.io=new IntersectionObserver(es=>{for(const e of es)this.vis=e.isIntersecting;if(this.vis)kick()},{threshold:.15});this.io.observe(el)}else this.vis=true;
  players.add(this);
 }
 seek(t){this.t=t%this.total;this.draw(0)}
 sync(){this.btn.textContent=this.paused?"▶":"❚❚";this.btn.setAttribute("aria-label",this.paused?"Guarda l'animazione":"Pausa");this.el.querySelector(".la").classList.toggle("paused",this.paused)}
 draw(dt){
  this.T+=dt;this.t=(this.t+dt)%this.total;
  let acc=0,seg=this.segs[this.segs.length-1],p=1;
  for(const s of this.segs){if(this.t<acc+s.t){seg=s;p=(this.t-acc)/s.t;break}acc+=s.t}
  if(this.t>=this.total-1.3){seg=Object.assign({},seg,{say:null,dsay:null,fx:null});p=1}
  const st=lerp(seg.a,seg.b,seg.lin?p:ease(p));
  this.off+=dt*(st.scroll||0)*55;
  this.svg.innerHTML=sceneSVG(st,seg,p,this.T,this.off);
  if(seg.cap!==this.cap){this.cap=seg.cap;this.capEl.textContent=seg.cap||""}
 }
}
function loop(now){
 raf=0;const dt=Math.min(.1,(now-(last||now))/1000);last=now;let any=false;
 for(const pl of players){
  if(!pl.el.isConnected){players.delete(pl);pl.io&&pl.io.disconnect();continue}
  if(pl.vis&&!pl.paused&&!document.hidden){pl.draw(dt);any=true}
 }
 if(any)raf=requestAnimationFrame(loop);else last=0;
}
function kick(){if(!raf)raf=requestAnimationFrame(loop)}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)kick()});

const css=`.la{position:relative;margin:10px 0 12px;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--accent-soft)}
.la svg{display:block;width:100%;height:auto;cursor:pointer}
.la-pp{position:absolute;top:8px;right:8px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(15,20,35,.55);color:#fff;font-size:13px;cursor:pointer;display:grid;place-items:center}
.la.paused .la-pp{width:52px;height:52px;top:calc(50% - 40px);right:calc(50% - 26px);font-size:20px;background:var(--accent);color:var(--accent-ink)}
.la-cap{margin:0;padding:9px 12px;background:var(--surface);border-top:1px solid var(--line);font-weight:600;font-size:15px;line-height:1.35;min-height:3.1em}`;
function addCSS(){if(document.getElementById("la-css"))return;const s=document.createElement("style");s.id="la-css";s.textContent=css;document.head.appendChild(s)}

window.AllDogsAnim={
 mount(root,name){addCSS();(root||document).querySelectorAll("[data-anim]").forEach(el=>{if(el._la)return;el._la=new Player(el,el.dataset.anim,name)});kick()},
 ids:Object.keys(SC)
};
})();
