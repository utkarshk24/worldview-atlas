(function(){
"use strict";
const I=window.WV_I18N, FL=window.WV_FL, RG=window.WV_REGION, LEX=window.WV_LEX, GROUPS=window.WV_GROUPS, CHOKE=window.WV_CHOKE, CORR=window.WV_CORR;
const BASE=window.WV_BASE||"";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store={get(k,d){try{const v=localStorage.getItem("wv:"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem("wv:"+k,JSON.stringify(v))}catch(e){}}};
const RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

const S={lang:store.get("lang","en"),edition:store.get("edition","india"),proj:"flat",color:store.get("color","region"),group:null,
  layers:store.get("layers",{choke:true,imec:false,instc:false,lanes:false}),ptab:"explore",sel:null,tab:"overview",
  fav:store.get("fav",[]),recent:store.get("recent",[]),cmp:[],mxSort:["g",-1]};
let C={},CUR={},LEAD={},GEO={},feats=[],byId={},shards={};
const t=k=>{const v=I[S.lang][k];return v==null?I.en[k]:v};
const tt=k=>(I[S.lang].tabs[k]||I.en.tabs[k]);
const loc=()=>({en:"en-IN",hi:"hi-IN",mr:"mr-IN"}[S.lang]);

/* ---------- names ---------- */
const DN={};
function dn(lang){if(!(lang in DN)){try{DN[lang]=new Intl.DisplayNames([lang],{type:"region"})}catch(e){DN[lang]=null}}return DN[lang]}
function nameOf(k,lang){lang=lang||S.lang;const c=C[k];if(!c){const f=byId[k];return f?f.properties.n:k}
  if(lang!=="en"){const d=dn(lang);try{const n=d&&c.a2&&d.of(c.a2);if(n&&n!==c.a2)return n}catch(e){}}
  return c.n}
function flagEmoji(k){const c=C[k];return c&&c.fl?c.fl:"🏳️"}

/* ---------- formatting ---------- */
const nf=(n,d=0)=>Number(n).toLocaleString("en-IN",{maximumFractionDigits:d,minimumFractionDigits:d});
const W={en:{tr:"trillion",bn:"billion",mn:"million",cr:"crore",lk:"lakh"},hi:{tr:"ट्रिलियन",bn:"बिलियन",mn:"मिलियन",cr:"करोड़",lk:"लाख",arab:"अरब"},mr:{tr:"ट्रिलियन",bn:"बिलियन",mn:"मिलियन",cr:"कोटी",lk:"लाख"}};
function fPop(n){if(n==null)return t("notAvail");const w=W[S.lang];
  if(S.lang==="en"){if(n>=1e9)return (n/1e9).toFixed(2)+" "+w.bn;if(n>=1e6)return (n/1e6).toFixed(1)+" "+w.mn;return nf(n)}
  if(n>=1e7)return nf(n/1e7,1)+" "+w.cr;if(n>=1e5)return nf(n/1e5,1)+" "+w.lk;return nf(n)}
function fPopAlt(n){if(n==null||S.lang!=="en")return "";if(n>=1e7)return nf(n/1e7,1)+" crore";if(n>=1e5)return nf(n/1e5,1)+" lakh";return ""}
function fUsd(bn){if(bn==null)return t("notAvail");const w=W[S.lang];if(bn>=1000)return "$"+(bn/1000).toFixed(2)+" "+w.tr;if(bn>=1)return "$"+bn.toFixed(1)+" "+w.bn;return "$"+Math.round(bn*1000)+" "+w.mn}
function fArea(a){if(!a)return t("notAvail");return nf(a)+" km²"}
function fCompact(v,mode){if(v==null)return "—";if(mode==="population")return fPop(v);if(mode==="gdp")return fUsd(v);if(mode==="gdppc")return "$"+nf(v);if(mode==="area")return nf(v)+" km²";if(mode==="density")return nf(v,v<10?1:0)+" /km²";if(mode==="hdi")return v.toFixed(3);if(mode==="gini")return v.toFixed(1);return String(v)}

/* ---------- metrics ---------- */
const RANKSET=k=>{const c=C[k];return c&&(c.un||["PSE","VAT"].includes(k))};
function metric(k,mode){const c=C[k];if(!c)return null;
  switch(mode){case"population":return c.pop?c.pop[0]:null;case"gdp":return c.gdp?c.gdp[0]:null;case"gdppc":return c.pc?c.pc[0]:null;
  case"area":return c.ar||null;case"hdi":return c.hdi?c.hdi[0]:null;case"gini":return c.gini?c.gini[0]:null;case"density":return c.pop&&c.ar>0?c.pop[0]/c.ar:null;case"shared":return sharedGroups(k).length;default:return null}}
const RANK={};
function rankOf(k,mode){if(mode==="hdi"){const c=C[k];return c&&c.hdi?[c.hdi[1],193]:null}if(!RANK[mode]){const arr=Object.keys(C).filter(RANKSET).map(x=>[x,metric(x,mode)]).filter(x=>x[1]!=null).sort((a,b)=>b[1]-a[1]);RANK[mode]={n:arr.length,r:Object.fromEntries(arr.map((x,i)=>[x[0],i+1]))}}
  const R=RANK[mode];return R.r[k]?[R.r[k],R.n]:null}
function sharedGroups(k){if(k==="IND")return Object.keys(GROUPS).filter(g=>!GROUPS[g].x);return Object.keys(GROUPS).filter(g=>!GROUPS[g].x&&GROUPS[g].m.includes(k)&&GROUPS[g].m.includes("IND"))}
function memberOf(k){return Object.keys(GROUPS).filter(g=>GROUPS[g].m.includes(k))}
function bordersOf(k){const b=(C[k]&&C[k].b||[]).slice();if(S.edition==="india"){if(k==="IND"&&!b.includes("AFG"))b.push("AFG");if(k==="AFG"&&!b.includes("IND"))b.push("IND")}return b}
function distKm(a,b){return Math.round(d3.geoDistance(a,b)*6371)}
const DELHI=[77.21,28.61];

/* ---------- colours ---------- */
let TOK={};
function readTokens(){const cs=getComputedStyle(document.documentElement);["--land","--seq0","--seq1","--accent","--r-af","--r-am","--r-as","--r-eu","--r-oc","--r-an","--chip","--sea"].forEach(v=>TOK[v]=cs.getPropertyValue(v).trim())}
const REGC={Africa:"--r-af",Americas:"--r-am",Asia:"--r-as",Europe:"--r-eu",Oceania:"--r-oc",Antarctic:"--r-an"};
let colorFn=()=>TOK["--land"];
function buildColor(){readTokens();const m=S.color;
  if(m==="region"){colorFn=k=>{const c=C[k];return c&&REGC[c.r]?TOK[REGC[c.r]]:TOK["--land"]};return}
  if(m==="shared"){const sc=d3.scaleLinear().domain([0,6]).range([TOK["--seq0"],TOK["--seq1"]]).interpolate(d3.interpolateLab).clamp(true);
    colorFn=k=>k==="IND"?TOK["--accent"]:(C[k]?sc(metric(k,"shared")):TOK["--land"]);return}
  if(m==="hdi"||m==="gini"){const v=Object.keys(C).map(k=>metric(k,m)).filter(x=>x!=null);const ext=[d3.min(v),d3.max(v)];const sc=d3.scaleLinear().domain(ext).range([TOK["--seq0"],TOK["--seq1"]]).interpolate(d3.interpolateLab);colorFn=k=>{const x=metric(k,m);return x!=null?sc(x):TOK["--chip"]};colorFn.ext=ext;return}
  const vals=Object.keys(C).map(k=>metric(k,m)).filter(v=>v!=null&&v>0);
  const ext=[d3.quantile(vals.slice().sort(d3.ascending),.02)||d3.min(vals),d3.max(vals)];
  const sc=d3.scaleLog().domain(ext).range([TOK["--seq0"],TOK["--seq1"]]).interpolate(d3.interpolateLab).clamp(true);
  colorFn=k=>{const v=metric(k,m);return v!=null&&v>0?sc(v):TOK["--chip"]};colorFn.ext=ext}

/* ---------- map ---------- */
const svg=d3.select("#map");let W_,H_;
const gRoot=svg.append("g"),gSea=gRoot.append("path").attr("class","sea"),gGrat=gRoot.append("path").attr("class","grat"),gLand=gRoot.append("g"),gOver=gRoot.append("g"),gPts=gRoot.append("g");
let proj,path,zoom,curK=1;
const grat=d3.geoGraticule10();
function setupProjection(){W_=innerWidth;H_=innerHeight;svg.attr("viewBox",[0,0,W_,H_]);
  if(S.proj==="flat"){proj=d3.geoEqualEarth().fitExtent([[12,Math.min(110,H_*.12)],[W_-12,H_-12]],{type:"Sphere"})}
  else{const r=Math.min(W_,H_-80)/2.25;proj=d3.geoOrthographic().scale(r).translate([W_/2,H_/2+30]).clipAngle(90).rotate(proj&&proj.rotate&&S._rot?S._rot:[-78,-18,0])}
  path=d3.geoPath(proj)}
function drawAll(){gSea.attr("d",path({type:"Sphere"}));gGrat.attr("d",path(grat));
  gLand.selectAll("path.ctry").attr("d",path);drawOverlays()}
function render(){
  const sel=gLand.selectAll("path.ctry").data(feats,d=>d.id);
  sel.exit().remove();
  sel.enter().append("path").attr("class",d=>"ctry"+(C[d.id]?"":" special")).attr("tabindex",-1)
    .on("mousemove",onHover).on("mouseleave",()=>{$("#tip").hidden=true})
    .on("click",(e,d)=>{e.stopPropagation();openCountry(d.id)})
    .merge(sel).attr("d",path);
  paint();drawOverlays()}
function paint(){gLand.selectAll("path.ctry").attr("fill",d=>colorFn(d.id))
  .classed("sel",d=>d.id===S.sel).classed("dim",d=>S.group?!GROUPS[S.group].m.includes(d.id):false);
  if(S.group){gLand.selectAll("path.ctry").filter(d=>GROUPS[S.group].m.includes(d.id)).attr("fill",d=>d.id==="IND"?TOK["--accent"]:d3.interpolateLab(TOK["--accent"],colorFn(d.id))(.35))}
  gLand.selectAll("path.ctry.sel").raise();gPts.selectAll("circle.micro").attr("fill",d=>colorFn(d.id)).classed("sel",d=>d.id===S.sel).classed("dim",d=>S.group?!GROUPS[S.group].m.includes(d.id):false);legend()}
function visible(ll){if(S.proj==="flat")return true;const r=proj.rotate();return d3.geoDistance(ll,[-r[0],-r[1]])<Math.PI/2-.02}
function drawOverlays(){gOver.selectAll("*").remove();gPts.selectAll("*").remove();
  const addLegs=(key,cls)=>{const g=gOver.append("g").attr("class",cls);CORR[key].legs.forEach(l=>{g.append("path").attr("class",l.k==="lane"?"lane":l.k==="rail"?"leg-rail":"leg-sea").attr("d",path({type:"LineString",coordinates:l.c}))});
    (CORR[key].pts||[]).forEach(p=>{if(!visible(p.ll))return;const xy=proj(p.ll);gPts.append("g").attr("class","port").attr("transform",`translate(${xy})`).append("circle").attr("r",4/curK).append("title").text(p.n)})};
  Object.keys(C).filter(k=>C[k].ar!=null&&C[k].ar>=0&&C[k].ar<2500&&(C[k].un||k==="VAT")&&(C[k].capll||C[k].ll)).forEach(k=>{const c=C[k];const p=c.capll?[c.capll[1],c.capll[0]]:[c.ll[1],c.ll[0]];if(!visible(p))return;const xy=proj(p);
    gPts.append("circle").datum({id:k}).attr("class","micro"+(k===S.sel?" sel":"")).attr("cx",xy[0]).attr("cy",xy[1]).attr("r",3.4/curK).attr("fill",colorFn(k)).on("click",e=>{e.stopPropagation();openCountry(k)}).on("mousemove",e=>onHover(e,{id:k})).on("mouseleave",()=>{$("#tip").hidden=true})});
  if(S.layers.lanes)addLegs("lanes","lanes");
  if(S.layers.imec)addLegs("imec","imec");
  if(S.layers.instc)addLegs("instc","instc");
  if(S.layers.choke){CHOKE.forEach(c=>{if(!visible(c.ll))return;const xy=proj(c.ll);const g=gPts.append("g").attr("class","choke").attr("transform",`translate(${xy})`)
      .on("mousemove",e=>tip(e,`<b>${esc(c.n[S.lang])}</b><span>${esc(c.t)}</span>`)).on("mouseleave",()=>{$("#tip").hidden=true});
    g.append("circle").attr("class","ring").attr("r",7/curK);g.append("circle").attr("class","core").attr("r",4/curK)})}}
function onHover(e,d){const k=d.id,c=C[k];let line="";
  if(!c)line=t("special");else if(["region"].includes(S.color))line=(RG[S.lang][c.r]||c.r)+(c.sr?" · "+c.sr:"");
  else if(S.color==="shared"){const g=sharedGroups(k);line=k==="IND"?t("india"):(g.length?g.map(x=>GROUPS[x].n[S.lang]).join(" · "):"0")}
  else line=fCompact(metric(k,S.color),S.color);
  tip(e,`<b>${esc(flagEmoji(k))} ${esc(nameOf(k))}</b><span>${esc(line)}</span>`)}
function tip(e,html){const el=$("#tip");el.innerHTML=html;el.hidden=false;const x=Math.min(e.clientX+14,innerWidth-el.offsetWidth-8),y=Math.min(e.clientY+14,innerHeight-el.offsetHeight-8);el.style.left=x+"px";el.style.top=y+"px"}

function attachInteraction(){svg.on(".zoom",null).on(".drag",null);
  if(S.proj==="flat"){zoom=d3.zoom().scaleExtent([1,16]).clickDistance(4).translateExtent([[-W_,-H_],[W_*2,H_*2]])
      .on("zoom",e=>{gRoot.attr("transform",e.transform);if(Math.abs(e.transform.k-curK)>.01){curK=e.transform.k;gPts.selectAll("circle.core,.port circle").attr("r",4/curK);gPts.selectAll("circle.micro").attr("r",3.4/curK);gPts.selectAll("circle.ring").attr("r",7/curK)}});
    svg.call(zoom).on("dblclick.zoom",null);svg.call(zoom.transform,d3.zoomIdentity)}
  else{gRoot.attr("transform",null);curK=1;
    let raf=0;const redraw=()=>{raf=0;drawAll()};
    svg.call(d3.drag().clickDistance(4).on("drag",e=>{const r=proj.rotate(),k=75/proj.scale();proj.rotate([r[0]+e.dx*k,Math.max(-80,Math.min(80,r[1]-e.dy*k)),0]);S._rot=proj.rotate();if(!raf)raf=requestAnimationFrame(redraw)}));
    svg.on("wheel.globe",e=>{e.preventDefault();const s=Math.max(150,Math.min(3000,proj.scale()*(e.deltaY<0?1.08:.93)));proj.scale(s);if(!raf)raf=requestAnimationFrame(redraw)},{passive:false})}}
function zoomBy(f){if(S.proj==="flat")svg.transition().duration(RM?0:300).call(zoom.scaleBy,f);else{proj.scale(Math.max(150,Math.min(3000,proj.scale()*f)));drawAll()}}
function resetView(){if(S.proj==="flat")svg.transition().duration(RM?0:600).call(zoom.transform,d3.zoomIdentity);else{proj.rotate([-78,-18,0]);S._rot=null;setupGlobeScale();drawAll()}}
function setupGlobeScale(){proj.scale(Math.min(W_,H_-80)/2.25)}
function viewCentre(){const desk=innerWidth>820;const L=desk?360:0,Rr=desk&&S.sel?Math.min(560,innerWidth-32)+24:0;
  return {ox:L+(W_-L-Rr)/2,oy:desk?H_/2+30:(S.sel?Math.max(130,H_*.16)/1+0:H_/2),aw:W_-L-Rr,ah:desk?H_-140:(S.sel?H_*.16:H_-160),desk}}
function flyTo(k){const f=byId[k];if(!f)return;const c=C[k];
  const centre=c&&c.ll?[c.ll[1],c.ll[0]]:d3.geoCentroid(f);const v=viewCentre();
  if(S.proj==="flat"){let [[x0,y0],[x1,y1]]=path.bounds(f);const wide=(x1-x0)>W_*.5;
    let cx,cy,s;if(wide||!isFinite(x0)){[cx,cy]=proj(centre);s=2}else{cx=(x0+x1)/2;cy=(y0+y1)/2;s=.8/Math.max((x1-x0)/v.aw,(y1-y0)/Math.max(v.ah,120))}
    s=Math.max(1,Math.min(v.desk?8:4,s));
    svg.transition().duration(RM?0:900).call(zoom.transform,d3.zoomIdentity.translate(v.ox,v.oy).scale(s).translate(-cx,-cy))}
  else{const r0=proj.rotate(),r1=[-centre[0],-centre[1],0];const ip=d3.interpolate(r0,r1);
    d3.transition().duration(RM?0:900).tween("rot",()=>x=>{proj.rotate(ip(x));S._rot=proj.rotate();drawAll()})}}

/* ---------- legend ---------- */
function legend(){const el=$("#legend");const m=S.color;let h=`<h4>${esc(t(m==="shared"?"shared":m))}</h4>`;
  if(m==="region"){h+=`<div class="cats">`+Object.keys(REGC).filter(r=>r!=="Antarctic").map(r=>`<span><i style="background:${TOK[REGC[r]]}"></i>${esc(RG[S.lang][r])}</span>`).join("")+`</div><div class="src">${esc(t("legendSrc"))}: UN M49 (world-countries)</div>`}
  else if(m==="shared"){h+=`<div class="ramp" style="background:linear-gradient(90deg,${TOK["--seq0"]},${TOK["--seq1"]})"></div><div class="ends"><span>0</span><span>6+</span></div><div class="src">Quad, BRICS, SCO, G20, I2U2, IMEC, BIMSTEC, SAARC, IORA, CSC · mid-2026</div>`}
  else{const e=colorFn.ext||[0,1];const yrs=Object.values(C).map(c=>m==="population"||m==="density"?c.pop&&c.pop[1]:m==="area"?null:c.gdp&&c.gdp[1]).filter(Boolean);
    const yr=yrs.length?(d3.min(yrs)===d3.max(yrs)?d3.max(yrs):`${d3.quantile(yrs.sort(),.1)}–${d3.max(yrs)}`):"";
    const srcTxt=m==="area"?"world-countries (area incl. inland water) · log scale":m==="hdi"?esc(t("hdiSrc")):m==="gini"?"CIA World Factbook (latest year per country) · 0–100, higher = more unequal":(m==="gdp"||m==="gdppc"?"World Bank / CIA World Factbook":esc(t("wb")))+(yr?" · "+yr:"")+" · log scale";
    h+=`<div class="ramp" style="background:linear-gradient(90deg,${TOK["--seq0"]},${TOK["--seq1"]})"></div><div class="ends"><span>${esc(fCompact(e[0],m))}</span><span>${esc(fCompact(e[1],m))}</span></div><div class="src">${srcTxt}</div>`}
  h+=`<div class="src">${esc(S.edition==="india"?t("mapEd"):t("mapEdG"))}</div>`;el.innerHTML=h}

/* ---------- data loading ---------- */
async function getJSON(u){const r=await fetch(u);if(!r.ok)throw new Error(u+" "+r.status);return r.json()}
async function loadGeo(ed){if(GEO[ed])return GEO[ed];const topo=await getJSON(BASE+(ed==="india"?"geo-india.json":"geo-global.json"));
  const fc=topojson.feature(topo,topo.objects.c);GEO[ed]=fc.features;return GEO[ed]}
async function setEdition(ed){S.edition=ed;store.set("edition",ed);feats=await loadGeo(ed);byId=Object.fromEntries(feats.map(f=>[f.id,f]));gLand.selectAll("path.ctry").remove();render();renderPanel()}
async function shard(k){const L=k[0];if(shards[L])return shards[L];shards[L]=getJSON(BASE+"shard/"+L+".json").catch(e=>{delete shards[L];throw e});return shards[L]}

/* ---------- search ---------- */
let IDX=[];
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function buildIndex(){IDX=Object.keys(C).map(k=>{const c=C[k];const terms=[c.n,c.o,c.nv,k,c.a2,nameOf(k,"hi"),nameOf(k,"mr")];if(k==="IND")terms.push("bharat","bhārat","भारत");return {k,terms:terms.filter(Boolean).map(norm)}})}
let qSel=-1,qItems=[];
function doSearch(){const q=norm($("#q").value.trim());const ul=$("#qres");if(!q){ul.hidden=true;return}
  const sc=[];IDX.forEach(r=>{let best=0;r.terms.forEach(tm=>{if(tm===q)best=Math.max(best,100);else if(tm.startsWith(q))best=Math.max(best,60);else if(tm.includes(q))best=Math.max(best,25)});if(best)sc.push([r.k,best+(C[r.k].pop?Math.log10(C[r.k].pop[0])/10:0)])});
  if(!sc.length&&q.length>=4){const lev=(a,b)=>{const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const tmp=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=tmp}}return d[b.length]};
    IDX.forEach(r=>{const best=Math.min(...r.terms.slice(0,3).map(tm=>lev(q,tm.slice(0,q.length+1))));if(best<=2)sc.push([r.k,10-best])})}
  sc.sort((a,b)=>b[1]-a[1]);qItems=sc.slice(0,8).map(x=>x[0]);qSel=qItems.length?0:-1;
  ul.innerHTML=qItems.length?qItems.map((k,i)=>`<li role="option" data-k="${k}" aria-selected="${i===qSel}"><span>${esc(flagEmoji(k))}</span><span>${esc(nameOf(k))}${S.lang!=="en"?` <span class="note">· ${esc(C[k].n)}</span>`:""}</span><small>${k}</small></li>`).join(""):`<li>${esc(t("noResults"))}</li>`;ul.hidden=false}
function pickSearch(k){$("#qres").hidden=true;$("#q").value="";$("#q").blur();openCountry(k)}

/* ---------- panel ---------- */
const COLOR_MODES=["region","population","density","area","gdp","gdppc","hdi","gini","shared"];
function renderPanel(){["explore","lens","library"].forEach(p=>{const b=$("#pt-"+p);b.textContent=t(p==="lens"?"lens":p);b.setAttribute("aria-selected",S.ptab===p)});
  const pb=$("#pbody");let h="";
  if(S.ptab==="explore"){
    h+=`<div class="grp"><div class="lbl">${esc(t("colorBy"))}</div><div class="chips">${COLOR_MODES.map(m=>`<button class="chip${m==="shared"?" lensc":""}" data-color="${m}" aria-pressed="${S.color===m}">${esc(t(m))}</button>`).join("")}</div></div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("view"))}</div><div class="chips"><button class="chip" data-proj="flat" aria-pressed="${S.proj==="flat"}">${esc(t("map"))}</button><button class="chip" data-proj="globe" aria-pressed="${S.proj==="globe"}">${esc(t("globe"))}</button></div></div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("bounds"))}</div><div class="chips"><button class="chip" data-ed="india" aria-pressed="${S.edition==="india"}">${esc(t("bInd"))}</button><button class="chip" data-ed="global" aria-pressed="${S.edition==="global"}">${esc(t("bGlob"))}</button></div><div class="note">${esc(S.edition==="india"?t("mapEd"):t("mapEdG"))}</div></div>`;
    h+=layerToggles();
    h+=`<div class="note">${esc(t("dataNote"))}</div>`}
  else if(S.ptab==="lens"){
    h+=`<div class="lensbox">${esc(t("analytical"))}: ${esc(t("matrixNote"))}</div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("highlight"))}</div><div class="chips"><button class="chip lensc" data-group="" aria-pressed="${!S.group}">${esc(t("none"))}</button>${Object.keys(GROUPS).map(g=>`<button class="chip lensc" data-group="${g}" aria-pressed="${S.group===g}" title="${esc(GROUPS[g].f)}">${esc(GROUPS[g].n[S.lang])}</button>`).join("")}</div>${S.group?`<div class="note">${esc(GROUPS[S.group].f)} · ${GROUPS[S.group].m.length} ${esc(t("members"))}</div>`:""}</div>`;
    h+=layerToggles();
    h+=`<div class="grp"><div class="lbl">${esc(t("chokes"))}</div><div class="list">${CHOKE.map(c=>`<button data-choke="${c.id}"><i class="dot"></i><span>${esc(c.n[S.lang])}<small>${esc(c.t)}</small></span></button>`).join("")}</div></div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("corridors"))}</div>${["imec","instc"].map(k=>`<div><b style="font-weight:600;font-size:14px">${esc(CORR[k].n[S.lang])}</b><div class="note">${esc(CORR[k].t)}</div></div>`).join("")}</div>`;
    h+=matrixHTML();
    h+=`<div class="grp"><div class="lbl">${esc(t("lexicon"))}</div><div class="lex">${LEX.map(r=>`<div><b>${esc(r[0])}</b><span lang="hi">हिं: ${esc(r[1])}</span><br><span lang="mr">मरा: ${esc(r[2])}</span></div>`).join("")}</div></div>`}
  else{
    const chipList=(arr,empty)=>arr.length?`<div class="chips">${arr.map(k=>`<button class="chip" data-open="${k}">${esc(flagEmoji(k))} ${esc(nameOf(k))}</button>`).join("")}</div>`:`<div class="note">${esc(t(empty))}</div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("fav"))}</div>${chipList(S.fav,"emptyFav")}</div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("recent"))}</div>${chipList(S.recent,"emptyRecent")}</div>`;
    h+=`<div class="grp"><div class="lbl">${esc(t("compare"))}</div>${S.cmp.length?chipList(S.cmp,""):`<div class="note">${esc(t("addCompare"))} →</div>`}</div>`}
  pb.innerHTML=h}
function layerToggles(){const L=[["choke","lChoke","var(--accent)"],["imec","lImec","var(--corr)"],["instc","lInstc","var(--corr2)"],["lanes","lLanes","var(--lane)"]];
  return `<div class="grp"><div class="lbl">${esc(t("layers"))}</div>${L.map(([k,l,c])=>`<label class="toggle"><input type="checkbox" id="ly-${k}" data-layer="${k}" ${S.layers[k]?"checked":""}><span>${esc(t(l))}</span><i class="swatch" style="background:${c}"></i></label>`).join("")}</div>`}
function matrixHTML(){const rows=Object.keys(C).filter(k=>RANKSET(k)&&k!=="IND"&&C[k].ll).map(k=>{const c=C[k];return {k,g:sharedGroups(k).length,b:bordersOf(k).includes("IND")?1:0,d:distKm(DELHI,[c.ll[1],c.ll[0]])}});
  const [f,dir]=S.mxSort;rows.sort((a,b)=>f==="n"?dir*nameOf(a.k).localeCompare(nameOf(b.k)):(dir*(a[f]-b[f])||a.d-b.d));
  const arrow=x=>S.mxSort[0]===x?(S.mxSort[1]<0?" ↓":" ↑"):"";
  return `<div class="grp"><div class="lbl">${esc(t("matrix"))}</div><div class="mxwrap"><table class="mx"><thead><tr><th data-sort="n">${esc(t("country"))}${arrow("n")}</th><th data-sort="g">${esc(t("groups"))}${arrow("g")}</th><th data-sort="b">${esc(t("border"))}${arrow("b")}</th><th data-sort="d">${esc(t("km"))}${arrow("d")}</th></tr></thead><tbody>${rows.map(r=>`<tr data-open="${r.k}"><td>${esc(flagEmoji(r.k))} ${esc(nameOf(r.k))}</td><td class="mono">${r.g}</td><td>${r.b?"●":""}</td><td class="mono">${nf(r.d)}</td></tr>`).join("")}</tbody></table></div><div class="note">${esc(t("matrixNote"))}</div></div>`}

/* ---------- drawer ---------- */
const TABS=["overview","geography","people","health","government","economy","foreign","culture","history","infra","india","facts"];
let CUR_REC=null;
async function openCountry(k,tab){if(!byId[k]&&!C[k])return;S.sel=k;S.tab=tab&&TABS.includes(tab)?tab:(S.tab||"overview");
  if(C[k]){S.recent=[k,...S.recent.filter(x=>x!==k)].slice(0,10);store.set("recent",S.recent)}
  try{history.replaceState(null,"","#"+k+(S.tab!=="overview"?"."+S.tab:""))}catch(e){}
  paint();flyTo(k);$("#hint").hidden=true;
  const dr=$("#drawer");dr.hidden=false;dr.classList.remove("closing");
  if(!C[k]){dr.innerHTML=heroHTML(k,null)+`<div class="dbody"><div class="empty"><b>${esc(t("special"))}</b>${esc(specialNote(k))}</div></div>`;wireDrawer(k);return}
  dr.innerHTML=heroHTML(k,null)+tabsHTML()+`<div class="dbody" id="dbody"><div class="skel" style="width:60%"></div><div class="skel"></div><div class="skel" style="width:80%"></div><div class="note">${esc(t("loading"))}</div></div>`;wireDrawer(k);
  try{const sh=await shard(k);if(S.sel!==k)return;CUR_REC={k,base:C[k],fb:(sh[k]||{}).fb||{},flag:(sh[k]||{}).flag,cur:CUR[k]};
    const cache=store.get("cache",{});cache[k]=Date.now();store.set("cache",cache);
    dr.innerHTML=heroHTML(k,CUR_REC)+tabsHTML()+`<div class="dbody" id="dbody"></div>`;wireDrawer(k);renderTab()}
  catch(e){const b=$("#dbody");if(b)b.innerHTML=`<div class="err">${esc(t("loadErr"))} <button class="morebtn" id="retry">${esc(t("retry"))}</button></div>`;const r=$("#retry");if(r)r.onclick=()=>openCountry(k)}}
const SPECIAL={SOL:"Somaliland: self-declared state; internationally recognised as part of Somalia.",CYN:"Northern Cyprus: recognised only by Türkiye; internationally recognised as part of Cyprus.",KAS:"Siachen Glacier: under Indian control since 1984; claimed by Pakistan. Shown as part of India in the India edition.",CNM:"UN buffer zone in Cyprus.",KAB:"Baikonur: Kazakh territory leased to Russia for its cosmodrome.",SPI:"Southern Patagonian Ice Field: boundary partly undemarcated between Argentina and Chile.",BRT:"Bir Tawil: unclaimed land between Egypt and Sudan.",PGA:"Spratly Islands: claimed in whole or part by China, Taiwan, Vietnam, the Philippines, Malaysia and Brunei.",SCR:"Scarborough Reef: disputed between China, Taiwan and the Philippines.",IOA:"Australian Indian Ocean territories (Christmas Island, Cocos Islands).",ESB:"Dhekelia: UK Sovereign Base Area on Cyprus.",WSB:"Akrotiri: UK Sovereign Base Area on Cyprus.",USG:"US naval base at Guantánamo Bay, Cuba."};
const specialNote=k=>SPECIAL[k]||"A territory without a full country profile in this edition.";
function heroHTML(k,R){const c=C[k];const fav=S.fav.includes(k),inC=S.cmp.includes(k);
  const flag=R&&R.flag?`<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(R.flag)}">`:"";
  const nm=nameOf(k);const sub=c?[S.lang!=="en"?c.n:null,c.o!==c.n?c.o:null].filter(Boolean).join(" · "):"";
  const stats=c?[[t("capital"),(c.cap||[]).join(", ")||"—",""],[t("population"),fPop(c.pop&&c.pop[0]),c.pop?t("wb")+" "+c.pop[1]:""],[t("gdp"),fUsd(c.gdp&&c.gdp[0]),gdpSrc(c)],[t("area"),c.ar?nf(c.ar)+" km²":"—",""]]:[];
  const wikiLang=S.lang==="en"?"en":S.lang;const wikiT=S.lang==="en"?(c?c.n:nm):nm;
  return `<div class="hero">${flag?`<div class="bgflag" aria-hidden="true">${flag}</div>`:""}
  <button class="icon-btn closeX" id="dClose" aria-label="${esc(t("close"))}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  <button class="icon-btn sheetBtn" id="dSheet" aria-label="${esc(t("collapse"))}"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
  <div class="row"><div class="flagbox${flag?" wave":""}" aria-hidden="true">${flag||esc(c?flagEmoji(k):"")}</div><div style="min-width:0;padding-right:40px"><h2>${esc(nm)}</h2><div class="sub">${esc(sub)}</div></div></div>
  ${c?`<div class="acts">
    <button class="act" id="aFav" aria-pressed="${fav}"><svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>${esc(t("fav"))}</button>
    <button class="act" id="aCmp" aria-pressed="${inC}"><svg viewBox="0 0 24 24"><path d="M8 3v18M16 3v18M3 8h5M16 16h5"/></svg>${esc(inC?t("inCompare"):t("addCompare"))}</button>
    <button class="act" id="aCopy"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg><span>${esc(t("copy"))}</span></button>
    ${"speechSynthesis" in window?`<button class="act" id="aRead"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg><span>${esc(t("read"))}</span></button>`:""}
    <a class="act" href="https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(wikiT.replace(/ /g,"_"))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>${esc(t("wiki"))}</a>
  </div><div class="stats">${stats.map(s=>`<div class="stat"><div class="k">${esc(s[0])}</div><div class="v">${esc(s[1])}</div>${s[2]?`<div class="y">${esc(s[2])}</div>`:""}</div>`).join("")}</div>`:""}</div>`}
function tabsHTML(){return `<div class="dtabs" role="tablist">${TABS.map(x=>`<button role="tab" data-tab="${x}" class="${x==="india"?"lensTab":""}" aria-selected="${S.tab===x}">${esc(tt(x))}</button>`).join("")}</div>`}
function wireDrawer(k){const q=s=>document.querySelector("#drawer "+s);
  q("#dClose").onclick=closeDrawer;
  const sb=q("#dSheet");if(sb)sb.onclick=()=>{const d=$("#drawer");const mini=d.classList.toggle("mini");sb.setAttribute("aria-label",mini?t("expand"):t("collapse"));sb.style.transform=mini?"rotate(180deg)":""};
  const f=q("#aFav");if(f)f.onclick=()=>{S.fav=S.fav.includes(k)?S.fav.filter(x=>x!==k):[k,...S.fav];store.set("fav",S.fav);f.setAttribute("aria-pressed",S.fav.includes(k));if(S.ptab==="library")renderPanel()};
  const cm=q("#aCmp");if(cm)cm.onclick=()=>{toggleCmp(k);cm.setAttribute("aria-pressed",S.cmp.includes(k));cm.lastChild.textContent=S.cmp.includes(k)?t("inCompare"):t("addCompare")};
  const cp=q("#aCopy");if(cp)cp.onclick=()=>{const txt=summaryText(k);const done=ok=>{cp.querySelector("span").textContent=ok?t("copied"):t("copyFail");setTimeout(()=>{if(cp.isConnected)cp.querySelector("span").textContent=t("copy")},1800)};
    try{navigator.clipboard.writeText(txt).then(()=>done(true),()=>done(false))}catch(e){done(false)}};
  const rd=q("#aRead");if(rd)rd.onclick=()=>{try{if(speechSynthesis.speaking){speechSynthesis.cancel();rd.querySelector("span").textContent=t("read");return}
    const u=new SpeechSynthesisUtterance(speakText(k));u.lang="en-IN";u.onend=()=>{if(rd.isConnected)rd.querySelector("span").textContent=t("read")};speechSynthesis.speak(u);rd.querySelector("span").textContent=t("stop")}catch(e){}};
  document.querySelectorAll("#drawer .dtabs button").forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;document.querySelectorAll("#drawer .dtabs button").forEach(x=>x.setAttribute("aria-selected",x===b));try{history.replaceState(null,"","#"+k+(S.tab!=="overview"?"."+S.tab:""))}catch(e){}renderTab()})}
function closeDrawer(){const dr=$("#drawer");try{speechSynthesis.cancel()}catch(e){}dr.classList.add("closing");setTimeout(()=>{dr.hidden=true;dr.classList.remove("closing")},RM?0:300);S.sel=null;paint();try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}
function summaryText(k){const c=C[k];const R=CUR_REC&&CUR_REC.k===k?CUR_REC:null;const g=sharedGroups(k);
  return [`${c.n} (${c.o})`,`Capital: ${(c.cap||[]).join(", ")}`,c.pop?`Population: ${fPop(c.pop[0])} (World Bank ${c.pop[1]})`:"",c.gdp?`GDP: ${fUsd(c.gdp[0])} (World Bank ${c.gdp[1]})`:"",`Region: ${c.r}${c.sr?" / "+c.sr:""}`,k!=="IND"&&g.length?`Groupings shared with India: ${g.join(", ")}`:"","— WorldView Atlas"].filter(Boolean).join("\n")}
function speakText(k){const fb=CUR_REC&&CUR_REC.fb;const bg=fb&&fb.overview&&fb.overview.find(r=>r[0]==="Background");return `${C[k].n}. Capital: ${(C[k].cap||[]).join(", ")}. `+(bg?bg[1].split("\n\n").slice(0,2).join(" "):"")}

/* ---------- tab rendering helpers ---------- */
const FLD=(lbl)=>S.lang!=="en"&&FL[S.lang]&&FL[S.lang][lbl]?FL[S.lang][lbl]:lbl;
function fbRows(R,tab,exclude){const rows=(R.fb[tab]||[]).filter(r=>!(exclude||[]).includes(r[0]));return rows}
function kv(rows,opts={}){if(!rows.length)return "";return `<dl class="kv">${rows.map(([l,v])=>{const long=String(v).length>420;return `<dt>${esc(opts.raw?l:FLD(l))}</dt><dd>${long?`<div class="clamp">${esc(v)}</div><button class="morebtn" data-more>${esc(t("more"))}</button>`:esc(v)}</dd>`}).join("")}</dl>`}
function sec(title,body,badge){if(!body)return "";return `<section class="sec"><h3>${esc(title)}${badge||""}</h3>${body}</section>`}
const fbBadge=()=>`<span class="badge warn" title="${esc(t("fbNote"))}">Factbook · Feb 2026</span>`;
const curBadge=()=>`<span class="badge ok">${esc(t("verified"))} · 12 Oct 2026</span>`;
function pctBars(text,max=7){if(!text)return "";const re=/([^,;:()\n]+?)\s*(?:\([^)]*\))?\s+(\d{1,3}(?:\.\d+)?)%/g;let m,out=[];
  while((m=re.exec(text))){const label=m[1].replace(/^(and|other)\s+/i,s=>s).trim();const p=parseFloat(m[2]);if(p>0&&p<=100&&label.length<60&&!/^\d/.test(label))out.push([label,p])}
  if(out.length<2)return "";out=out.slice(0,max);const mx=Math.max(...out.map(x=>x[1]));
  return `<div class="bars">${out.map(([l,p])=>`<div class="bar"><span class="t" title="${esc(l)}">${esc(l)}</span><span class="p">${p}%</span><div class="track"><div class="fill" style="width:${(p/mx*100).toFixed(1)}%"></div></div></div>`).join("")}</div>`}
function lineChart(series,fmt,label){if(!series||series.length<3)return "";const w=520,h=170,m={l:44,r:14,t:12,b:24};
  const x=d3.scaleLinear().domain(d3.extent(series,d=>d[0])).range([m.l,w-m.r]);const y=d3.scaleLinear().domain([0,d3.max(series,d=>d[1])*1.08]).nice(4).range([h-m.b,m.t]);
  const ln=d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveMonotoneX),ar=d3.area().x(d=>x(d[0])).y0(h-m.b).y1(d=>y(d[1])).curve(d3.curveMonotoneX);
  const yt=y.ticks(4),xt=x.ticks(5).map(Math.round).filter((v,i,a)=>a.indexOf(v)===i);const last=series[series.length-1];
  return `<div class="chart" role="img" aria-label="${esc(label)}"><svg viewBox="0 0 ${w} ${h}">${yt.map(v=>`<line class="gd" x1="${m.l}" x2="${w-m.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l-6}" y="${y(v)+3}" text-anchor="end">${esc(fmt(v))}</text>`).join("")}
  ${xt.map(v=>`<text x="${x(v)}" y="${h-6}" text-anchor="middle">${v}</text>`).join("")}<path class="ar" d="${ar(series)}"/><path class="ln" d="${ln(series)}"/><circle class="end" cx="${x(last[0])}" cy="${y(last[1])}" r="4"/><text x="${x(last[0])-6}" y="${y(last[1])-8}" text-anchor="end" style="fill:var(--fg)">${esc(fmt(last[1]))} (${last[0]})</text></svg></div>`}
const shortNum=v=>v>=1e9?(v/1e9).toFixed(v>=1e10?0:1)+"B":v>=1e6?(v/1e6).toFixed(v>=1e7?0:1)+"M":v>=1e3?(v/1e3).toFixed(0)+"k":String(Math.round(v));
const fbGet=(R,tab,lbl)=>{const r=(R.fb[tab]||[]).find(x=>x[0]===lbl);return r?r[1]:null};


const HEALTH_F=["Literacy", "Life expectancy at birth", "Infant mortality rate", "Total fertility rate", "Physician density", "Hospital bed density", "Health expenditure", "Education expenditure", "School life expectancy (primary to tertiary education)"];
const gdpSrc=c=>c.gdp?(c.gdp[2]==="fb"?"Factbook":t("wb"))+" "+c.gdp[1]:"";
const pcSrc=c=>c.pc?(c.pc[2]==="fb"?"Factbook":t("wb"))+" "+c.pc[1]:"";
const firstNum=(txt,re)=>{if(!txt)return null;const m=txt.match(re||/([\d.]+)/);return m?m[1]:null};
function pyramid(txt){if(!txt)return "";const rows=[];txt.split("\n").forEach(l=>{const m=l.match(/^([\d]+-[\d]+ years|[\d]+ years and over)\s*:\s*([\d.]+)%.*?male ([\d,]+)\/female ([\d,]+)/);if(m)rows.push([m[1],+m[2],+m[3].replace(/,/g,""),+m[4].replace(/,/g,"")])});
  if(rows.length<2)return "";const mx=Math.max(...rows.map(r=>Math.max(r[2],r[3])));
  return `<div class="pyr"><div class="pyr-h"><span>${esc(t("male"))}</span><span></span><span>${esc(t("female"))}</span></div>${rows.slice().reverse().map(r=>`<div class="pyr-r"><div class="pm"><i style="width:${(r[2]/mx*100).toFixed(1)}%"></i><em>${shortNum(r[2])}</em></div><span class="pl">${esc(r[0].replace(" years and over","+").replace(" years",""))}<small>${r[1]}%</small></span><div class="pf"><i style="width:${(r[3]/mx*100).toFixed(1)}%"></i><em>${shortNum(r[3])}</em></div></div>`).join("")}</div>`}
const titleCase=x=>x.toLowerCase().replace(/(^|[\s\-'(])([a-zà-ÿ])/g,(a,b,c)=>b+c.toUpperCase());
function citiesFrom(txt,cur){if(!txt)return [];const out=[];const re=/([\d.]+)\s*(million|thousand)\s+([^,;]+?)(\s*\(capital\))?(?=,|;|\(\d{4}|$)/g;let m;
  while((m=re.exec(txt))&&out.length<10){const name=titleCase(m[3].trim());const pop=+m[1]*(m[2]==="million"?1e6:1e3);
    let sig="";(cur&&cur.cities||[]).forEach(cc=>{const a=cc[0].toLowerCase();if(a.includes(name.toLowerCase())||name.toLowerCase().includes(a.split(" ")[0]))sig=cc[1]});out.push({name,pop,cap:!!m[4],sig})}
  return out}
const yr=txt=>{const m=String(txt||"").match(/\((\d{4})/);return m?m[1]:""};
/* ---------- live enrichment (works on the deployed site; blocked inside the Claude artifact sandbox) ---------- */
const LIVE={ok:null,wd:{},wx:{},fx:null};
function tfetch(u,ms,opt){const c=new AbortController();const tm=setTimeout(()=>c.abort(),ms||7000);return fetch(u,Object.assign({signal:c.signal},opt||{})).finally(()=>clearTimeout(tm))}
async function liveOK(){if(LIVE.ok!==null)return LIVE.ok;try{const r=await tfetch("https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&current=temperature_2m",5000);LIVE.ok=r.ok}catch(e){LIVE.ok=false}return LIVE.ok}
const fp=u=>u?String(u).replace(/^http:/,"https:"):u;
async function liveWD(k){const key=k+"|"+S.lang;if(LIVE.wd[key])return LIVE.wd[key];
  const q=`SELECT ?role ?pLabel ?st ?anthemLabel ?audio ?coa WHERE { ?c wdt:P298 "${k}". { ?c p:P35 ?s. BIND("hos" AS ?role) } UNION { ?c p:P6 ?s. BIND("hog" AS ?role) } UNION { ?c wdt:P85 ?anthem. OPTIONAL{?anthem wdt:P51 ?audio} BIND("anthem" AS ?role) } UNION { ?c wdt:P94 ?coa. BIND("coa" AS ?role) }
    OPTIONAL{ ?s ps:P35|ps:P6 ?p. ?s wikibase:rank ?rk. FILTER(?rk != wikibase:DeprecatedRank) FILTER NOT EXISTS{ ?s pq:P582 [] } OPTIONAL{ ?s pq:P580 ?st } }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${S.lang},en". } }`;
  const r=await tfetch("https://query.wikidata.org/sparql?format=json&query="+encodeURIComponent(q),9000,{headers:{Accept:"application/sparql-results+json"}});if(!r.ok)throw new Error("wd");const j=await r.json();
  const out={hos:[],hog:[],anthem:null,audio:null,coa:null};
  j.results.bindings.forEach(b=>{const role=b.role.value;if((role==="hos"||role==="hog")&&b.pLabel){const v=b.pLabel.value+(b.st?` (${t("since")} ${b.st.value.slice(0,10)})`:"");if(!out[role].includes(v))out[role].push(v)}
    if(role==="anthem"){out.anthem=b.anthemLabel&&b.anthemLabel.value;if(b.audio)out.audio=fp(b.audio.value)}if(role==="coa"&&b.coa)out.coa=fp(b.coa.value)});
  LIVE.wd[key]=out;return out}
async function liveWX(ll){const key=ll.join(",");if(LIVE.wx[key])return LIVE.wx[key];
  const r=await tfetch(`https://api.open-meteo.com/v1/forecast?latitude=${ll[0]}&longitude=${ll[1]}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);if(!r.ok)throw new Error("wx");return LIVE.wx[key]=await r.json()}
async function liveFX(){if(LIVE.fx)return LIVE.fx;const r=await tfetch("https://open.er-api.com/v6/latest/USD");if(!r.ok)throw new Error("fx");return LIVE.fx=await r.json()}
const WMO={en:["Clear","Partly cloudy","Fog","Drizzle","Rain","Snow","Showers","Thunderstorm"],hi:["साफ़","आंशिक बादल","कोहरा","बूंदाबांदी","बारिश","बर्फ़बारी","बौछारें","आंधी-तूफ़ान"],mr:["निरभ्र","अंशतः ढगाळ","धुके","रिमझिम","पाऊस","हिमवर्षाव","सरी","वादळी पाऊस"]};
const wmoI=c=>c===0?0:c<=3?1:c<=48?2:c<=57?3:c<=67?4:c<=77?5:c<=86?6:7;const WICON=["☀️","⛅","🌫️","🌦️","🌧️","❄️","🌦️","⛈️"];
const liveBadge=()=>`<span class="badge ok">${esc(t("live"))}</span>`;
async function fillLive(k,tab){if(!(await liveOK())){const n=document.getElementById("live-note");if(n)n.hidden=false;return}
  const same=()=>S.sel===k&&S.tab===tab;const c=C[k];
  try{if(tab==="government"||tab==="overview"){const w=await liveWD(k);if(!same())return;
    const g=document.getElementById("live-gov");if(g&&(w.hos.length||w.hog.length))g.innerHTML=sec(t("liveLeaders"),kv([w.hos.length?["Head of state",w.hos.join("; ")]:null,w.hog.length?["Head of government",w.hog.join("; ")]:null].filter(Boolean),{raw:true})+`<div class="note">Wikidata · <a href="https://www.wikidata.org/w/index.php?search=${encodeURIComponent(c.n)}" target="_blank" rel="noopener">wikidata.org</a></div>`,liveBadge());
    const m=document.getElementById("live-media");if(m&&(w.coa||w.audio))m.innerHTML=sec(t("emblem")+(w.audio?" · "+t("anthemAudio"):""),`<div class="media">${w.coa?`<img class="coa" alt="${esc(t("emblem"))}" src="${esc(w.coa)}?width=240" loading="lazy">`:""}${w.audio?`<div class="aud"><b>${esc(w.anthem||"")}</b><audio controls preload="none" src="${esc(w.audio)}"></audio></div>`:""}</div><div class="note">Wikimedia Commons</div>`,liveBadge())}}catch(e){}
  try{if(tab==="overview"&&c.cur&&c.cur[0]){const fx=await liveFX();if(!same())return;const code=c.cur[0][0],R=fx.rates||{};const el=document.getElementById("live-fx");
    if(el&&R[code]&&R.INR){const inr=R.INR/R[code];el.innerHTML=sec(t("fx"),`<div class="metric-grid">${code!=="INR"?`<div class="mg"><div class="k">1 ${esc(code)}</div><div class="v">₹${inr>=100?nf(inr,0):inr.toFixed(inr<1?4:2)}</div></div>`:""}<div class="mg"><div class="k">1 USD</div><div class="v">${nf(R[code],R[code]<10?3:1)} ${esc(code)}</div></div></div><div class="note">open.er-api.com · ${esc((fx.time_last_update_utc||"").slice(0,16))}</div>`,liveBadge())}}}catch(e){}
  try{if(tab==="geography"&&(c.capll||c.ll)){const ll=c.capll||c.ll;const w=await liveWX(ll);if(!same())return;const el=document.getElementById("live-wx");if(!el||!w.current)return;const cu=w.current,d=w.daily;const L=WMO[S.lang];
    el.innerHTML=sec(t("weather")+" · "+((c.cap||[])[0]||""),`<div class="wx"><div class="wx-now"><span class="wx-i">${WICON[wmoI(cu.weather_code)]}</span><b class="mono">${Math.round(cu.temperature_2m)}°C</b><span>${esc(L[wmoI(cu.weather_code)])} · ${Math.round(cu.relative_humidity_2m)}% RH · ${Math.round(cu.wind_speed_10m)} km/h</span></div><div class="wx-days">${d.time.map((x,i)=>`<div><small>${esc(new Date(x+"T12:00").toLocaleDateString(loc(),{weekday:"short"}))}</small><span>${WICON[wmoI(d.weather_code[i])]}</span><b class="mono">${Math.round(d.temperature_2m_max[i])}°</b><small class="mono">${Math.round(d.temperature_2m_min[i])}°</small></div>`).join("")}</div></div><div class="note">Open-Meteo · ${esc(w.timezone||"")}</div>`,liveBadge())}}catch(e){}}

function renderTab(){const R=CUR_REC,k=R.k,c=R.base,cur=R.cur,el=$("#dbody");let h="";
  const curd=cur&&cur.identity;
  switch(S.tab){
  case"overview":{
    const rows=[[t("official"),c.o],[t("native"),c.nv],[t("capital"),(c.cap||[]).join(", ")||"—"],[t("region"),(RG[S.lang][c.r]||c.r)+(c.sr?" · "+c.sr:"")],[t("iso"),`${c.a2} · ${k} · ${c.n3||"—"}`],[t("tld"),(c.tld||[]).join(" ")||"—"],[t("calling"),(c.cc||[]).join(", ")||"—"],[t("tz"),(c.tz||[]).map(z=>"UTC"+z).join(", ")||"—"],[t("currency"),(c.cur||[]).map(x=>`${x[1]} (${x[0]}${x[2]?", "+x[2]:""})`).join("; ")||"—"],[t("languages"),(c.lang||[]).join(", ")||"—"],[t("un"),c.un?t("yes"):t("no")]];
    h+=sec(t("keyFacts"),kv(rows,{raw:true}));
    if(curd)h+=sec(tt("overview")+" · "+t("verified"),kv(Object.entries(curd),{raw:true}),curBadge());
    const ov=fbRows(R,"overview",["Background"]);if(ov.length){h+=sec("Factbook",kv(ov),fbBadge());
      const an=fbGet(R,"overview","National anthem(s)");if(an)h+=`<div><a class="act" target="_blank" rel="noopener" href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent("National anthem of "+c.n)}">♪ ${esc(t("anthemLink"))}</a></div>`}
    h+=`<div id="live-fx"></div><div id="live-media"></div><div id="live-note" class="note" hidden>${esc(t("liveNote"))}</div>`;
    break}
  case"geography":{const rk=rankOf(k,"area");
    h+=`<div class="metric-grid"><div class="mg"><div class="k">${esc(t("area"))}</div><div class="v">${esc(fArea(c.ar))}</div>${c.ar?`<div class="note">${nf(c.ar*0.386102)} sq mi${rk?` · ${esc(t("rank"))} #${rk[0]} ${esc(t("of"))} ${rk[1]}`:""}</div>`:""}</div><div class="mg"><div class="k">${esc(t("landlocked"))}</div><div class="v txt">${c.ll_?t("yes"):t("no")}</div></div></div>`;
    if(bordersOf(k).length)h+=sec(t("borders"),`<div class="chips">${bordersOf(k).map(b=>`<button class="chip" data-open="${b}">${esc(flagEmoji(b))} ${esc(nameOf(b))}</button>`).join("")}</div>`);
    h+=`<div id="live-wx"></div>`;
    h+=sec("Factbook",kv(fbRows(R,"geography")),fbBadge());break}
  case"people":{const rk=rankOf(k,"population");
    h+=`<div class="metric-grid"><div class="mg"><div class="k">${esc(t("population"))}</div><div class="v">${esc(fPop(c.pop&&c.pop[0]))}</div><div class="note">${c.pop?esc(fPopAlt(c.pop[0])||nf(c.pop[0]))+" · "+esc(t("wb"))+" "+c.pop[1]:""}${rk?` · #${rk[0]} ${esc(t("of"))} ${rk[1]}`:""}</div></div><div class="mg"><div class="k">${esc(t("density"))}</div><div class="v">${c.pop&&c.ar?nf(c.pop[0]/c.ar,0):"—"}</div><div class="note">${esc(t("perKm"))}</div></div></div>`;
    h+=sec(t("popTrend"),lineChart(c.pt,shortNum,t("popTrend")),`<span class="badge">${esc(t("wb"))}</span>`);
    const lg=pctBars(fbGet(R,"people","Languages")),rl=pctBars(fbGet(R,"people","Religions")),et=pctBars(fbGet(R,"people","Ethnic groups"));
    h+=sec(t("languages"),lg);h+=sec(t("religions"),rl);h+=sec(t("ethnic"),et);
    h+=sec(t("pyramid"),pyramid(fbGet(R,"people","Age structure")),fbBadge());
    const cf=citiesFrom(fbGet(R,"people","Major urban areas - population"),cur);
    if(cur&&cur.cities)h+=sec(t("cities"),`<div class="cities">${cur.cities.map(x=>{const m=cf.find(z=>x[0].toLowerCase().includes(z.name.toLowerCase())||z.name.toLowerCase().includes(x[0].toLowerCase().split(" ")[0]));return `<div class="city"><b>${esc(x[0])}</b>${m?`<span class="mono">${esc(shortNum(m.pop))}</span> `:""}<span>${esc(x[1])}</span></div>`}).join("")}</div>`,curBadge());
    else if(cf.length)h+=sec(t("cities"),`<div class="cities">${cf.map(x=>`<div class="city"><b>${esc(x.name)}${x.cap?" ★":""}</b><span class="mono">${esc(shortNum(x.pop))}</span>${x.cap?` <span>${esc(t("capital"))}</span>`:""}</div>`).join("")}</div><div class="note">${esc(FLD("Major urban areas - population"))} · ${esc(yr(fbGet(R,"people","Major urban areas - population")))}</div>`,fbBadge());
    h+=sec("Factbook",kv(fbRows(R,"people",HEALTH_F.concat(["Major urban areas - population"]))),fbBadge());break}
  case"health":{const le=fbGet(R,"people","Life expectancy at birth"),li=fbGet(R,"people","Literacy");
    h+=`<div class="metric-grid"><div class="mg"><div class="k">${esc(t("hdi"))}</div><div class="v">${c.hdi?c.hdi[0].toFixed(3):"—"}</div><div class="note">${c.hdi?`#${c.hdi[1]} ${esc(t("of"))} 193 · `:""}${esc(t("hdiSrc"))}</div></div><div class="mg"><div class="k">${esc(FLD("Life expectancy at birth"))}</div><div class="v">${esc(firstNum(le,/total population:\s*([\d.]+)/)||firstNum(le)||"—")}</div><div class="note">${esc(yr(le))}</div></div><div class="mg"><div class="k">${esc(FLD("Literacy"))}</div><div class="v">${esc((firstNum(li,/total population:\s*([\d.]+)/)||"—")+(li?"%":""))}</div><div class="note">${esc(yr(li))}</div></div><div class="mg"><div class="k">${esc(FLD("Infant mortality rate"))}</div><div class="v">${esc(firstNum(fbGet(R,"people","Infant mortality rate"),/total:\s*([\d.]+)/)||"—")}</div><div class="note">/1,000</div></div></div>`;
    const rows=(R.fb.people||[]).filter(r=>HEALTH_F.includes(r[0]));h+=sec("Factbook",kv(rows),fbBadge())||`<div class="empty">${esc(t("notAvail"))}</div>`;break}
  case"government":{
    if(cur&&cur.gov)h+=sec(t("leadership"),kv(Object.entries(cur.gov),{raw:true})+(k==="BRA"?`<div class="note">${esc(t("source"))}: <a href="https://en.mercopress.com/2026/10/05/flavio-bolsonaro-edges-lula-in-the-first-round-both-head-to-an-october-25-runoff/comments" target="_blank" rel="noopener">MercoPress, 5 Oct 2026</a> (Superior Electoral Court count)</div>`:k==="JPN"?`<div class="note">${esc(t("source"))}: <a href="https://en.wikipedia.org/wiki/2026_Japanese_general_election" target="_blank" rel="noopener">2026 Japanese general election</a> · <a href="https://www.nippon.com/en/japan-data/h02906/takaichi-opts-for-stability-in-first-cabinet-reshuffle.html" target="_blank" rel="noopener">Nippon.com, Sep 2026</a></div>`:""),curBadge());
    else if(LEAD[k])h+=sec(t("verifiedLeaders"),kv(Object.entries(LEAD[k].rows),{raw:true})+`<div class="note">${esc(t("source"))}: ${LEAD[k].src.map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(" · ")}</div>`,curBadge());
    else h+=`<div class="lensbox">${esc(t("fbNote"))}</div>`;
    if(!(cur&&cur.gov))h+=`<div id="live-gov"></div>`;
    const ad=fbGet(R,"government","Administrative divisions");if(ad){const head=ad.split(/;/)[0];if(head.length<120)h+=`<div class="mg"><div class="k">${esc(t("divisions"))}</div><div class="v txt">${esc(head.replace(/\*/g,""))}</div></div>`}
    h+=sec("Factbook",kv(fbRows(R,"government")),fbBadge());break}
  case"economy":{const rk=rankOf(k,"gdp");
    h+=`<div class="metric-grid"><div class="mg"><div class="k">${esc(t("gdp"))}</div><div class="v">${esc(fUsd(c.gdp&&c.gdp[0]))}</div><div class="note">${esc(gdpSrc(c))}${rk?` · #${rk[0]} ${esc(t("of"))} ${rk[1]}`:""}</div></div><div class="mg"><div class="k">${esc(t("gdppc"))}</div><div class="v">${c.pc?"$"+nf(c.pc[0]):"—"}</div><div class="note">${esc(pcSrc(c))}</div></div><div class="mg"><div class="k">${esc(t("hdi"))}</div><div class="v">${c.hdi?c.hdi[0].toFixed(3):"—"}</div><div class="note">${c.hdi?`#${c.hdi[1]} ${esc(t("of"))} 193 · UNDP 2025`:esc(t("notAvail"))}</div></div><div class="mg"><div class="k">${esc(t("gini"))}</div><div class="v">${c.gini?c.gini[0].toFixed(1):"—"}</div><div class="note">${c.gini?"Factbook "+c.gini[1]:esc(t("notAvail"))}</div></div></div>`;
    h+=sec(t("gdpTrend"),lineChart(c.gt,v=>v>=1000?(v/1000).toFixed(1)+"T":Math.round(v)+"B",t("gdpTrend")),`<span class="badge">${esc(t("wb"))}</span>`);
    h+=sec("Factbook",kv(fbRows(R,"economy")),fbBadge());break}
  case"foreign":{const mem=memberOf(k);
    if(mem.length)h+=sec(t("memberships"),`<div class="chips">${mem.map(g=>`<button class="chip lensc" data-hl="${g}" aria-pressed="${S.group===g}" title="${esc(GROUPS[g].f)}">${esc(GROUPS[g].n[S.lang])}</button>`).join("")}</div>`);
    h+=sec("Factbook",kv(fbRows(R,"foreign")),fbBadge());break}
  case"culture":{
    if(cur&&cur.culture){h+=sec(tt("culture"),kv(Object.entries(cur.culture),{raw:true}),curBadge());if(cur.tourism)h+=sec(t("attractions"),`<div class="chips">${cur.tourism.map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div>`)}
    else h+=`<div class="empty"><b>${esc(t("notCurated"))}</b>${esc(t("notCuratedBody"))}</div>`;
    const sym=fbGet(R,"overview","National symbol(s)"),her=fbGet(R,"overview","National heritage");if(sym||her)h+=sec("Factbook",kv([sym?["National symbol(s)",sym]:null,her?["National heritage",her]:null].filter(Boolean)),fbBadge());break}
  case"history":{
    if(cur&&cur.history)h+=sec(t("timeline"),`<ol class="tl">${cur.history.map(x=>`<li><div class="yr">${esc(x[0])}</div><div>${esc(x[1])}</div></li>`).join("")}</ol>`,curBadge());
    const bg=fbGet(R,"overview","Background");if(bg)h+=sec(t("background"),`<div class="prose">${esc(bg)}</div>`,fbBadge());
    const ind=fbGet(R,"overview","Independence");if(ind)h+=kv([["Independence",ind]]);
    if(!bg&&!(cur&&cur.history))h+=`<div class="empty">${esc(t("notAvail"))}</div>`;break}
  case"infra":h+=sec("Factbook",kv(fbRows(R,"infra")),fbBadge())||`<div class="empty">${esc(t("notAvail"))}</div>`;break;
  case"india":h+=indiaLens(R);break;
  case"facts":{const f=cur&&cur.facts;const gn=fbGet(R,"geography","Geography - note");
    if(f)h+=sec(tt("facts"),`<ul class="prose" style="margin:0;padding-left:18px;white-space:normal">${f.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`,curBadge());
    if(gn)h+=sec("Factbook",`<div class="prose">${esc(gn)}</div>`,fbBadge());
    if(!f&&!gn)h+=`<div class="empty">${esc(t("factsEmpty"))}</div>`;break}}
  if(S.lang!=="en"&&!["india"].includes(S.tab))h=`<div class="note">${esc(t("langNote"))}</div>`+h;
  h+=`<div class="foot">${esc(t("dataNote"))}</div>`;
  el.innerHTML=h;el.scrollTop=0;fillLive(k,S.tab);
  el.querySelectorAll("[data-more]").forEach(b=>b.onclick=()=>{const d=b.previousElementSibling;const open=d.classList.toggle("clamp");b.textContent=open?t("more"):t("less")})}

function indiaLens(R){const k=R.k,c=R.base;let h=`<div class="lensbox"><b>${esc(t("analytical"))}.</b> ${esc(t("matrixNote"))}</div>`;
  if(k==="IND"){h+=`<div class="note">${esc(t("self"))}</div>`;
    h+=sec(t("indiaGroups"),`<div class="chips">${sharedGroups("IND").map(g=>`<button class="chip lensc" data-hl="${g}" aria-pressed="${S.group===g}" title="${esc(GROUPS[g].f)}">${esc(GROUPS[g].n[S.lang])} <span class="x">${GROUPS[g].m.length}</span></button>`).join("")}</div>`);
    h+=sec(t("neighbours"),`<div class="chips">${bordersOf("IND").map(b=>`<button class="chip" data-open="${b}">${esc(flagEmoji(b))} ${esc(nameOf(b))}</button>`).join("")}</div>`);
    h+=sec(t("corridors"),["imec","instc"].map(x=>`<div><b style="font-weight:600">${esc(CORR[x].n[S.lang])}</b><div class="note">${esc(CORR[x].t)}</div></div>`).join(""));
    return h}
  const g=sharedGroups(k);const cen=c.ll?[c.ll[1],c.ll[0]]:d3.geoCentroid(byId[k]);const d=distKm(DELHI,cen);
  let near=null;CHOKE.forEach(ch=>{const dd=distKm(ch.ll,cen);if(!near||dd<near[1])near=[ch,dd]});
  const ior=GROUPS.IORA.m.includes(k),bord=bordersOf(k).includes("IND");
  h+=`<div class="metric-grid"><div class="mg"><div class="k">${esc(t("sharedGroups"))}</div><div class="v">${g.length}</div></div><div class="mg"><div class="k">${esc(t("distance"))}</div><div class="v">${nf(d)} ${esc(t("km"))}</div><div class="note">${esc(t("distNote"))}</div></div><div class="mg"><div class="k">${esc(t("border"))}</div><div class="v txt">${bord?t("yes"):t("no")}</div></div><div class="mg"><div class="k">${esc(t("ior"))}</div><div class="v txt">${ior?t("yes"):t("no")}</div></div></div>`;
  if(g.length)h+=sec(t("sharedGroups"),`<div class="chips">${g.map(x=>`<button class="chip lensc" data-hl="${x}" aria-pressed="${S.group===x}" title="${esc(GROUPS[x].f)}">${esc(GROUPS[x].n[S.lang])}</button>`).join("")}</div>`);
  if(near&&near[1]<2500)h+=sec(t("nearChoke"),`<div class="list"><button data-choke="${near[0].id}"><i class="dot"></i><span>${esc(near[0].n[S.lang])} · <span class="mono">${nf(near[1])} ${esc(t("km"))}</span><small>${esc(near[0].t)}</small></span></button></div>`);
  const cur=R.cur&&R.cur.india;if(cur)h+=sec(t("relNotes"),kv(Object.entries(cur),{raw:true}),curBadge());
  h+=sec(t("feed"),`<div class="empty">${esc(t("feedBody"))}</div>`);
  return h}

/* ---------- compare ---------- */
function toggleCmp(k){if(S.cmp.includes(k))S.cmp=S.cmp.filter(x=>x!==k);else{S.cmp=[...S.cmp,k].slice(-2)}renderTray();if(S.ptab==="library")renderPanel()}
function renderTray(){const tr=$("#tray");if(!S.cmp.length){tr.hidden=true;return}tr.hidden=false;
  tr.innerHTML=`<span class="lbl">${esc(t("compare"))}</span>${S.cmp.map(k=>`<button class="chip" data-uncmp="${k}">${esc(flagEmoji(k))} ${esc(nameOf(k))} <span class="x">×</span></button>`).join("")}<button class="primary" id="cmpGo" ${S.cmp.length<2?"disabled":""}>${esc(t("openCompare"))}</button>`;
  tr.querySelectorAll("[data-uncmp]").forEach(b=>b.onclick=()=>{toggleCmp(b.dataset.uncmp);const a=$("#aCmp");if(a&&S.sel===b.dataset.uncmp){a.setAttribute("aria-pressed","false");a.lastChild.textContent=t("addCompare")}});
  $("#cmpGo").onclick=openCompare}
async function openCompare(){const [a,b]=S.cmp;const md=$("#modal");md.hidden=false;md.innerHTML=`<div class="mcard"><div class="skel"></div></div>`;
  let fa={},fb={};try{const [sa,sb]=await Promise.all([shard(a),shard(b)]);fa=(sa[a]||{}).fb||{};fb=(sb[b]||{}).fb||{}}catch(e){}
  const ca=C[a],cb=C[b];const row=(lbl,va,vb,na,nb)=>{const mx=Math.max(na||0,nb||0);const bar=n=>n!=null&&mx>0?`<div class="cbar" style="width:${Math.max(2,n/mx*100).toFixed(1)}%"></div>`:"";return `<tr><th>${esc(lbl)}</th><td><span class="mono">${esc(va)}</span>${bar(na)}</td><td><span class="mono">${esc(vb)}</span>${bar(nb)}</td></tr>`};
  const g=(fbx,tab,l)=>{const r=(fbx[tab]||[]).find(x=>x[0]===l);if(!r)return "—";const s=r[1].split("\n")[0];return s.length>140?s.slice(0,140)+"…":s};
  const rows=[row(t("capital"),(ca.cap||[]).join(", "),(cb.cap||[]).join(", ")),row(t("region"),RG[S.lang][ca.r]||ca.r,RG[S.lang][cb.r]||cb.r),
    row(t("population"),fPop(ca.pop&&ca.pop[0]),fPop(cb.pop&&cb.pop[0]),metric(a,"population"),metric(b,"population")),
    row(t("area"),fArea(ca.ar),fArea(cb.ar),ca.ar,cb.ar),row(t("density"),fCompact(metric(a,"density"),"density"),fCompact(metric(b,"density"),"density"),metric(a,"density"),metric(b,"density")),
    row(t("gdp"),fUsd(ca.gdp&&ca.gdp[0]),fUsd(cb.gdp&&cb.gdp[0]),metric(a,"gdp"),metric(b,"gdp")),row(t("gdppc"),ca.pc?"$"+nf(ca.pc[0]):"—",cb.pc?"$"+nf(cb.pc[0]):"—",metric(a,"gdppc"),metric(b,"gdppc")),
    row(t("hdi"),ca.hdi?`${ca.hdi[0].toFixed(3)} (#${ca.hdi[1]})`:"—",cb.hdi?`${cb.hdi[0].toFixed(3)} (#${cb.hdi[1]})`:"—",metric(a,"hdi"),metric(b,"hdi")),row(t("gini"),ca.gini?ca.gini[0].toFixed(1):"—",cb.gini?cb.gini[0].toFixed(1):"—",metric(a,"gini"),metric(b,"gini")),
    row(FLD("Government type"),g(fa,"government","Government type"),g(fb,"government","Government type")),row(FLD("Life expectancy at birth"),g(fa,"people","Life expectancy at birth"),g(fb,"people","Life expectancy at birth")),
    row(FLD("Literacy"),g(fa,"people","Literacy"),g(fb,"people","Literacy")),row(FLD("Internet users"),g(fa,"infra","Internet users"),g(fb,"infra","Internet users")),
    row(FLD("Military expenditures"),g(fa,"foreign","Military expenditures"),g(fb,"foreign","Military expenditures")),
    row(t("currency"),(ca.cur||[]).map(x=>x[0]).join(", "),(cb.cur||[]).map(x=>x[0]).join(", ")),row(t("tz"),(ca.tz||[]).map(z=>"UTC"+z).join(", "),(cb.tz||[]).map(z=>"UTC"+z).join(", ")),
    row(t("shared"),a==="IND"?t("india"):sharedGroups(a).join(", ")||"—",b==="IND"?t("india"):sharedGroups(b).join(", ")||"—")];
  md.innerHTML=`<div class="mcard" role="dialog" aria-modal="true" aria-label="${esc(t("compare"))}"><button class="icon-btn closeX" id="mClose" aria-label="${esc(t("close"))}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button><h2>${esc(t("compare"))}</h2><div class="cwrap"><table class="ctab"><thead><tr><th></th><th>${esc(flagEmoji(a))} ${esc(nameOf(a))}</th><th>${esc(flagEmoji(b))} ${esc(nameOf(b))}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div><div class="foot" style="margin-top:12px">${esc(t("dataNote"))}</div></div>`;
  $("#mClose").onclick=()=>{md.hidden=true};md.onclick=e=>{if(e.target===md)md.hidden=true}}

/* ---------- global events ---------- */
function applyLang(){document.documentElement.lang=S.lang;$("#tagline").textContent=t("tag");$("#q").placeholder=t("search");$("#hint").textContent=t("clickHint");
  document.querySelectorAll(".seg [data-lang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lang===S.lang));
  renderPanel();legend();renderTray();if(S.sel){const k=S.sel;if(CUR_REC&&CUR_REC.k===k){$("#drawer").innerHTML=heroHTML(k,CUR_REC)+tabsHTML()+`<div class="dbody" id="dbody"></div>`;wireDrawer(k);renderTab()}else openCountry(k)}}
function setTheme(next){const root=document.documentElement;root.setAttribute("data-theme",next);store.set("theme",next);setTimeout(()=>{buildColor();paint()},30)}
document.addEventListener("click",e=>{const el=e.target.closest("[data-color],[data-proj],[data-ed],[data-group],[data-open],[data-choke],[data-hl],[data-sort],.ptabs [data-p]");if(!el)return;
  if(el.dataset.p){S.ptab=el.dataset.p;if(S.ptab==="lens"&&S.color==="region"){S.color="shared";store.set("color",S.color);buildColor();paint()}renderPanel();return}
  if(el.dataset.color){S.color=el.dataset.color;store.set("color",S.color);buildColor();paint();renderPanel();return}
  if(el.dataset.proj){if(S.proj!==el.dataset.proj){S.proj=el.dataset.proj;setupProjection();attachInteraction();render();if(S.sel)flyTo(S.sel)}renderPanel();return}
  if(el.dataset.ed){if(S.edition!==el.dataset.ed)setEdition(el.dataset.ed);return}
  if(el.dataset.group!==undefined&&el.closest("#panel")){S.group=el.dataset.group||null;paint();renderPanel();return}
  if(el.dataset.hl){S.group=S.group===el.dataset.hl?null:el.dataset.hl;paint();renderPanel();renderTab();return}
  if(el.dataset.sort){const f=el.dataset.sort;S.mxSort=S.mxSort[0]===f?[f,-S.mxSort[1]]:[f,f==="n"?1:-1];renderPanel();return}
  if(el.dataset.choke){const c=CHOKE.find(x=>x.id===el.dataset.choke);if(!S.layers.choke){S.layers.choke=true;store.set("layers",S.layers);drawOverlays();renderPanel()}
    if(S.proj==="flat"){const xy=proj(c.ll);{const v=viewCentre();svg.transition().duration(RM?0:900).call(zoom.transform,d3.zoomIdentity.translate(v.ox,v.oy).scale(5).translate(-xy[0],-xy[1]))}}
    else{const ip=d3.interpolate(proj.rotate(),[-c.ll[0],-c.ll[1],0]);d3.transition().duration(RM?0:900).tween("r",()=>x=>{proj.rotate(ip(x));drawAll()})}return}
  if(el.dataset.open){openCountry(el.dataset.open);if(innerWidth<=820)$("#panel").dataset.open="false";return}});
document.addEventListener("change",e=>{const l=e.target.dataset&&e.target.dataset.layer;if(l){S.layers[l]=e.target.checked;store.set("layers",S.layers);drawOverlays()}});
document.querySelectorAll(".seg [data-lang]").forEach(b=>b.onclick=()=>{S.lang=b.dataset.lang;store.set("lang",S.lang);applyLang()});
$("#themeBtn").onclick=()=>{const cur=document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");setTheme(cur==="dark"?"light":"dark")};
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{buildColor();paint()})}catch(e){}
$("#zIn").onclick=()=>zoomBy(1.6);$("#zOut").onclick=()=>zoomBy(1/1.6);$("#zReset").onclick=resetView;
$("#panelBtn").onclick=()=>{const p=$("#panel");p.dataset.open=p.dataset.open==="false"?"true":"false"};
const q=$("#q");q.addEventListener("input",doSearch);q.addEventListener("focus",doSearch);
q.addEventListener("keydown",e=>{const ul=$("#qres");if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!qItems.length)return;qSel=(qSel+(e.key==="ArrowDown"?1:-1)+qItems.length)%qItems.length;ul.querySelectorAll("li").forEach((li,i)=>li.setAttribute("aria-selected",i===qSel))}
  else if(e.key==="Enter"&&qSel>=0)pickSearch(qItems[qSel]);else if(e.key==="Escape"){ul.hidden=true;q.blur()}});
$("#qres").addEventListener("mousedown",e=>{const li=e.target.closest("li[data-k]");if(li){e.preventDefault();pickSearch(li.dataset.k)}});
q.addEventListener("blur",()=>setTimeout(()=>{$("#qres").hidden=true},120));
document.addEventListener("keydown",e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(e.key==="/"&&!typing){e.preventDefault();q.focus()}else if(e.key==="Escape"&&!typing){if(!$("#modal").hidden)$("#modal").hidden=true;else if(S.sel)closeDrawer()}
  else if(!typing&&(e.key==="+"||e.key==="="))zoomBy(1.6);else if(!typing&&e.key==="-")zoomBy(1/1.6)});
let rs;addEventListener("resize",()=>{clearTimeout(rs);rs=setTimeout(()=>{const keep=S._rot;setupProjection();if(keep&&S.proj==="globe")proj.rotate(keep);attachInteraction();render()},150)});
addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(!h)return;const [k,tb]=h.split(".");if(k&&k!==S.sel&&(C[k]||byId[k]))openCountry(k,tb)});

/* ---------- boot ---------- */
async function boot(){if(innerWidth<=820)$("#panel").dataset.open="false";const th=store.get("theme",null);if(th)document.documentElement.setAttribute("data-theme",th);
  try{const [c,cur]=await Promise.all([getJSON(BASE+"countries.json"),getJSON(BASE+"curated.json")]);C=c;CUR=cur;LEAD=await getJSON(BASE+"leaders.json").catch(()=>({}));
    feats=await loadGeo(S.edition);byId=Object.fromEntries(feats.map(f=>[f.id,f]))}
  catch(e){$("#loadMsg").innerHTML=esc(I[S.lang].loadErr)+` <button class="morebtn" onclick="location.reload()">${esc(I[S.lang].retry)}</button>`;return}
  buildIndex();buildColor();setupProjection();attachInteraction();render();applyLang();
  $("#loader").hidden=true;
  const h=location.hash.slice(1);if(h){const [k,tb]=h.split(".");if(C[k]||byId[k])openCountry(k,tb)}}
boot();
})();
