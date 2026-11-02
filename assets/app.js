const DATA=(()=>{try{const l=localStorage.getItem("raporData");if(l)return JSON.parse(l)}catch(e){}return window.RAPOR_DATA||{files:[]}})();
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let files=DATA.files,active=DATA.active,merges=DATA.merges||[],daily=DATA.daily||null,track=Object.assign({},DATA.track||{},(()=>{try{return JSON.parse(localStorage.getItem('trk')||'{}')}catch(e){return{}}})()),cur=null,confirmId=null,art=null;
const exportData=()=>"window.RAPOR_DATA="+JSON.stringify({files,active,track,merges,daily}).replace(/</g,"\\u003c")+";\n";
const save=()=>{try{localStorage.setItem("raporData",JSON.stringify({files,active,track,merges,daily}));$('#msg').textContent='✔ Tersimpan di browser ini. Klik "Unduh data.js" lalu unggah ke folder data/ di repositori agar berlaku untuk semua santri.'}catch(e){$('#msg').textContent='Gagal menyimpan di browser: '+(e&&e.message||e)}};
function unduhData(){const b=new Blob([exportData()],{type:'text/javascript'}),u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download='data.js';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
/* ===== MODE GABUNGAN: gabungkan beberapa file bulanan menjadi satu periode ===== */
const MGM={JAN:1,FEB:2,MAR:3,APR:4,MEI:5,MAY:5,JUN:6,JUL:7,AGU:8,AGT:8,AUG:8,SEP:9,SEPT:9,OKT:10,OCT:10,NOV:11,NOP:11,DES:12,DEC:12,JANUARI:1,FEBRUARI:2,MARET:3,JUNI:6,JULI:7,AGUSTUS:8,SEPTEMBER:9,OKTOBER:10,NOVEMBER:11,DESEMBER:12},MGA=['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];
const MGC=new Map(),MG={on:false,sel:new Set(),cap:'last',name:'',ed:null};let mgVer=0,mgConf=null;
const mgFind=id=>merges.find(m=>m.id===id),mgKey=r=>String(r.nama).trim().toLowerCase().replace(/\s+/g,' '),mgR2=x=>Math.round((+x||0)*100)/100;
const KUM=DATA.kum!==false;
const mgPred=v=>v>=90?'SANGAT BAIK':v>=80?'BAIK':v>=70?'CUKUP':v>=60?'KURANG':'SANGAT KURANG';
function mgPer(f){const re=/([A-Za-z]{3,9})\.?\s*[-\/]?\s*(\d{4})/g;let m;while((m=re.exec(String(f.name)))){const mo=MGM[m[1].toUpperCase()];if(mo)return{mo,y:+m[2],k:+m[2]*12+mo}}return null}
function mgParts(ids){const p=ids.map(id=>files.find(f=>f.id===id)).filter(Boolean),ks=p.map(mgPer);
 if(ks.every(Boolean)){return p.map((f,i)=>({f,k:ks[i].k})).sort((a,b)=>a.k-b.k).map(x=>x.f)}
 return p.sort((a,b)=>files.indexOf(a)-files.indexOf(b))}
function mgLabel(ps){const ks=ps.map(mgPer);if(!ks.every(Boolean))return ps.map(f=>String(f.name).replace(/^.*?-\s*/,'')).join(', ');
 const a=ks[0],z=ks[ks.length-1],con=ks.every((k,i)=>!i||k.k===ks[i-1].k+1),sy=a.y===z.y;
 if(con)return sy?MGA[a.mo-1]+'-'+MGA[z.mo-1]+' '+a.y:MGA[a.mo-1]+' '+a.y+' - '+MGA[z.mo-1]+' '+z.y;
 return sy?ks.map(k=>MGA[k.mo-1]).join(', ')+' '+a.y:ks.map(k=>MGA[k.mo-1]+' '+k.y).join(', ')}
function mgScore(arr,mode){if(!arr.length)return 0;
 if(mode==='sum')return Math.min(100,arr.reduce((s,x)=>s+x,0));
 if(mode==='last')return arr[arr.length-1];
 return arr.reduce((s,x)=>s+x,0)/arr.length}
function mgBuild(m){
 const c=MGC.get(m.id);if(c&&c.ver===mgVer)return c.v;
 const ps=mgParts(m.ids||[]);if(ps.length<2){MGC.set(m.id,{ver:mgVer,v:null});return null}
 const map=new Map();
 ps.forEach(f=>f.rows.forEach(r=>{const k=mgKey(r);let o=map.get(k);if(!o){o={hadir:0,izin:0,alpa:0,total:0,kw:0,caps:[],bln:0};map.set(k,o)}
  o.base=r;o.bln++;o.hadir+=r.hadir||0;o.izin+=r.izin||0;o.alpa+=r.alpa||0;o.total+=r.total||0;o.kw+=(r.nKeh||0)*(r.total||0);
  if((r.total||0)>0)o.caps.push(r.nCap||0)}));
 const rows=[...map.values()].map(o=>{const nKeh=o.total?mgR2(o.kw/o.total):0,nCap=mgR2(mgScore(o.caps,m.cap)),pct=o.total?mgR2(o.hadir/o.total*100):0;
  return Object.assign({},o.base,{hadir:o.hadir,izin:o.izin,alpa:o.alpa,total:o.total,pct,nKeh,nCap,avg:mgR2((nKeh+nCap)/2),predikat:mgPred(nKeh),kat:mgPred(pct),bln:o.bln,rank:0})});
 if(KUM){const all=mgParts(files.map(f=>f.id)),i0=all.indexOf(ps[0]),pm=new Map(),lt=new Map();if(i0>0)all[i0-1].rows.forEach(r=>pm.set(mgKey(r),r));ps.forEach(f=>f.rows.forEach(r=>lt.set(mgKey(r),r)));
  rows.forEach(r=>{const k=mgKey(r),L=lt.get(k)||r,P=pm.get(k)||{},d=x=>Math.max(0,(+L[x]||0)-(+P[x]||0));r.hadir=d('hadir');r.izin=d('izin');r.alpa=d('alpa');r.total=d('total')||r.hadir+r.izin+r.alpa;
   r.pct=r.total?mgR2(r.hadir/r.total*100):0;r.nKeh=r.total?mgR2((r.hadir+r.izin*.5)/r.total*100):0;r.nCap=mgR2(+L.nCap||0);r.avg=mgR2((r.nKeh+r.nCap)/2);r.predikat=mgPred(r.nKeh);r.kat=mgPred(r.pct);r.status=L.status||r.status})}
 rows.sort((a,b)=>(a.no||0)-(b.no||0)||String(a.nama).localeCompare(String(b.nama)));rows.forEach((r,i)=>r.no=i+1);
 rows.filter(r=>!/NON/i.test(r.status)).sort((a,b)=>b.avg-a.avg||b.nCap-a.nCap||b.pct-a.pct||String(a.nama).localeCompare(String(b.nama))).forEach((r,i)=>r.rank=i+1);
 const lab=(m.label||'').trim()||mgLabel(ps),v={id:m.id,merged:true,name:'GABUNGAN - '+lab,disp:'Gabungan '+lab+' ('+ps.length+' bulan)',rows,parts:ps.map(f=>f.name),ids:ps.map(f=>f.id),partial:rows.filter(r=>r.bln<ps.length).length};
 MGC.set(m.id,{ver:mgVer,v});return v}
function mgPrune(){mgVer++;merges=merges.map(m=>Object.assign({},m,{ids:(m.ids||[]).filter(id=>files.some(f=>f.id===id))})).filter(m=>m.ids.length>=2)}
const act=()=>{const f=files.find(f=>f.id===active);if(f)return f;const m=mgFind(active),v=m&&mgBuild(m);return v||files[0]};
MG.on=merges.some(m=>m.id===active);
const MGN={avg:'Cocok bila nilai capaian tiap bulan dinilai terhadap target bulan itu sendiri.',sum:'Cocok bila capaian bulanan adalah tambahan progres hafalan menuju target semester (dijumlahkan, maksimal 100).',last:'Cocok bila nilai capaian di file sudah bersifat kumulatif sampai bulan itu.'};
function mgDraw(){
 const box=$('#mergeBox'),lst=$('#mergeList');if(!box||!lst)return;
 const ac=act();let h='';
 if(files.length>=2||merges.length){
  h+=`<div class="mg-seg"><button data-mg="single" class="${MG.on?'':'on'}">📄 Satu Bulan</button><button data-mg="merge" class="${MG.on?'on':''}">🧩 Gabungan</button></div>`;
  h+=ac?`<p class="mg-act">Data yang sedang dipakai: <b>${esc(ac.merged?ac.disp:ac.name)}</b>${ac.merged?' <span class="chip">Gabungan</span>':''}</p>`:'';
 }
 if(MG.on){
  const sel=[...MG.sel].filter(id=>files.some(f=>f.id===id)),ps=sel.length>=2?mgParts(sel):[];
  let pv='Centang minimal 2 file bulanan di daftar bawah untuk melihat pratinjau.';
  if(ps.length>=2){const cn=new Map();ps.forEach(f=>f.rows.forEach(r=>{const k=mgKey(r);cn.set(k,(cn.get(k)||0)+1)}));let pt=0;cn.forEach(c=>{if(c<ps.length)pt++});
   pv=`Periode: <b>${esc(mgLabel(ps))}</b> · ${ps.length} bulan · ${cn.size} santri`+(pt?`<br><span style="color:var(--mid)">${pt} santri tidak ada di semua bulan; nilainya dihitung dari bulan yang tersedia.</span>`:'')}
  const op=(v,l)=>`<option value="${v}"${MG.cap===v?' selected':''}>${l}</option>`;
  h+=`<div class="mg-panel"><h4>${MG.ed?'Ubah Data Gabungan':'Buat Data Gabungan'}</h4>
   <p class="mg-n">Centang file bulanan yang ingin digabung pada daftar di bawah, misalnya September sampai Desember untuk akhir semester.</p>
   <div class="mg-r"><button class="btn g" data-mg="all">Pilih semua</button><button class="btn g" data-mg="none">Kosongkan</button><span>${sel.length} file dipilih</span></div>
   <label class="mg-l" for="mgcap">Cara menggabung Nilai Capaian Hafalan</label>
   <select class="qin" id="mgcap">${op('avg','Rata-rata antar bulan (disarankan)')}${op('sum','Akumulasi (dijumlahkan, maksimal 100)')}${op('last','Nilai bulan terakhir')}</select>
   <p class="mg-n" id="mgcapn">${MGN[MG.cap]}</p>
   <label class="mg-l" for="mgname">Nama periode (opsional)</label>
   <input class="qin" id="mgname" maxlength="60" placeholder="Otomatis, mis. SEP-DES 2026" value="${esc(MG.name)}">
   <div class="mg-pv">${pv}</div>
   <div class="mg-r"><button class="btn" data-mg="save"${sel.length<2?' disabled':''}>${MG.ed?'💾 Simpan Perubahan':'🧩 Buat &amp; Gunakan'}</button>${MG.ed?'<button class="btn g" data-mg="cancel">Batal</button>':''}</div>
   <p class="mg-n">Kehadiran (hadir, izin, alpa) dijumlahkan per santri. Nilai kehadiran dihitung ulang berbobot jumlah pertemuan, nilai akhir adalah rata-rata nilai kehadiran dan capaian, lalu predikat dan peringkat dihitung ulang. Status santri (aktif / non aktif), halaqah, dan angkatan mengikuti bulan terakhir.</p></div>`;
 }
 box.innerHTML=h;
 lst.innerHTML=merges.length?`<p class="mg-sub">DATA GABUNGAN TERSIMPAN</p>`+merges.map(m=>{const v=mgBuild(m);
  return `<div class="file ${m.id===active?'on':''}"><div class="n"><b>🧩 ${esc(v?v.name:'(file sumber tidak lengkap)')}</b><br><small>${v?v.parts.length+' bulan · '+v.rows.length+' santri'+(v.partial?' · '+v.partial+' santri tidak ada di semua bulan':''):''}</small></div>
  ${m.id===active?'<span class="chip">Aktif</span>':`<button class="btn" data-mu="${m.id}">Gunakan</button>`}<button class="btn g" data-me="${m.id}">Ubah</button><button class="btn d" data-md="${m.id}">${mgConf===m.id?'Yakin hapus?':'Hapus'}</button></div>`}).join(''):''}
function mgSave(){
 const ids=[...MG.sel].filter(id=>files.some(f=>f.id===id));
 if(ids.length<2){$('#msg').textContent='✖ Pilih minimal 2 file bulanan untuk digabung';return}
 const lab=(MG.name||'').trim().slice(0,60);let m=MG.ed&&mgFind(MG.ed);
 if(m){m.ids=ids;m.cap=MG.cap;m.label=lab}else{m={id:'mg'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),ids,cap:MG.cap,label:lab};merges.push(m)}
 mgVer++;MG.ed=null;MG.sel=new Set();MG.name='';MG.cap='last';active=m.id;
 const v=mgBuild(m);$('#msg').textContent='✔ Gabungan '+(v?v.name.replace(/^GABUNGAN - /,''):'')+' dipakai ('+(v?v.rows.length:0)+' santri, '+ids.length+' bulan)';
 save();cur=null;draw()}
function mgClick(e){const b=e.target.closest('button');if(!b)return;
 const a=b.dataset.mg,u=b.dataset.mu,ed=b.dataset.me,dl=b.dataset.md;
 if(a==='single'){MG.on=false;MG.ed=null;drawFiles();return}
 if(a==='merge'){MG.on=true;drawFiles();return}
 if(a==='all'){files.forEach(f=>MG.sel.add(f.id));drawFiles();return}
 if(a==='none'){MG.sel.clear();drawFiles();return}
 if(a==='cancel'){MG.ed=null;MG.sel=new Set();MG.name='';MG.cap='last';drawFiles();return}
 if(a==='save'){mgSave();return}
 if(u){active=u;save();cur=null;draw();return}
 if(ed){const m=mgFind(ed);if(!m)return;MG.on=true;MG.ed=ed;MG.sel=new Set(m.ids);MG.cap=m.cap||'avg';MG.name=m.label||'';drawFiles();const bx=$('#mergeBox');if(bx&&bx.scrollIntoView)bx.scrollIntoView({behavior:'smooth',block:'center'});return}
 if(dl){if(mgConf===dl){merges=merges.filter(m=>m.id!==dl);MGC.delete(dl);mgVer++;Object.keys(track).filter(k=>k.startsWith(dl+'|')).forEach(k=>delete track[k]);mgConf=null;if(active===dl)active=files[files.length-1]?.id;save();cur=null;draw()}
  else{mgConf=dl;drawFiles();setTimeout(()=>{mgConf=null;drawFiles()},4000)}}}

const K={no:'NO',nama:'NAMA',nim:'NIM',halaqah:'HALAQAH',gender:'GENDER',angkatan:'ANGKATAN',hadir:'TOAL HADIR',izin:'TOTAL IZIN',alpa:'TOTAL ALPA',total:'TOTAL PRESENSI',pct:'%KEHADIRAN',status:'STATUS',nKeh:'NILAI AKHIR KEHADIRAN',nCap:'NILAI AKHIR CAPAIAN',avg:'RATA-RATA NILAI AKHIR',predikat:'PREDIKAT',kat:'KATEGORI KEHADIRAN',rank:'PERINGKAT',last:'PRESENSI TERAKHIR',since:'NON AKTIF SEJAK'};
function parse(buf,name){
 const nm0=XLSX.read(buf,{type:'array',bookSheets:true}).SheetNames,want=['MASTER DATA','Pusat DB','DBS - MASTER','PROGRESS KETERCAPAIAN SETORAN'].filter(x=>nm0.includes(x)),wb=XLSX.read(buf,{type:'array',sheets:want.length?want:nm0[0]}),ws=wb.Sheets['MASTER DATA']||wb.Sheets[wb.SheetNames[0]],a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
 const hi=a.findIndex(r=>r.some(c=>String(c).trim().toUpperCase()==='NAMA'));
 if(hi<0)throw new Error('Kolom NAMA tidak ditemukan');
 const h=a[hi].map(c=>String(c).trim().toUpperCase()),ix={};
 for(const k in K){ix[k]=h.indexOf(K[k])}
 if(ix.pct<0&&ix.hadir<0)throw new Error('Kolom kehadiran tidak ditemukan');
 const rows=a.slice(hi+1).filter(r=>String(r[ix.nama]).trim()).map(r=>{const o={};for(const k in K)o[k]=ix[k]>=0?r[ix[k]]:'';
  ['hadir','izin','alpa','total','nKeh','nCap','avg','rank','pct'].forEach(k=>{let v=o[k];if(typeof v==='string'){v=v.replace('%','').trim();if(v.includes(','))v=v.replace(/\./g,'').replace(',','.')}o[k]=parseFloat(v)||0});
  if(o.pct<=1.0001)o.pct=Math.round(o.pct*1e4)/100; if(!o.total)o.total=o.hadir+o.izin+o.alpa;
  o.nama=String(o.nama).trim();['last','since'].forEach(k=>{if(typeof o[k]==='number'&&o[k]>20000)o[k]=idDate(o[k])});o.nim=String(o.nim==null?'':o.nim);return o});
 const LC={};rows.forEach(r=>{if(r.last)LC[r.last]=(LC[r.last]||0)+1});const LD=Object.keys(LC).sort((a,b)=>LC[b]-LC[a])[0]||'';
 if(LD&&!/(JAN|FEB|MAR|APR|MEI|MAY|JUN|JUL|AGU|AUG|SEP|OKT|OCT|NOV|DES|DEC)[A-Z]*\.?\s*[-\/]?\s*\d{4}/i.test(name))name='REKAP TAHFIZ - '+LD.replace(/^[A-Za-z']+\s+/,'');
 const PG=wb.Sheets['PROGRESS KETERCAPAIAN SETORAN'];if(PG){const pm=new Map();XLSX.utils.sheet_to_json(PG,{defval:''}).forEach(g=>pm.set(mgKey({nama:g.NAMA}),g));rows.forEach(r=>{const g=pm.get(mgKey(r));if(g){r.tgt=parseFloat(g['TARGET HALAMAN'])||0;r.capH=parseFloat(g['TOTAL CAPAIAN'])||0;r.stc=String(g['STATUS CAPAIAN']||'')}})}
 const dly=buildDaily(wb);return{dly,id:Date.now()+Math.random().toString(36).slice(2,6),name:name.replace(/\.[^.]+$/,'').replace(/[_]+/g,' '),rows}
}
async function add(list){
 $('#msg').textContent='';
 for(const f of list){try{const p=parse(await f.arrayBuffer(),f.name);if(p.dly){daily=p.dly}delete p.dly;files.push(p);mgVer++;active=p.id;$('#msg').textContent='✔ '+f.name+' ditambahkan ('+p.rows.length+' santri)'}catch(e){$('#msg').textContent='✖ '+f.name+': '+e.message}}
 save();cur=null;draw();
}
function drawFiles(){
 const used=id=>merges.filter(m=>m.ids.includes(id)).length;
 $('#files').innerHTML=files.map(f=>{const u=used(f.id);return `<div class="file ${f.id===active?'on':''}">${MG.on?`<input type="checkbox" class="mg-ck" data-mck="${f.id}"${MG.sel.has(f.id)?' checked':''} aria-label="Pilih ${esc(f.name)}">`:''}<div class="n"><b>${esc(f.name)}</b><br><small>${f.rows.length} santri${u?' · dipakai di '+u+' gabungan':''}</small></div>
  ${f.id===active?'<span class="chip">Aktif</span>':`<button class="btn" data-use="${f.id}">Gunakan</button>`}
  <button class="btn d" data-del="${f.id}">${confirmId===f.id?'Yakin hapus?':'Hapus'}</button></div>`}).join('')||'<p class="hint">Belum ada file. Tambahkan file rekap Excel.</p>';
 mgDraw();
 }
 function draw(){if(document.querySelector(".wrap.zv")&&admin)setTimeout(zona,0);if(document.querySelector(".wrap.lv")&&admin)setTimeout(lapor,0);if(document.querySelector(".wrap.dv"))setTimeout(dash,0);
 const f=act();$('#periode').textContent=f?'Periode: '+(f.merged?f.disp:f.name):'Belum ada data';
 $('#hint').style.display=f?'':'none';$('#q').disabled=!f;drawFiles();$('#out').innerHTML='';$('#sug').innerHTML='';$('#q').value='';
}
$('#files').onclick=e=>{const u=e.target.dataset.use,d=e.target.dataset.del;
 if(u){active=u;save();draw()}
 if(d){if(confirmId===d){files=files.filter(f=>f.id!==d);mgPrune();if(!files.some(f=>f.id===active)&&!mgFind(active))active=files[0]?.id;confirmId=null;save();draw()}else{confirmId=d;drawFiles();setTimeout(()=>{confirmId=null;drawFiles()},4000)}}};
$('#pick').onclick=()=>$('#f').click();$('#f').onchange=e=>{add([...e.target.files]);e.target.value=''};
const dr=$('#drop');dr.ondragover=e=>{e.preventDefault();dr.classList.add('over')};dr.ondragleave=()=>dr.classList.remove('over');
dr.ondrop=e=>{e.preventDefault();dr.classList.remove('over');add([...e.dataTransfer.files])};
$('#files').addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.mck;if(!k)return;e.target.checked?MG.sel.add(k):MG.sel.delete(k);drawFiles()});
$('#mergeBox').addEventListener('change',e=>{if(e.target.id==='mgcap'){MG.cap=e.target.value;const n=$('#mgcapn');if(n)n.textContent=MGN[MG.cap]||''}});
$('#mergeBox').addEventListener('input',e=>{if(e.target.id==='mgname')MG.name=e.target.value});
$('#mergeBox').addEventListener('click',mgClick);$('#mergeList').addEventListener('click',mgClick);
$('#q').oninput=()=>{const v=$('#q').value.trim().toLowerCase(),f=act();
 if(v.length<2||!f){$('#sug').innerHTML='';return}
 const m=f.rows.filter(r=>r.nama.toLowerCase().includes(v)).slice(0,8);
 $('#sug').innerHTML=m.length?m.map(r=>`<li tabindex="0" data-n="${esc(r.nama)}"><span>${esc(r.nama)}</span><small>${esc(r.halaqah)}</small></li>`).join(''):'<li><small>Nama tidak ditemukan. Coba ejaan lain.</small></li>'};
$('#q').onkeydown=e=>{if(e.key==='Enter'){const li=$('#sug li[data-n]');if(li)show(li.dataset.n)}};
$('#sug').onclick=e=>{const li=e.target.closest('li[data-n]');if(li)show(li.dataset.n)};
$('#sug').onkeydown=e=>{if(e.key==='Enter'){const li=e.target.closest('li[data-n]');if(li)show(li.dataset.n)}};
const tone=p=>p<50?'bad':p<75?'mid':'ok',col={bad:'var(--bad)',mid:'var(--mid)',ok:'var(--ok)'};
const hs=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const pk=(a,h,o=0)=>a[(h+o*7919)%a.length];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(_,k)=>v[k]);
const W=["{n}, ngapain aja selama ini? Hadir cuma {h} dari {t} pertemuan. Kehadiran {p}% itu lampu merah, bestie. 🚨",
"Hmm {n}, kok jarang banget keliatan di halaqah? Baru {h}× hadir, sisanya ghosting. Hafalan nggak bisa nyicil lewat niat doang lho. 👻",
"Plot twist: absenmu lebih banyak dari hadirmu. {p}% bukan angka aman, {n}. Mau sampai kapan gabut begini?",
"Halaqah nyariin kamu, {n}! Kehadiran {p}% = kritis. Jangan jadi NPC di halaqah sendiri. 🎮",
"Alert {n}! Tinggal {h}× hadir dari {t} pertemuan. Hafalan itu marathon, tapi kalau nggak lari ya nggak nyampe. 🏃",
"Santri kok kayak sinyal di lift: ilang-ilangan. 📶 {p}% ya, {n}. Fix it sekarang juga.",
"Jujur aja {n}, ini udah red flag. 🚩 Kehadiran {p}%. Jangan nunggu dipanggil, datang duluan ke Dewan.",
"Kamu tuh kenapa sih, {n}? Mushaf udah nunggu, halaqah udah buka, tapi kamunya mana? Baru hadir {h}× lho. 🥲",
"Kehadiran {p}%? Itu bukan progres, itu cuma nama doang yang terdaftar. Yuk balik jalur, {n}! 🛤️"];
const W0="{n}, 0 kali hadir… kamu masih santri sini, kan? 👀 Please muncul dulu, sekali aja, biar kita ngobrol.";
const NG=["Lumayan {n}, tapi {p}% masih bisa naik. Dikit lagi menuju zona aman, jangan mager! 🔋",
"Kamu udah setengah jalan, {n}. Tinggal tancap gas biar kehadiran tembus 75%. 🚀",
"{p}% itu bukan buruk, tapi kamu bisa lebih. Naikin dikit lagi, {n}, hafalanmu bakal ikut ngebut. 📈",
"Posisi kamu aman tapi belum glowing, {n}. Konsisten hadir bulan depan, level up! ✨"];
const QL=["Yang penting bukan seberapa jauh kamu tertinggal, tapi seberapa cepat kamu balik jalan. Mulai dari pertemuan berikutnya. 💪",
"Hafalan itu soal konsisten, bukan soal jenius. Datang dulu, sisanya Allah mudahkan. 🤲",
"Fresh start itu nyata. Bulan baru, halaqah baru, kamu yang lebih baik. 🌱",
"Allah nggak minta kamu sempurna, cuma minta kamu mau kembali. Yuk balik, hafalanmu nungguin. 🕌",
"Satu ayat sehari lebih berarti daripada seribu rencana yang cuma ada di notes. 📝"];
const QG=["Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya. (HR. Al-Bukhari) 💚",
"Istiqomah itu bukan nggak pernah capek, tapi capek terus lanjut. Keep going, calon hafidz/ah! ✨",
"Setiap ayat yang kamu hafal itu investasi akhirat: no refund, no expiry. 📈",
"Hari ini 1% lebih baik dari kemarin, itu udah cukup bikin malaikat senyum. 😇",
"Pelan-pelan nggak apa, yang penting jalan dan nggak pindah haluan. 🐢➡️🏆",
"Hafalan itu kayak otot: dilatih tiap hari, bukan dikebut sehari sebelum setoran. 💪",
"Al-Qur'an bukan cuma dihafal, tapi dijadiin teman hidup. Jadi bestie sama kalamullah. 📖",
"Dunia boleh ribut, kamu tetap fokus: murajaah dulu, scroll belakangan. 📵"];
function nick(nm){const t=nm.split(/\s+/),x=t.find(w=>!/^(m|moh|muh|muhammad|muhamad|muhammed|mohammad|mohammed|mohamad|mohamed|muhd|ahmad|nur|siti)\.?$/i.test(w));return x||t[0]}
const RKC=new WeakMap();
function RK(f){let c=RKC.get(f);if(c)return c;
 const A=f.rows.filter(r=>!/NON/i.test(r.status)),nA=A.length,m=new Map(),ok=A.every(r=>r.rank>=1&&r.rank<=nA);
 A.forEach(r=>m.set(r,ok?r.rank:A.filter(x=>x.avg>r.avg).length+1));
 c={nA,rank:r=>m.get(r)||0};RKC.set(f,c);return c}
function extra(r,f,p){const R=RK(f),rank=R.rank(r);
 const h=hs(r.nama),v={n:nick(r.nama),p:p.toFixed(1).replace('.',','),h:r.hadir,t:r.total,a:r.alpa,rank:rank,N:R.nA,cap:r.nCap};
 let alert='';
 if(p<50){let m=r.hadir===0?fill(W0,v):fill(pk(W,h),v);if(r.alpa>=5&&r.hadir>0)m+=` Alpa ${r.alpa}× itu bukan vibes yang bagus.`;
  alert=`<div class="alert"><span style="font-size:26px">⚠️</span><div><b>Kehadiran di bawah 50%.</b><br>${esc(m)}<br><b>Segera konfirmasi dan melapor ke Dewan Ketahfidzan.</b></div></div>`}
 else if(p<75)alert=`<div class="alert nudge"><span style="font-size:26px">💡</span><div>${esc(fill(pk(NG,h),v))}</div></div>`;
 const B=[],pc=r.total?100*rank/R.nA:100;
 if(rank>0&&rank<=3)B.push(['🏆','Podium Ma\'had',`Peringkat ${rank} dari ${v.N} santri! Kamu bukan cuma hadir, kamu yang pegang kendali. Salut banget, ${v.n}!`]);
 else if(rank>0&&rank<=10)B.push(['🔥','Top 10 Santri',`Peringkat ${rank} dari ${v.N}. Masuk 10 besar itu nggak kebetulan, ${v.n}, itu hasil kerja keras. Keren parah!`]);
 else if(rank>0&&rank<=25)B.push(['⭐','Top 25 Santri',`Peringkat ${rank} dari ${v.N}. Udah di jajaran atas nih, ${v.n}. Dikit lagi nyentuh 10 besar!`]);
 else if(rank>0&&pc<=25)B.push(['✨','Top 25% Santri',`Peringkat ${rank} dari ${v.N}, kamu masuk seperempat teratas. Pertahankan ya, ${v.n}!`]);
 if(r.total&&p>=100)B.push(['💯','Full Attendance',pk(["Hadir terus tanpa bolos sekalipun. Istiqomah is your aesthetic, "+v.n+"! 😎","Absen sempurna! Konsisten ya, "+v.n+", ini langka dan berharga. 👏"],h,2)]);
 else if(p>=90)B.push(['🎯','Santri Rajin',`Kehadiran ${v.p}%, tinggal selangkah lagi ke 100%. Rajinmu patut ditiru, ${v.n}! 🙌`]);
 if(r.total&&r.alpa===0&&p>=50)B.push(['🛡️','Anti Alpa','Nol alpa bulan ini. Clean record, no drama. ✨']);
 if(r.nCap>=75)B.push(['📖','Target Hafalan Tercapai',`Nilai capaian ${r.nCap}, target kelar! Otakmu kayak hard disk 1TB, ${v.n}. 🤯`]);
 else if(r.nCap>=50)B.push(['🌱','Capaian Hafalan Mantap',`Nilai capaian ${r.nCap}, udah lewat setengah target. Terus gas, ${v.n}! 🚀`]);
 else if(r.nCap>=35)B.push(['📈','Progres Hafalan Naik',`Nilai capaian ${r.nCap}, lebih tinggi dari mayoritas santri. Lanjutkan!`]);
 if(/^SANGAT BAIK/.test(r.predikat))B.push(['🌟','Predikat Sangat Baik','Nilai akhirmu masuk kategori tertinggi. Bangga banget sama kamu! 💚']);
 if(!B.length)B.push(['🌙','Cerita Belum Tamat',p<50?'Belum ada badge bulan ini, tapi satu pertemuan hadir = satu langkah balik ke jalur. Kamu pasti bisa. 💪':'Belum ada badge bulan ini, tapi kamu terus berproses. Bulan depan kita rebut satu! 🎖️']);
 const q=pk(p<50?QL:QG,h,5);
 const apr=`<h3 class="aprh">🎉 Apresiasi untukmu</h3>${B.map(b=>`<div class="bd"><span class="bi">${b[0]}</span><div><b>${esc(b[1])}</b><br><span>${esc(b[2])}</span></div></div>`).join('')}<div class="qt">“${esc(q)}”<small>— Semangat buat ${esc(v.n)}</small></div>`;
 return{alert,apr}}

function show(n){
 const f=act(),r=f.rows.find(x=>x.nama===n);if(!r)return;
 $('#sug').innerHTML='';$('#q').value=r.nama;
 const ex=extra(r,f,Math.round(r.pct*10)/10),p=Math.round(r.pct*10)/10,t=tone(p),C=2*Math.PI*54,off=C*(1-Math.min(p,100)/100);
 const bar=(l,v,c)=>`<div class="bar"><div class="l"><span>${l}</span><b>${v}×</b></div><div class="track"><div class="fill" data-w="${r.total?v/r.total*100:0}" style="background:${c}"></div></div></div>`;
 const nonaktif=String(r.status).toUpperCase().includes('NON');
 $('#out').innerHTML=`<div class="glass rapor">
 <div class="head"><div class="av">${esc(r.nama[0])}</div><div><h2>${esc(r.nama)}</h2><p>${esc(r.halaqah)}</p></div></div>
 <div class="chips"><span class="chip">${r.gender==='L'?'Ikhwan':'Akhwat'}</span><span class="chip">Angkatan ${esc(r.angkatan)}</span><span class="chip">${esc(r.nim)}</span><span class="chip" style="${nonaktif?'background:rgba(255,90,95,.3)':''}">${esc(r.status)}</span></div>
 ${nonaktif?'<p class="hint" style="text-align:left;margin:12px 0 0">ℹ️ Santri non aktif tidak dihitung dalam peringkat maupun rata-rata persentase.</p>':''}${ex.alert}
 <div class="grid"><div class="ring"><svg width="180" height="180" viewBox="0 0 128 128"><circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="11"/>
 <circle id="rg" cx="64" cy="64" r="54" fill="none" stroke="${col[t]}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset 1.2s ease"/></svg>
 <div class="c"><b class="${t}">${p.toFixed(1).replace('.',',')}%</b><span>KEHADIRAN</span></div></div>
 <div class="bars">${bar('Hadir',r.hadir,'var(--ok)')}${bar('Izin',r.izin,'var(--mid)')}${bar('Alpa',r.alpa,'var(--bad)')}<small style="color:var(--mut)">Dari ${r.total} pertemuan · presensi terakhir: ${esc(r.last)}</small></div></div>
 <div class="stats"><div class="st"><span>Nilai Kehadiran</span><b>${r.nKeh}</b></div><div class="st"><span>Nilai Capaian</span><b>${r.nCap}</b></div><div class="st"><span>Rata-rata Akhir</span><b>${r.avg}</b></div>
 <div class="st"><span>Predikat</span><b class="${/BAIK/.test(r.predikat)&&!/KURANG/.test(r.predikat)?'ok':/CUKUP/.test(r.predikat)?'mid':'bad'}" style="font-size:18px">${esc(r.predikat)}</b></div>
 <div class="st"><span>Peringkat</span><b>${RK(f).rank(r)||'–'} <small style="font-size:12px;color:var(--mut)">${RK(f).rank(r)?'/ '+RK(f).nA:'tidak masuk peringkat'}</small></b></div></div>${rprBar(r)}${shareBar(r)}${certCard(r,f)}${gmCard(r,f)}${ex.apr}</div>`;
 requestAnimationFrame(()=>setTimeout(()=>{$('#rg').style.strokeDashoffset=off;document.querySelectorAll('.fill').forEach(e=>e.style.width=Math.min(e.dataset.w,100)+'%')},60));
 try{mcReact(r,f)}catch(e){}
 $('#out').scrollIntoView({behavior:'smooth',block:'nearest'});
}
draw();
const avgOf=(a,k)=>a.length?a.reduce((s,r)=>s+(+r[k]||0),0)/a.length:0;
const f1=n=>(Math.round(n*10)/10).toFixed(1).replace('.',',');
function grp(a,key){const m={};a.forEach(r=>(m[r[key]]=m[r[key]]||[]).push(r));return Object.entries(m).map(([k,v])=>({k,n:v.length,pct:avgOf(v,'pct'),cap:avgOf(v,'nCap'),avg:avgOf(v,'avg')}))}
const tc=v=>col[tone(v)];
const hb=(it,mx,clr,sfx)=>it.map(i=>`<div class="bar"><div class="l"><span>${esc(i.l)}${i.n?` <small style="color:var(--mut)">· ${i.n}</small>`:''}</span><b>${f1(i.v)}${sfx}</b></div><div class="track"><div class="fill" data-w="${Math.min(i.v/mx*100,100)}" style="background-color:${typeof clr==='function'?clr(i.v):clr}"></div>${clr===tc?'<i class="mk" style="left:50%"></i><i class="mk" style="left:75%"></i>':''}</div></div>`).join('');
const stk=it=>{const T=it.reduce((s,i)=>s+i.v,0)||1;return `<div class="stk">${it.map(i=>`<span style="width:${i.v/T*100}%;background:${i.c}"></span>`).join('')}</div><div class="lg">${it.map(i=>`<span><i style="background:${i.c}"></i>${i.l} <b>${i.v}</b> (${f1(i.v/T*100)}%)</span>`).join('')}</div>`};
const isoOf=v=>{if(v==null||v==='')return'';if(typeof v==='number')return new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5).toISOString().slice(0,10);if(v instanceof Date)return v.toISOString().slice(0,10);const m=String(v).match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:''};
function buildDaily(wb){const P=wb.Sheets['Pusat DB'];if(!P)return null;const sl=new Set(),rc=[];
 XLSX.utils.sheet_to_json(P,{defval:''}).forEach(r=>{const d=isoOf(r.Tanggal),n=String(r.Nama||'').trim(),q=String(r.Sesi||'').trim(),st=String(r.Status||'').replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,1);if(d&&n&&q&&st){sl.add(d+'|'+q);rc.push([d+'|'+q,n,st])}});
 const slots=[...sl].sort((a,b)=>{const x=a.split('|'),y=b.split('|');return x[0]<y[0]?-1:x[0]>y[0]?1:(x[1]==='S'?0:1)-(y[1]==='S'?0:1)}),ix=new Map(slots.map((k,i)=>[k,i])),p={};
 rc.forEach(([k,n,st])=>{const key=mgKey({nama:n});(p[key]=p[key]||Array(slots.length).fill('-'))[ix.get(k)]=st});Object.keys(p).forEach(k=>p[k]=p[k].join(''));
 const D=wb.Sheets['DBS - MASTER'],set=[];if(D)XLSX.utils.sheet_to_json(D,{defval:''}).forEach(r=>{const d=isoOf(r.TANGGAL),n=String(r.NAMA||'').trim(),h=parseFloat(String(r['JUMLAH HALAMAN']).replace(',','.'))||0;if(d&&n&&h)set.push([d,mgKey({nama:n}),h])});
 return{slots,p,set}}
function trenDaily(){const{slots,p,set}=daily,A=act().rows.filter(r=>!/NON/i.test(r.status)),ks=A.map(mgKey),dt=i=>slots[i].split('|')[0],
 wk=d=>{const t=new Date(d+'T00:00:00Z');return new Date(t.getTime()-((t.getUTCDay()+6)%7)*864e5).toISOString().slice(5,10)},W=new Map();
 slots.forEach((q,i)=>{const w=wk(dt(i));let o=W.get(w);if(!o){o={h:0,t:0,pg:0};W.set(w,o)}ks.forEach(k=>{const c=p[k]&&p[k][i];if(c&&'HIA'.includes(c)){o.t++;if(c==='H')o.h++}})});
 set.forEach(([d,k,h])=>{const w=wk(d);let o=W.get(w);if(!o){o={h:0,t:0,pg:0};W.set(w,o)}o.pg+=h});
 const E=[...W.entries()].sort((a,b)=>a[0]<b[0]?-1:1),mx=Math.max(1,...E.map(e=>e[1].pg)),Wd=300,Hh=120,x=i=>E.length>1?22+i*(Wd-44)/(E.length-1):Wd/2,y=v=>Hh-18-Math.min(100,v)/100*(Hh-34),bh=v=>v/mx*(Hh-34)*.6;
 const pts=E.map((e,i)=>e[1].t?x(i)+','+y(e[1].h/e[1].t*100):'').filter(Boolean).join(' '),lab=m=>m.slice(3)+'/'+m.slice(0,2);
 const L=Math.max(0,slots.length-14),ls=new Date(dt(slots.length-1)+'T00:00:00Z').getTime(),dn=[],ns=[];
 A.forEach(r=>{const s=p[mgKey(r)]||'',cnt=(a)=>{let h=0,t=0;for(let i=a;i<s.length;i++){if('HIA'.includes(s[i])){t++;if(s[i]==='H')h++}}return[h,t]},[wh,wt]=cnt(L),[oh,ot]=cnt(0);
  if(wt>=6&&ot>=12){const a=wh/wt*100,b=oh/ot*100;if(a<b-10)dn.push({r,a,b})}
  const ms=set.filter(z=>z[1]===mgKey(r)).map(z=>z[0]).sort().pop();if(!ms||(ls-new Date(ms+'T00:00:00Z').getTime())/864e5>14)ns.push({r,ms})});
 dn.sort((a,b)=>(a.a-a.b)-(b.a-b.b));
 return`<div class="glass" style="padding:16px;margin-top:14px"><b style="color:var(--gold)">📈 Tren Mingguan</b>
 <svg viewBox="0 0 ${Wd} ${Hh}" width="100%" style="margin-top:8px">${E.map((e,i)=>`<rect x="${x(i)-9}" y="${Hh-18-bh(e[1].pg)}" width="18" height="${bh(e[1].pg)}" rx="3" fill="rgba(233,196,106,.28)"/><text x="${x(i)}" y="${Hh-5}" font-size="8" text-anchor="middle" fill="#a9c4b9">${lab(e[0])}</text>${e[1].t?`<text x="${x(i)}" y="${y(e[1].h/e[1].t*100)-6}" font-size="8" text-anchor="middle" fill="#f4f1e6">${(e[1].h/e[1].t*100).toFixed(0)}</text>`:''}`).join('')}<polyline fill="none" stroke="#3ddc97" stroke-width="2.4" points="${pts}"/>${E.map((e,i)=>e[1].t?`<circle cx="${x(i)}" cy="${y(e[1].h/e[1].t*100)}" r="3" fill="#3ddc97"/>`:'').join('')}</svg>
 <p class="hint" style="text-align:left;margin:4px 0">Garis hijau: kehadiran ma'had per minggu (%). Batang kuning: jumlah halaman ziyadah yang disetor per minggu. Minggu dimulai hari Senin.</p>
 ${admin?'':'<p class="hint" style="text-align:left">Daftar nama santri hanya terlihat di Mode Admin.</p>'}<div ${admin?'':'hidden'}><b style="font-size:13px">Kehadiran 14 sesi terakhir turun dibanding keseluruhan (${dn.length})</b>
 ${dn.length?'<ul style="font-size:13px;padding-left:18px">'+dn.slice(0,8).map(z=>`<li>${esc(z.r.nama)} <small style="color:var(--mut)">${z.b.toFixed(0)}% → ${z.a.toFixed(0)}%</small></li>`).join('')+'</ul>':'<p class="hint" style="text-align:left">Belum ada yang terdeteksi.</p>'}
 <b style="font-size:13px">Belum setor ziyadah lebih dari 14 hari (${ns.length} santri aktif)</b>
 ${ns.length?'<ul style="font-size:13px;padding-left:18px">'+ns.slice(0,8).map(z=>`<li>${esc(z.r.nama)} <small style="color:var(--mut)">${z.ms?'setoran terakhir '+z.ms:'belum pernah setor'}</small></li>`).join('')+(ns.length>8?`<li><small>dan ${ns.length-8} lainnya</small></li>`:'')+'</ul>':'<p class="hint" style="text-align:left">Semua santri aktif sudah setor dalam 14 hari terakhir.</p>'}</div></div>`}
function trenData(){const ps=mgParts(files.map(f=>f.id)),out=[];
 ps.forEach((f,i)=>{const A=f.rows.filter(r=>!/NON/i.test(r.status)),pv=i?ps[i-1]:null,pm=new Map();if(pv)pv.rows.forEach(r=>pm.set(mgKey(r),r));
  let H=0,T=0;const per=[];A.forEach(r=>{const P=pm.get(mgKey(r))||{},dh=Math.max(0,r.hadir-(+P.hadir||0)),dt=Math.max(0,r.total-(+P.total||0));H+=dh;T+=dt;if(pv&&dt>=3)per.push({n:r.nama,h:r.halaqah,p:dh/dt*100,c:+P.pct||0,cn:r.pct})});
  out.push({f,kum:A.length?A.reduce((s,r)=>s+r.pct,0)/A.length:0,per:i&&T?H/T*100:null,tp:per})});return out}
function trenHTML(){if(daily&&daily.slots&&daily.slots.length&&files.length)return trenDaily();const D=trenData();if(D.length<2)return'<div class="glass" style="padding:16px;margin-top:14px"><b style="color:var(--gold)">📈 Tren Kehadiran</b><p class="hint" style="text-align:left">Tren muncul setelah minimal 2 potret data ditambahkan. Unggah master data secara berkala, misalnya tiap pekan.</p></div>';
 const W=300,Hh=110,x=i=>D.length>1?20+i*(W-40)/(D.length-1):W/2,y=v=>Hh-14-(Math.min(100,Math.max(0,v))/100)*(Hh-30),pt=(k)=>D.map((d,i)=>d[k]==null?null:x(i)+','+y(d[k])).filter(Boolean).join(' ');
 const last=D[D.length-1],dn=last.tp.filter(r=>r.p<r.c-5).sort((a,b)=>(a.p-a.c)-(b.p-b.c)).slice(0,8);
 return`<div class="glass" style="padding:16px;margin-top:14px"><b style="color:var(--gold)">📈 Tren Kehadiran</b>
 <svg viewBox="0 0 ${W} ${Hh}" width="100%" style="margin-top:8px"><polyline fill="none" stroke="#e9c46a" stroke-width="2.5" points="${pt('kum')}"/><polyline fill="none" stroke="#3ddc97" stroke-width="2" stroke-dasharray="4 3" points="${pt('per')}"/>${D.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.kum)}" r="3.5" fill="#e9c46a"/><text x="${x(i)}" y="${Hh-2}" font-size="8" text-anchor="middle" fill="#a9c4b9">${esc(String(d.f.name).replace(/^.*?-\s*/,'').slice(0,12))}</text><text x="${x(i)}" y="${y(d.kum)-7}" font-size="8" text-anchor="middle" fill="#f4f1e6">${d.kum.toFixed(1)}</text>`).join('')}</svg>
 <p class="hint" style="text-align:left;margin:4px 0">Garis kuning: rata-rata kehadiran kumulatif. Garis putus hijau: kehadiran pada rentang antar potret${last.per!=null?' (terakhir '+last.per.toFixed(1)+'%)':''}.</p>
 <b style="font-size:13px">Kehadiran terbaru turun dibanding kumulatif</b>
 ${dn.length?'<ul style="font-size:13px;padding-left:18px">'+dn.map(r=>`<li>${esc(r.n)} <small style="color:var(--mut)">kumulatif ${r.c.toFixed(0)}% → rentang terakhir ${r.p.toFixed(0)}%</small></li>`).join('')+'</ul>':'<p class="hint" style="text-align:left">Belum ada yang terdeteksi. Penilaian butuh selisih minimal 3 pertemuan antar potret.</p>'}</div>`}
const _dash=dash;dash=function(){_dash.apply(this,arguments);const el=$('#dash');if(el&&el.children.length&&files.length)el.insertAdjacentHTML('beforeend',trenHTML())};
function dash(){
 const f=act(),el=$('#dash');
 if(!f){el.innerHTML='<p class="hint">Belum ada data. Tambahkan file rekap di Mode Admin.</p>';return}
 const all=f.rows,A=all.filter(r=>!/NON/i.test(r.status)),na=all.length-A.length,n=A.length||1;
 const pa=avgOf(A,'pct'),ca=avgOf(A,'nCap'),va=avgOf(A,'avg');
 const red=A.filter(r=>r.pct<50).length,full=A.filter(r=>r.pct>=99.95).length,c50=A.filter(r=>r.nCap>=50).length,c75=A.filter(r=>r.nCap>=75).length,z=A.filter(r=>r.total&&!r.alpa).length;
 const L=A.filter(r=>r.gender==='L'),P=A.filter(r=>r.gender==='P');
 const ang=grp(A,'angkatan').sort((a,b)=>a.k-b.k),hal=grp(A,'halaqah');
 const hK=[...hal].sort((a,b)=>b.pct-a.pct),hR=[...hal].sort((a,b)=>b.avg-a.avg),aK=[...ang].sort((a,b)=>b.pct-a.pct);
 const cnt=k=>A.filter(r=>r.predikat===k).length,PR=[['SANGAT BAIK','#3ddc97'],['BAIK','#8fd14f'],['CUKUP','#f4d03f'],['KURANG','#f4a93b'],['SANGAT KURANG','#ff5a5f']];
 const sum=k=>A.reduce((s,r)=>s+r[k],0);
 const kp=(l,v,s,c)=>`<div class="st"><span>${l}</span><b class="${c||''}">${v}</b><small style="color:var(--mut)">${s||''}</small></div>`;
 const gc=(l,ic,a)=>`<div class="glass dc"><h3>${ic} ${l} <small>${a.length} santri aktif</small></h3>${hb([{l:'Kehadiran',v:avgOf(a,'pct')}],100,tc,'%')}${hb([{l:'Capaian target',v:avgOf(a,'nCap')}],100,'#7cc4ff','')}${hb([{l:'Nilai akhir',v:avgOf(a,'avg')}],100,'var(--gold)','')}</div>`;
 const d=(x,y)=>Math.abs(x-y);const pL=avgOf(L,'pct'),pP=avgOf(P,'pct'),cL=avgOf(L,'nCap'),cP=avgOf(P,'nCap');
 const ins=[`🏅 Kehadiran halaqah tertinggi: <b>${esc(hK[0].k)}</b> (${f1(hK[0].pct)}%)`,`🔔 Kehadiran halaqah terendah: <b>${esc(hK[hK.length-1].k)}</b> (${f1(hK[hK.length-1].pct)}%)`,
 `📅 Angkatan paling rajin: <b>Angkatan ${esc(aK[0].k)}</b> (${f1(aK[0].pct)}%)`,
 `${pP>=pL?'👩':'👨'} Kehadiran <b>${pP>=pL?'Putri':'Putra'}</b> lebih tinggi ${f1(d(pP,pL))} poin; capaian target <b>${cP>=cL?'Putri':'Putra'}</b> lebih tinggi ${f1(d(cP,cL))} poin`,
 `🚨 <b>${red}</b> santri (${f1(red/n*100)}%) di zona merah (kehadiran &lt; 50%)`,`💯 <b>${full}</b> santri hadir 100% dan <b>${z}</b> santri tanpa alpa`];
 const top=A.filter(r=>RK(f).rank(r)>0).sort((a,b)=>RK(f).rank(a)-RK(f).rank(b)).slice(0,10);
 el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><p class="hint" style="margin:0 0 6px">Periode: ${esc(f.merged?f.disp:f.name)} · rata-rata dihitung dari santri aktif</p><span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="pgo">🎞️ Mode Presentasi</button><button class="btn g" id="mdgo">🖼️ Mode Mading</button></span></div>
 <div class="stats" style="margin-top:8px">${kp('Total Mahasantri',all.length,'terdaftar')}${kp('Aktif',A.length,f1(A.length/all.length*100)+'%','ok')}${kp('Non Aktif',na,na?'perlu tindak lanjut':'tidak ada',na?'bad':'')}${kp('Rata-rata Kehadiran',f1(pa)+'%','',tone(pa))}${kp('Capaian Target',f1(ca),'rata-rata nilai capaian (maks 100)')}${kp('Rata-rata Nilai Akhir',f1(va),'')}${kp('Putra / Putri',L.length+' / '+P.length,'santri aktif')}${kp('Jumlah Halaqah',hal.length,'')}${kp('Zona Merah',red,'kehadiran < 50%',red?'bad':'ok')}${kp('Capaian ≥ 50',c50,f1(c50/n*100)+'% santri','ok')}${kp('Capaian ≥ 75',c75,f1(c75/n*100)+'% santri','ok')}${kp('Hadir 100%',full,'santri','ok')}</div>
 <div class="glass dc"><h3>💡 Sorotan</h3>${ins.map(x=>`<p class="ins">${x}</p>`).join('')}</div>
 <div class="g2">${gc('Putra','👨',L)}${gc('Putri','👩',P)}</div>
 <div class="g2"><div class="glass dc"><h3>📅 Kehadiran per Angkatan</h3><p class="leg">┆ garis putus-putus = batas 50% (zona merah) dan 75%</p>${hb(ang.map(g=>({l:'Angkatan '+g.k,v:g.pct,n:g.n})),100,tc,'%')}</div>
 <div class="glass dc"><h3>🎯 Capaian Target per Angkatan</h3>${hb(ang.map(g=>({l:'Angkatan '+g.k,v:g.cap,n:g.n})),100,'#7cc4ff','')}</div></div>
 <div class="glass dc"><h3>🕌 Kehadiran per Halaqah</h3><p class="leg">┆ garis putus-putus = batas 50% (zona merah) dan 75%</p>${hb(hK.map(g=>({l:g.k,v:g.pct,n:g.n})),100,tc,'%')}</div>
 <div class="glass dc"><h3>🏆 Ranking Halaqah (Rata-rata Nilai Akhir)</h3>${hR.map((g,i)=>`<div class="rk"><span class="no">${['🥇','🥈','🥉'][i]||i+1}</span><div class="nm">${esc(g.k)}<small>${g.n} santri · kehadiran ${f1(g.pct)}%</small></div><b>${f1(g.avg)}</b>${i<3?`<button class="btn g" data-hcert="${esc(g.k)}" style="padding:6px 10px;font-size:11px">🏆 Sertifikat</button>`:''}</div>`).join('')}</div>
 <div class="g2"><div class="glass dc"><h3>🎓 Sebaran Predikat</h3>${stk(PR.map(p=>({l:p[0],v:cnt(p[0]),c:p[1]})))}</div>
 <div class="glass dc"><h3>🗓️ Komposisi Presensi</h3>${stk([{l:'Hadir',v:sum('hadir'),c:'#3ddc97'},{l:'Izin',v:sum('izin'),c:'#f4a93b'},{l:'Alpa',v:sum('alpa'),c:'#ff5a5f'}])}</div></div>
 <div class="glass dc"><h3>🌟 10 Santri Terbaik</h3>${top.map(r=>`<div class="rk"><span class="no">${RK(f).rank(r)}</span><div class="nm">${esc(r.nama)}<small>${esc(r.halaqah)}</small></div><b>${f1(r.avg)}</b><button class="btn g" data-cert="${esc(r.nama)}" style="padding:6px 10px;font-size:11px">🏆 Sertifikat</button></div>`).join('')}</div>`;
 requestAnimationFrame(()=>setTimeout(()=>el.querySelectorAll('.fill').forEach(e=>e.style.width=e.dataset.w+'%'),60));
}
$('#tR').onclick=()=>{$('.wrap').classList.remove('dv');$('#tR').className='on';$('#tD').className=''};
$('#tD').onclick=()=>{$('.wrap').classList.add('dv');$('#tD').className='on';$('#tR').className='';dash();window.scrollTo(0,0)};

const HASH="7ebdd7ca9d12042884f2a388cd75c2ab352d86a3516bf7c728090575b1b04d9c";let admin=false;
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
function mode(m){$('#mS').className=m==='s'?'on':'';$('#mA').className=m==='a'?'on':'';$('#login').hidden=!(m==='a'&&!admin);const p=$('.adm');p.hidden=!(m==='a'&&admin);if(!p.hidden)p.open=true;if(m==='a'&&!admin)$('#uid').focus()}
$('#mS').onclick=()=>mode('s');$('#mA').onclick=()=>mode('a');
async function login(){try{const h=await sha('tahfidz-rapor|'+$('#uid').value.trim()+'|'+$('#pw').value);
 if(h===HASH){admin=true;try{sessionStorage.setItem('adm','1')}catch(e){}$('#lmsg').textContent='';$('#pw').value='';if($('.wrap').classList.contains('zv')){$('#login').hidden=true;zona()}else if($('.wrap').classList.contains('lv')){$('#login').hidden=true;lapor()}else mode('a')}else $('#lmsg').textContent='ID atau password salah.'}catch(e){$('#lmsg').textContent='Browser tidak mendukung login ini.'}}
$('#go').onclick=login;$('#pw').onkeydown=e=>{if(e.key==='Enter')login()};
let zf='',zs='';
function zona(){
 const f=act(),el=$('#zona');
 if(!f){el.innerHTML='<p class="hint">Belum ada data.</p>';return}
 const A=f.rows.filter(r=>!/NON/i.test(r.status));
 const Z=A.filter(r=>r.pct<50).sort((a,b)=>a.pct-b.pct||b.alpa-a.alpa||a.nama.localeCompare(b.nama));
 const hs=[...new Set(Z.map(r=>r.halaqah))].sort();if(zf&&!hs.includes(zf))zf='';
 const L=Z.filter(r=>(!zf||r.halaqah===zf)&&(!zs||(tr(r).st||'belum')===zs)),sv=r=>r.pct===0?['Kritis','k']:r.pct<25?['Parah','p']:['Waspada','w'];zl=L.slice();
 const kp=(l,v,s,c)=>`<div class="st"><span>${l}</span><b class="${c||''}">${v}</b><small style="color:var(--mut)">${s||''}</small></div>`;
 el.innerHTML=`<div class="glass dc"><h3>🚨 Daftar Zona Merah <small>khusus admin · bahan evaluasi</small></h3>
 <p class="leg" style="margin:0 0 12px">Urutan dari persentase kehadiran terendah; bila sama, alpa terbanyak lebih dulu. Santri non aktif tidak disertakan. SP hanya diterbitkan untuk kategori Parah dan Kritis (&lt; 25%); kategori Waspada hanya dipantau.</p>
 <div class="stats" style="margin-top:0">${kp('Santri Zona Merah',Z.length,f1(Z.length/(A.length||1)*100)+'% dari santri aktif','bad')}${kp('Rata-rata Kehadiran',f1(avgOf(Z,'pct'))+'%','kelompok zona merah','bad')}${kp('Kritis / Parah (&lt; 25%)',Z.filter(r=>r.pct<25).length,'menerima SP','bad')}${kp('Total Alpa',Z.reduce((s,r)=>s+r.alpa,0)+'×','seluruh zona merah')}${kp('Belum Dipanggil',Z.filter(r=>!tr(r).st||tr(r).st==='belum').length,'surat belum terbit','mid')}${kp('Sudah Hadir',Z.filter(r=>/hadir|eval/.test(tr(r).st||'')).length,'datang saat pemanggilan','ok')}${kp('Sudah Dievaluasi',Z.filter(r=>tr(r).st==='eval').length,'dari '+Z.length+' santri','ok')}</div>
 ${rekap()}${ttdUI()}<div class="zbar"><select id="zh"><option value="">Semua halaqah (${Z.length})</option>${hs.map(h=>`<option value="${esc(h)}"${h===zf?' selected':''}>${esc(h)} (${Z.filter(r=>r.halaqah===h).length})</option>`).join('')}</select><select id="zs"><option value="">Semua status pemanggilan</option>${Object.entries(ST).map(([k,v])=>`<option value="${k}"${k===zs?' selected':''}>${v[0]} (${Z.filter(r=>(tr(r).st||'belum')===k).length})</option>`).join('')}</select><label class="ztg" title="Dicantumkan di setiap surat SP">Target kehadiran di surat <input type="number" id="ztg" min="1" max="100" value="${TG()}">%</label><button class="btn g" id="zall">📄 Unduh semua SP (${L.filter(isP).length})</button><button class="btn d" id="zrs">${rsC==='ALL'?'Yakin reset semua?':'↺ Reset semua status'}</button><button class="btn d" id="zx">🔒 Keluar Admin</button></div><div class="zm" id="zm"></div></div>
 ${L.length?L.map((r,i)=>{const s=sv(r);return `<div class="zw"><div class="zr"><div class="zn">${i+1}</div><div class="zi"><b>${esc(r.nama)}</b><small>${esc(r.halaqah)} · Angkatan ${esc(r.angkatan)} · ${r.gender==='L'?'Putra':'Putri'}</small>
 <div class="track"><div class="fill" data-w="${r.pct}" style="background-color:var(--bad)"></div></div>
 <div class="zs"><span>Hadir ${r.hadir}</span><span>Izin ${r.izin}</span><span class="bad"><b>Alpa ${r.alpa}</b></span><span>dari ${r.total} pertemuan</span></div></div>
 <div class="zp"><b class="bad">${f1(r.pct)}%</b><span class="sv ${s[1]}">${s[0]}</span></div></div>${trk(r)}</div>`}).join(''):'<p class="hint">Tidak ada santri di zona merah. 🎉</p>'}`;
 requestAnimationFrame(()=>setTimeout(()=>el.querySelectorAll('.fill').forEach(e=>e.style.width=Math.max(+e.dataset.w,2)+'%'),60));
}
$('#zona').addEventListener('toggle',e=>{if(e.target.id==='ttd')ttdO=e.target.open},true);
$('#zona').onchange=e=>{const t=e.target;if(t.dataset.tsc){ttdSc(t.dataset.tsc,+t.value);return}if(t.dataset.ttd){ttdUp(t);return}if(t.id==='ztg'){(track._cfg=track._cfg||{}).target=Math.min(100,Math.max(1,+t.value||60));tsave()}else if(t.id==='zh'){zf=t.value;zona()}else if(t.id==='zs'){zs=t.value;zona()}else if(t.dataset.f){const r=zr(t);if(!r)return;let v=t.value;if(t.dataset.f==='sp')v=+v;ts(r,{[t.dataset.f]:v});tsave();if(t.dataset.f!=='cat')zona()}};
$('#zona').onclick=e=>{const xx=e.target.closest('[data-ttdx]');if(xx){ttdSet(xx.dataset.ttdx,null);return}const b=e.target.closest('[data-a]');if(b){const r=zr(b);if(r){const a=b.dataset.a;if(a==='rs'){if(rsC===kk(r)){delete track[kk(r)];rsC='';tsave();zona()}else{rsC=kk(r);zona();setTimeout(()=>{if(rsC){rsC='';zona()}},4000)}}else(a==='dl'?dl:sh)([r])}}if(e.target.id==='zrs'){if(rsC==='ALL'){Object.keys(track).filter(k=>k.startsWith(act().id+'|')).forEach(k=>delete track[k]);rsC='';tsave();zona()}else{rsC='ALL';zona();setTimeout(()=>{if(rsC){rsC='';zona()}},4000)}}if(e.target.id==='zall')dl(zl.filter(isP));if(e.target.id==='zx'){admin=false;try{sessionStorage.clear()}catch(e){}$('#tR').click()}};
const wr=()=>$('.wrap'),tabs=k=>{['tR','tD','tZ','tL','tQ','tM','tA','tB','tT'].forEach(x=>$('#'+x).className=x===k?'on':'');if(k!=='tA')wr().classList.remove('arv');if(k!=='tT')wr().classList.remove('tgv');if(k!=='tB')wr().classList.remove('bnv');if(k!=='tQ')wr().classList.remove('qv');if(k!=='tM')wr().classList.remove('uv');try{sessionStorage.setItem('tab',k)}catch(e){}};
$('#tR').onclick=()=>{wr().classList.remove('dv','zv','lv');tabs('tR');mode($('#mA').className==='on'?'a':'s')};
$('#tD').onclick=()=>{wr().classList.remove('zv','lv');wr().classList.add('dv');tabs('tD');$('#login').hidden=true;dash();window.scrollTo(0,0)};
$('#tZ').onclick=()=>{wr().classList.remove('dv','lv');wr().classList.add('zv');tabs('tZ');window.scrollTo(0,0);
 if(admin){$('#login').hidden=true;zona()}else{$('#zona').innerHTML='';$('#login').hidden=false;$('#uid').focus()}};

const ST={belum:['Belum dipanggil'],surat:['Surat terbit · menunggu'],hadir:['Hadir · belum dievaluasi'],eval:['Sudah dievaluasi'],tidak:['Tidak hadir'],izin:['Izin · jadwal ulang']};
const LV={belum:0,surat:1,hadir:2,eval:3,tidak:1,izin:1},NOPRE='Un.05/DMK-MTQ',KETUA='Ust. Ahmad Satria, S.Ag.';let zl=[],tm,rsC='';
const kk=r=>act().id+'|'+r.nama,tr=r=>track[kk(r)]||{},ts=(r,o)=>{track[kk(r)]=Object.assign(track[kk(r)]||{},o)};
const zr=el=>{const n=el.closest('[data-n]');return n&&zl.find(r=>r.nama===n.dataset.n)};
const tsave=()=>{clearTimeout(tm);$('#zm')&&($('#zm').textContent='Menyimpan perubahan…');tm=setTimeout(()=>{const z=$('#zm');if(true){save();if(z)z.textContent=$('#msg').textContent}else{try{localStorage.setItem('trk',JSON.stringify(track));if(z)z.textContent='✔ Tersimpan di browser ini (halaman lokal).'}catch(e){if(z)z.textContent='Gagal menyimpan lokal.'}}},1200)};
const TG=()=>Math.min(100,Math.max(1,+(track._cfg&&track._cfg.target)||60));
const lb=n=>String(n).replace(/^.*?-\s*/,''),isP=r=>r.pct<25;
const hist=r=>{const i=files.indexOf(act()),o=[];for(let j=0;j<i;j++){const t=track[files[j].id+'|'+r.nama];if(t&&t.no)o.push({f:files[j].name,n:t.noSp||1,st:t.st})}return o};
const spL=r=>Math.min(Math.max(0,...hist(r).map(h=>h.n))+1,3);
function rekap(){const m=new Map();files.forEach(f=>f.rows.forEach(r=>{const t=track[f.id+'|'+r.nama];if(t&&t.no){if(!m.has(r.nama))m.set(r.nama,{h:r.halaqah,l:[]});m.get(r.nama).l.push({f:f.name,n:t.noSp||1,st:t.st||'surat'})}}));
 const mx=v=>Math.max(...v.l.map(q=>q.n)),a=[...m.entries()].sort((x,y)=>mx(y[1])-mx(x[1])||x[0].localeCompare(y[0]));
 return `<details class="rk2"><summary>📋 Rekap riwayat SP · ${a.length} santri pernah menerima SP</summary>${a.length?a.map(([n,v])=>`<div class="rkr"><b>${esc(n)}</b><small>${esc(v.h)}</small><span>${v.l.map(q=>`<i class="s${q.n}">SP-${q.n} · ${esc(lb(q.f))} · ${esc((ST[q.st]||ST.surat)[0])}</i>`).join('')}</span></div>`).join(''):'<p class="hint" style="text-align:left">Belum ada SP terbit. SP tercatat otomatis saat suratnya diunduh.</p>'}</details>`}
const spN=r=>tr(r).sp||spL(r),sev=r=>r.pct===0?'Kritis':r.pct<25?'Parah':'Waspada';
const tglID=d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
const RM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function trk(r){const t=tr(r),st=t.st||'belum',lv=LV[st],n=spN(r),P=isP(r),H=hist(r);zl.includes(r)||zl.push(r);
 const step=(i,l)=>`<span class="${lv>=i?(i===2&&st==='tidak'?'':'d'):''}${i===2&&st==='tidak'?'x':''}">${i===2&&st==='tidak'?'✖ Tidak hadir':(lv>=i?'✔ ':'')+l}</span>`;
 const hx=H.length?`<span class="hx p">⚠ Pernah SP-${Math.max(...H.map(h=>h.n))} · ${H.map(h=>'SP-'+h.n+' ('+esc(lb(h.f))+')').join(', ')}</span>`:'<span class="hx">Belum pernah SP</span>';
 return `<div class="zt" data-n="${esc(r.nama)}"><div class="stp">${step(1,P?'Surat terbit':'Dipanggil')}${step(2,'Hadir pemanggilan')}${step(3,'Dievaluasi')}${hx}</div>
 <div class="zf">${P?`<select data-f="sp" title="Tingkat SP">${[1,2,3].map(i=>`<option value="${i}"${i===n?' selected':''}>SP-${i}</option>`).join('')}</select>`:'<select disabled><option>Tanpa SP</option></select>'}
 <select data-f="st">${Object.entries(ST).map(([k,v])=>`<option value="${k}"${k===st?' selected':''}>${k==='surat'&&!P?'Dipanggil · menunggu':v[0]}</option>`).join('')}</select>
 <input type="date" data-f="tgl" value="${esc(t.tgl||'')}" title="Tanggal pemanggilan">
 <input class="cat" data-f="cat" value="${esc(t.cat||'')}" placeholder="Keterangan: alasan ketidakhadiran, hasil evaluasi, tindak lanjut…"></div>
 <div class="za">${P?`<button class="btn" data-a="dl">📄 Unduh SP-${n} (PDF)</button><button class="btn g" data-a="sh">📤 Bagikan</button>`:''}<button class="btn d" data-a="rs">${rsC===kk(r)?'Yakin reset?':'↺ Reset'}</button><small>${P?(t.no?'No. '+esc(t.no):'Nomor surat dibuat otomatis saat diunduh'):'Kategori Waspada (25–50%): hanya dipantau, SP tidak diterbitkan'}</small></div></div>`}
function issue(r){const t=tr(r),n=spN(r),now=new Date();
 if(!t.no||t.noSp!==n){const q=Math.max(0,...Object.values(track).map(x=>parseInt(x.no)||0))+1;ts(r,{no:String(q).padStart(3,'0')+'/'+NOPRE+'/SP-'+n+'/'+RM[now.getMonth()]+'/'+now.getFullYear(),noSp:n,tglSurat:now.toISOString().slice(0,10)})}
 if(!tr(r).st||tr(r).st==='belum')ts(r,{st:'surat'});return tr(r)}
function letter(d,r,f){const t=issue(r),n=spN(r),W=210,M=24,CW=W-2*M,im=[...document.querySelectorAll('.logos img')].reverse();let y=14;
 im.forEach((g,i)=>{const h=22,w=h*g.naturalWidth/g.naturalHeight;try{d.addImage(g.src,'PNG',i?W-M+4-w:M-4,y,w,h)}catch(e){}});
 d.setFont('times','bold');[['KEMENTERIAN AGAMA REPUBLIK INDONESIA',10.5],['UNIVERSITAS ISLAM NEGERI',11.5],['SUNAN GUNUNG DJATI BANDUNG',11.5],["MA'HAD TAHFIDZ AL-QUR'AN",13],['DEWAN MAJLIS KETAHFIDZAN',11.5]].forEach(([x,z],i)=>{d.setFontSize(z);d.text(x,W/2,y+4+i*4.9,{align:'center',maxWidth:CW-30})});
 d.setFont('times','normal');d.setFontSize(8.5);d.setTextColor(60,60,60);const AD=['Jl. Raya Cileunyi RT.001 RW.021 Kel. Cileunyi Wetan, Kab. Bandung, 40622, +62 821-8134-4345','E-mail : mahad.tahfidz@uinsgd.ac.id'];AD.forEach((x,i)=>d.text(x,W/2,y+30.2+i*3.7,{align:'center'}));d.setTextColor(0,0,0);
 y=y+30.2+(AD.length-1)*3.7+3;d.setLineWidth(.9);d.line(M-4,y,W-M+4,y);d.setLineWidth(.3);d.line(M-4,y+1.2,W-M+4,y+1.2);
 y+=12;d.setFont('times','bold');d.setFontSize(13);d.text('SURAT PERINGATAN KE-'+n+' (SP-'+n+')',W/2,y,{align:'center'});const tw=d.getTextWidth('SURAT PERINGATAN KE-'+n+' (SP-'+n+')');d.line(W/2-tw/2,y+1,W/2+tw/2,y+1);
 d.setFont('times','normal');d.setFontSize(11);d.text('Nomor : '+t.no,W/2,y+6.5,{align:'center'});y+=17;
 const P=(x,w=CW,lh=5.4)=>{const L=d.splitTextToSize(x,w);d.text(L,M,y);y+=L.length*lh+2};
 P("Assalamu'alaikum Warahmatullahi Wabarakatuh,");
 P('Berdasarkan rekapitulasi presensi halaqah periode '+f.name+', Dewan Majlis Ketahfidzan Ma\'had Tahfidz Al-Qur\'an UIN Sunan Gunung Djati Bandung menyampaikan bahwa mahasantri berikut:');
 [['Nama',r.nama],['NIM / Smt',r.nim||'-'],['Halaqah',r.halaqah],['Angkatan',r.angkatan||'-'],['Kehadiran',f1(r.pct)+'% (Hadir '+r.hadir+', Izin '+r.izin+', Alpa '+r.alpa+' dari '+r.total+' pertemuan)'],['Zona',"Merah · kategori "+sev(r)]].forEach(([a,b])=>{const L=d.splitTextToSize(String(b),CW-52);d.text(a,M+6,y);d.text(':',M+34,y);d.text(L,M+38,y);y+=L.length*5.4});
 y+=3;const tl=t.tgl?tglID(new Date(t.tgl+'T00:00:00')):null;
 P('berada pada zona merah karena tingkat kehadiran di bawah batas minimal 50%. Sehubungan dengan hal tersebut, kami menerbitkan Surat Peringatan ke-'+n+' (SP-'+n+') sebagai '+({1:'peringatan pertama dan bentuk pembinaan',2:'peringatan kedua karena belum terlihat perbaikan kehadiran',3:"peringatan ketiga (terakhir); apabila tidak ada perbaikan akan ditindaklanjuti sesuai ketentuan yang berlaku di Ma'had"})[n]+'.');
 P('Kami meminta saudara/i untuk:');
 [tl?'Menghadap Dewan Majlis Ketahfidzan pada '+tl+' untuk dievaluasi dan dibina.':'Menghadap Dewan Majlis Ketahfidzan pada waktu yang akan diinformasikan kemudian untuk dievaluasi dan dibina.','Hadir halaqah secara konsisten dan meningkatkan kehadiran hingga minimal '+TG()+'%.','Berkoordinasi dengan musyrif/ah halaqah terkait kejar hafalan yang tertinggal.'].forEach((x,i)=>{const L=d.splitTextToSize(x,CW-10);d.text((i+1)+'.',M+4,y);d.text(L,M+10,y);y+=L.length*5.4});
 y+=2;P("Demikian surat peringatan ini disampaikan agar dilaksanakan dengan penuh tanggung jawab. Jazakumullahu khairan.");P("Wassalamu'alaikum Warahmatullahi Wabarakatuh.");
 y+=4;const X=W-M-62;d.text('Bandung, '+tglID(t.tglSurat?new Date(t.tglSurat+'T00:00:00'):new Date()),X,y);d.text('Ketua Dewan Majlis Ketahfidzan,',X,y+5.5);
 {const tt=ttdGet('ketua');if(tt){const sc=Math.min(48/tt.w,22/tt.h)*(tt.s||1);try{d.addImage(tt.d,'PNG',X,y+28-tt.h*sc,tt.w*sc,tt.h*sc)}catch(e){}}}y+=30;d.setFont('times','bold');d.text(KETUA,X,y);const kw=d.getTextWidth(KETUA);d.setLineWidth(.3);d.line(X,y+1,X+kw,y+1);
 d.setFont('times','normal');d.setFontSize(9.5);d.text('Tembusan: 1. Musyrif/ah halaqah ('+r.halaqah+');  2. Arsip.',M,285-4)}
async function mk(list){const f=act(),d=new window.jspdf.jsPDF({unit:'mm',format:'a4'});list.forEach((r,i)=>{if(i)d.addPage();letter(d,r,f)});return d}
const fname=l=>l.length===1?'SP-'+spN(l[0])+'_'+l[0].nama.replace(/[^\w]+/g,'_')+'.pdf':'SP_Zona_Merah_'+l.length+'_santri.pdf';
async function dl(list){const z=$('#zm');if(!list.length)return;if(!window.jspdf){z.textContent='Pustaka PDF belum termuat, periksa koneksi.';return}
 try{const d=await mk(list),dn=window.claude&&claude.use?await claude.use('downloads'):null;
  const bl=d.output('blob');if(dn)await dn.save({filename:fname(list),data:bl});else{const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=fname(list);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}z.textContent='✔ PDF siap. Surat berstatus "Surat terbit".';tsave();zona()}
 catch(e){z.textContent=e&&e.code==='declined'?'Unduhan dibatalkan.':'Gagal membuat PDF: '+(e&&e.message||e)}}
async function sh(list){const z=$('#zm');try{const d=await mk(list),fl=new File([d.output('blob')],fname(list),{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[fl]})){await navigator.share({files:[fl],title:'Surat Peringatan Tahfidz'});tsave();zona()}
  else{z.textContent='Berbagi langsung tidak didukung di browser ini; PDF diunduh, silakan kirim manual.';await dl(list)}}
 catch(e){if(e&&e.name!=='AbortError')z.textContent='Gagal berbagi: '+(e.message||e)}}

const pdfOut=async(d,fn)=>{const bl=d.output('blob'),dn=window.claude&&claude.use?await claude.use('downloads'):null;if(dn)await dn.save({filename:fn,data:bl});else{const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}};
function certCard(r,f){const k=RK(f).rank(r);if(!(k>=1&&k<=10))return '';
 return `<div class="cc"><span class="ccb">🏆</span><div><b>Selamat! Peringkat ${k} dari ${RK(f).nA} santri</b><br>Kamu masuk 10 besar santri terbaik. Unduh sertifikat penghargaanmu.</div><button class="btn" data-cert="${esc(r.nama)}">🏆 Unduh Sertifikat</button></div>`}
const BL={JAN:'Januari',FEB:'Februari',MAR:'Maret',APR:'April',MEI:'Mei',MAY:'Mei',JUN:'Juni',JUL:'Juli',AGU:'Agustus',AGT:'Agustus',AUG:'Agustus',SEP:'September',SEPT:'September',OKT:'Oktober',OCT:'Oktober',NOV:'November',NOP:'November',DES:'Desember',DEC:'Desember',JANUARI:'Januari',FEBRUARI:'Februari',MARET:'Maret',JUNI:'Juni',JULI:'Juli',AGUSTUS:'Agustus',SEPTEMBER:'September',OKTOBER:'Oktober',NOVEMBER:'November',DESEMBER:'Desember'};
const perFull=n=>lb(n).replace(/\b[A-Za-z]{3,9}\b/g,m=>BL[m.toUpperCase()]||m);
const ttdGet=k=>track._cfg&&track._cfg.ttd&&track._cfg.ttd[k];let ttdO=false;
const ttdSet=(k,v)=>{const c=track._cfg=track._cfg||{};c.ttd=c.ttd||{};if(v)c.ttd[k]=v;else delete c.ttd[k];ttdO=true;tsave();zona()};
function ttdUp(t){const fl=t.files[0];if(!fl)return;const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{
 const sc=Math.min(1,900/im.width),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));const x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);
 try{const id=x.getImageData(0,0,c.width,c.height),p=id.data;let x0=c.width,y0=c.height,x1=0,y1=0;
  for(let i=0;i<p.length;i+=4){const mn=Math.min(p[i],p[i+1],p[i+2]),al=p[i+3]*Math.min(1,(255-mn)/45);p[i+3]=al;if(al>24){const q=i/4,px=q%c.width,py=(q/c.width)|0;if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py}}
  if(x1>x0&&y1>y0){x.putImageData(id,0,0);const pd=3,a0=Math.max(0,x0-pd),b0=Math.max(0,y0-pd),cw=Math.min(c.width,x1+pd)-a0,ch=Math.min(c.height,y1+pd)-b0,k=Math.min(1,700/cw),o=document.createElement('canvas');o.width=Math.max(1,Math.round(cw*k));o.height=Math.max(1,Math.round(ch*k));o.getContext('2d').drawImage(c,a0,b0,cw,ch,0,0,o.width,o.height);ttdSet(t.dataset.ttd,{d:o.toDataURL('image/png'),w:o.width,h:o.height,s:1});return}}catch(e){}
 ttdSet(t.dataset.ttd,{d:c.toDataURL('image/png'),w:c.width,h:c.height,s:1})};im.src=fr.result};fr.readAsDataURL(fl)}
const ttdSc=(k,v)=>{const t=ttdGet(k);if(!t)return;t.s=Math.max(.4,Math.min(3,v/100));ttdO=true;tsave();zona()};
function ttdUI(){const hs=[...new Set(act().rows.map(r=>r.halaqah).filter(Boolean))].sort(),bs='padding:6px 10px;font-size:11px',row=(k,l)=>{const t=ttdGet(k);return `<div class="rkr"><b>${esc(l)}</b><small>${t?'<img src="'+t.d+'" style="height:30px;background:#fff;border-radius:6px;padding:2px">':'Belum ada'}</small><label class="btn g" style="${bs}">${t?'Ganti':'Unggah'}<input type="file" accept="image/*" data-ttd="${esc(k)}" hidden></label>${t?`<button class="btn d" data-ttdx="${esc(k)}" style="${bs}">Hapus</button><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mut)">Ukuran<input type="range" min="40" max="300" step="10" value="${Math.round((t.s||1)*100)}" data-tsc="${esc(k)}" style="width:90px">${Math.round((t.s||1)*100)}%</span>`:''}</div>`};
 return `<details class="rk2" id="ttd"${ttdO?' open':''}><summary>✍️ Tanda tangan digital · opsional (muncul di sertifikat &amp; surat)</summary><p class="hint" style="text-align:left;margin:8px 0 0">Unggah foto/scan tanda tangan; margin kosong dipotong dan latar putih dibuat transparan otomatis. Atur besarnya dengan penggeser Ukuran. Tanpa unggahan, ruang tanda tangan dibiarkan kosong untuk tanda tangan basah.</p>${row('ketua','Ketua · '+KETUA)}${row('direktur','Direktur · '+DIR)}${hs.map(h=>row(h,'Mentor · '+h)).join('')}</details>`}
async function bism(){try{await document.fonts.load('700 80px Amiri')}catch(e){}const c=document.createElement('canvas');c.width=1000;c.height=240;const x=c.getContext('2d');x.font='700 120px Amiri, serif';x.textAlign='center';x.textBaseline='middle';x.direction='rtl';x.fillStyle='#2f3746';x.fillText('بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ',500,125);return c.toDataURL('image/png')}
async function certPdf(r,f){const d=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),W=297,H=210,cx=W/2,k=RK(f).rank(r),N=RK(f).nA,SL=[63,71,86],SD=[47,55,70],GL=[226,198,122],GD=[190,163,98],INK=[22,28,38],GR=[90,98,110],per=lb(f.name);
 const fc=c=>d.setFillColor(...c),dc=c=>d.setDrawColor(...c),tc=c=>d.setTextColor(...c),poly=(c,p)=>{fc(c);d.lines(p.slice(1).map((q,i)=>[q[0]-p[i][0],q[1]-p[i][1]]),p[0][0],p[0][1],[1,1],'F',true)},mir=p=>p.map(q=>[W-q[0],q[1]]);
 fc([255,255,255]);d.rect(0,0,W,H,'F');
 [[GD,[[28,25.5],[86,2],[2,86]]],[GL,[[31.5,2],[86,2],[28,25.5]]],[GL,[[2,33],[28,25.5],[2,86]]],[SL,[[2,2],[31.5,2],[28,25.5],[2,33]]]].forEach(([c,p])=>{poly(c,p);poly(c,mir(p))});
 fc(SD);d.rect(0,H-13.4,W,4.2,'F');fc(SL);d.rect(0,H-9.2,W,4.2,'F');fc(GD);d.rect(0,H-5,W,5,'F');
 const L=[...document.querySelectorAll('.logos img')],uin=L.find(g=>/UIN Sunan/i.test(g.alt))||L[1],mh=L.find(g=>/Ma'?had/i.test(g.alt))||L[0];
 [[uin,0],[mh,1]].forEach(([g,i])=>{if(!g)return;const h=19,w=h*g.naturalWidth/g.naturalHeight;try{d.addImage(g.src,'PNG',i?cx+5:cx-5-w,8,w,h)}catch(e){}});
 dc(GD);d.setLineWidth(.5);d.line(cx,10,cx,25);
 d.setFont('helvetica','bold');tc(SD);d.setFontSize(12.5);d.text("Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung",cx,33,{align:'center'});
 try{d.addImage(await bism(),'PNG',cx-32,35.5,64,15.4)}catch(e){}
 d.setFontSize(32);tc(INK);d.text('SERTIFIKAT PENGHARGAAN',cx,63,{align:'center'});
 d.setFont('helvetica','normal');d.setFontSize(8.5);tc(GR);d.text('Nomor : '+String(k).padStart(3,'0')+'/'+NOPRE+'/SERT/'+per.replace(/\s+/g,'-'),cx,69,{align:'center'});
 d.setFontSize(14);tc(INK);d.text('Diberikan kepada :',cx,79,{align:'center'});
 d.setFont('helvetica','bolditalic');let z=34;d.setFontSize(z);while(d.getTextWidth(r.nama)>205&&z>18){z-=2;d.setFontSize(z)}d.text(r.nama,cx,95,{align:'center'});
 dc(GD);d.setLineWidth(.7);d.line(cx-58,100,cx-5,100);d.line(cx+5,100,cx+58,100);fc(GD);d.lines([[2.4,2.4],[-2.4,2.4],[-2.4,-2.4],[2.4,-2.4]],cx,97.6,[1,1],'F',true);
 {const tl='Sebagai Peringkat '+k+' Santri Terbaik di Bidang Ketahfidzan Periode '+perFull(f.name);d.setFont('helvetica','bold');tc(INK);let fz=14.5;d.setFontSize(fz);while(d.getTextWidth(tl)>235&&fz>10){fz-=.5;d.setFontSize(fz)}d.text(tl,cx,110,{align:'center'})}
 d.setFont('helvetica','normal');d.setFontSize(10.5);tc([50,58,70]);
 d.text(d.splitTextToSize("dari "+N+" santri aktif dengan nilai akhir rata-rata "+f1(r.avg)+" dan tingkat kehadiran "+f1(r.pct)+"%. Semoga ananda senantiasa diberi kemudahan untuk istiqomah muraja'ah dan menjaga hafalannya, serta menjadikan penghargaan ini motivasi untuk terus mendekat kepada Al-Qur'an. Aamiin.",205),cx,118,{align:'center',lineHeightFactor:1.5});
 const sg=(x,lab,nm,key)=>{d.setFont('helvetica','normal');d.setFontSize(10.5);tc(INK);d.text(lab,x,148,{align:'center'});const t=ttdGet(key);if(t){const sc=Math.min(46/t.w,21/t.h)*(t.s||1),w=t.w*sc,h=t.h*sc;try{d.addImage(t.d,'PNG',x-w/2,173-h,w,h)}catch(e){}}
  d.setFont('helvetica','bold');d.setFontSize(11.5);d.text(nm,x,179,{align:'center'});const kw=d.getTextWidth(nm);dc(GD);d.setLineWidth(.5);d.line(x-kw/2,180.4,x+kw/2,180.4)};
 sg(cx-76,'Ketua Dewan Majlis Ketahfidzan',KETUA,'ketua');sg(cx+76,'Mentor Halaqah',r.halaqah||'..............................',r.halaqah);
 const sy=164;fc(SD);d.triangle(cx-9,sy+6,cx-2,sy+8,cx-8,sy+21,'F');d.triangle(cx+9,sy+6,cx+2,sy+8,cx+8,sy+21,'F');
 d.circle(cx,sy,9.5,'F');dc(GL);d.setLineWidth(.7);d.circle(cx,sy,7.8,'S');
 {const s=String(k),fs=s.length>2?15:s.length>1?19:24;d.setFont('helvetica','bold');d.setFontSize(fs);tc(GL);d.text(s,cx,sy+fs*0.3528*0.36,{align:'center'})}
 d.setFont('helvetica','normal');d.setFontSize(9);tc(GR);d.text('Bandung, '+tglID(new Date()),cx,192,{align:'center'});
 return d}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-cert]');if(!b)return;const f=act(),r=f&&f.rows.find(x=>x.nama===b.dataset.cert);if(!r)return;const o=b.innerHTML;b.disabled=true;b.textContent='⏳ Menyiapkan…';
 try{if(!window.jspdf)throw new Error('Pustaka PDF belum termuat');await pdfOut(await certPdf(r,f),'Sertifikat_Top10_'+r.nama.replace(/[^\w]+/g,'_')+'.pdf');b.textContent='✔ Sertifikat siap'}catch(err){b.textContent=err&&err.code==='declined'?'Dibatalkan':'✖ Gagal: '+(err&&err.message||err)}
 setTimeout(()=>{b.disabled=false;b.innerHTML=o},3000)});

const MBG="assets/img3.jpg";
const hRank=f=>{const A=f.rows.filter(r=>!/NON/i.test(r.status));return grp(A,'halaqah').sort((a,b)=>b.avg-a.avg)};
const ldImg=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('Gambar gagal dimuat'));i.src=s});
async function mentorCert(g,k,f){
 try{await Promise.all(['400 40px Montserrat','500 40px Montserrat','700 40px Montserrat','800 40px Montserrat'].map(x=>document.fonts.load(x)))}catch(e){}
 const W=2000,H=1414,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),per=perFull(f.name),cx=W/2,FF='Montserrat, "Plus Jakarta Sans", Arial, sans-serif',INK='#222',OR='#e8622c';
 x.drawImage(await ldImg(MBG),0,0,W,H);x.textAlign='center';x.textBaseline='alphabetic';
 const fit=(t,wt,sz,mw,min)=>{let s=sz;x.font=wt+' '+s+'px '+FF;while(x.measureText(t).width>mw&&s>min){s-=2;x.font=wt+' '+s+'px '+FF}return s};
 // kop
 x.fillStyle=INK;fit("MA'HAD TAHFIDZ AL-QUR'AN",'800',60,1240,36);x.fillText("MA'HAD TAHFIDZ AL-QUR'AN",cx,148);
 fit('UIN SUNAN GUNUNG DJATI BANDUNG','800',60,1240,36);x.fillText('UIN SUNAN GUNUNG DJATI BANDUNG',cx,206);
 const AD='Jl. Raya Cileunyi RT.001 RW.021 Kel. Cileunyi Wetan, Kab. Bandung, 40622 · Telp. +62 821-8134-4345';fit(AD,'400',28,1300,20);x.fillText(AD,cx,252);
 // diberikan kepada + nama
 fit('Diberikan Kepada','400',38,900,30);x.fillText('Diberikan Kepada',cx,458);
 x.fillStyle=INK;fit(g.k,'700',90,1200,48);x.fillText(g.k,cx,544);
 // bar
 x.fillStyle='#fff';fit('MENTOR HALAQAH','500',30,380,20);if('letterSpacing' in x)x.letterSpacing='5px';x.fillText('MENTOR HALAQAH',cx+2,594);if('letterSpacing' in x)x.letterSpacing='0px';
 // isi
 x.fillStyle=INK;fit('Telah ditetapkan sebagai:','400',38,900,30);x.fillText('Telah ditetapkan sebagai:',cx,672);
 const B1='Mentor Halaqah Terbaik',B2='di Bidang Ketahfidzan';let bs=Math.min(fit(B1,'700',54,1300,34),fit(B2,'700',54,1300,34));x.font='700 '+bs+'px '+FF;x.fillText(B1,cx,724);x.fillText(B2,cx,724+bs*1.12);
 const P2='Periode '+per+', nilai rata-rata santri '+f1(g.avg)+' dan dinyatakan:';fit(P2,'400',38,1300,26);x.fillText(P2,cx,862);
 fit('“PERINGKAT '+k+'”','700',66,900,40);x.fillText('“PERINGKAT '+k+'”',cx,934);
 // medali peringkat
 const mx=678,my=1125,rg=x.createRadialGradient(mx-30,my-34,10,mx,my,128);rg.addColorStop(0,'#f58a4f');rg.addColorStop(1,'#d9480f');
 x.beginPath();x.arc(mx,my,128,0,7);x.fillStyle=rg;x.fill();x.lineWidth=12;x.strokeStyle='#fdc20f';x.stroke();x.beginPath();x.arc(mx,my,104,0,7);x.lineWidth=4;x.strokeStyle='rgba(255,255,255,.85)';x.stroke();
 x.fillStyle='#fff';x.textBaseline='middle';x.font='800 '+(String(k).length>1?110:150)+'px '+FF;x.fillText(String(k),mx,my+8);x.textBaseline='alphabetic';
 x.fillStyle=INK;fit('No. '+String(k).padStart(3,'0')+'/'+NOPRE+'/SERT-MTR','700',28,520,18);x.fillText('No. '+String(k).padStart(3,'0')+'/'+NOPRE+'/SERT-MTR',mx,1290);
 // kanan: tanggal & ttd Dewan Ketahfidzan
 x.textAlign='left';const rx=1106;
 x.fillStyle=INK;x.font='700 31px '+FF;x.fillText('Bandung, '+tglID(new Date()),rx,1027);
 x.font='400 31px '+FF;x.fillText('Mengetahui,',rx,1086);x.fillText('Dewan Ketahfidzan',rx,1124);
 const t=ttdGet('ketua');if(t){const sc=Math.min(300/t.w,100/t.h)*(t.s||1),w=t.w*sc,hh=t.h*sc;try{x.drawImage(await ldImg(t.d),rx,1240-hh,w,hh)}catch(e){}}
 fit(KETUA,'700',31,520,22);x.fillText(KETUA,rx,1272);
 const d=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});d.addImage(c.toDataURL('image/jpeg',.93),'JPEG',0,0,297,210);return d}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-hcert]');if(!b)return;const f=act();if(!f)return;const R=hRank(f),i=R.findIndex(g=>g.k===b.dataset.hcert);if(i<0||i>2)return;const o=b.innerHTML;b.disabled=true;b.textContent='⏳ Menyiapkan…';
 try{if(!window.jspdf)throw new Error('Pustaka PDF belum termuat');await pdfOut(await mentorCert(R[i],i+1,f),'Sertifikat_Mentor_Peringkat'+(i+1)+'_'+R[i].k.replace(/[^\w]+/g,'_')+'.pdf');b.textContent='✔ Sertifikat siap'}catch(err){b.textContent=err&&err.code==='declined'?'Dibatalkan':'✖ Gagal: '+(err&&err.message||err)}
 setTimeout(()=>{b.disabled=false;b.innerHTML=o},3000)});

/* ===== LAPORAN ANALISIS ===== */
const LC={g:'#2f9e6e',y:'#e0a030',r:'#d64550',b:'#3b82c4',o:'#c9a13b'},lcT=v=>v<50?LC.r:v<75?LC.y:LC.g;
const lN=(a,k)=>a.map(r=>+r[k]||0),f2=n=>(Math.round(n*100)/100).toFixed(2).replace('.',',');
const lMed=(a,k)=>{const s=lN(a,k).sort((x,y)=>x-y),m=s.length>>1;return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):0};
const lSd=(a,k)=>{const m=avgOf(a,k);return Math.sqrt(lN(a,k).reduce((s,v)=>s+(v-m)**2,0)/(a.length||1))};
const lR=(a,k1,k2)=>{const x=lN(a,k1),y=lN(a,k2),mx=avgOf(a,k1),my=avgOf(a,k2);let p=0,q=0,s=0;x.forEach((v,i)=>{p+=(v-mx)*(y[i]-my);q+=(v-mx)**2;s+=(y[i]-my)**2});return q&&s?p/Math.sqrt(q*s):0};
const lStr=r=>{const a=Math.abs(r);return a<.2?'sangat lemah':a<.4?'lemah':a<.6?'sedang':a<.8?'kuat':'sangat kuat'};
const lGrp=(A,key)=>{const m={};A.forEach(r=>(m[r[key]]=m[r[key]]||[]).push(r));return Object.keys(m).map(k=>{const v=m[k];return{k,n:v.length,pct:avgOf(v,'pct'),cap:avgOf(v,'nCap'),avg:avgOf(v,'avg'),red:v.filter(r=>r.pct<50).length,crit:v.filter(r=>r.pct<25).length}})};
const lBin=(a,k,e,l)=>l.map((x,i)=>({l:x,v:a.filter(r=>r[k]>=e[i]&&r[k]<e[i+1]).length}));
function lapModel(f){
 const A=f.rows.filter(r=>!/NON/i.test(r.status)),n=A.length||1,NA=f.rows.length-A.length,per=perFull(f.name),nw=new Date();
 const Z=A.filter(r=>r.pct<50),Pz=A.filter(isP),Kz=A.filter(r=>r.pct===0),Wz=Z.length-Pz.length;
 const pM=avgOf(A,'pct'),pMd=lMed(A,'pct'),pSd=lSd(A,'pct'),cM=avgOf(A,'nCap'),cMd=lMed(A,'nCap'),cSd=lSd(A,'nCap'),aM=avgOf(A,'avg'),aMd=lMed(A,'avg'),aSd=lSd(A,'avg');
 const rPC=lR(A,'pct','nCap'),rPA=lR(A,'pct','avg'),pc=(x,y)=>y?f1(x/y*100)+'%':'-',gl=k=>k==='L'?'Putra':'Putri',tg=TG();
 const ang=lGrp(A,'angkatan').sort((a,b)=>a.k-b.k),hal=lGrp(A,'halaqah'),gen=lGrp(A,'gender');
 const hP=[...hal].sort((a,b)=>b.pct-a.pct),hA=[...hal].sort((a,b)=>b.avg-a.avg),hR=[...hal].sort((a,b)=>b.red/b.n-a.red/a.n||b.red-a.red),aP=[...ang].sort((a,b)=>b.pct-a.pct);
 const sH=A.reduce((s,r)=>s+r.hadir,0),sI=A.reduce((s,r)=>s+r.izin,0),sA=A.reduce((s,r)=>s+r.alpa,0),sT=sH+sI+sA||1;
 const al=[...A].sort((a,b)=>b.alpa-a.alpa),k10=Math.max(1,Math.ceil(n*.1)),sh10=sA?al.slice(0,k10).reduce((s,r)=>s+r.alpa,0)/sA*100:0;
 const g3=[['Tinggi (75% ke atas)',A.filter(r=>r.pct>=75)],['Sedang (50-74%)',A.filter(r=>r.pct>=50&&r.pct<75)],['Rendah / zona merah (di bawah 50%)',Z]];
 const HL=A.filter(r=>r.pct>=75&&r.nCap<25),cap0=A.filter(r=>r.nCap===0).length,cap50=A.filter(r=>r.nCap>=50).length;
 const pi=files.indexOf(f),pf=pi>0?files[pi-1]:null,PA=pf?pf.rows.filter(r=>!/NON/i.test(r.status)):null;
 const stc=k=>Z.filter(r=>((track[f.id+'|'+r.nama]||{}).st||'belum')===k).length;
 const sevc=s=>A.filter(r=>sev(r)===s).length;
 const top=[...A].filter(r=>RK(f).rank(r)>0).sort((a,b)=>RK(f).rank(a)-RK(f).rank(b)).slice(0,10);
 const M=[],P=x=>M.push({t:'p',x}),H1=x=>M.push({t:'h1',x}),H2=x=>M.push({t:'h2',x}),UL=(a,o)=>M.push({t:'ul',a,o}),NOTE=x=>M.push({t:'note',x}),T=(head,rows,w,al2,fs)=>M.push({t:'tbl',head,rows,w,al:al2,fs}),B=(items,max,sfx)=>M.push({t:'bars',items,max:max||100,sfx:sfx||''});
 const no='001/'+NOPRE+'/LAP/'+RM[nw.getMonth()]+'/'+nw.getFullYear(),dS=pM>=tg?'di atas':'di bawah';
 M.push({t:'title',a:['LAPORAN HASIL ANALISIS DATA','KEHADIRAN DAN CAPAIAN HAFALAN MAHASANTRI'],no,per,tgl:tglID(nw)});M.push({t:'toc'});M.push({t:'pb'});
 H1('Ringkasan Eksekutif');
 M.push({t:'kpi',items:[{v:n,l:'Mahasantri aktif'},{v:f1(pM)+'%',l:'Rata-rata kehadiran'},{v:f1(cM),l:'Rata-rata nilai capaian'},{v:f1(aM),l:'Rata-rata nilai akhir'},{v:Z.length,l:'Zona merah (<50%)'},{v:Pz.length,l:'Parah / kritis (<25%)'},{v:NA,l:'Non aktif'},{v:f2(rPC),l:'Korelasi hadir-capaian (r)'}]});
 M.push({t:'box',items:[`Pada periode ${per} tercatat ${n} mahasantri aktif dari ${f.rows.length} mahasantri terdaftar (${NA} non aktif). Rata-rata kehadiran halaqah ${f1(pM)}% (median ${f1(pMd)}%), ${dS} target ${tg}%. Rata-rata nilai capaian hafalan ${f1(cM)} dan nilai akhir ${f1(aM)} pada skala 100.`,`${Z.length} mahasantri (${pc(Z.length,n)} dari yang aktif) berada di zona merah; ${Pz.length} di antaranya parah/kritis (kehadiran di bawah 25%) dan memerlukan Surat Peringatan serta pemanggilan.`,'Temuan kunci:',`- Kehadiran tertinggi pada halaqah ${hP[0].k} (${f1(hP[0].pct)}%) dan terendah pada ${hP[hP.length-1].k} (${f1(hP[hP.length-1].pct)}%), selisih ${f1(hP[0].pct-hP[hP.length-1].pct)} poin.`,`- Kehadiran berhubungan ${lStr(rPC)} dengan capaian hafalan (r = ${f2(rPC)}): rata-rata capaian kelompok kehadiran tinggi ${f1(avgOf(g3[0][1],'nCap'))} berbanding ${f1(avgOf(g3[2][1],'nCap'))} pada zona merah.`,`- ${pc(HL.length,n)} mahasantri (${HL.length} orang) rajin hadir namun capaian hafalan masih rendah, sehingga perlu pendampingan metode, bukan sekadar kehadiran.`,'Keputusan yang diusulkan:',`- Menerbitkan SP dan memanggil ${Pz.length} mahasantri parah/kritis dalam 14 hari kerja.`,`- Pendampingan khusus pada halaqah dan angkatan dengan kinerja terendah (Bab 10).`,'- Menetapkan kehadiran sebagai indikator utama dan memantaunya mingguan.']});
 H1('1. Pendahuluan');H2('1.1 Latar Belakang');
 P(`Kehadiran halaqah dan capaian hafalan merupakan dua indikator utama pembinaan mahasantri di Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung. Laporan ini menyajikan hasil analisis data rekap tahfidz periode ${per} sebagai bahan pertimbangan Dewan Majlis Ketahfidzan dalam mengambil keputusan pembinaan, penanganan mahasantri berisiko, serta evaluasi halaqah.`);
 H2('1.2 Tujuan');UL(['Memetakan kondisi kehadiran, capaian hafalan, dan nilai akhir mahasantri secara menyeluruh.','Mengidentifikasi kelompok berisiko (zona merah) beserta sebarannya menurut halaqah, angkatan, dan jenis kelamin.','Menguji hubungan antara kehadiran dan capaian hafalan sebagai dasar penentuan prioritas kebijakan.','Merumuskan rekomendasi keputusan yang terukur, lengkap dengan penanggung jawab dan indikator keberhasilan.']);
 H2('1.3 Sumber Data dan Metodologi');
 P(`Sumber data adalah berkas rekap tahfidz "${f.name}" yang memuat ${f.rows.length} mahasantri. Analisis dilakukan secara deskriptif (rata-rata, median, simpangan baku, distribusi), komparatif antar kelompok, dan korelasional (Pearson). Definisi yang digunakan:`);
 UL([`Populasi analisis: mahasantri berstatus aktif (${n} orang). Mahasantri non aktif (${NA} orang) tidak dihitung dalam rata-rata, persentase, maupun peringkat.`,'Kehadiran (%): persentase total hadir terhadap total pertemuan pada rekap.','Nilai capaian: nilai akhir capaian hafalan pada rekap (skala 0-100).','Nilai akhir: rata-rata nilai akhir kehadiran dan nilai akhir capaian pada rekap.','Zona merah: kehadiran di bawah 50%. Kategori waspada 25-49%, parah di bawah 25%, dan kritis tepat 0%.']);
 H1('2. Gambaran Umum Populasi');
 P(`Dari ${f.rows.length} mahasantri terdaftar, ${n} aktif (${pc(n,f.rows.length)}) dan ${NA} non aktif. Komposisi mahasantri aktif terdiri dari ${gen.map(g=>g.n+' '+gl(g.k).toLowerCase()).join(' dan ')}, tersebar pada ${hal.length} halaqah dan ${ang.length} angkatan.`);
 T(['Kelompok','Jumlah','Persentase'],[...gen.map(g=>['Jenis kelamin - '+gl(g.k),g.n,pc(g.n,n)]),...ang.map(g=>['Angkatan '+g.k,g.n,pc(g.n,n)])],[60,20,20],['l','r','r']);
 H1('3. Analisis Kehadiran');H2('3.1 Statistik Deskriptif');
 T(['Ukuran','Kehadiran (%)','Nilai Capaian','Nilai Akhir'],[['Rata-rata',f1(pM),f1(cM),f1(aM)],['Median',f1(pMd),f1(cMd),f1(aMd)],['Simpangan baku',f1(pSd),f1(cSd),f1(aSd)],['Minimum',f1(Math.min(...lN(A,'pct'))),f1(Math.min(...lN(A,'nCap'))),f1(Math.min(...lN(A,'avg')))],['Maksimum',f1(Math.max(...lN(A,'pct'))),f1(Math.max(...lN(A,'nCap'))),f1(Math.max(...lN(A,'avg')))]],[34,22,22,22],['l','r','r','r']);
 P(`Rata-rata kehadiran ${f1(pM)}% ${dS} target ${tg}%. Simpangan baku ${f1(pSd)} poin menunjukkan ${pSd>25?'variasi antar mahasantri yang besar: sebagian sangat rajin dan sebagian sangat jarang hadir':'variasi antar mahasantri yang relatif terkendali'}.`);
 H2('3.2 Distribusi Kehadiran');
 const bp=lBin(A,'pct',[0,25,50,75,90,100.01],['0-24%','25-49%','50-74%','75-89%','90-100%']);
 B(bp.map((b,i)=>({l:b.l+' ('+b.v+' orang)',v:b.v/n*100,c:[LC.r,LC.r,LC.y,LC.g,LC.g][i]})),100,'%');
 P(`${pc(Z.length,n)} mahasantri berada di bawah batas 50%, sedangkan ${pc(bp[3].v+bp[4].v,n)} berada pada kehadiran 75% ke atas.`);
 H2('3.3 Komposisi Presensi');
 T(['Status','Jumlah','Persentase'],[['Hadir',sH,pc(sH,sT)],['Izin',sI,pc(sI,sT)],['Alpa',sA,pc(sA,sT)],['Total presensi',sT,'100%']],[40,24,24],['l','r','r']);
 P(`Ketidakhadiran terkonsentrasi: ${k10} mahasantri dengan alpa terbanyak (10% teratas) menyumbang ${f1(sh10)}% dari seluruh alpa. Intervensi yang menyasar kelompok kecil ini berpotensi menurunkan alpa secara signifikan.`);
 H2('3.4 Kehadiran per Angkatan');B(ang.map(g=>({l:'Angkatan '+g.k+' (n='+g.n+')',v:g.pct,c:lcT(g.pct)})),100,'%');
 P(`Angkatan ${aP[0].k} paling rajin (${f1(aP[0].pct)}%), sedangkan Angkatan ${aP[aP.length-1].k} terendah (${f1(aP[aP.length-1].pct)}%); selisih ${f1(aP[0].pct-aP[aP.length-1].pct)} poin.`);
 H2('3.5 Kehadiran menurut Jenis Kelamin');T(['Kelompok','Jumlah','Kehadiran (%)','Zona merah','% zona merah'],gen.map(g=>[gl(g.k),g.n,f1(g.pct),g.red,pc(g.red,g.n)]),[30,18,26,22,24],['l','r','r','r','r']);
 H2('3.6 Kehadiran per Halaqah');B(hP.map(g=>({l:g.k+' ('+g.n+')',v:g.pct,c:lcT(g.pct)})),100,'%');
 H1('4. Analisis Capaian Hafalan');
 const bc=lBin(A,'nCap',[0,1e-9,25,50,75,100.01],['0 (belum ada capaian)','> 0 - 24','25 - 49','50 - 74','75 - 100']);
 B(bc.map((b,i)=>({l:b.l+' ('+b.v+' orang)',v:b.v/n*100,c:[LC.r,LC.r,LC.y,LC.g,LC.g][i]})),100,'%');
 P(`Rata-rata nilai capaian ${f1(cM)} dengan median ${f1(cMd)}; nilai rata-rata yang lebih tinggi daripada median menandakan sebagian kecil mahasantri berprestasi menarik rata-rata ke atas. Terdapat ${cap0} mahasantri (${pc(cap0,n)}) tanpa capaian tercatat dan ${cap50} mahasantri (${pc(cap50,n)}) dengan capaian 50 ke atas.`);
 H2('4.1 Capaian per Angkatan dan Jenis Kelamin');T(['Kelompok','Jumlah','Kehadiran (%)','Nilai Capaian','Nilai Akhir'],[...ang.map(g=>['Angkatan '+g.k,g.n,f1(g.pct),f1(g.cap),f1(g.avg)]),...gen.map(g=>[gl(g.k),g.n,f1(g.pct),f1(g.cap),f1(g.avg)])],[30,16,26,26,22],['l','r','r','r','r']);
 H1('5. Analisis Nilai Akhir dan Predikat');
 const pr=['SANGAT BAIK','BAIK','CUKUP','KURANG','SANGAT KURANG'],pcl=[LC.g,'#8fd14f',LC.y,'#e8803a',LC.r];
 B(pr.map((p,i)=>{const c=A.filter(r=>r.predikat===p).length;return{l:p+' ('+c+' orang)',v:c/n*100,c:pcl[i]}}),100,'%');
 H2('5.1 Peringkat Halaqah menurut Rata-rata Nilai Akhir');
 T(['Peringkat','Halaqah','n','Kehadiran','Capaian','Nilai Akhir'],hA.map((g,i)=>[i+1,g.k,g.n,f1(g.pct),f1(g.cap),f1(g.avg)]),[14,56,8,18,16,18],['c','l','r','r','r','r']);
 H1('6. Analisis Hubungan Kehadiran dan Capaian');
 P(`Korelasi Pearson antara kehadiran dan nilai capaian adalah r = ${f2(rPC)} (hubungan ${lStr(rPC)} dan searah). Artinya mahasantri yang lebih rajin hadir cenderung memiliki capaian hafalan lebih tinggi, tetapi kehadiran saja tidak menjelaskan seluruh variasi capaian.`);
 T(['Kelompok kehadiran','n','Rata-rata capaian','Rata-rata nilai akhir'],g3.map(([l,a])=>[l,a.length,f1(avgOf(a,'nCap')),f1(avgOf(a,'avg'))]),[56,12,28,30],['l','r','r','r']);
 P(`Selisih rata-rata capaian antara kelompok kehadiran tinggi dan zona merah adalah ${f1(avgOf(g3[0][1],'nCap')-avgOf(g3[2][1],'nCap'))} poin. Sebanyak ${HL.length} mahasantri berkehadiran 75% ke atas namun bercapaian di bawah 25, yaitu kelompok yang memerlukan evaluasi metode hafalan dan bimbingan musyrif/ah.`);
 NOTE(`Catatan: korelasi kehadiran dengan nilai akhir (r = ${f2(rPA)}) sebagian bersifat mekanis karena nilai akhir memuat nilai kehadiran, sehingga korelasi kehadiran-capaian lebih tepat sebagai dasar interpretasi.`);
 H1('7. Analisis Zona Merah dan Risiko');
 T(['Kategori','Rentang kehadiran','Jumlah','% dari aktif','Penanganan'],[['Waspada','25 - 49%',sevc('Waspada'),pc(sevc('Waspada'),n),'Dipantau, pembinaan'],['Parah','1 - 24%',sevc('Parah'),pc(sevc('Parah'),n),'SP dan pemanggilan'],['Kritis','0%',sevc('Kritis'),pc(sevc('Kritis'),n),'SP dan pemanggilan'],['Total zona merah','di bawah 50%',Z.length,pc(Z.length,n),'-']],[26,28,16,22,34],['l','l','r','r','l']);
 H2('7.1 Sebaran Zona Merah');
 B(hR.slice(0,6).map(g=>({l:g.k+' ('+g.red+' dari '+g.n+')',v:g.red/g.n*100,c:LC.r})),100,'%');
 P(`Bagan di atas menampilkan enam halaqah dengan proporsi zona merah tertinggi. Berdasarkan jenis kelamin, ${gen.map(g=>gl(g.k)+' '+pc(g.red,g.n)).join(' dan ')} dari masing-masing kelompok berada di zona merah.`);
 H2('7.2 Status Tindak Lanjut Pemanggilan');
 T(['Status','Jumlah'],Object.keys(ST).map(k=>[ST[k][0],stc(k)]),[60,20],['l','r']);
 H1('8. Perkembangan antar Periode');
 if(PA&&PA.length){const dp=pM-avgOf(PA,'pct'),dc=cM-avgOf(PA,'nCap'),dz=Z.length-PA.filter(r=>r.pct<50).length;
  T(['Indikator',lb(pf.name),per,'Perubahan'],[['Rata-rata kehadiran (%)',f1(avgOf(PA,'pct')),f1(pM),(dp>=0?'+':'')+f1(dp)],['Rata-rata capaian',f1(avgOf(PA,'nCap')),f1(cM),(dc>=0?'+':'')+f1(dc)],['Jumlah zona merah',PA.filter(r=>r.pct<50).length,Z.length,(dz>=0?'+':'')+dz]],[44,26,26,24],['l','r','r','r']);
  P(`Dibandingkan periode sebelumnya, kehadiran ${dp>=0?'meningkat':'menurun'} ${f1(Math.abs(dp))} poin dan jumlah zona merah ${dz>0?'bertambah':dz<0?'berkurang':'tidak berubah'}.`)}
 else P('Hanya satu periode data yang tersedia sehingga analisis tren belum dapat dilakukan. Analisis ini akan otomatis memuat perbandingan setelah rekap periode berikutnya ditambahkan.');
 H1('9. Temuan Utama');
 UL([`Kehadiran rata-rata ${f1(pM)}% ${dS} target ${tg}%; ${pc(Z.length,n)} mahasantri di zona merah.`,`Ketidakhadiran terkonsentrasi: 10% mahasantri teratas menyumbang ${f1(sh10)}% alpa.`,`Halaqah ${hP[hP.length-1].k} memiliki kehadiran terendah (${f1(hP[hP.length-1].pct)}%) dan halaqah ${hR[0].k} memiliki proporsi zona merah tertinggi (${pc(hR[0].red,hR[0].n)}).`,`Angkatan ${aP[aP.length-1].k} paling rendah kehadirannya (${f1(aP[aP.length-1].pct)}%).`,`Kehadiran Putra ${f1(gen.find(g=>g.k==='L')?gen.find(g=>g.k==='L').pct:0)}% dan Putri ${f1(gen.find(g=>g.k==='P')?gen.find(g=>g.k==='P').pct:0)}%.`,`Hubungan kehadiran-capaian ${lStr(rPC)} (r = ${f2(rPC)}); ${HL.length} mahasantri rajin namun capaian rendah.`,`${cap0} mahasantri belum memiliki capaian tercatat dan ${NA} mahasantri non aktif perlu tindak lanjut administrasi.`],{n:1});
 H1('10. Rekomendasi Keputusan');
 const R=[];
 if(Pz.length)R.push(['Tinggi',`Terbitkan SP dan panggil ${Pz.length} mahasantri parah/kritis (termasuk ${Kz.length} dengan kehadiran 0%) untuk konfirmasi dan evaluasi (Lampiran B).`,'Dewan Ketahfidzan, musyrif/ah','14 hari kerja',`100% terpanggil; kehadiran naik minimal ke ${tg}%`]);
 if(Wz)R.push(['Sedang',`Bina ${Wz} mahasantri kategori waspada melalui pengingat kehadiran mingguan oleh musyrif/ah tanpa SP.`,'Musyrif/ah halaqah','Berjalan, evaluasi 2 mingguan','Naik ke kehadiran di atas 50%']);
 R.push(['Tinggi',`Evaluasi dan pendampingan halaqah berkehadiran terendah (${hP.slice(-3).map(g=>g.k+' '+f1(g.pct)+'%').join('; ')}), meliputi jadwal, metode, dan komunikasi musyrif/ah.`,'Ketua Dewan, musyrif/ah','1 bulan','Selisih kehadiran antar halaqah mengecil']);
 R.push(['Sedang',`Program penguatan Angkatan ${aP[aP.length-1].k} (kehadiran ${f1(aP[aP.length-1].pct)}%), misalnya mentoring sebaya dan pengingat kegiatan.`,'Dewan Ketahfidzan','1 bulan','Kehadiran angkatan mendekati rata-rata']);
 const gd=Math.abs(pM-0)&&gen.length===2?Math.abs(gen[0].pct-gen[1].pct):0;if(gd>=5)R.push(['Sedang',`Telaah penyebab selisih kehadiran ${f1(gd)} poin antara putra dan putri (jadwal, kegiatan lain, pola komunikasi) dan sesuaikan strategi pembinaan.`,'Dewan Ketahfidzan','1 bulan','Selisih di bawah 5 poin']);
 if(HL.length>=3)R.push(['Sedang',`Adakan pendampingan metode hafalan (setoran terjadwal, murajaah) bagi ${HL.length} mahasantri rajin hadir namun capaian rendah.`,'Musyrif/ah halaqah','2 bulan','Capaian naik ke 25 ke atas']);
 R.push(['Sedang',`Jadikan kehadiran indikator utama (hubungan dengan capaian ${lStr(rPC)}) dengan pemantauan mingguan dan peringatan dini pada kehadiran di bawah ${tg}%.`,'Dewan Ketahfidzan','Mulai periode berikutnya','Zona merah turun tiap periode']);
 if(NA)R.push(['Tinggi',`Verifikasi status ${NA} mahasantri non aktif dan tuntaskan tindak lanjut administrasinya.`,'Dewan Ketahfidzan, administrasi','2 minggu','Status terdokumentasi']);
 R.push(['Rendah',`Apresiasi 10 mahasantri terbaik dan 3 halaqah terbaik (Lampiran C) untuk menjaga motivasi.`,'Dewan Ketahfidzan','Akhir periode','Penghargaan terlaksana']);
 T(['No','Prioritas','Rekomendasi dan dasar data','Penanggung jawab','Tenggat','Indikator keberhasilan'],R.map((r,i)=>[i+1,...r]),[5,12,50,18,14,22],['c','c','l','l','l','l'],8.5);
 H1('11. Keterbatasan dan Catatan Metodologis');
 UL(['Analisis memakai satu rekap periode sehingga hubungan antar variabel bersifat asosiatif dan tidak membuktikan sebab-akibat.','Nilai capaian adalah skor pada rekap, bukan jumlah hafalan mentah; interpretasi perlu mempertimbangkan target tiap angkatan.','Alasan ketidakhadiran (izin/alpa) tidak diklasifikasikan lebih lanjut; konfirmasi langsung saat pemanggilan tetap diperlukan.','Kualitas hasil bergantung pada ketepatan input presensi dan capaian oleh musyrif/ah.']);
 H1('12. Penutup');
 P(`Demikian laporan analisis ini disusun sebagai bahan pengambilan keputusan Dewan Majlis Ketahfidzan. Rekomendasi bersifat usulan dan dapat disesuaikan dengan kebijakan serta kondisi lapangan. Analisis akan diperbarui setiap periode rekap.`);
 M.push({t:'sig',tgl:tglID(nw)});
 M.push({t:'pb'});H1('Lampiran A. Ringkasan Statistik per Halaqah');
 T(['Halaqah','n','Kehadiran','Capaian','Nilai Akhir','Zona merah'],hP.map(g=>[g.k,g.n,f1(g.pct),f1(g.cap),f1(g.avg),g.red+' ('+pc(g.red,g.n)+')']),[52,8,18,16,18,24],['l','r','r','r','r','r']);
 H1('Lampiran B. Daftar Mahasantri Zona Merah');
 const Zs=[...Z].sort((a,b)=>a.pct-b.pct||b.alpa-a.alpa||a.nama.localeCompare(b.nama));
 T(['No','Nama','Halaqah','Ang.','Hadir %','H/I/A','Kategori','Status'],Zs.map((r,i)=>[i+1,r.nama,r.halaqah,r.angkatan,f1(r.pct),r.hadir+'/'+r.izin+'/'+r.alpa,sev(r),ST[(track[f.id+'|'+r.nama]||{}).st||'belum'][0]]),[5,30,30,7,10,11,12,22],['c','l','l','c','r','c','l','l'],7.5);
 NOTE('Urutan dari kehadiran terendah, lalu alpa terbanyak. H/I/A = hadir/izin/alpa. Lampiran ini bersifat rahasia dan hanya untuk keperluan pembinaan internal.');
 H1('Lampiran C. Sepuluh Mahasantri Terbaik');
 T(['Peringkat','Nama','Halaqah','Kehadiran','Capaian','Nilai Akhir'],top.map(r=>[RK(f).rank(r),r.nama,r.halaqah,f1(r.pct),f1(r.nCap),f1(r.avg)]),[14,34,36,16,14,16],['c','l','l','r','r','r'],8.5);
 H1('Lampiran D. Definisi dan Rumus');
 UL(['Kehadiran (%) = total hadir / total pertemuan x 100.','Nilai akhir = (nilai akhir kehadiran + nilai akhir capaian) / 2.','Simpangan baku dihitung sebagai simpangan baku populasi.','Korelasi Pearson r = jumlah[(x - rata-rata x)(y - rata-rata y)] / akar[jumlah (x - rata-rata x)^2 x jumlah (y - rata-rata y)^2]; interpretasi: <0,2 sangat lemah, 0,2-0,4 lemah, 0,4-0,6 sedang, 0,6-0,8 kuat, >0,8 sangat kuat.','Peringkat mahasantri mengikuti rekap dan hanya mencakup mahasantri aktif.']);
 return{m:M,fn:'Laporan_Analisis_Tahfidz_'+per.replace(/[^\w]+/g,'_')+'.pdf'}}
const lapKopHtml=()=>{const im=[...document.querySelectorAll('.logos img')].reverse();return `<div class="kp"><img src="${im[0]?im[0].src:''}"><div><b>KEMENTERIAN AGAMA REPUBLIK INDONESIA</b><b>UNIVERSITAS ISLAM NEGERI</b><b>SUNAN GUNUNG DJATI BANDUNG</b><b class="big">MA'HAD TAHFIDZ AL-QUR'AN</b><b>DEWAN MAJLIS KETAHFIDZAN</b><span>Jl. Raya Cileunyi RT.001 RW.021 Kel. Cileunyi Wetan, Kab. Bandung, 40622, +62 821-8134-4345</span><span>E-mail : mahad.tahfidz@uinsgd.ac.id</span></div><img src="${im[1]?im[1].src:''}"></div>`};
function lapHtml(MD){let h=lapKopHtml();const hs=MD.filter(x=>x.t==='h1').map(x=>x.x);
 MD.forEach(x=>{switch(x.t){
  case'title':h+=`<h2 class="lt">${x.a.map(esc).join('<br>')}</h2><p class="lc">Periode : ${esc(x.per)}<br>Nomor : ${esc(x.no)}<br>Tanggal : ${esc(x.tgl)}</p>`;break;
  case'toc':h+=`<div class="toc"><b>DAFTAR ISI</b>${hs.map(s=>`<div>${esc(s)}</div>`).join('')}</div>`;break;
  case'h1':h+=`<h3>${esc(x.x)}</h3>`;break;case'h2':h+=`<h4>${esc(x.x)}</h4>`;break;case'p':h+=`<p>${esc(x.x)}</p>`;break;
  case'note':h+=`<p class="nt">${esc(x.x)}</p>`;break;
  case'ul':h+=`<${x.o&&x.o.n?'ol':'ul'}>${x.a.map(s=>`<li>${esc(s)}</li>`).join('')}</${x.o&&x.o.n?'ol':'ul'}>`;break;
  case'kpi':h+=`<div class="kg">${x.items.map(i=>`<div><b>${esc(i.v)}</b><span>${esc(i.l)}</span></div>`).join('')}</div>`;break;
  case'box':h+=`<div class="bx">${x.items.map(s=>/^- /.test(s)?`<p class="bl">• ${esc(s.slice(2))}</p>`:`<p>${/:$/.test(s)?'<b>'+esc(s)+'</b>':esc(s)}</p>`).join('')}</div>`;break;
  case'bars':h+=`<div class="rbs">${x.items.map(i=>`<div class="rb"><span>${esc(i.l)}</span><i><u style="width:${Math.min(100,i.v/x.max*100)}%;background:${i.c}"></u></i><b>${f1(i.v)}${x.sfx}</b></div>`).join('')}</div>`;break;
  case'tbl':h+=`<div class="tw"><table><thead><tr>${x.head.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${x.rows.map(r=>`<tr>${r.map((c,i)=>`<td style="text-align:${({r:'right',c:'center'})[x.al&&x.al[i]]||'left'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;break;
  case'sig':h+=`<div class="sg"><span>Bandung, ${esc(x.tgl)}</span><span>Ketua Dewan Majlis Ketahfidzan,</span><i>${ttdGet('ketua')?`<img src="${ttdGet('ketua').d}">`:''}</i><b>${esc(KETUA)}</b></div>`;break;
  case'pb':h+='<hr class="pgb">';break}});return h}
function lapPdf(MD,pg){
 const d=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),W=210,H=297,Mg=22,CW=W-2*Mg,TOP=22,BOT=H-20,K=.3528,pages={};let y=14;d.setLineHeightFactor(1.25);
 const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
 const ens=h=>{if(y+h>BOT){d.addPage();y=TOP}},fn=(b,s,i)=>{d.setFont('times',b?(i?'bolditalic':'bold'):(i?'italic':'normal'));d.setFontSize(s)};
 const para=(s,fs,x0,w,b,i)=>{fn(b,fs,i);const lh=fs*K*1.25;d.splitTextToSize(String(s),w).forEach(l=>{ens(lh);d.text(l,x0,y+fs*K*.85);y+=lh})};
 const kop=()=>{const im=[...document.querySelectorAll('.logos img')].reverse(),M2=24,CW2=W-2*M2;y=14;
  im.forEach((g,i)=>{const h=22,w=h*g.naturalWidth/g.naturalHeight;try{d.addImage(g.src,'PNG',i?W-M2+4-w:M2-4,y,w,h)}catch(e){}});
  d.setFont('times','bold');[['KEMENTERIAN AGAMA REPUBLIK INDONESIA',10.5],['UNIVERSITAS ISLAM NEGERI',11.5],['SUNAN GUNUNG DJATI BANDUNG',11.5],["MA'HAD TAHFIDZ AL-QUR'AN",13],['DEWAN MAJLIS KETAHFIDZAN',11.5]].forEach(([s,z],i)=>{d.setFontSize(z);d.text(s,W/2,y+4+i*4.9,{align:'center',maxWidth:CW2-30})});
  d.setFont('times','normal');d.setFontSize(8.5);d.setTextColor(60,60,60);['Jl. Raya Cileunyi RT.001 RW.021 Kel. Cileunyi Wetan, Kab. Bandung, 40622, +62 821-8134-4345','E-mail : mahad.tahfidz@uinsgd.ac.id'].forEach((s,i)=>d.text(s,W/2,y+30.2+i*3.7,{align:'center'}));d.setTextColor(0,0,0);
  y=y+30.2+3.7+3;d.setDrawColor(0);d.setLineWidth(.9);d.line(M2-4,y,W-M2+4,y);d.setLineWidth(.3);d.line(M2-4,y+1.2,W-M2+4,y+1.2);y+=7};
 kop();
 MD.forEach(x=>{switch(x.t){
  case'title':{y+=4;fn(1,13.5);x.a.forEach(s=>{d.text(s,W/2,y,{align:'center'});y+=6.2});const tw=d.getTextWidth(x.a[1]);d.setLineWidth(.4);d.line(W/2-tw/2,y-4.3,W/2+tw/2,y-4.3);fn(0,11);y+=1;['Periode : '+x.per,'Nomor : '+x.no,'Tanggal : '+x.tgl].forEach(s=>{d.text(s,W/2,y,{align:'center'});y+=5.4});y+=6;break}
  case'toc':{fn(1,11.5);d.text('DAFTAR ISI',Mg,y);y+=6;MD.filter(q=>q.t==='h1').forEach(q=>{fn(0,10.5);const pn=String((pg&&pg[q.x])||'0'),dw=d.getTextWidth('.'),aw=CW-d.getTextWidth(q.x)-d.getTextWidth(pn)-4;d.text(q.x,Mg,y);d.text('.'.repeat(Math.max(3,Math.floor(aw/dw))),Mg+d.getTextWidth(q.x)+2,y);d.text(pn,W-Mg,y,{align:'right'});y+=5.6});break}
  case'pb':d.addPage();y=TOP;break;
  case'h1':ens(26);pages[x.x]=d.getNumberOfPages();y+=3;fn(1,12.5);d.setTextColor(31,111,85);d.text(x.x,Mg,y+4);d.setDrawColor(31,111,85);d.setLineWidth(.5);d.line(Mg,y+6,W-Mg,y+6);d.setTextColor(0,0,0);y+=10;break;
  case'h2':ens(16);y+=1.5;fn(1,11);d.text(x.x,Mg,y+4);y+=6.5;break;
  case'p':para(x.x,11,Mg,CW);y+=2.2;break;
  case'note':para(x.x,9,Mg,CW,0,1);y+=2.5;break;
  case'ul':x.a.forEach((s,i)=>{fn(0,11);const L=d.splitTextToSize(String(s),CW-8),lh=11*K*1.25;ens(lh);d.text(x.o&&x.o.n?(i+1)+'.':'\u2022',Mg+2,y+11*K*.85);L.forEach(l=>{ens(lh);d.text(l,Mg+8,y+11*K*.85);y+=lh});y+=.8});y+=1.5;break;
  case'kpi':{const w=(CW-9)/4,h=17;for(let i=0;i<x.items.length;i+=4){ens(h+3);x.items.slice(i,i+4).forEach((q,j)=>{const X=Mg+j*(w+3);d.setFillColor(238,245,240);d.setDrawColor(150,190,170);d.setLineWidth(.2);d.rect(X,y,w,h,'FD');fn(1,13);d.text(String(q.v),X+w/2,y+7.5,{align:'center'});fn(0,7.5);d.text(d.splitTextToSize(q.l,w-3),X+w/2,y+11.5,{align:'center'})});y+=h+3}y+=1;break}
  case'box':{const fs=10.5,lh=fs*K*1.25,w=CW-9;fn(0,fs);const pr=x.items.map(s=>{const b=/^- /.test(s),t=b?s.slice(2):s;return{b,t,L:d.splitTextToSize(t,b?w-5:w),h:/:$/.test(s)}});const hh=pr.reduce((s,p)=>s+p.L.length*lh+1.3,0)+6;ens(Math.min(hh,230));const y0=y;d.setFillColor(238,245,240);d.rect(Mg,y,CW,hh,'F');d.setFillColor(31,111,85);d.rect(Mg,y,1.6,hh,'F');y+=3.5;pr.forEach(p=>{fn(p.h,fs);p.L.forEach((l,i)=>{if(y+lh>BOT){d.addPage();y=TOP}if(p.b&&!i)d.text('\u2022',Mg+5,y+fs*K*.85);d.text(l,Mg+(p.b?9.5:5),y+fs*K*.85);y+=lh});y+=1.3});y=y0+hh+3;break}
  case'bars':{const lw=70,bw=CW-lw-18;x.items.forEach(i=>{ens(6.4);fn(0,8.5);d.text(d.splitTextToSize(i.l,lw-2)[0],Mg,y+3.6);d.setFillColor(232,236,234);d.rect(Mg+lw,y+0.6,bw,4,'F');d.setFillColor(...rgb(i.c));d.rect(Mg+lw,y+0.6,Math.max(.4,Math.min(100,i.v/x.max*100)/100*bw),4,'F');fn(1,8.5);d.text(f1(i.v)+x.sfx,W-Mg,y+3.6,{align:'right'});y+=6.2});y+=2.5;break}
  case'tbl':{const fs=x.fs||9.5,lh=fs*K*1.25,pad=1.5,tw=x.w.reduce((a,b)=>a+b,0),cw=x.w.map(v=>v/tw*CW);let zi=0;
   const dr=(cells,hd)=>{fn(hd,fs);const ls=cells.map((c,i)=>d.splitTextToSize(String(c),cw[i]-2*pad)),h=Math.max(...ls.map(l=>l.length))*lh+2*pad;
    if(y+h>BOT){d.addPage();y=TOP;if(!hd){dr(x.head,1);fn(hd,fs)}}
    if(hd){d.setFillColor(205,224,214);d.rect(Mg,y,CW,h,'F')}else if(zi++%2){d.setFillColor(246,249,247);d.rect(Mg,y,CW,h,'F')}
    d.setDrawColor(150);d.setLineWidth(.15);d.rect(Mg,y,CW,h);let cx=Mg;ls.forEach((l,i)=>{if(i)d.line(cx,y,cx,y+h);const a=hd?'c':(x.al&&x.al[i])||'l';d.text(l,a==='r'?cx+cw[i]-pad:a==='c'?cx+cw[i]/2:cx+pad,y+pad+fs*K*.85,{align:a==='r'?'right':a==='c'?'center':'left'});cx+=cw[i]});y+=h};
   dr(x.head,1);x.rows.forEach(r=>dr(r,0));y+=3.5;break}
  case'sig':{ens(56);y+=4;fn(0,11);const X=W-Mg-62;d.text('Bandung, '+x.tgl,X,y);d.text('Ketua Dewan Majlis Ketahfidzan,',X,y+5.5);const tt=ttdGet('ketua');if(tt){const sc=Math.min(48/tt.w,22/tt.h)*(tt.s||1);try{d.addImage(tt.d,'PNG',X,y+28-tt.h*sc,tt.w*sc,tt.h*sc)}catch(e){}}y+=30;fn(1,11);d.text(KETUA,X,y);d.setLineWidth(.3);d.setDrawColor(0);d.line(X,y+1,X+d.getTextWidth(KETUA),y+1);y+=8;break}}});
 const N=d.getNumberOfPages();for(let i=1;i<=N;i++){d.setPage(i);d.setTextColor(90,90,90);fn(0,8.5);d.setDrawColor(150);d.setLineWidth(.2);d.line(Mg,H-14,W-Mg,H-14);d.text("Laporan Analisis Data Tahfidz - Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung",Mg,H-10);d.text('Halaman '+i+' dari '+N,W-Mg,H-10,{align:'right'});if(i>1){d.text("Dewan Majlis Ketahfidzan - Dokumen Internal",W-Mg,11,{align:'right'});d.line(Mg,12.5,W-Mg,12.5)}d.setTextColor(0,0,0)}
 return{d,pages}}
function lapor(){const f=act(),el=$('#lap');if(!f){el.innerHTML='<p class="hint">Belum ada data.</p>';return}
 const m=lapModel(f);el.innerHTML=`<div class="glass dc"><h3>📑 Laporan Analisis Data <small>khusus admin · bahan keputusan</small></h3><p class="leg" style="margin:0 0 12px">Disusun otomatis dari file aktif (${esc(f.name)}) dan ikut berubah saat file bulan diganti. Santri non aktif tidak dihitung.</p><button class="btn" id="lpdf">⬇️ Unduh PDF Laporan</button> <span id="lst" class="leg"></span></div><div class="rpt">${lapHtml(m.m)}</div>`}
$('#lap').onclick=async e=>{if(e.target.id!=='lpdf')return;const b=e.target,o=b.textContent,z=$('#lst');b.disabled=true;b.textContent='⏳ Menyusun PDF…';
 try{if(!window.jspdf)throw new Error('Pustaka PDF belum termuat, periksa koneksi.');const m=lapModel(act());let r=lapPdf(m.m,null);r=lapPdf(m.m,r.pages);await pdfOut(r.d,m.fn);z.textContent='✔ PDF siap'}catch(err){z.textContent=err&&err.code==='declined'?'Dibatalkan':'✖ Gagal: '+(err&&err.message||err)}b.disabled=false;b.textContent=o};
$('#tL').onclick=()=>{wr().classList.remove('dv','zv');wr().classList.add('lv');tabs('tL');window.scrollTo(0,0);if(admin){$('#login').hidden=true;lapor()}else{$('#lap').innerHTML='';$('#login').hidden=false;$('#uid').focus()}};

/* ===== RAPOR RESMI (PDF) ===== */
const DIR='Prof. Dr. KH. Asep Musthofa Kamal, M. Ag',DIR_NIP='196104281994031002';
function rprBar(r){const n=esc(r.nama);return `<div class="shr"><div><b>🧾 Rapor Resmi (PDF)</b><span>Dokumen resmi berkop surat Ma'had, ditandatangani Mentor Halaqah dan Ketua Dewan Majlis Ketahfidzan, serta diketahui Direktur Ma\'had. Bisa diunduh atau dibagikan.</span></div><div class="shb"><button class="btn" data-rpt="dl" data-n="${n}">📄 Unduh PDF</button><button class="btn g" data-rpt="share" data-n="${n}">📤 Bagikan PDF</button></div><em class="shm"></em></div>`}
function raporPdf(r,f,D,first){const d=D||new window.jspdf.jsPDF({unit:'mm',format:'a4'}),W=210,M=24,CW=W-2*M,K=RK(f),k=K.rank(r),per=perFull(f.name),na=/NON/i.test(r.status),im=[...document.querySelectorAll('.logos img')].reverse();if(D&&!first)d.addPage();let y=14;
 im.forEach((g,i)=>{const h=22,w=h*g.naturalWidth/g.naturalHeight;try{d.addImage(g.src,'PNG',i?W-M+4-w:M-4,y,w,h)}catch(e){}});
 d.setFont('times','bold');[['KEMENTERIAN AGAMA REPUBLIK INDONESIA',10.5],['UNIVERSITAS ISLAM NEGERI',11.5],['SUNAN GUNUNG DJATI BANDUNG',11.5],["MA'HAD TAHFIDZ AL-QUR'AN",13],['DEWAN MAJLIS KETAHFIDZAN',11.5]].forEach(([x,z],i)=>{d.setFontSize(z);d.text(x,W/2,y+4+i*4.9,{align:'center',maxWidth:CW-30})});
 d.setFont('times','normal');d.setFontSize(8.5);d.setTextColor(60,60,60);['Jl. Raya Cileunyi RT.001 RW.021 Kel. Cileunyi Wetan, Kab. Bandung, 40622, +62 821-8134-4345','E-mail : mahad.tahfidz@uinsgd.ac.id'].forEach((x,i)=>d.text(x,W/2,y+30.2+i*3.7,{align:'center'}));d.setTextColor(0,0,0);
 y=y+30.2+3.7+3;d.setDrawColor(0);d.setLineWidth(.9);d.line(M-4,y,W-M+4,y);d.setLineWidth(.3);d.line(M-4,y+1.2,W-M+4,y+1.2);
 y+=11;d.setFont('times','bold');d.setFontSize(13);const T='RAPOR TAHFIDZ MAHASANTRI',tw=d.getTextWidth(T);d.text(T,W/2,y,{align:'center'});d.setLineWidth(.4);d.line(W/2-tw/2,y+1,W/2+tw/2,y+1);
 d.setFont('times','normal');d.setFontSize(10.5);d.text('Periode : '+per,W/2,y+6,{align:'center'});d.text('Nomor : '+String(r.no||k||0).padStart(3,'0')+'/'+NOPRE+'/RPR/'+lb(f.name).replace(/\s+/g,'-'),W/2,y+11,{align:'center'});y+=17;
 const GRY=[238,241,239],cell=(x,w,h,t,o={})=>{if(o.fill){d.setFillColor(...o.fill);d.rect(x,y,w,h,'F')}d.setDrawColor(120);d.setLineWidth(.2);d.rect(x,y,w,h);d.setFont('times',o.b?'bold':'normal');d.setFontSize(o.fs||10.5);d.setTextColor(0,0,0);const L=d.splitTextToSize(String(t),w-3);d.text(L,o.c?x+w/2:x+1.8,y+h/2+1.3-(L.length-1)*2,{align:o.c?'center':'left'})};
 const H=t=>{d.setFont('times','bold');d.setFontSize(11.5);d.setTextColor(0,0,0);d.text(t,M,y+4);y+=6.5},kv=(rows,w1,hb)=>rows.forEach(([a,b])=>{cell(M,w1,5.4,a,{fill:GRY,b:1});cell(M+w1,CW-w1,5.4,b,{b:hb});y+=5.4});
 H('A. Identitas Mahasantri');kv([['Nama',r.nama],['NIM / Semester',r.nim||'-'],['Halaqah / Mentor',r.halaqah],['Angkatan',r.angkatan],['Jenis Kelamin',r.gender==='L'?'Putra (Ikhwan)':'Putri (Akhwat)'],['Status',r.status]],46,0);y+=3;
 H('B. Rekapitulasi Kehadiran Halaqah');d.setFont('times','italic');d.setFontSize(9);d.text('Presensi terakhir: '+(r.last||'-'),W-M,y-2.2,{align:'right'});{const w=CW/5;['Total Pertemuan','Hadir','Izin','Alpa','Kehadiran'].forEach((t,i)=>cell(M+i*w,w,7,t,{fill:GRY,b:1,c:1}));y+=7;[r.total,r.hadir,r.izin,r.alpa,f1(r.pct)+'%'].forEach((t,i)=>cell(M+i*w,w,8,t,{b:1,c:1,fs:12}));y+=8}
 y+=2;
 H('C. Capaian dan Penilaian');kv([['Nilai Kehadiran',f1(r.nKeh)],['Nilai Capaian Hafalan',f1(r.nCap)],['Rata-rata Nilai Akhir',f1(r.avg)],['Predikat',r.predikat],['Peringkat',k?k+' dari '+K.nA+' mahasantri aktif':'Tidak masuk peringkat (non aktif)']],62,1);y+=3;
 H('D. Keterangan');const p=r.pct,zn=p<50?'zona merah':p<75?'kategori sedang':'zona aman';
 const tx=['Pada periode '+per+', '+r.nama+' memperoleh predikat '+r.predikat+' dengan kehadiran '+f1(p)+'% ('+zn+') dan rata-rata nilai akhir '+f1(r.avg)+'.',(p<50?'Kehadiran halaqah perlu segera ditingkatkan hingga minimal '+TG()+'% dan mahasantri diharapkan memenuhi panggilan Dewan Majlis Ketahfidzan apabila diminta.':p<75?'Kehadiran perlu ditingkatkan hingga minimal '+TG()+'% agar capaian hafalan semakin optimal.':"Kehadiran dan capaian perlu dipertahankan; semoga senantiasa istiqomah bersama Al-Qur'an.")+(na?' Berstatus non aktif sehingga tidak dihitung dalam peringkat.':'')+(k>=1&&k<=10?' Alhamdulillah, termasuk 10 besar santri terbaik pada periode ini.':'')];
 d.setFont('times','normal');d.setFontSize(10.5);tx.forEach(t=>{const L=d.splitTextToSize(t,CW);d.text(L,M,y+4);y+=L.length*4.9+1.5});
 y+=3;const XL=M+40,XR=W-M-40,XC=W/2;d.setFont('times','normal');d.setFontSize(10.5);d.setTextColor(0,0,0);d.text('Bandung, '+tglID(new Date()),XR,y+2,{align:'center'});y+=3;
 const nm=(x,t,yy,mw)=>{d.setFont('times','bold');let z=10.5;const q='('+t+')';d.setFontSize(z);while(d.getTextWidth(q)>mw&&z>7){z-=.5;d.setFontSize(z)}d.text(q,x,yy,{align:'center'});const kw=d.getTextWidth(q);d.setLineWidth(.3);d.setDrawColor(0);d.line(x-kw/2,yy+1,x+kw/2,yy+1)};
 const sg=(x,lab,name,key)=>{d.setFont('times','normal');d.setFontSize(10.5);d.text(lab,x,y+5,{align:'center'});const t=ttdGet(key);if(t){const sc=Math.min(52/t.w,17/t.h)*(t.s||1);try{d.addImage(t.d,'PNG',x-t.w*sc/2,y+23-t.h*sc,t.w*sc,t.h*sc)}catch(e){}}nm(x,name,y+25.5,76)};
 sg(XL,'Mentor Halaqah,',r.halaqah||'..............................',r.halaqah);sg(XR,'Ketua Dewan Majlis Ketahfidzan,',KETUA,'ketua');
 y+=31.5;d.setFont('times','normal');d.setFontSize(10.5);d.text('Mengetahui,',XC,y,{align:'center'});d.text("Direktur Ma'had Tahfidz Al-Qur'an,",XC,y+4.4,{align:'center'});
 {const T=ttdGet('direktur');if(T){const sc=Math.min(56/T.w,25/T.h)*(T.s||1),ww=T.w*sc,h2=T.h*sc;try{d.addImage(T.d,'PNG',XC-ww/2,y+31.5-h2,ww,h2)}catch(e){}}}
 nm(XC,DIR,y+33.5,110);d.setFont('times','normal');d.setFontSize(10);d.text('NIP. '+DIR_NIP,XC,y+38,{align:'center'});
 d.setDrawColor(150);d.setLineWidth(.2);d.line(M,284,W-M,284);d.setFont('times','italic');d.setFontSize(8.5);d.setTextColor(90,90,90);d.text("Dokumen ini diterbitkan oleh Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung berdasarkan rekap presensi dan capaian periode "+per+'.',W/2,288,{align:'center',maxWidth:CW});
  return d}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-rpt]');if(!b)return;const f=act(),r=f&&f.rows.find(q=>q.nama===b.dataset.n);if(!r)return;const m=b.closest('.shr').querySelector('.shm'),set=t=>{m.textContent=t},sh=b.dataset.rpt==='share';b.disabled=true;set('⏳ Menyusun PDF…');
 try{if(!window.jspdf)throw new Error('Pustaka PDF belum termuat, periksa koneksi.');const d=raporPdf(r,f),fn='Rapor_Resmi_'+r.nama.replace(/[^\w]+/g,'_')+'.pdf';
  if(sh){const fl=new File([d.output('blob')],fn,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[fl]})){try{await navigator.share({files:[fl],title:'Rapor Tahfidz '+r.nama});set('✔ Terbagikan');b.disabled=false;return}catch(er){if(er&&er.name==='AbortError'){set('');b.disabled=false;return}}}}
  await pdfOut(d,fn);set(sh?'Berbagi langsung tidak didukung di perangkat ini. PDF sudah diunduh, silakan kirim manual lewat WhatsApp atau email.':'✔ PDF rapor resmi siap disimpan.')}
 catch(err){set(err&&err.code==='declined'?'Dibatalkan':'✖ Gagal: '+(err&&err.message||err))}b.disabled=false});

/* ===== BAGIKAN RAPOR (PNG) ===== */
function shareBar(r){const n=esc(r.nama);return `<div class="shr"><div><b>📲 Bagikan rapormu</b><span>Simpan sebagai gambar PNG (format story 9:16), lalu pasang di Status WhatsApp, Story Instagram, atau medsos lainnya.</span></div><div class="shb"><button class="btn" data-shr="share" data-n="${n}">📤 Bagikan</button><button class="btn g" data-shr="save" data-n="${n}">⬇️ Simpan PNG</button></div><em class="shm"></em></div>`}
function rrect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function star8(x,cx,cy,R){x.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,q=i%2?R*.58:R;x.lineTo(cx+Math.cos(a)*q,cy+Math.sin(a)*q)}x.closePath();x.stroke()}
function wrapTxt(x,t,mw){const L=[];let c='';String(t).split(' ').forEach(s=>{const u=c?c+' '+s:s;if(x.measureText(u).width>mw&&c){L.push(c);c=s}else c=u});if(c)L.push(c);return L}
function badgeList(r,f){const k=RK(f).rank(r),a=[];if(k>=1&&k<=3)a.push("🏆 Podium Ma'had #"+k);else if(k>=1&&k<=10)a.push('🔥 Top 10 Santri');if(r.pct>=99.95)a.push('💯 Full Attendance');else if(r.pct>=90)a.push('🎯 Santri Rajin');if(r.nCap>=75)a.push('📖 Target Hafalan Tercapai');else if(r.nCap>=50)a.push('🌱 Capaian Mantap');if(/^SANGAT BAIK/.test(r.predikat))a.push('🌟 Predikat Sangat Baik');try{if(!/NON/i.test(r.status)){const g=gmCalc(r,f);a.unshift(g.tr.t.e+' '+g.tr.full)}}catch(e){}return a.slice(0,4)}
async function raporPng(r,f){
 try{await Promise.all(['800 40px "Plus Jakarta Sans"','600 30px "Plus Jakarta Sans"','700 30px "Plus Jakarta Sans"'].map(s=>document.fonts.load(s)))}catch(e){}
 const FF='"Plus Jakarta Sans",system-ui,sans-serif',W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const p=Math.round(r.pct*10)/10,CL=p<50?'#ff5a5f':p<75?'#f4a93b':'#3ddc97',GOLD='#e9c46a',MUT='#a9c4b9',INK='#f4f1e6',ca=(t,px,wt,col,X,Y,al)=>{x.font=(wt||700)+' '+px+'px '+FF;x.fillStyle=col||INK;x.textAlign=al||'center';x.fillText(t,X,Y)};
 const fit=(t,mw,wt,s)=>{while(s>18){x.font=wt+' '+s+'px '+FF;if(x.measureText(t).width<=mw)break;s-=2}return s};
 let g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0b4a3a');g.addColorStop(.55,'#06332a');g.addColorStop(1,'#04261f');x.fillStyle=g;x.fillRect(0,0,W,H);
 [[150,80,700,'18,122,92,.75'],[1080,460,650,'201,161,59,.42'],[200,1750,600,'18,122,92,.45']].forEach(([a,b,R,col])=>{const q=x.createRadialGradient(a,b,0,a,b,R);q.addColorStop(0,'rgba('+col+')');q.addColorStop(1,'rgba('+col.replace(/,[^,]*$/,',0')+')');x.fillStyle=q;x.fillRect(0,0,W,H)});
 x.strokeStyle='rgba(233,196,106,.09)';x.lineWidth=2;for(let a=0;a<W+120;a+=120)for(let b=0;b<H+120;b+=120)star8(x,a,b,38);
 const lg=[...document.querySelectorAll('.logos img')].filter(i=>i.naturalWidth),LH=108,lw=lg.map(i=>LH*i.naturalWidth/i.naturalHeight),tw=lw.reduce((s,v)=>s+v,0)+(lg.length-1)*40,pw=tw+90;
 x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=30;x.shadowOffsetY=10;x.fillStyle='#fff';rrect(x,(W-pw)/2,60,pw,LH+44,40);x.fill();x.restore();
 x.strokeStyle=GOLD;x.lineWidth=4;rrect(x,(W-pw)/2,60,pw,LH+44,40);x.stroke();
 let lx=(W-tw)/2;lg.forEach((i,k)=>{try{x.drawImage(i,lx,82,lw[k],LH)}catch(e){}lx+=lw[k]+40});
 ca("MA'HAD TAHFIDZ AL-QUR'AN",34,800,GOLD,W/2,262);ca('UIN SUNAN GUNUNG DJATI BANDUNG',27,600,INK,W/2,302);
 ca('RAPOR TAHFIDZ',80,800,INK,W/2,420);ca(perFull(f.name).toUpperCase(),32,700,GOLD,W/2,474);
 x.fillStyle='rgba(255,255,255,.09)';rrect(x,70,510,940,210,36);x.fill();x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=2;rrect(x,70,510,940,210,36);x.stroke();
 const av=x.createLinearGradient(110,550,230,670);av.addColorStop(0,GOLD);av.addColorStop(1,'#b8842a');x.fillStyle=av;x.beginPath();x.arc(170,615,60,0,7);x.fill();ca((r.nama[0]||'?').toUpperCase(),56,800,'#2b1d00',170,636);
 x.font='800 44px '+FF;const nl=wrapTxt(x,r.nama,720).slice(0,2),ny=nl.length>1?590:610;nl.forEach((l,i)=>ca(l,44,800,INK,262,ny+i*52,'left'));
 let hs2=fit(r.halaqah,720,'600',28);ca(r.halaqah,hs2,600,MUT,262,ny+nl.length*52+4,'left');ca('Angkatan '+r.angkatan+' · '+(r.gender==='L'?'Putra':'Putri'),26,600,GOLD,262,ny+nl.length*52+42,'left');
 const cy=915,R0=158;x.lineWidth=30;x.lineCap='round';x.strokeStyle='rgba(255,255,255,.14)';x.beginPath();x.arc(W/2,cy,R0,0,7);x.stroke();
 if(p>0){x.save();x.shadowColor=CL;x.shadowBlur=28;x.strokeStyle=CL;x.beginPath();x.arc(W/2,cy,R0,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(p,100)/100);x.stroke();x.restore()}
 {const ps=f1(p)+'%',fs=fit(ps,250,'800',76);ca(ps,fs,800,CL,W/2,cy+fs*.3);ca('KEHADIRAN',22,700,MUT,W/2,cy+fs*.3+38)}
 [['HADIR',r.hadir,'#3ddc97'],['IZIN',r.izin,'#f4a93b'],['ALPA',r.alpa,'#ff5a5f']].forEach(([l,v,col],i)=>{const X=70+i*(290+35);x.fillStyle='rgba(0,0,0,.25)';rrect(x,X,1100,290,112,26);x.fill();x.strokeStyle='rgba(255,255,255,.16)';x.lineWidth=2;rrect(x,X,1100,290,112,26);x.stroke();ca(v+'×',46,800,col,X+145,1158);ca(l,22,700,MUT,X+145,1192)});
 const k=RK(f).rank(r);[['NILAI CAPAIAN',String(r.nCap)],['NILAI AKHIR',String(r.avg)],['PREDIKAT',r.predikat],['PERINGKAT',k?'#'+k+' dari '+RK(f).nA:'–']].forEach(([l,v],i)=>{const X=70+(i%2)*(452+36),Y=1236+Math.floor(i/2)*118;x.fillStyle='rgba(255,255,255,.08)';rrect(x,X,Y,452,102,26);x.fill();x.strokeStyle='rgba(255,255,255,.16)';x.lineWidth=2;rrect(x,X,Y,452,102,26);x.stroke();ca(l,20,700,MUT,X+226,Y+34);const s=fit(v,410,'800',40);ca(v,s,800,GOLD,X+226,Y+80)});
 const bl=badgeList(r,f);if(!bl.length)bl.push('🌙 Terus berproses, semangat!');x.font='700 26px '+FF;
 let rows=[[]],rw=0;bl.forEach(b=>{const w=x.measureText(b).width+54;if(rw+w>940&&rows[rows.length-1].length){rows.push([]);rw=0}rows[rows.length-1].push([b,w]);rw+=w+14});
 let by=1500;rows.forEach(rw2=>{const tot=rw2.reduce((s,q)=>s+q[1]+14,-14);let bx=(W-tot)/2;rw2.forEach(([b,w])=>{x.fillStyle='rgba(61,220,151,.14)';rrect(x,bx,by,w,58,29);x.fill();x.strokeStyle='rgba(61,220,151,.55)';x.lineWidth=2;rrect(x,bx,by,w,58,29);x.stroke();ca(b,26,700,'#9ff0c7',bx+w/2,by+38);bx+=w+14});by+=70});
 const q=pk(p<50?QL:QG,hs(r.nama),5);x.font='italic 600 29px '+FF;const ql=wrapTxt(x,'“'+q+'”',820).slice(0,4),qh=ql.length*40+58,qy=Math.max(by+14,1640);
 x.fillStyle='rgba(233,196,106,.12)';rrect(x,70,qy,940,qh,30);x.fill();x.strokeStyle='rgba(233,196,106,.45)';x.lineWidth=2;rrect(x,70,qy,940,qh,30);x.stroke();ql.forEach((l,i)=>ca(l,29,600,INK,W/2,qy+48+i*40));
 ca("Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung",23,600,MUT,W/2,H-46);
 return c}
async function bagikanRapor(r,f,mode,msg){
 const set=t=>{if(msg)msg.textContent=t};set('⏳ Menyiapkan gambar…');
 try{const c=await raporPng(r,f),bl=await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('Gagal membuat gambar')),'image/png')),fn='Rapor_Tahfidz_'+r.nama.replace(/[^\w]+/g,'_')+'.png';
  if(mode==='share'){const fl=new File([bl],fn,{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[fl]})){try{await navigator.share({files:[fl],title:'Rapor Tahfidz '+r.nama,text:'Alhamdulillah, rapor tahfidz periode '+perFull(f.name)+' ✨'});set('✔ Dibagikan');return}catch(e){if(e&&e.name==='AbortError'){set('');return}}}}
  const dn=window.claude&&claude.use?await claude.use('downloads'):null;
  if(dn)await dn.save({filename:fn,data:bl});else{const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
  set(mode==='share'?'✔ Gambar disimpan. Buka WhatsApp/Instagram lalu pilih gambar dari galeri untuk dipasang di status/story.':'✔ Gambar siap disimpan.')}
 catch(e){set(e&&e.code==='declined'?'Dibatalkan':'✖ Gagal: '+(e&&e.message||e))}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-shr]');if(!b)return;const f=act(),r=f&&f.rows.find(q=>q.nama===b.dataset.n);if(r)bagikanRapor(r,f,b.dataset.shr,b.closest('.shr').querySelector('.shm'))});

/* ===== MODE PRESENTASI DASHBOARD ===== */
function presBuild(f){
 const A=f.rows.filter(r=>!/NON/i.test(r.status)),all=f.rows,n=A.length||1,per=perFull(f.name),R=RK(f),pa=avgOf(A,'pct'),ca=avgOf(A,'nCap'),va=avgOf(A,'avg'),
 red=A.filter(r=>r.pct<50).length,full=A.filter(r=>r.pct>=99.95).length,z=A.filter(r=>r.total&&!r.alpa).length,L=A.filter(r=>r.gender==='L'),P=A.filter(r=>r.gender==='P'),
 ang=grp(A,'angkatan').sort((a,b)=>a.k-b.k),hal=grp(A,'halaqah'),hK=[...hal].sort((a,b)=>b.pct-a.pct),hR=[...hal].sort((a,b)=>b.avg-a.avg),aK=[...ang].sort((a,b)=>b.pct-a.pct),
 PRD=[['SANGAT BAIK','#3ddc97'],['BAIK','#8fd14f'],['CUKUP','#f4d03f'],['KURANG','#f4a93b'],['SANGAT KURANG','#ff5a5f']],
 top=A.filter(r=>R.rank(r)>0).sort((a,b)=>R.rank(a)-R.rank(b)).slice(0,10),MD=['🥇','🥈','🥉'],
 logo='<div class="lg">'+[...document.querySelectorAll('.logos img')].map(g=>`<img src="${g.src}" alt="">`).join('')+'</div>',
 kt=(l,v,d,s,c)=>`<div class="kt"><span>${l}</span><b class="cn ${c||''}" data-v="${v}" data-d="${d}" data-s="${s||''}">0</b></div>`,
 pb=(it,mx,clr)=>`<div>${it.map(i=>`<div class="pr"><span>${esc(i.l)}</span><div class="pk"><i data-w="${Math.min(100,i.v/mx*100)}" style="background:${i.c||(typeof clr==='function'?clr(i.v):clr)}"></i></div><b>${i.t}</b></div>`).join('')}</div>`,
 rank=(t,ic,items)=>{const N=items.length;return{m:1,n:N,s:N+1,h:s=>{const cur=s?N-s:-1,it=items[cur],cf=s&&cur===0?Array.from({length:22},(_,i)=>`<i class="cf" style="left:${(i*4.7+3)%98}%;animation-delay:${(i%9)*.35}s">${['🎉','✨','🌟','🎊'][i%4]}</i>`).join(''):'';
  const sp=s?`<div class="sp ${cur<3?'top'+(cur+1):''} new" key="${cur}">${cf}<small>PERINGKAT</small><div class="big">${MD[cur]||it.rank}</div><h3>${esc(it.name)}</h3><p>${it.sub}</p><b>${it.val}</b></div>`:`<div class="sp"><div class="big">🥁</div><h3>Siapakah yang terbaik?</h3><p>Tekan → untuk memanggil dari peringkat ${N} sampai 1 · 🔊 musik penghargaan aktif (M = senyap)</p></div>`;
  const bd=items.map((x,i)=>s&&i>=cur?`<div class="bi ${i<3?'t'+(i+1):''} ${i===cur?'cur':''}"><span>${MD[i]||x.rank}</span><em>${esc(x.name)}</em><b>${x.val}</b></div>`:`<div class="bi q"><span>${i+1}</span><em>•••</em><b></b></div>`).join('');
  return`<h2 class="pt">${ic} ${t}</h2><div class="rk2">${sp}<div class="bd">${bd}</div></div>`}}},
 S=[
 {s:1,h:()=>`<div class="cv">${logo}<p>MA'HAD TAHFIDZ AL-QUR'AN · UIN SUNAN GUNUNG DJATI BANDUNG</p><h1>Dashboard <em>Ketahfidzan</em></h1><p>Periode ${esc(per)}</p></div>`},
 {s:1,h:()=>`<h2 class="pt">📊 Ringkasan Periode ${esc(per)}</h2><div class="kg">${kt('Santri Aktif',A.length,0)}${kt('Rata-rata Kehadiran',pa,1,'%',pa<50?'bad':pa<75?'':'ok')}${kt('Capaian Target',ca,1)}${kt('Rata-rata Nilai Akhir',va,1)}${kt('Hadir 100%',full,0,'','ok')}${kt('Zona Merah',red,0,'',red?'bad':'ok')}</div><p class="ps" style="margin-top:2.4vh">${all.length-A.length} santri non-aktif tidak dihitung dalam rata-rata</p>`},
 {s:1,h:()=>`<h2 class="pt">🎓 Sebaran Predikat</h2><div class="cd" style="max-width:1000px;margin:0 auto;width:100%">${pb(PRD.map(p=>{const c=A.filter(r=>r.predikat===p[0]).length;return{l:p[0],v:c,c:p[1],t:c+' · '+f1(100*c/n)+'%'}}),n,'var(--ok)')}</div>`},
 {s:1,h:()=>`<h2 class="pt">📅 Kehadiran & Capaian</h2><div class="cols"><div class="cd"><h3>Kehadiran per Angkatan</h3>${pb(ang.map(g=>({l:'Angkatan '+g.k,v:g.pct,t:f1(g.pct)+'%'})),100,tc)}</div><div class="cd"><h3>Putra vs Putri</h3>${pb([{l:'Kehadiran Putra',v:avgOf(L,'pct'),t:f1(avgOf(L,'pct'))+'%'},{l:'Kehadiran Putri',v:avgOf(P,'pct'),t:f1(avgOf(P,'pct'))+'%'},{l:'Capaian Putra',v:avgOf(L,'nCap'),t:f1(avgOf(L,'nCap'))},{l:'Capaian Putri',v:avgOf(P,'nCap'),t:f1(avgOf(P,'nCap'))}],100,'#7cc4ff')}</div></div>`},
 {s:1,h:()=>`<h2 class="pt">🕌 Kehadiran per Halaqah</h2><div class="cd" style="width:100%">${pb(hK.map(g=>({l:g.k,v:g.pct,t:f1(g.pct)+'%'})),100,tc)}</div>`},
 {s:1,h:()=>`<h2 class="pt">💡 Sorotan</h2><ul class="in"><li>🏅 Halaqah paling rajin: <b>${esc(hK[0].k)}</b> (${f1(hK[0].pct)}%)</li><li>🔔 Perlu perhatian: <b>${esc(hK[hK.length-1].k)}</b> (${f1(hK[hK.length-1].pct)}%)</li><li>📅 Angkatan paling rajin: <b>Angkatan ${esc(aK[0].k)}</b> (${f1(aK[0].pct)}%)</li><li>🚨 <b>${red}</b> santri (${f1(100*red/n)}%) di zona merah</li><li>💯 <b>${full}</b> santri hadir 100%, <b>${z}</b> santri tanpa alpa</li></ul>`},
 rank('Ranking Mentor Halaqah','🏆',hR.map((g,i)=>({rank:i+1,name:g.k,sub:g.n+' santri · kehadiran '+f1(g.pct)+'%',val:f1(g.avg)}))),
 rank('10 Santri Terbaik','🌟',top.map(r=>({rank:R.rank(r),name:r.nama,sub:esc(r.halaqah)+' · kehadiran '+f1(r.pct)+'%',val:f1(r.avg)}))),
 {s:1,h:()=>`<div class="cv">${logo}<h1>Terima <em>Kasih</em></h1><p>Barakallahu fiikum · Semoga istiqomah menjaga Al-Qur'an</p></div>`}];
 return S}
/* ===== MUSIK PENGHARGAAN (sintesis Web Audio, tanpa file audio) ===== */
function mkMusic(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
 const c=new AC(),M=c.createGain(),cp=c.createDynamicsCompressor(),rv=c.createConvolver(),rg=c.createGain(),dr=c.createGain(),bus=c.createGain(),an=c.createAnalyser(),mf=m=>440*Math.pow(2,(m-69)/12);
 const len=c.sampleRate*2.2,ir=c.createBuffer(2,len,c.sampleRate);for(let k=0;k<2;k++){const d=ir.getChannelData(k);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8)}
 rv.buffer=ir;rg.gain.value=.3;dr.gain.value=.85;M.gain.value=0;bus.connect(dr);dr.connect(M);bus.connect(rv);rv.connect(rg);rg.connect(M);M.connect(cp);cp.connect(c.destination);cp.connect(an);
 const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 const env=(g,t,a,d,r,v)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+Math.max(a,d));g.gain.exponentialRampToValueAtTime(.0001,t+d+r)};
 const tone=(ty,f,t,d,v,o={})=>{const s=c.createOscillator(),l=c.createBiquadFilter(),g=c.createGain();s.type=ty;s.frequency.setValueAtTime(f,t);if(o.det)s.detune.value=o.det;if(o.to)s.frequency.exponentialRampToValueAtTime(o.to,t+d);l.type='lowpass';l.frequency.value=o.lp||2500;env(g,t,o.a||.01,d,o.r||.2,v);s.connect(l);l.connect(g);g.connect(bus);s.start(t);s.stop(t+d+(o.r||.2)+.1)};
 const nz=(t,d,v,ft,fq,sweep)=>{const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=nb;s.playbackRate.value=.8+Math.random()*.4;f.type=ft;f.frequency.setValueAtTime(fq,t);if(sweep){f.frequency.exponentialRampToValueAtTime(sweep,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+d)}else{g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d)}s.connect(f);f.connect(g);g.connect(bus);s.start(t,Math.random());s.stop(t+d+.1)};
 const kick=(t,v)=>{tone('sine',150,t,.01,v,{to:44,a:.003,r:.28,lp:500});nz(t,.03,v*.25,'lowpass',900)},
 clap=(t,v)=>{[0,.012,.026].forEach(x=>nz(t+x,.09,v,'bandpass',1600))},hat=(t,v)=>nz(t,.05,v,'highpass',7500),crash=(t,d,v)=>nz(t,d,v,'highpass',4200),
 bell=(m,t,v)=>{tone('sine',mf(m),t,.02,v,{a:.004,r:.5});tone('triangle',mf(m+12),t,.02,v*.4,{a:.004,r:.35})},
 brass=(m,t,d,v,lp)=>{tone('sawtooth',mf(m),t,d,v,{a:.03,r:.18,lp:lp||2400});tone('sawtooth',mf(m),t,d,v*.7,{a:.03,r:.18,lp:lp||2400,det:11})},
 pad=(m,t,d,v,lp)=>{[-8,0,8].forEach(x=>tone('sawtooth',mf(m),t,d,v,{det:x,a:.25,r:.5,lp}))},
 clapping=(t,d,n,v)=>{for(let i=0;i<n;i++)nz(t+Math.random()*d,.06,v*(.4+Math.random()*.6),'bandpass',1400+Math.random()*2200)};
 const CH=[[50,54,57],[57,61,64],[59,62,66],[55,59,62]],BS=[38,45,47,43],beat=.5,bar=beat*4;let L=0,nx=0,bi=0,iv=0,tok=0,mut=false;
 const RF=[[0,0,.5],[.75,1,.5],[1.5,2,.5],[2,3,.9],[3,2,.45],[3.5,1,.45]];
 const sch=(t,b)=>{const ch=CH[b%4],rt=BS[b%4];ch.forEach(m=>pad(m,t,bar,.022+.006*L,1300+500*L));
  if(L===0)tone('sine',mf(rt),t,bar,.2,{a:.1,r:.4,lp:300});
  [0,1,2,3,4,5,6,7].forEach(k=>{const x=t+k*beat/2;
   if(L>=1)tone('sawtooth',mf(rt+(k%2?12:0)),x,beat*.38,.15,{a:.004,r:.08,lp:650});
   if(L===0&&k%2===0)bell(ch[(k/2)%3]+24,x,.026);
   if(L>=1)bell(ch[k%3]+12+(k>=4?12:0),x,.034);
   if(L>=1&&k%2)hat(x,.05+.02*L);
   if(L>=2&&k%2===0)hat(x,.035);
   if(L>=3){hat(x+beat/4,.03);}
   if(L>=2&&k%2)ch.forEach(m=>brass(m+12,x,beat*.18,.016,1800))});
  if(L===0){kick(t,.4);kick(t+beat*2,.28)}
  if(L>=1){[0,1,2,3].forEach(k=>kick(t+k*beat,L>=3?.75:.6));clap(t+beat,.28+.05*L);clap(t+beat*3,.28+.05*L)}
  if(L>=2){if(b%2)[3.5,3.75].forEach(k=>clap(t+k*beat,.2));RF.forEach(([a,n,d])=>{const arr=[ch[0]+12,ch[1]+12,ch[2]+12,ch[0]+24];brass(arr[n],t+a*beat,d*beat,.03+.018*(L-2),2600)})}
  if(L>=3||(L>=2&&b%2===0))crash(t,1.6,.07+.03*(L-2))};
 const tick=()=>{while(nx<c.currentTime+.9){sch(nx,bi);nx+=bar;bi++}};
 return{an,c,
 start(){c.resume();tok++;if(!iv){nx=c.currentTime+.1;bi=0;tick();iv=setInterval(tick,250)}M.gain.cancelScheduledValues(c.currentTime);M.gain.setTargetAtTime(mut?0:.85,c.currentTime,.4)},
 stop(){const k=++tok;M.gain.cancelScheduledValues(c.currentTime);M.gain.setTargetAtTime(0,c.currentTime,.3);setTimeout(()=>{if(k===tok&&iv){clearInterval(iv);iv=0}},1500)},
 lvl(x){L=x},
 riser(){const t=c.currentTime+.05;nz(t,3.2,.14,'bandpass',500,7000);for(let i=0;i<24;i++)nz(t+i*.13,.08,.04+i*.006,'bandpass',1800);tone('sawtooth',mf(50),t,3.2,.04,{to:mf(74),a:1.4,r:.3,lp:1800})},
 hit(k){const t=c.currentTime+.03;
  if(k==='a'){kick(t,.9);clap(t,.45);crash(t,1.1,.1);[74,78,81,86].forEach((m,i)=>bell(m,t+.05+i*.06,.05));brass(66,t,.35,.05,2600);brass(74,t,.35,.05,2600);clapping(t+.1,.9,10,.08)}
  else if(k==='t'){for(let i=0;i<8;i++)clap(t+i*.07,.1+i*.05);const u=t+.6;kick(u,1);crash(u,2.4,.2);[50,57,62,66,69,74].forEach(m=>brass(m,u,1.1,.04,2800));[78,81,86,90].forEach((m,i)=>bell(m,u+.05+i*.07,.06));clapping(u,2,26,.1)}
  else{for(let i=0;i<10;i++)clap(t+i*.07,.1+i*.05);const u=t+.75;kick(u,1);tone('sine',mf(38),u,.05,.8,{to:mf(26),a:.005,r:1.8,lp:200});crash(u,5,.28);[50,57,62,66,69,74,78].forEach(m=>{brass(m,u,2.6,.045,3000);tone('sine',mf(m+12),u,2.6,.02,{a:.3,r:1.5})});[86,90,93,98].forEach((m,i)=>bell(m,u+.1+i*.09,.07));clapping(u,5.5,70,.12);for(let i=0;i<14;i++)bell(78+Math.floor(Math.random()*20),u+.5+Math.random()*3.5,.03)}},
 mute(b){mut=b;M.gain.setTargetAtTime(b?0:.85,c.currentTime,.2)},
 close(){this.stop();setTimeout(()=>{clearInterval(iv);try{c.close()}catch(e){}},1800)}}}

function presOpen(){const f=act();if(!f||!f.rows.length)return;const S=presBuild(f);let i=0,s=0;const o=document.createElement('div');o.id='pres';o.innerHTML='<div class="pg"><i></i></div><div class="sl"></div><div class="bar"><button id="pp">◀</button><span id="pc"></span><button id="pn">▶</button><button id="pm" title="Musik (M)">🔊</button><button id="pf" title="Layar penuh (F)">⛶</button><button id="px" title="Tutup (Esc)">✕</button></div>';document.body.appendChild(o);const ov=document.body.style.overflow;document.body.style.overflow='hidden';
 let PM=null,mu=true,pi=-1,ps=0;try{PM=mkMusic()}catch(e){}
 const mus=()=>{if(!PM)return;const sl=S[i];if(sl.m&&mu){PM.start();const N=sl.n,cur=s?N-s:N;PM.lvl(s===0?0:cur>=N*.55?1:cur>=3?2:3);if(i===pi&&s>ps&&s>0)PM.hit(cur===0?'f':cur<3?'t':'a');else if(s===0&&(i!==pi||ps!==0))PM.riser()}else PM.stop();pi=i;ps=s},
 T=S.length,render=()=>{const sl=S[i],el=o.querySelector('.sl');el.style.animation='none';void el.offsetWidth;el.style.animation='';el.innerHTML=sl.h(s);o.querySelector('.pg i').style.width=Math.min(100,100*(i+s/sl.s)/(T-1||1))+'%';o.querySelector('#pc').textContent='Slide '+(i+1)+' / '+T+(sl.s>1&&s?'  ·  '+s+' / '+(sl.s-1):'');
  mus();requestAnimationFrame(()=>setTimeout(()=>{el.querySelectorAll('.pk i').forEach(e=>e.style.width=e.dataset.w+'%');el.querySelectorAll('.cn').forEach(e=>{const v=+e.dataset.v,d=+e.dataset.d,t0=performance.now(),st=()=>{const p=Math.min(1,(performance.now()-t0)/1100),q=1-Math.pow(1-p,3);e.textContent=(v*q).toFixed(d).replace('.',',')+e.dataset.s;if(p<1&&document.body.contains(e))requestAnimationFrame(st)};st()})},40))},
 nx=()=>{if(s<S[i].s-1)s++;else if(i<T-1){i++;s=0}render()},pv=()=>{if(s>0)s--;else if(i>0){i--;s=S[i].s-1}render()},
 cl=()=>{document.removeEventListener('keydown',kd,true);if(PM)PM.close();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});o.remove();document.body.style.overflow=ov},
 tm=()=>{mu=!mu;o.querySelector('#pm').textContent=mu?'🔊':'🔇';if(PM)PM.mute(!mu);mus()},
 fs=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(o.requestFullscreen)o.requestFullscreen().catch(()=>{})},
 kd=e=>{const k=e.key;if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(k)){e.preventDefault();e.stopPropagation();nx()}else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();e.stopPropagation();pv()}else if(k==='Escape'){e.stopPropagation();cl()}else if(k==='f'||k==='F')fs();else if(k==='m'||k==='M')tm()};
 document.addEventListener('keydown',kd,true);o.addEventListener('click',e=>{const b=e.target.closest('button');if(!b){if(e.target.closest('.bar'))return;nx();return}if(b.id==='pn')nx();else if(b.id==='pp')pv();else if(b.id==='pf')fs();else if(b.id==='pm')tm();else if(b.id==='px')cl()});render()}
document.addEventListener('click',e=>{if(e.target.closest('#pgo'))presOpen()});

/* ===== MASKOT: Fikri & Nayla ===== */
const MC_SVG={
m:`<svg viewBox="0 0 120 140" aria-hidden="true"><ellipse cx="60" cy="137" rx="42" ry="4" fill="rgba(0,0,0,.25)"/>
<path d="M12 140Q12 108 40 104L80 104Q108 108 108 140Z" fill="#1f9d6e"/><path d="M48 104L60 124L72 104Z" fill="#17795a"/><rect x="57" y="120" width="6" height="20" fill="#e9c46a"/>
<path d="M31 110Q60 128 89 110" fill="none" stroke="#ff9f43" stroke-width="4" stroke-linecap="round"/><circle cx="31" cy="111" r="7" fill="#ff9f43"/><circle cx="89" cy="111" r="7" fill="#ff9f43"/><circle cx="31" cy="111" r="3" fill="#c46a14"/><circle cx="89" cy="111" r="3" fill="#c46a14"/>
<rect x="50" y="88" width="20" height="20" rx="8" fill="#f1c19a"/>
<ellipse cx="25" cy="66" rx="5" ry="8" fill="#f1c19a"/><ellipse cx="95" cy="66" rx="5" ry="8" fill="#f1c19a"/><circle cx="60" cy="62" r="35" fill="#f1c19a"/>
<path d="M26 54Q24 20 60 19Q96 20 94 54Q60 44 26 54Z" fill="#17181c"/><path d="M28 47Q60 37 92 47" stroke="#e9c46a" stroke-width="2.6" fill="none"/>
<path d="M26 52Q25 64 31 72Q30 58 37 50Z" fill="#17181c"/><path d="M94 52Q95 64 89 72Q90 58 83 50Z" fill="#17181c"/>
<g class="ey"><ellipse cx="47" cy="65" rx="4.2" ry="5.2" fill="#222"/><ellipse cx="73" cy="65" rx="4.2" ry="5.2" fill="#222"/><circle cx="48.6" cy="63" r="1.6" fill="#fff"/><circle cx="74.6" cy="63" r="1.6" fill="#fff"/></g>
<path d="M40 56Q47 52 54 55M66 55Q73 52 80 56" stroke="#17181c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="38" cy="76" rx="6" ry="3.6" fill="#ff8aa1" opacity=".45"/><ellipse cx="82" cy="76" rx="6" ry="3.6" fill="#ff8aa1" opacity=".45"/>
<path class="mc" d="M52 78Q60 86 68 78" stroke="#7a2b2b" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse class="mo" opacity="0" cx="60" cy="80" rx="6" ry="4.5" fill="#7a2b2b"/></svg>`,
f:`<svg viewBox="0 0 120 140" aria-hidden="true"><ellipse cx="60" cy="137" rx="42" ry="4" fill="rgba(0,0,0,.25)"/>
<path d="M12 140Q12 110 38 106L82 106Q108 110 108 140Z" fill="#f4b942"/><path d="M60 106L60 140" stroke="#d99a1c" stroke-width="2"/>
<path d="M60 17C24 17 14 52 19 88C22 112 38 122 60 122C82 122 98 112 101 88C106 52 96 17 60 17Z" fill="#b79cf5"/>
<path d="M19 92Q22 132 60 134Q98 132 101 92Q90 118 60 118Q30 118 19 92Z" fill="#a086ee"/><circle cx="80" cy="112" r="4.5" fill="#e9c46a"/>
<ellipse cx="60" cy="66" rx="28" ry="31" fill="#f1c19a"/><ellipse cx="60" cy="66" rx="28" ry="31" fill="none" stroke="#9a7fe8" stroke-width="3"/>
<g class="ey"><ellipse cx="47" cy="66" rx="4.2" ry="5.2" fill="#222"/><ellipse cx="73" cy="66" rx="4.2" ry="5.2" fill="#222"/><circle cx="48.6" cy="64" r="1.6" fill="#fff"/><circle cx="74.6" cy="64" r="1.6" fill="#fff"/></g>
<circle cx="47" cy="66" r="9.5" fill="rgba(255,255,255,.18)" stroke="#3a2f55" stroke-width="2"/><circle cx="73" cy="66" r="9.5" fill="rgba(255,255,255,.18)" stroke="#3a2f55" stroke-width="2"/><path d="M56.5 65Q60 62 63.5 65" stroke="#3a2f55" stroke-width="2" fill="none"/>
<path d="M40 53Q47 49 53 52M67 52Q73 49 80 53" stroke="#4a3a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="38" cy="78" rx="6" ry="3.6" fill="#ff8aa1" opacity=".5"/><ellipse cx="82" cy="78" rx="6" ry="3.6" fill="#ff8aa1" opacity=".5"/>
<path class="mc" d="M52 79Q60 87 68 79" stroke="#7a2b2b" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse class="mo" opacity="0" cx="60" cy="81" rx="6" ry="4.5" fill="#7a2b2b"/></svg>`};
const mc={q:[],busy:false,tm:null,min:false,last:0,tip:0};
const mcTime=()=>{const h=new Date().getHours();return h<4?'Qiyamul lail yuk 🌙':h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam'};
const mcAct=()=>{const f=act();return f?f.rows.filter(r=>!/NON/i.test(r.status)):[]};
function mcBubble(w,t){const b=$('#mcb');['m','f'].forEach(k=>$('#mc .mk[data-w='+k+']').classList.toggle('talk',k===w));
 if(!w){b.style.display='none';return}
 b.className='mb '+w;b.style.display='';b.querySelector('b').textContent=w==='m'?'Fikri':'Nayla';b.querySelector('span').textContent=t;b.style.animation='none';void b.offsetWidth;b.style.animation='';mc.last=Date.now()}
function mcNext(){if(mc.busy)return;const l=mc.q.shift();if(!l){mcBubble(null);return}mc.busy=true;mcBubble(l[0],l[1]);mc.tm=setTimeout(()=>{mc.busy=false;mcNext()},Math.min(9500,3000+l[1].length*58))}
function mcSay(lines,now){if(mc.min)return;if(now){mc.q=[];clearTimeout(mc.tm);mc.busy=false}mc.q.push(...lines);mcNext()}
function mcReact(r,f){const p=Math.round(r.pct*10)/10,P=f1(p),n=nick(r.nama),K=RK(f),k=K.rank(r),h=hs(r.nama),pn=(a)=>a[h%a.length],L=[];
 if(/NON/i.test(r.status))L.push(['f',`Hai ${n}, statusmu non aktif nih. Kalau mau aktif lagi, hubungi Dewan Ketahfidzan ya 🙏`],['m','Tenang, pintu halaqah selalu terbuka kok 🤝']);
 else if(p<50)L.push(['m',pn([`${n}, kehadiranmu baru ${P}%. Yuk balik ke halaqah, kita tungguin lho 🥺`,`Eh ${n}, ${P}% itu zona merah. Jangan ghosting halaqah terus dong 👻`,`${n}, kita kangen kamu di halaqah! Hadirmu baru ${P}% 🥲`])],['f','Pelan-pelan nggak apa-apa, yang penting mulai lagi. Segera konfirmasi dan melapor ke Dewan Ketahfidzan ya 🤲']);
 else if(k&&k<=3)L.push(['f',`Masyaallah ${n}! Peringkat ${k} dari ${K.nA} santri, keren banget! 🏆`],['m','Gokil, konsisten parah. Barakallah, jadi inspirasi kita semua 🔥']);
 else if(k&&k<=10)L.push(['m',`Top 10, ${n}! Peringkat ${k} dari ${K.nA}. Mantul banget 🔥`],['f','Barakallah! Pertahankan ya, siapa tau bulan depan naik podium ✨']);
 else if(p>=90)L.push(['f',`Kehadiran ${P}%, rajin banget ${n}! 🎯`],['m','Istiqomah is your aesthetic. Lanjutkan, bro! 😎']);
 else if(p>=75)L.push(['m',`Kehadiran ${P}%, udah di zona hijau ${n}! 🌿`],['f','Dikit lagi menuju 90%, kamu pasti bisa ✨']);
 else L.push(['f',`Kehadiran ${P}%, lumayan ${n}. Tinggal tancap gas biar tembus 75% 🚀`],['m','Yuk saling ingetin buat hadir halaqah, jangan mager 🔋']);
 if(!/NON/i.test(r.status)&&p>=50)L.push(['f','Jangan lupa 📲 bagikan rapormu ke status WhatsApp atau 📄 unduh PDF resminya ya!']);
 if(!/NON/i.test(r.status)){try{const g=gmCalc(r,f);L.push(['m',`Rank kamu sekarang ${g.tr.t.e} ${g.tr.full} (${g.tr.t.n}) dengan ${xpFmt(g.xp)} EXP! ${g.tr.need>0&&g.tr.need<600?'Tinggal '+xpFmt(g.tr.need)+' EXP lagi buat naik 🔥':'Lanjut push rank ya 🚀'}`])}catch(e){}}
 mcSay(L,1)}
function mcTab(id){const A=mcAct(),f=act(),n=A.length||1,L=[];
 if(id==='tR')L.push(['m','Ketik namamu di kolom pencarian, nanti rapormu langsung muncul!'],['f','Bisa dibagikan ke status WhatsApp atau Instagram juga lho 📲']);
 else if(id==='tD'&&f){const pm=avgOf(A,'pct'),g={};A.forEach(r=>(g[r.halaqah]=g[r.halaqah]||[]).push(r));const bh=Object.keys(g).map(k=>[k,avgOf(g[k],'pct')]).sort((a,b)=>b[1]-a[1])[0];
  L.push(['m',`Ini dashboard ${perFull(f.name)}. Rata-rata kehadiran ${f1(pm)}% dari ${n} santri aktif.`]);if(bh)L.push(['f',`Halaqah paling rajin: ${bh[0]} (${f1(bh[1])}%). Selamat ya! 🎉`])}
 else if(id==='tQ')L.push(['f','Yuk latihan sambung ayat! Pilih juz atau surat, nanti ada soal pilihan ganda 📖'],['m','Hasilnya bisa dibagikan dan diunduh jadi PDF lho 🎯']);
 else if(id==='tM')L.push(['m','Mode Musyrif: lihat santri halaqahmu, cetak rapor sekaligus, dan ekspor ke Excel 📊'],['f','Masuk pakai password halaqah dari admin ya 🔐']);
 else if(id==='tB')L.push(['m','Mau bandingin siapa nih? Pilih 2 sampai 5 santri atau halaqah, nanti kelihatan siapa yang unggul di mana ⚖️']);else if(id==='tA')L.push(['m','Selamat datang di Arena Rank! Kumpulin EXP dari hadir dan setoran, naik dari Warrior sampai Immortal 🔥'],['f','Alpa bikin EXP berkurang lho, jadi hadir terus ya ✨']);
 else if(id==='tZ'||id==='tL'){if(admin){const z=A.filter(r=>r.pct<50).length;L.push(id==='tZ'?['m',`Ada ${z} santri di zona merah yang perlu dipanggil dan dievaluasi.`]:['m','Laporan analisis ini bisa jadi bahan keputusan Dewan 📑'],id==='tZ'?['f','Jangan lupa cek status pemanggilan dan SP-nya ya 🙏']:['f','Tinggal unduh PDF-nya, sudah lengkap dengan kop dan tanda tangan Ketua ✍️'])}
  else L.push(['f','Halaman ini khusus admin. Masukkan ID dan password dulu ya 🔐'],['m','Santri biasa cukup cek rapor di tab pertama, bro 😄'])}
 if(L.length)mcSay(L,1)}
const MC_CL={m:['Eh, kamu manggil aku? Santai bro, murajaah dulu yuk 📖','Aku Fikri! Hafalan boleh pelan, asal istiqomah 💪','Hadir terus itu kunci, bro 🔑 Jangan ghosting halaqah ya 😄'],f:['Haii! Aku Nayla. Yuk setor hafalan bareng ✨','Satu ayat sehari juga bakal jadi hafalan lho 📖','Kalau lagi males, inget niat awal masuk ma\'had ya 💚']};
const MC_TIP=[[['f','Murajaah dulu sebelum scroll medsos ya! 📵'],['m','Setuju. Scroll boleh, tapi setoran jangan ketinggalan 😆']],[['m','Sebaik-baik kalian adalah yang belajar Al-Qur\'an dan mengajarkannya. (HR. Al-Bukhari) 💚']],[['f','Tips: tombol 📄 Unduh PDF di rapor itu versi resminya, ada kop dan tanda tangan.'],['m','Sama 📲 Bagikan, buat dipajang di status!']],[['m','Hafalan itu kayak gym: konsisten tiap hari, bukan dikebut sehari sebelum setoran 💪']],[['f','Yang kehadirannya lagi turun, yuk saling ingetin. Jangan ghosting halaqah 👻']],[['f','Allah suka amal yang konsisten walau sedikit. Pelan-pelan, tapi jalan terus ✨']],[['m','Bingung rapor ada di mana? Cari namamu di tab 📖 Rapor Santri.']]];
function mcInit(){if(document.getElementById('mc'))return;const d=document.createElement('div');d.id='mc';
 d.innerHTML=`<div class="mb m" id="mcb" style="display:none" role="status" aria-live="polite"><b></b><span></span></div><div class="mw"><button class="mt" id="mcT" aria-label="Sembunyikan maskot">–</button><div class="mk" data-w="m" role="button" tabindex="0" aria-label="Fikri">${MC_SVG.m}<i class="nm">Fikri</i></div><div class="mk" data-w="f" role="button" tabindex="0" aria-label="Nayla">${MC_SVG.f}<i class="nm">Nayla</i></div></div>`;
 document.body.appendChild(d);
 try{mc.min=localStorage.getItem('tahfiz_mc')==='1'}catch(e){}
 const setMin=v=>{mc.min=v;d.classList.toggle('min',v);$('#mcT').textContent=v?'💬 Fikri & Nayla':'–';try{localStorage.setItem('tahfiz_mc',v?'1':'0')}catch(e){}if(v){mc.q=[];clearTimeout(mc.tm);mc.busy=false;mcBubble(null)}else mcSay([['m','Halo lagi! Aku Fikri 👋'],['f','Dan aku Nayla. Panggil kami kalau butuh teman ngobrol ✨']],1)};
 d.classList.toggle('min',mc.min);$('#mcT').textContent=mc.min?'💬 Fikri & Nayla':'–';
 $('#mcT').onclick=()=>setMin(!mc.min);
 d.addEventListener('click',e=>{const k=e.target.closest('.mk');if(k){const w=k.dataset.w,a=MC_CL[w];mcSay([[w,a[mc.tip++%a.length]]],1);return}if(e.target.closest('#mcb')){clearTimeout(mc.tm);mc.busy=false;mcNext()}});
 d.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.classList.contains('mk'))e.target.click()});
 $('#nav').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTimeout(()=>mcTab(b.id),80)});
 const lg=()=>setTimeout(()=>{if(admin)mcSay([['f','Login admin berhasil ✅ Selamat datang, Ust./Usth.!'],['m','Semua fitur admin sudah terbuka. Semangat evaluasinya! 💼']],1)},900);
 $('#go').addEventListener('click',lg);$('#pw').addEventListener('keydown',e=>{if(e.key==='Enter')lg()});
 setTimeout(()=>mcSay([['f',`Assalamu'alaikum! ${mcTime()} 👋 Aku Nayla.`],['m','Aku Fikri. Yuk cek rapor tahfidzmu, ketik namamu di atas!']]),1400);
 let ix=0;setInterval(()=>{if(document.hidden||mc.min||mc.busy||mc.q.length||Date.now()-mc.last<30000)return;mcSay(MC_TIP[ix++%MC_TIP.length])},9000)}
mcInit();

/* ===== LATIHAN TES HAFALAN QUR'AN ===== */
function qPlain(s){return s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640]/g,'').replace(/[ٱأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim()}
const QJ=window.QURAN_DATA,QN=QJ.n,QA=QJ.v.map((x,i)=>({i,s:x[0],a:x[1],j:x[2],t:x[3],p:qPlain(x[3])})),QBy={},QC=new Map();
QA.forEach(x=>{(QBy[x.s]=QBy[x.s]||[]).push(x);QC.set(x.p,(QC.get(x.p)||0)+1)});
const QS={mode:'juz',juz:new Set([30]),sur:new Set(),n:10,hint:true,name:'',ph:'setup',qs:[],i:0,fb:false,res:null,filter:'',streak:0,k:'s1',diff:1,tm:0},QF='"Amiri Quran","Amiri","Noto Naskh Arabic",serif';
try{QS.name=localStorage.getItem('tahfiz_qname')||''}catch(e){}
const qPool=()=>QS.mode==='juz'?QA.filter(x=>QS.juz.has(x.j)):QA.filter(x=>QS.sur.has(x.s));
const qOK=x=>{const nx=QBy[x.s][x.a];return!!nx&&x.p.length>=8&&nx.p.length>=6&&QC.get(x.p)===1};
const qSh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const qRef=x=>'QS. '+QN[x.s-1]+' : '+x.a+(x.e&&x.e>x.a?'–'+x.e:'');
function qRanges(a){a=[...a].sort((x,y)=>x-y);const o=[];let s=a[0],p=a[0];for(let i=1;i<=a.length;i++){if(a[i]===p+1){p=a[i];continue}o.push(s===p?String(s):s+'–'+p);s=p=a[i]}return o.join(', ')}
function qScope(full){if(QS.mode==='juz')return 'Juz '+qRanges(QS.juz);const n=[...QS.sur].sort((a,b)=>a-b).map(k=>QN[k-1]);return full||n.length<=4?n.join(', '):n.slice(0,4).join(', ')+' dan '+(n.length-4)+' surat lainnya'}
const QKL={s1:'Sambung 1 ayat',s2:'Lanjutkan 2 ayat',s3:'Lanjutkan 3 ayat',surat:'Tebak surat',nomor:'Tebak nomor ayat',mut:'Ayat mutasyabihat (mirip)'};
/* Data mutasyabihat terkurasi: [[ [surat,ayat],... ], catatan pembeda]. Teks ayat diambil dari data Qur'an di file ini. */
const QMG=[
[[[2,35],[7,19]],'2:35 diawali «wa qulnā» dan memuat «raghadan»; 7:19 diawali «wa yā Ādamu» tanpa «raghadan».'],
[[[2,58],[7,161]],'2:58 «wa idz qulnā udkhulū…» + «raghadan»; 7:161 «wa idz qīla lahum uskunū…» tanpa «raghadan».'],
[[[3,133],[57,21]],'3:133 «wa sāri\'ū» dan «\'arḍuhas-samāwātu wal-arḍ»; 57:21 «sābiqū» dan «ka-\'arḍis-samā\'i wal-arḍ».'],
[[[7,54],[10,3]],'7:54 berlanjut «yughshil-layla an-nahāra yathlubuhu ḥathīthā»; 10:3 berlanjut «yudabbirul-amr».'],
[[[2,126],[14,35]],'2:126 «baladan āminan» (tanpa alif-lam); 14:35 «al-balada āminan» dan ada «wajnubnī».'],
[[[6,32],[29,64]],'6:32 «la\'ibun wa lahwun»; 29:64 «lahwun wa la\'ib» dan ada «al-ḥayawān».'],
[[[28,20],[36,20]],'28:20 «wa jā\'a rajulun min aqshal-madīnah»; 36:20 «wa jā\'a min aqshal-madīnati rajulun» (letak «rajulun» berbeda).'],
[[[7,59],[23,23]],'7:59 tanpa «wa» di awal dan berakhir «innī akhāfu \'alaykum \'adzāba yawmin \'azhīm»; 23:23 diawali «wa laqad» dan berakhir «afalā tattaqūn».'],
[[[3,185],[21,35],[29,57]],'Ketiganya diawali «kullu nafsin dzā\'iqatul-maut». 3:185 lanjut «wa innamā tuwaffawna ujūrakum»; 21:35 «wa nabluwakum bisy-syarri wal-khayr»; 29:57 «tsumma ilaynā turja\'ūn».'],
[[[2,62],[5,69]],'2:62 «wan-naṣārā waṣ-ṣābi\'īn»; 5:69 «waṣ-ṣābi\'ūna wan-naṣārā» (urutan dan i\'rab berbeda).']];
const QM=new Map();QMG.forEach(([rf,note],g)=>{const L=rf.map(([s,a])=>QBy[s]&&QBy[s][a-1]).filter(Boolean);L.forEach(x=>QM.set(x.i,{g,note,sib:L.filter(y=>y!==x)}))});
const qNx=(x,n)=>{const L=QBy[x.s];if(!L[x.a+n-1])return null;const z=L.slice(x.a,x.a+n),t=z.map(v=>v.t).join(' ');return Object.assign({},z[0],{e:z[n-1].a,t,p:qPlain(t)})};
function qAvail(){const k=QS.k,P=qPool();
 if(k==='mut')return P.filter(x=>QM.has(x.i)&&QBy[x.s][x.a]);
 if(k==='surat')return P.filter(x=>x.p.length>=12&&QC.get(x.p)===1);
 if(k==='nomor')return P.filter(x=>x.p.length>=12&&QC.get(x.p)===1&&QBy[x.s].length>=4);
 if(k==='s1')return P.filter(qOK);const n=k==='s2'?2:3;return P.filter(x=>{const z=qNx(x,n);return z&&x.p.length>=8&&z.p.length>=6*n&&QC.get(x.p)===1})}
const qOkN=()=>QS.k==='mut'?new Set(qAvail().map(x=>QM.get(x.i).g)).size:qAvail().length;
function qDs(x,ans,f){const L=ans.p.length,last=ans.p.slice(-1),d=QS.diff,W=new Set(ans.p.split(' '));
 const cand=[...qSh(qPool()).slice(0,350),...qSh(QA).slice(0,250)].map(f).filter(c=>c&&c.i!==ans.i&&c.i!==x.i).map(c=>{const ln=Math.abs(c.p.length-L)/L,sm=c.p.split(' ').filter(w=>W.has(w)).length/(W.size+1);return[c,d===0?Math.random():d===2?(1-sm)+ln*.5+Math.random()*.1:ln+(c.p.slice(-1)===last?0:.2)+Math.random()*.25-(c.s===x.s?.05:0)]}).sort((a,b)=>a[1]-b[1]),seen=new Set([ans.p,x.p]),ds=[];
 cand.forEach(([c])=>{if(ds.length<3&&!seen.has(c.p)){seen.add(c.p);ds.push(c)}});return ds}
function qMk(x){const k=QS.k,d=QS.diff,H=QS.hint&&d<2,mk=(a,ds,o)=>{const op=o&&o.srt?[a,...ds].sort((p,r)=>p.a-r.a):qSh([a,...ds]);return Object.assign({k,q:x,a,o:op,c:op.indexOf(a),u:-1,rf:H?qRef(x)+' · Juz '+x.j:'',pr:'Sambungkan ayat berikut dengan ayat sesudahnya:',lb:'Sambungan yang benar'},o)};
 if(k==='surat'){const ss=[...Array(114)].map((_,i)=>i+1),sc=d===0?ss:[...new Set(qPool().map(c=>c.s))];let cs=qSh(sc.filter(s=>s!==x.s));if(d===2)cs=qSh(ss.filter(s=>s!==x.s).sort((p,r)=>Math.abs(p-x.s)-Math.abs(r-x.s)).slice(0,6));if(cs.length<3)cs=qSh(ss.filter(s=>s!==x.s));const sv=s=>({s,a:x.a,j:x.j,t:QN[s-1]});return mk(sv(x.s),cs.slice(0,3).map(sv),{lat:1,rf:'',pr:'Ayat berikut terdapat dalam surat apa?',lb:'Surat yang benar'})}
 if(k==='nomor'){const mx=QBy[x.s].length,Rg=d===0?mx:d===1?8:3,S=new Set([x.a]);let g=0;while(S.size<4&&g++<300)S.add(Math.max(1,Math.min(mx,x.a+Math.round((Math.random()*2-1)*Rg))));const nv=v=>({s:x.s,a:v,j:x.j,t:'Ayat '+v});return mk(nv(x.a),[...S].filter(v=>v!==x.a).map(nv),{lat:1,srt:1,rf:'QS. '+QN[x.s-1],pr:'Ayat berikut nomor berapa?',lb:'Nomor ayat yang benar'})}
 if(k==='mut'){const m=QM.get(x.i),a=qNx(x,1),ds=[];m.sib.forEach(s=>{const c=qNx(s,1);if(c&&c.p!==a.p&&!ds.some(z=>z.p===c.p))ds.push(c)});qDs(x,a,c=>c).forEach(c=>{if(ds.length<3&&!ds.some(z=>z.p===c.p))ds.push(c)});return mk(a,ds.slice(0,3),{note:m.note,pr:'Ayat ini mirip dengan ayat lain. Sambungkan dengan ayat sesudahnya:'})}
 const n=k==='s2'?2:k==='s3'?3:1,a=qNx(x,n);return mk(a,qDs(x,a,c=>qNx(c,n)),n>1?{pr:'Lanjutkan dengan '+n+' ayat sesudahnya:',lb:'Sambungan '+n+' ayat yang benar'}:{})}
function qGen(){const pool=qAvail(),N=Math.min(QS.n,QS.k==='mut'?qOkN():pool.length),P=qSh(pool),pick=[],used=new Set(),M=QS.k==='mut';
 for(const x of P){if(pick.length>=N)break;const k=x.s*1000+x.a,g=M?'g'+QM.get(x.i).g:null;if(used.has(k-1)||used.has(k+1)||(g&&used.has(g)))continue;used.add(k);if(g)used.add(g);pick.push(x)}
 if(!M)for(const x of P){if(pick.length>=N)break;if(!pick.includes(x))pick.push(x)}
 return pick.map(qMk)}
let qTi=null;const qStop=()=>{clearInterval(qTi);qTi=null};
function qTick(){if(qTi)return;const q=QS.qs[QS.i],t0=Date.now();qTi=setInterval(()=>{const r=Math.max(0,QS.tm-Math.floor((Date.now()-t0)/1000)),e=$('#qtt'),b=$('#qtb');if(e)e.textContent=r;if(b)b.style.width=r/QS.tm*100+'%';if(r<=0){qStop();if(!QS.fb){q.u=-1;q.to=1;QS.fb=true;QS.streak=0;qRender()}}},250)}
$('#qz').addEventListener('change',e=>{const t=e.target;if(t.id==='qk'){QS.k=t.value;qRender()}else if(t.id==='qd'){QS.diff=+t.value;qRender()}else if(t.id==='qt')QS.tm=+t.value});
const qGrade=p=>p>=90?['MUMTAZ','Luar biasa']:p>=75?['JAYYID JIDDAN','Sangat baik']:p>=60?['JAYYID','Baik']:p>=40?['MAQBUL','Cukup']:['PERLU MURAJAAH','Terus berlatih'];
const QMSG={h:['Hafalanmu kokoh banget, sambung ayatnya udah kayak autopilot! Barakallah 🔥','Masyaallah, ayat-ayat itu udah nempel di hati kamu ✨','Mantul! Pertahankan dengan murajaah rutin ya 💚'],m:['Lumayan banget! Murajaah bagian yang masih salah, bulan depan bisa tembus lebih tinggi 🚀','Udah di jalur yang benar, tinggal diperkuat sedikit lagi 💪','Dikit lagi sempurna. Ulangi tesnya biar makin lengket 🔁'],l:['Gapapa, namanya juga latihan. Yang penting kamu berani mencoba 🤲','Murajaah lagi yuk, pelan-pelan tapi konsisten. Kamu pasti bisa 🌱','Cek rincian jawabannya, ulang lagi sampai hafalannya lengket di hati 📖']};
const qMsg=p=>{const a=p>=75?QMSG.h:p>=50?QMSG.m:QMSG.l;return a[(p*7+QS.qs.length)%a.length]};
function qSetupH(){const P=qPool(),ok=qOkN(),cnt=QS.mode==='juz'?QS.juz.size:QS.sur.size,f=QS.filter.trim().toLowerCase(),J=QS.mode==='juz';
 const chips=Array.from({length:30},(_,k)=>k+1).map(j=>`<button class="qc${QS.juz.has(j)?' on':''}" data-qj="${j}">Juz ${j}</button>`).join('');
 const list=QN.map((n,k)=>[k+1,n]).filter(([k,n])=>!f||n.toLowerCase().includes(f)||String(k)===f).map(([k,n])=>`<label class="qs${QS.sur.has(k)?' on':''}"><input type="checkbox" data-qs="${k}"${QS.sur.has(k)?' checked':''}><span>${k}. ${esc(n)}</span></label>`).join('')||'<p class="hint">Surat tidak ditemukan.</p>';
 return `<div class="glass dc"><h3>🎯 Latihan Tes Hafalan Qur'an <small>sambung ayat · tebak surat · mutasyabihat</small></h3><p class="leg" style="margin:0 0 12px">Pilih cakupan hafalanmu, sistem menyusun soal acak. Boleh pilih lebih dari satu juz atau surat, dan boleh diulang sebanyak yang kamu mau.</p>
 <div class="seg qseg"><button data-qm="juz" class="${J?'on':''}">📚 Per Juz</button><button data-qm="surah" class="${J?'':'on'}">📖 Per Surat</button></div>
 ${J?`<div class="qchips">${chips}</div><div class="qpre"><button class="btn g" data-qp="j30">Juz 30</button><button class="btn g" data-qp="j2930">Juz 29–30</button><button class="btn g" data-qp="jall">Semua juz</button><button class="btn g" data-qp="jreset">Reset</button></div>`
 :`<input id="qf" class="qin" placeholder="Cari surat (nama atau nomor)…" value="${esc(QS.filter)}" autocomplete="off"><div class="qlist">${list}</div><div class="qpre"><button class="btn g" data-qp="s78">Juz 'Amma (78–114)</button><button class="btn g" data-qp="sall">Semua surat</button><button class="btn g" data-qp="sreset">Reset</button></div>`}
 <div class="qsum">${cnt?`<b>${cnt}</b> ${J?'juz':'surat'} dipilih · <b>${P.length}</b> ayat · <b>${ok}</b> soal tersedia`:'Belum ada pilihan. Pilih minimal satu '+(J?'juz':'surat')+'.'}${ok&&ok<QS.n?`<br><small>Soal tersedia kurang dari ${QS.n}, tes akan berisi ${ok} soal.</small>`:''}</div>
 ${QS.k==='mut'?`<p class="hint" style="text-align:left;margin:6px 0">Mode ini memakai ${QMG.length} kelompok ayat mutasyabihat terkurasi. Pilih juz/surat yang memuatnya, mis. Juz 1–10, 21, 28–29.</p>`:''}<div class="qopt"><label>Jumlah soal<select id="qn">${[5,10,15,20].map(v=>`<option${QS.n===v?' selected':''}>${v}</option>`).join('')}</select></label><label>Nama (opsional, untuk hasil)<input id="qname" class="qin" value="${esc(QS.name)}" maxlength="40" placeholder="Nama kamu"></label><label>Jenis soal<select id="qk">${Object.entries(QKL).map(([v,n])=>`<option value="${v}"${QS.k===v?' selected':''}>${n}</option>`).join('')}</select></label><label>Tingkat kesulitan<select id="qd">${['Mudah · opsi acak, ada petunjuk','Sedang','Sulit · opsi mirip, tanpa petunjuk'].map((n,i)=>`<option value="${i}"${QS.diff===i?' selected':''}>${n}</option>`).join('')}</select></label><label>Waktu per soal<select id="qt">${[[0,'Tanpa batas'],[15,'15 detik'],[30,'30 detik'],[60,'60 detik']].map(([v,n])=>`<option value="${v}"${QS.tm===v?' selected':''}>${n}</option>`).join('')}</select></label><label class="chk"><input type="checkbox" id="qh"${QS.hint?' checked':''}> Tampilkan petunjuk surat &amp; nomor ayat</label></div>
 <button class="btn qgo" data-qa="start" ${ok?'':'disabled'}>🚀 Mulai Tes</button></div>`}
function qQuizH(){const q=QS.qs[QS.i],T=QS.qs.length,good=QS.qs.filter(z=>z.u===z.c&&z.u>=0).length,L='ABCD',last=QS.i===T-1,r=q.u===q.c;
 return `<div class="glass dc"><div class="qtop"><span>Soal <b>${QS.i+1}</b> / ${T}</span><span class="ok">✔ ${good} benar</span><button class="btn d" data-qa="quit">✕ Keluar</button></div>
 <div class="track" style="margin:10px 0 16px"><div class="fill" style="width:${(QS.i+(QS.fb?1:0))/T*100}%;background-color:var(--gold)"></div></div>
 ${QS.tm?`<div class="qtm"><i id="qtb" style="width:100%"></i><span><b id="qtt">${QS.tm}</b> detik</span></div>`:''}<p class="qlbl">${esc(q.pr)}</p><div class="qar">${esc(q.q.t)}</div>${q.rf?`<div class="qref">${esc(q.rf)}</div>`:''}
 <div class="qopts">${q.o.map((o,k)=>`<button class="qo${QS.fb?(k===q.c?' ok':k===q.u?' bad':''):''}" data-qo="${k}"${QS.fb?' disabled':''}><span class="ql">${L[k]}</span><span class="qt${q.lat?' lt':''}">${esc(o.t)}</span></button>`).join('')}</div>
 ${QS.fb?`<div class="qfb ${r?'ok':'bad'}"><b>${r?'✅ Benar, masyaallah!':(q.to?'⏰ Waktu habis. ':'❌ Belum tepat. ')+'Jawaban yang benar: '+L[q.c]}</b><span>${q.lat?'Letak ayat':'Ayat sesudahnya'}: ${esc(qRef(q.a))} · Juz ${q.a.j}</span>${q.note?`<span>💡 ${esc(q.note)}</span>`:''}<button class="btn" data-qa="next">${last?'🏁 Lihat Hasil':'Lanjut ➜'}</button></div>`:''}</div>`}
const qSfx=()=>' · '+QKL[QS.k]+' · '+['Mudah','Sedang','Sulit'][QS.diff]+(QS.tm?' · '+QS.tm+' dtk/soal':'');
function qFinish(){const T=QS.qs.length,ben=QS.qs.filter(z=>z.u===z.c).length,pc=Math.round(ben/T*100);
 QS.res={tgl:new Date(),name:QS.name.trim(),scope:qScope(false)+qSfx(),scopeFull:qScope(true)+qSfx(),T,ben,pc,gr:qGrade(pc),msg:qMsg(pc),items:QS.qs.map(z=>({lb:z.lb,q:z.q,a:z.a,u:z.u>=0?z.o[z.u]:null,ok:z.u===z.c}))};QS.ph='result';
 try{mcSay(pc>=75?[['f',`Masyaallah, ${pc}%! Hafalanmu mantap banget ✨`],['m','Gas terus! Bagiin hasilnya ke status biar yang lain ikut semangat 📲']]:pc>=50?[['m',`${pc}%, lumayan! Dikit lagi bisa tembus 80% 💪`],['f','Murajaah bagian yang salah, lalu coba lagi ya 🔁']]:[['f','Gapapa, namanya juga latihan. Yang penting kamu berani nyoba 🤲'],['m','Cek rincian jawabannya, ulang lagi biar makin lengket di hati 📖']],1)}catch(e){}}
const qTgl=d=>d.getDate()+' '+['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]+' '+d.getFullYear();
function qResH(){const R=QS.res,C=2*Math.PI*54,col=R.pc>=75?'var(--ok)':R.pc>=50?'var(--mid)':'var(--bad)',tc=R.pc>=75?'ok':R.pc>=50?'mid':'bad';
 return `<div class="glass dc qres"><h3>🏁 Hasil Latihan Tes Hafalan <small>${esc(qTgl(R.tgl))}</small></h3>${R.name?`<p class="qnm">${esc(R.name)}</p>`:''}<p class="leg" style="margin:0 0 10px">Cakupan: ${esc(R.scope)}</p>
 <div class="qrg"><div class="ring"><svg width="170" height="170" viewBox="0 0 128 128"><circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="11"/><circle cx="64" cy="64" r="54" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-R.pc/100)}" style="transform:rotate(-90deg);transform-origin:64px 64px"/></svg><div class="c"><b class="${tc}">${R.pc}%</b><span>${R.ben} dari ${R.T} benar</span></div></div>
 <div class="qgm"><span class="sv ${R.pc>=75?'w':R.pc>=50?'w':'k'}" style="font-size:13px">${R.gr[0]}</span><p>${esc(R.msg)}</p></div></div>
 <div class="shr"><div><b>📲 Bagikan &amp; simpan hasilmu</b><span>Gambar PNG (format story) untuk status WhatsApp/Instagram, atau PDF dengan rincian jawaban lengkap.</span></div><div class="shb"><button class="btn" data-qa="png">📤 Bagikan PNG</button><button class="btn g" data-qa="pngs">⬇️ Simpan PNG</button><button class="btn" data-qa="pdf">📄 Unduh PDF</button><button class="btn g" data-qa="pdfs">📨 Bagikan PDF</button></div><em class="shm"></em></div>
 <div class="qpre" style="margin-top:14px"><button class="btn" data-qa="again">🔁 Ulangi (soal baru)</button><button class="btn g" data-qa="setup">⚙️ Ganti pilihan</button></div>
 <h3 class="aprh" style="margin-top:22px">Rincian Jawaban</h3>${R.items.map((it,k)=>`<div class="qrv ${it.ok?'ok':'bad'}"><div class="qrh"><b>${k+1}.</b> ${it.ok?'✅ Benar':'❌ Salah'}<small>${esc(qRef(it.q))} → ${esc(qRef(it.a))}</small></div><div class="qar sm">${esc(it.q.t)}</div><div class="qrl">${esc(it.lb||'Sambungan benar')}</div><div class="qar sm okt">${esc(it.a.t)}</div>${it.ok?'':`<div class="qrl">Jawabanmu</div><div class="qar sm bdt">${it.u?esc(it.u.t):'(tidak dijawab)'}</div>`}</div>`).join('')}</div>`}
function qRender(){const el=$('#qz'),fo=document.activeElement&&document.activeElement.id==='qf',l0=el.querySelector('.qlist'),st=l0?l0.scrollTop:0;
 el.innerHTML=QS.ph==='setup'?qSetupH():QS.ph==='quiz'?qQuizH():qResH();
 QS.ph==='quiz'&&!QS.fb&&QS.tm?qTick():qStop();
 if(QS.ph==='setup'){const l=el.querySelector('.qlist');if(l)l.scrollTop=st;if(fo){const i=el.querySelector('#qf');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}}
 requestAnimationFrame(()=>{const f=el.querySelector('.track .fill');if(f){const w=f.style.width;f.style.width='0';requestAnimationFrame(()=>f.style.width=w)}})}
const qTop=()=>{const e=$('#qz');if(e&&e.scrollIntoView)e.scrollIntoView({behavior:'smooth',block:'start'})};
/* --- file keluaran --- */
async function qOut(blob,fn,share,msg,title,text){const set=t=>{if(msg)msg.textContent=t};
 try{if(share){const fl=new File([blob],fn,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[fl]})){try{await navigator.share({files:[fl],title,text});set('✔ Dibagikan');return}catch(e){if(e&&e.name==='AbortError'){set('');return}}}}
  const dn=window.claude&&claude.use?await claude.use('downloads'):null;
  if(dn)await dn.save({filename:fn,data:blob});else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
  set(share?'✔ File disimpan. Buka WhatsApp/Instagram lalu pilih file dari galeri/unduhan untuk dibagikan.':'✔ File siap disimpan.')}catch(e){set(e&&e.code==='declined'?'Dibatalkan':'✖ Gagal: '+(e&&e.message||e))}}
async function arImg(t,W,fs,col){try{await document.fonts.load(fs+'px "Amiri Quran"')}catch(e){}
 const c=document.createElement('canvas'),F=fs+'px '+QF;let x=c.getContext('2d');x.font=F;try{x.direction='rtl'}catch(e){}
 const lines=[];let cur='';t.split(' ').forEach(w=>{const u=cur?cur+' '+w:w;if(x.measureText(u).width>W-24&&cur){lines.push(cur);cur=w}else cur=u});if(cur)lines.push(cur);
 const lh=Math.round(fs*1.9);c.width=W;c.height=lines.length*lh+8;x=c.getContext('2d');x.font=F;try{x.direction='rtl'}catch(e){}x.textAlign='right';x.textBaseline='middle';x.fillStyle=col||'#111';lines.forEach((l,i)=>x.fillText(l,W-12,4+lh*i+lh/2));
 return{u:c.toDataURL('image/png'),w:W,h:c.height}}
async function qPdf(R){const d=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),W=210,M=22,CW=W-2*M,BOT=278;let y=14;const K=.3528;
 const im=[...document.querySelectorAll('.logos img')].reverse(),M2=24;
 im.forEach((g,i)=>{if(!g.naturalWidth)return;const h=22,w=h*g.naturalWidth/g.naturalHeight;try{d.addImage(g.src,'PNG',i?W-M2+4-w:M2-4,y,w,h)}catch(e){}});
 d.setFont('times','bold');[['KEMENTERIAN AGAMA REPUBLIK INDONESIA',10.5],['UNIVERSITAS ISLAM NEGERI',11.5],['SUNAN GUNUNG DJATI BANDUNG',11.5],["MA'HAD TAHFIDZ AL-QUR'AN",13],['DEWAN MAJLIS KETAHFIDZAN',11.5]].forEach(([s,z],i)=>{d.setFontSize(z);d.text(s,W/2,y+4+i*4.9,{align:'center'})});
 d.setFont('times','normal');d.setFontSize(8.5);d.setTextColor(60,60,60);['Jl. Raya Cileunyi RT.001 RW.021 Kel. Cileunyi Wetan, Kab. Bandung, 40622, +62 821-8134-4345','E-mail : mahad.tahfidz@uinsgd.ac.id'].forEach((s,i)=>d.text(s,W/2,y+30.2+i*3.7,{align:'center'}));d.setTextColor(0,0,0);
 y+=36.5;d.setDrawColor(0);d.setLineWidth(.9);d.line(M2-4,y,W-M2+4,y);d.setLineWidth(.3);d.line(M2-4,y+1.2,W-M2+4,y+1.2);y+=9;
 d.setFont('times','bold');d.setFontSize(14);d.text("HASIL LATIHAN TES HAFALAN AL-QUR'AN",W/2,y,{align:'center'});y+=6;d.setFont('times','normal');d.setFontSize(11);d.text('Sambung Ayat · Pilihan Ganda',W/2,y,{align:'center'});y+=9;
 const row=(a,b)=>{d.setFont('times','bold');d.setFontSize(11);d.text(a,M,y);d.setFont('times','normal');const L=d.splitTextToSize(String(b),CW-42);d.text(L,M+42,y);y+=L.length*5.2+.8};
 row('Nama',R.name||'-');row('Tanggal',qTgl(R.tgl));row('Cakupan',R.scopeFull);row('Jumlah soal',R.T+' soal');row('Jawaban benar',R.ben+' soal');row('Jawaban salah',(R.T-R.ben)+' soal');
 y+=2;const bc=R.pc>=75?[225,243,234]:R.pc>=50?[252,240,214]:[250,224,225];d.setFillColor(...bc);d.setDrawColor(150);d.setLineWidth(.2);d.rect(M,y,CW,16,'FD');d.setFont('times','bold');d.setFontSize(15);d.text('Skor : '+R.pc+'%   ·   '+R.gr[0],W/2,y+7.2,{align:'center'});d.setFont('times','italic');d.setFontSize(9.5);d.text(R.msg.replace(/[^\x20-\x7EÀ-ɏ’‘“”]/g,'').trim(),W/2,y+12.6,{align:'center',maxWidth:CW-6});y+=22;
 d.setFont('times','italic');d.setFontSize(9);d.setTextColor(90,90,90);d.text('Dokumen ini adalah hasil latihan mandiri, bukan penilaian resmi.',M,y);d.setTextColor(0,0,0);y+=8;
 d.setFont('times','bold');d.setFontSize(12.5);d.setTextColor(31,111,85);d.text('Rincian Jawaban',M,y);d.setDrawColor(31,111,85);d.setLineWidth(.5);d.line(M,y+1.6,W-M,y+1.6);d.setTextColor(0,0,0);y+=7;
 const IW=CW-6,pm=CW/1300;
 for(let k=0;k<R.items.length;k++){const it=R.items[k],A=await arImg(it.q.t,1300,38,'#111'),B=await arImg(it.a.t,1300,38,'#1b6b4a'),C=it.ok?null:await arImg(it.u?it.u.t:'(tidak dijawab)',1300,38,'#b4232c');
  const hh=7+A.h*pm+5+B.h*pm+(C?5+C.h*pm:0)+4;if(y+hh>BOT){d.addPage();y=22}
  d.setFont('times','bold');d.setFontSize(11);d.setTextColor(it.ok?27:180,it.ok?107:35,it.ok?74:44);d.text((k+1)+'. '+(it.ok?'BENAR':'SALAH'),M,y);d.setFont('times','normal');d.setFontSize(9);d.setTextColor(90,90,90);d.text(qRef(it.q)+'  ->  '+qRef(it.a),W-M,y,{align:'right'});d.setTextColor(0,0,0);y+=2;
  d.addImage(A.u,'PNG',M,y,CW,A.h*pm);y+=A.h*pm+3.4;d.setFontSize(8.5);d.setTextColor(27,107,74);d.text(it.lb?it.lb+':':'Sambungan yang benar:',M,y);d.setTextColor(0,0,0);y+=1;d.addImage(B.u,'PNG',M,y,CW,B.h*pm);y+=B.h*pm+2;
  if(C){d.setFontSize(8.5);d.setTextColor(180,35,44);d.text('Jawabanmu:',M,y+1.4);d.setTextColor(0,0,0);y+=2.4;d.addImage(C.u,'PNG',M,y,CW,C.h*pm);y+=C.h*pm+1}
  d.setDrawColor(200);d.setLineWidth(.15);d.line(M,y+1,W-M,y+1);y+=5}
 const N=d.getNumberOfPages();for(let i=1;i<=N;i++){d.setPage(i);d.setTextColor(90,90,90);d.setFont('times','normal');d.setFontSize(8.5);d.setDrawColor(150);d.setLineWidth(.2);d.line(M,283,W-M,283);d.text("Latihan Tes Hafalan - Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung",M,288);d.text('Halaman '+i+' dari '+N,W-M,288,{align:'right'});d.setTextColor(0,0,0)}
 return d}
async function qPng(R){try{await Promise.all(['800 40px "Plus Jakarta Sans"','600 30px "Plus Jakarta Sans"','700 30px "Plus Jakarta Sans"'].map(s=>document.fonts.load(s)))}catch(e){}
 const FF='"Plus Jakarta Sans",system-ui,sans-serif',W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),GOLD='#e9c46a',MUT='#a9c4b9',INK='#f4f1e6',CL=R.pc>=75?'#3ddc97':R.pc>=50?'#f4a93b':'#ff5a5f';
 const ca=(t,px,wt,col,X,Y,al)=>{x.font=(wt||700)+' '+px+'px '+FF;x.fillStyle=col||INK;x.textAlign=al||'center';x.fillText(t,X,Y)},fit=(t,mw,wt,s)=>{while(s>18){x.font=wt+' '+s+'px '+FF;if(x.measureText(t).width<=mw)break;s-=2}return s};
 let g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0b4a3a');g.addColorStop(.55,'#06332a');g.addColorStop(1,'#04261f');x.fillStyle=g;x.fillRect(0,0,W,H);
 [[150,80,700,'18,122,92,.75'],[1080,460,650,'201,161,59,.42'],[200,1750,600,'18,122,92,.45']].forEach(([a,b,Rr,co])=>{const q=x.createRadialGradient(a,b,0,a,b,Rr);q.addColorStop(0,'rgba('+co+')');q.addColorStop(1,'rgba('+co.replace(/,[^,]*$/,',0')+')');x.fillStyle=q;x.fillRect(0,0,W,H)});
 x.strokeStyle='rgba(233,196,106,.09)';x.lineWidth=2;for(let a=0;a<W+120;a+=120)for(let b=0;b<H+120;b+=120)star8(x,a,b,38);
 const lg=[...document.querySelectorAll('.logos img')].filter(i=>i.naturalWidth),LH=108,lw=lg.map(i=>LH*i.naturalWidth/i.naturalHeight),tw=lw.reduce((s,v)=>s+v,0)+(lg.length-1)*40,pw=tw+90;
 x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=30;x.shadowOffsetY=10;x.fillStyle='#fff';rrect(x,(W-pw)/2,60,pw,LH+44,40);x.fill();x.restore();x.strokeStyle=GOLD;x.lineWidth=4;rrect(x,(W-pw)/2,60,pw,LH+44,40);x.stroke();
 let lx=(W-tw)/2;lg.forEach((i,k)=>{try{x.drawImage(i,lx,82,lw[k],LH)}catch(e){}lx+=lw[k]+40});
 ca("MA'HAD TAHFIDZ AL-QUR'AN",34,800,GOLD,W/2,262);ca('UIN SUNAN GUNUNG DJATI BANDUNG',27,600,INK,W/2,302);
 ca('LATIHAN TES HAFALAN',70,800,INK,W/2,420);ca("SAMBUNG AYAT · PILIHAN GANDA",30,700,GOLD,W/2,474);
 x.fillStyle='rgba(255,255,255,.09)';rrect(x,70,520,940,190,36);x.fill();x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=2;rrect(x,70,520,940,190,36);x.stroke();
 const nm=R.name||'Mahasantri';ca(nm,fit(nm,860,'800',48),800,INK,W/2,600);x.font='600 28px '+FF;const sl=wrapTxt(x,'Cakupan: '+R.scope,860).slice(0,2);sl.forEach((l,i)=>ca(l,28,600,GOLD,W/2,650+i*38));
 const cy=980,R0=170;x.lineWidth=32;x.lineCap='round';x.strokeStyle='rgba(255,255,255,.14)';x.beginPath();x.arc(W/2,cy,R0,0,7);x.stroke();
 if(R.pc>0){x.save();x.shadowColor=CL;x.shadowBlur=28;x.strokeStyle=CL;x.beginPath();x.arc(W/2,cy,R0,-Math.PI/2,-Math.PI/2+Math.PI*2*R.pc/100);x.stroke();x.restore()}
 ca(R.pc+'%',100,800,CL,W/2,cy+26);ca(R.ben+' dari '+R.T+' benar',26,700,MUT,W/2,cy+74);
 x.font='800 34px '+FF;const gw=x.measureText(R.gr[0]).width+80;x.fillStyle='rgba(233,196,106,.16)';rrect(x,(W-gw)/2,1210,gw,70,35);x.fill();x.strokeStyle=GOLD;x.lineWidth=2;rrect(x,(W-gw)/2,1210,gw,70,35);x.stroke();ca(R.gr[0],34,800,GOLD,W/2,1257);
 const T=R.items.length,sp=Math.min(48,860/T),sx=(W-sp*(T-1))/2;R.items.forEach((it,k)=>{const X=sx+k*sp;x.fillStyle=it.ok?'rgba(61,220,151,.9)':'rgba(255,90,95,.9)';x.beginPath();x.arc(X,1350,Math.min(17,sp/2-3),0,7);x.fill();ca(it.ok?'✓':'✗',Math.min(20,sp/2),800,'#04261f',X,1357)});
 x.font='italic 600 31px '+FF;const ql=wrapTxt(x,'“'+R.msg+'”',830).slice(0,5),qh=ql.length*44+60,qy=1440;x.fillStyle='rgba(233,196,106,.12)';rrect(x,70,qy,940,qh,30);x.fill();x.strokeStyle='rgba(233,196,106,.45)';x.lineWidth=2;rrect(x,70,qy,940,qh,30);x.stroke();ql.forEach((l,i)=>ca(l,31,600,INK,W/2,qy+52+i*44));
 ca('Latihan mandiri · '+qTgl(R.tgl),24,600,MUT,W/2,H-86);ca("Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung",23,600,MUT,W/2,H-46);return c}
/* --- event --- */
{const el=$('#qz'),P=k=>{const J=QS.juz,S=QS.sur;({j30:()=>{QS.mode='juz';J.clear();J.add(30)},j2930:()=>{QS.mode='juz';J.clear();J.add(29);J.add(30)},jall:()=>{QS.mode='juz';for(let i=1;i<=30;i++)J.add(i)},jreset:()=>J.clear(),s78:()=>{S.clear();for(let i=78;i<=114;i++)S.add(i)},sall:()=>{for(let i=1;i<=114;i++)S.add(i)},sreset:()=>S.clear()})[k]()};
 el.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.qm){QS.mode=d.qm;qRender();return}if(d.qj){const j=+d.qj;QS.juz.has(j)?QS.juz.delete(j):QS.juz.add(j);qRender();return}if(d.qp){P(d.qp);qRender();return}
  if(d.qo!==undefined){const q=QS.qs[QS.i];if(QS.fb)return;q.u=+d.qo;QS.fb=true;const r=q.u===q.c;QS.streak=r?QS.streak+1:0;qRender();try{if(QS.streak===3)mcSay([['m','Tiga benar berturut-turut! Gokil 🔥']],1);else if(!r&&Math.random()<.3)mcSay([['f','Gapapa, salah itu bagian dari belajar. Baca jawaban benarnya ya 📖']],1)}catch(e){}return}
  const a=d.qa;if(!a)return;
  if(a==='start'){QS.qs=qGen();if(!QS.qs.length)return;QS.i=0;QS.fb=false;QS.streak=0;QS.ph='quiz';try{localStorage.setItem('tahfiz_qname',QS.name)}catch(e){}qRender();qTop()}
  else if(a==='next'){if(QS.i>=QS.qs.length-1)qFinish();else{QS.i++;QS.fb=false}qRender();qTop()}
  else if(a==='quit'||a==='setup'){QS.ph='setup';qRender();qTop()}
  else if(a==='again'){QS.qs=qGen();QS.i=0;QS.fb=false;QS.streak=0;QS.ph='quiz';qRender();qTop()}
  else{const R=QS.res,m=el.querySelector('.shm'),fn='Latihan_Hafalan_'+(R.name||'Mahasantri').replace(/[^\w]+/g,'_'),tx='Alhamdulillah, skor latihan tes hafalan Qur\'an-ku '+R.ben+'/'+R.T+' ('+R.pc+'%) ✨',ti='Hasil Latihan Tes Hafalan';
   b.disabled=true;if(m)m.textContent='⏳ Menyiapkan file…';
   try{if(a==='png'||a==='pngs'){const c=await qPng(R),bl=await new Promise((ok,no)=>c.toBlob(z=>z?ok(z):no(new Error('Gagal membuat gambar')),'image/png'));await qOut(bl,fn+'.png',a==='png',m,ti,tx)}
    else{if(!window.jspdf)throw new Error('Pustaka PDF belum termuat, periksa koneksi.');const doc=await qPdf(R);await qOut(doc.output('blob'),fn+'.pdf',a==='pdfs',m,ti,tx)}}catch(er){if(m)m.textContent='✖ Gagal: '+(er&&er.message||er)}
   b.disabled=false}});
 el.addEventListener('change',e=>{const t=e.target;if(t.dataset.qs){const k=+t.dataset.qs;t.checked?QS.sur.add(k):QS.sur.delete(k);qRender()}else if(t.id==='qn'){QS.n=+t.value;qRender()}else if(t.id==='qh')QS.hint=t.checked});
 el.addEventListener('input',e=>{const t=e.target;if(t.id==='qf'){QS.filter=t.value;qRender()}else if(t.id==='qname')QS.name=t.value});
 $('#tQ').onclick=()=>{wr().classList.remove('dv','zv','lv');wr().classList.add('qv');tabs('tQ');$('#login').hidden=true;qRender();window.scrollTo(0,0)}}

/* ===== MODE MUSYRIF + CETAK MASSAL ===== */
const MZ={h:null,sort:'rank',q:'',non:false};try{MZ.h=sessionStorage.getItem('mus')||null}catch(e){}
const mzCfg=()=>{track._cfg=track._cfg||{};track._cfg.musy=track._cfg.musy||{};return track._cfg.musy};
const mzHal=f=>[...new Set((f?f.rows:[]).map(r=>r.halaqah))].sort(),mzAkt=r=>!/NON/i.test(r.status),mzSafe=s=>String(s).replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'').slice(0,50),mzNm=(a,b)=>a.nama.localeCompare(b.nama);
const mzHash=(h,p)=>sha('tahfidz-musy|'+h+'|'+p),mzKp=(l,v,s,c)=>`<div class="st"><span>${l}</span><b class="${c||''}">${v}</b><small style="color:var(--mut)">${s||''}</small></div>`;
function mzRender(){const el=$('#mus'),f=act(),fo=document.activeElement&&document.activeElement.id==='mzq';
 if(!f){el.innerHTML='<p class="hint">Belum ada data.</p>';return}
 const H=mzHal(f);if(admin&&(!MZ.h||!H.includes(MZ.h)))MZ.h=H[0];if(!admin&&MZ.h&&!H.includes(MZ.h))MZ.h=null;
 if(!MZ.h){el.innerHTML=`<div class="glass dc mzl"><h3>🧑‍🏫 Mode Musyrif/ah <small>khusus pembimbing halaqah</small></h3><p class="leg" style="margin:0 0 12px">Masuk untuk melihat santri halaqah Anda saja, mencetak rapor satu halaqah sekaligus, dan mengekspor rekap ke Excel.</p>
  <select id="mzh" class="qin">${H.map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join('')}</select><input id="mzp" class="qin" type="password" placeholder="Password halaqah" autocomplete="current-password"><button class="btn" id="mzgo">Masuk</button><div class="err" id="mzerr"></div>
  <p class="hint" style="text-align:left;margin:4px 0 0">Password diberikan oleh admin Dewan Ketahfidzan. Admin cukup masuk lewat Mode Admin.</p></div>`;return}
 const hh=MZ.h,all=f.rows.filter(mzAkt),own=f.rows.filter(r=>r.halaqah===hh),A=own.filter(mzAkt),K=RK(f),mP=avgOf(A,'pct'),oP=avgOf(all,'pct'),mC=avgOf(A,'nCap'),oC=avgOf(all,'nCap'),mV=avgOf(A,'avg'),oV=avgOf(all,'avg');
 const hs=H.map(h=>[h,avgOf(all.filter(r=>r.halaqah===h),'avg')]).sort((a,b)=>b[1]-a[1]),hr=hs.findIndex(x=>x[0]===hh)+1,Z=A.filter(r=>r.pct<50).sort((a,b)=>a.pct-b.pct||b.alpa-a.alpa),full=A.filter(r=>r.pct>=99.95).length;
 let L=own.filter(r=>MZ.non||mzAkt(r));const q=MZ.q.trim().toLowerCase();if(q)L=L.filter(r=>r.nama.toLowerCase().includes(q));
 const rk=r=>K.rank(r)||9999;L.sort(MZ.sort==='pct'?(a,b)=>a.pct-b.pct||b.alpa-a.alpa:MZ.sort==='pctd'?(a,b)=>b.pct-a.pct:MZ.sort==='nama'?mzNm:(a,b)=>rk(a)-rk(b)||mzNm(a,b));
 const dl=(a,b)=>{const d=a-b;return (d>=0?'▲ ':'▼ ')+f1(Math.abs(d))+' poin vs rata-rata ma\'had'},row=(r,i)=>{const na=!mzAkt(r),n=esc(r.nama);return `<div class="mzr${r.pct<50&&!na?' red':''}"><div class="zn">${i+1}</div><div class="zi"><b>${n}</b>${na?' <span class="cp">non aktif</span>':''}<small>Angkatan ${esc(r.angkatan)} · ${r.gender==='L'?'Putra':'Putri'} · ${esc(r.predikat)} · Peringkat ${K.rank(r)||'–'}</small><div class="track"><div class="fill" data-w="${r.pct}" style="background-color:${tc(r.pct)}"></div></div><div class="zs"><span>Hadir ${r.hadir}</span><span>Izin ${r.izin}</span><span class="bad"><b>Alpa ${r.alpa}</b></span><span>Capaian ${f1(r.nCap)}</span><span>Nilai akhir ${f1(r.avg)}</span></div></div><div class="zp"><b class="${tone(r.pct)}">${f1(r.pct)}%</b><button class="btn g" data-mp="${n}">📄 PDF</button></div></div>`};
 el.innerHTML=`<div class="glass dc"><h3>🧑‍🏫 ${esc(hh)} <small>${esc(perFull(f.name))}</small></h3>
 ${admin?`<select id="mzsel" class="qin" style="margin-bottom:10px">${H.map(h=>`<option value="${esc(h)}"${h===hh?' selected':''}>${esc(h)}</option>`).join('')}</select>`:''}
 <div class="stats" style="margin-top:0">${mzKp('Santri Aktif',A.length,own.length-A.length?(own.length-A.length)+' non aktif':'')}${mzKp('Kehadiran Halaqah',f1(mP)+'%',dl(mP,oP),tone(mP))}${mzKp('Rata-rata Capaian',f1(mC),dl(mC,oC))}${mzKp('Rata-rata Nilai Akhir',f1(mV),dl(mV,oV))}${mzKp('Peringkat Halaqah',hr?'#'+hr:'–','dari '+H.length+' halaqah (nilai akhir)','ok')}${mzKp('Zona Merah',Z.length,'kehadiran < 50%',Z.length?'bad':'ok')}${mzKp('Hadir 100%',full,'santri','ok')}</div>
 <div class="zbar" style="margin-top:14px"><button class="btn" data-mz="pdf">🖨️ Cetak Semua Rapor Halaqah (PDF)</button><button class="btn g" data-mz="xls">📊 Ekspor Excel</button>${admin?'<button class="btn g" data-mz="zip">📦 ZIP Semua Halaqah</button><button class="btn g" data-mz="xlsall">📊 Excel Semua Halaqah</button>':''}<label class="chk" style="display:flex;gap:6px;align-items:center;font-size:12.5px"><input type="checkbox" id="mzna"${MZ.non?' checked':''}> sertakan non aktif</label><button class="btn d" data-mz="out">🔒 Keluar</button></div><div class="shm" id="mzm" style="margin-top:8px;font-style:normal;font-size:12.5px;color:var(--mut)"></div></div>
 <div class="glass dc"><h3>📊 Halaqah vs Rata-rata Ma'had</h3>${hb([{l:'Kehadiran halaqah',v:mP},{l:"Kehadiran ma'had",v:oP}],100,tc,'%')}${hb([{l:'Capaian halaqah',v:mC},{l:"Capaian ma'had",v:oC}],100,'#7cc4ff','')}${hb([{l:'Nilai akhir halaqah',v:mV},{l:"Nilai akhir ma'had",v:oV}],100,'var(--gold)','')}</div>
 ${Z.length?`<div class="glass dc"><h3>🚨 Perlu Perhatian <small>${Z.length} santri zona merah</small></h3>${Z.map(r=>{const st=ST[(tr(r).st)||'belum'][0];return `<div class="rk"><span class="no" style="font-size:15px;color:var(--bad)">${f1(r.pct)}%</span><div class="nm">${esc(r.nama)}<small>Alpa ${r.alpa}× · ${esc(st)}</small></div></div>`}).join('')}<p class="leg" style="margin:8px 0 0">Status pemanggilan dikelola oleh Dewan Ketahfidzan.</p></div>`:''}
 <div class="glass dc"><h3>👥 Daftar Santri <small>${L.length} santri</small></h3><div class="zbar" style="margin:0 0 6px"><input id="mzq" class="qin" style="flex:1;min-width:160px" placeholder="Cari nama santri…" value="${esc(MZ.q)}" autocomplete="off"><select id="mzsort" class="qin" style="max-width:220px"><option value="rank"${MZ.sort==='rank'?' selected':''}>Urut peringkat</option><option value="pct"${MZ.sort==='pct'?' selected':''}>Kehadiran terendah</option><option value="pctd"${MZ.sort==='pctd'?' selected':''}>Kehadiran tertinggi</option><option value="nama"${MZ.sort==='nama'?' selected':''}>Nama A-Z</option></select></div>${L.map(row).join('')||'<p class="hint">Tidak ada santri.</p>'}</div>`;
 if(fo){const i=el.querySelector('#mzq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
 requestAnimationFrame(()=>setTimeout(()=>el.querySelectorAll('.fill').forEach(e=>e.style.width=Math.max(+e.dataset.w,2)+'%'),50))}
async function mzBulk(f,hh,non,set){const rows=f.rows.filter(r=>r.halaqah===hh&&(non||mzAkt(r))).sort(mzNm);if(!rows.length)throw new Error('Tidak ada santri pada halaqah ini');
 const d=new window.jspdf.jsPDF({unit:'mm',format:'a4'});for(let i=0;i<rows.length;i++){raporPdf(rows[i],f,d,i===0);if(i%6===5){if(set)set('⏳ Menyusun rapor '+(i+1)+' dari '+rows.length+'…');await new Promise(r=>setTimeout(r,0))}}return{d,n:rows.length}}
function mzSheet(f,rows){return rows.map((r,i)=>{const z=r.pct<50&&mzAkt(r);return{'No':i+1,'Nama':r.nama,'NIM':r.nim,'Angkatan':r.angkatan,'Jenis Kelamin':r.gender==='L'?'Putra':'Putri','Status':r.status,'Total Pertemuan':r.total,'Hadir':r.hadir,'Izin':r.izin,'Alpa':r.alpa,'Kehadiran (%)':Math.round(r.pct*10)/10,'Nilai Kehadiran':r.nKeh,'Nilai Capaian':r.nCap,'Nilai Akhir':r.avg,'Predikat':r.predikat,'Peringkat':RK(f).rank(r)||'-','Zona Merah':z?'Ya':'','Status Tindak Lanjut':z?ST[(track[f.id+'|'+r.nama]||{}).st||'belum'][0]:''}})}
function mzXls(f,hl,non){const wb=XLSX.utils.book_new(),used=new Set();hl.forEach(h=>{const rows=f.rows.filter(r=>r.halaqah===h&&(non||mzAkt(r))).sort(mzNm),ws=XLSX.utils.json_to_sheet(mzSheet(f,rows));ws['!cols']=[5,30,14,9,12,10,10,7,7,7,12,12,12,11,16,10,10,24].map(w=>({wch:w}));
  let nm=(mzSafe(h.replace(/^Ust[h]?\.\s*/,''))||'Halaqah').slice(0,28),k=2;while(used.has(nm))nm=nm.slice(0,25)+'_'+k++;used.add(nm);XLSX.utils.book_append_sheet(wb,ws,nm)});
 return new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
{const el=$('#mus');
 async function mzLogin(){const h=$('#mzh').value,p=$('#mzp').value,w=mzCfg()[h],e=$('#mzerr');if(!w){e.textContent='Akun halaqah ini belum diaktifkan admin.';return}
  try{if(await mzHash(h,p)===w){MZ.h=h;try{sessionStorage.setItem('mus',h)}catch(x){}try{mcSay([['m','Selamat datang, Ust./Usth.! Ini halaqah kamu 👋'],['f','Rapor satu halaqah bisa dicetak sekaligus lho 🖨️']],1)}catch(x){}mzRender()}else e.textContent='Password salah.'}catch(x){e.textContent='Browser tidak mendukung login ini.'}}
 el.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='mzgo'){mzLogin();return}const f=act(),m=$('#mzm'),set=t=>{if(m)m.textContent=t};
  if(b.dataset.mp){const r=f.rows.find(x=>x.nama===b.dataset.mp);if(!r)return;b.disabled=true;try{await pdfOut(raporPdf(r,f),'Rapor_Resmi_'+mzSafe(r.nama)+'.pdf');set('✔ PDF '+r.nama+' siap disimpan.')}catch(x){set('✖ '+(x&&x.code==='declined'?'Dibatalkan':'Gagal: '+(x&&x.message||x)))}b.disabled=false;return}
  const a=b.dataset.mz;if(!a)return;if(a==='out'){MZ.h=null;try{sessionStorage.removeItem('mus')}catch(x){}mzRender();return}
  b.disabled=true;const per=mzSafe(perFull(f.name));
  try{if(!window.jspdf&&(a==='pdf'||a==='zip'))throw new Error('Pustaka PDF belum termuat, periksa koneksi.');if(!window.XLSX&&(a==='xls'||a==='xlsall'))throw new Error('Pustaka Excel belum termuat, periksa koneksi.');
   if(a==='pdf'){set('⏳ Menyusun rapor…');const r=await mzBulk(f,MZ.h,MZ.non,set);await qOut(r.d.output('blob'),'Rapor_Halaqah_'+mzSafe(MZ.h)+'_'+per+'.pdf',false,null);set('✔ '+r.n+' rapor resmi dalam satu PDF siap disimpan (urut abjad, 1 santri per halaman).')}
   else if(a==='zip'){if(!window.JSZip)throw new Error('Pustaka ZIP belum termuat, periksa koneksi.');const Z=new JSZip(),hl=mzHal(f);let tot=0;for(let i=0;i<hl.length;i++){const r=await mzBulk(f,hl[i],MZ.non,t=>set('Halaqah '+(i+1)+'/'+hl.length+' · '+t));Z.file('Rapor_'+mzSafe(hl[i])+'.pdf',r.d.output('arraybuffer'));tot+=r.n}
    set('⏳ Mengemas ZIP…');await qOut(await Z.generateAsync({type:'blob',compression:'DEFLATE'}),'Rapor_Semua_Halaqah_'+per+'.zip',false,null);set('✔ ZIP berisi '+hl.length+' PDF ('+tot+' rapor) siap disimpan.')}
   else{const hl=a==='xlsall'?mzHal(f):[MZ.h];await qOut(mzXls(f,hl,MZ.non),'Rekap_'+(a==='xlsall'?'Semua_Halaqah':mzSafe(MZ.h))+'_'+per+'.xlsx',false,null);set('✔ File Excel siap disimpan.')}}
  catch(x){set('✖ '+(x&&x.code==='declined'?'Dibatalkan':'Gagal: '+(x&&x.message||x)))}b.disabled=false});
 el.addEventListener('change',e=>{const t=e.target;if(t.id==='mzsel'){MZ.h=t.value;mzRender()}else if(t.id==='mzna'){MZ.non=t.checked;mzRender()}else if(t.id==='mzsort'){MZ.sort=t.value;mzRender()}});
 el.addEventListener('input',e=>{if(e.target.id==='mzq'){MZ.q=e.target.value;mzRender()}});
 el.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='mzp')mzLogin()});
 $('#tM').onclick=()=>{wr().classList.remove('dv','zv','lv','qv');wr().classList.add('uv');tabs('tM');$('#login').hidden=true;mzRender();window.scrollTo(0,0)}}
/* ===== PENGUMUMAN & AGENDA ===== */
const AGJ={pengumuman:['📝','Pengumuman','#e9c46a'],ujian:['📅','Jadwal Ujian','#f4a93b'],khataman:['🏆','Khataman','#3ddc97'],libur:['🌴','Libur','#8ecae6'],penting:['⚠️','Penting','#ff5a5f']},AG={ed:null};
const agList=()=>{track._cfg=track._cfg||{};track._cfg.ag=track._cfg.ag||[];return track._cfg.ag};
const agU=s=>{const[a,b,c]=s.split('-').map(Number);return Date.UTC(a,b-1,c)};
const agT=()=>{const n=new Date();return Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())};
const agF=(s,y)=>new Date(agU(s)).toLocaleDateString('id-ID',Object.assign({day:'numeric',month:'long',timeZone:'UTC'},y?{year:'numeric'}:{}));
const agR=x=>x.e&&x.e!==x.s?agF(x.s)+' – '+agF(x.e,1):agF(x.s,1);
const agSt=x=>{const t=agT(),s=agU(x.s),e=agU(x.e||x.s);if(t>e)return null;if(t>=s)return t===s&&e===s?'Hari ini':'Berlangsung';const d=Math.round((s-t)/864e5);return d===1?'Besok':'H-'+d};
const agSort=(a,b)=>agU(a.s)-agU(b.s);
function agBan(){const el=$('#agBanner');if(!el)return;const L=agList().filter(x=>agSt(x)).sort(agSort);
 el.innerHTML=L.length?`<section class="agb" aria-label="Pengumuman dan agenda">${L.map(x=>{const j=AGJ[x.j]||AGJ.pengumuman;return `<div class="agi" style="--c:${j[2]}"><span class="agj">${j[0]} ${j[1]}</span><div class="agt"><b>${esc(x.t)}</b>${x.x?`<small>${esc(x.x)}</small>`:''}</div><div class="agd"><span>${esc(agR(x))}</span><br><i>${agSt(x)}</i></div></div>`}).join('')}</section>`:''}
function agAdm(){const el=$('#agAdm');if(!el)return;if(!admin){el.innerHTML='';return}
 const L=agList().slice().sort(agSort),ev=AG.ed&&L.find(x=>x.id===AG.ed)||{j:'pengumuman',t:'',x:'',s:'',e:''};
 el.innerHTML=`<div class="musy"><h4>📣 Pengumuman &amp; Agenda</h4><p class="leg" style="margin:0 0 10px">Tampil sebagai banner di atas halaman untuk semua santri, dan otomatis hilang setelah tanggalnya lewat.</p>
 <div class="agf"><select class="qin" id="agj">${Object.entries(AGJ).map(([k,v])=>`<option value="${k}"${k===ev.j?' selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select>
 <input class="qin" id="agt" maxlength="80" placeholder="Judul, mis. Ujian Tahfidz Semester Ganjil" value="${esc(ev.t)}">
 <input class="qin" id="agx" maxlength="160" placeholder="Keterangan (opsional): tempat, jam, ketentuan" value="${esc(ev.x||'')}">
 <label>Mulai<input class="qin" type="date" id="ags" value="${ev.s}"></label><label>Selesai (opsional)<input class="qin" type="date" id="age" value="${ev.e||''}"></label>
 <div><button class="btn" data-ag="save">${AG.ed?'Simpan Perubahan':'+ Tambah'}</button>${AG.ed?' <button class="btn g" data-ag="cancel">Batal</button>':''}<span class="shm" id="agm" style="margin-left:8px"></span></div></div>
 ${L.map(x=>{const j=AGJ[x.j]||AGJ.pengumuman,s=agSt(x);return `<div class="file"><div class="n"><b>${j[0]} ${esc(x.t)}</b><br><small>${esc(agR(x))} · ${s||'Sudah lewat (tidak tampil)'}</small></div><button class="btn g" data-ag="edit" data-id="${x.id}">Ubah</button><button class="btn d" data-ag="del" data-id="${x.id}">Hapus</button></div>`}).join('')||'<p class="hint" style="text-align:left">Belum ada pengumuman.</p>'}</div>`}
$('#agAdm').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!b.dataset.ag||!admin)return;const a=b.dataset.ag,L=agList();
 if(a==='cancel'){AG.ed=null;agAdm();return}
 if(a==='edit'){AG.ed=b.dataset.id;agAdm();return}
 if(a==='del'){if(!confirm('Hapus pengumuman ini?'))return;const i=L.findIndex(x=>x.id===b.dataset.id);if(i>-1)L.splice(i,1);AG.ed=null}
 if(a==='save'){const t=$('#agt').value.trim(),s=$('#ags').value,en=$('#age').value,m=$('#agm');
  if(!t||!s){m.textContent='Judul dan tanggal mulai wajib diisi.';return}
  if(en&&en<s){m.textContent='Tanggal selesai tidak boleh sebelum tanggal mulai.';return}
  const o={id:AG.ed||Date.now().toString(36),j:$('#agj').value,t,x:$('#agx').value.trim(),s,e:en},i=L.findIndex(x=>x.id===o.id);if(i>-1)L[i]=o;else L.push(o);AG.ed=null}
 agBan();agAdm();tsave()});
$('.adm').addEventListener('toggle',agAdm);agBan();

/* --- admin: akun musyrif --- */
function musyAdm(){const el=$('#musyAdm'),f=act();if(!el)return;if(!admin||!f){el.innerHTML='';return}
 const H=mzHal(f),M=mzCfg();let nw=null;try{nw=JSON.parse(sessionStorage.getItem('musyNew')||'null')}catch(e){}
 el.innerHTML=`<div class="musy"><h4>🔑 Akun Musyrif/ah</h4><p class="leg" style="margin:0 0 10px">Tiap halaqah punya password sendiri untuk Mode Musyrif. Password disimpan terenkripsi (hash) sehingga tidak bisa dilihat lagi setelah dibuat. Setiap perubahan langsung dipublikasikan.</p>
 ${nw&&nw.length?`<div class="mznew"><b>Password baru, catat dan bagikan sekarang (hilang saat tab ditutup):</b><pre id="mzpre">${esc(nw.map(x=>x[0]+'  →  '+x[1]).join('\n'))}</pre><button class="btn g" data-mx="copy">📋 Salin</button> <button class="btn d" data-mx="hide">Sembunyikan</button></div>`:''}
 <button class="btn" data-mx="all">🎲 Buat Ulang Semua Password (acak)</button><span class="shm" id="mxm" style="margin-left:8px"></span>
 ${H.map((h,i)=>`<div class="file"><div class="n"><b>${esc(h)}</b><br><small>${M[h]?'✔ password aktif':'✖ belum diatur'}</small></div><input class="qin" style="max-width:190px" id="mzpw${i}" placeholder="password baru" autocomplete="off"><button class="btn g" data-mx="set" data-i="${i}">Simpan</button><button class="btn g" data-mx="rnd" data-i="${i}">🎲 Acak</button></div>`).join('')}</div>`}
{const rnd=()=>{const A='abcdefghjkmnpqrstuvwxyz23456789',u=crypto.getRandomValues(new Uint8Array(9));return[...u].map(x=>A[x%A.length]).join('')};
 async function setPw(h,p,list){mzCfg()[h]=await mzHash(h,p);list.push([h,p])}
 function stash(list){let o=[];try{o=JSON.parse(sessionStorage.getItem('musyNew')||'[]')}catch(e){}o=o.filter(x=>!list.some(y=>y[0]===x[0])).concat(list);try{sessionStorage.setItem('musyNew',JSON.stringify(o))}catch(e){}}
 $('#musyAdm').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||!b.dataset.mx)return;const a=b.dataset.mx,H=mzHal(act()),l=[];
  if(a==='hide'){try{sessionStorage.removeItem('musyNew')}catch(x){}musyAdm();return}
  if(a==='copy'){const pre=$('#mzpre');try{await navigator.clipboard.writeText(pre.textContent)}catch(x){const r=document.createRange();r.selectNode(pre);getSelection().removeAllRanges();getSelection().addRange(r);try{document.execCommand('copy')}catch(y){}}b.textContent='✔ Tersalin';return}
  if(a==='all'){if(!confirm('Buat ulang password SEMUA halaqah? Password lama tidak berlaku lagi.'))return;for(const h of H)await setPw(h,rnd(),l)}
  else{const h=H[+b.dataset.i];if(!h)return;let p=a==='rnd'?rnd():($('#mzpw'+b.dataset.i).value||'').trim();if(p.length<6){$('#mxm').textContent='Password minimal 6 karakter.';return}await setPw(h,p,l)}
  stash(l);musyAdm();tsave()});
 $('.adm').addEventListener('toggle',musyAdm)}

/* ===== GAMIFIKASI: RANK & EXP ala MLBB ===== */
const XPD={h:100,i:30,a:80,s:20,full:500,m1:500,m3:300,m10:150},GR=['I','II','III','IV','V'];
const XPW=()=>Object.assign({},XPD,(track._cfg&&track._cfg.xp)||{});
const TIERS=[
{k:'Warrior',n:'Mujahid Ilmu',ar:'مجاهد العلم',e:'🗡️',c:'#b08d57',min:0,div:3,d:'Pejuang di jalan ilmu. Setiap langkah menuntut ilmu dicatat.'},
{k:'Elite',n:"Murabith Qur'ani",ar:'مرابط',e:'🛡️',c:'#aeb9c6',min:800,div:3,d:"Penjaga barisan Al-Qur'an yang istiqomah hadir."},
{k:'Master',n:'Mutqin Hafalan',ar:'متقن',e:'📿',c:'#e0b341',min:1600,div:4,d:'Kokoh dan teliti dalam hafalan.'},
{k:'Grandmaster',n:"Hamilul Qur'an",ar:'حامل القرآن',e:'📖',c:'#5aa7e8',min:2400,div:5,d:"Pembawa Al-Qur'an di dada dan di langkah."},
{k:'Epic',n:'Hafizh Pilihan',ar:'حافظ',e:'🌙',c:'#b57cf2',min:3200,div:5,d:'Penghafal pilihan dengan konsistensi tinggi.'},
{k:'Legend',n:"Qari' Mumtaz",ar:'قارئ ممتاز',e:'👑',c:'#ff7a59',min:4200,div:5,d:'Hafalan dan kehadiran yang istimewa.'},
{k:'Mythic',n:'As-Sabiqun',ar:'السابقون',e:'⭐',c:'#ff4d6d',min:6000,div:5,d:'Terdepan dalam kebaikan, berlomba-lomba bersama Al-Qur\'an.'},
{k:'Mythical Honor',n:"Syaraf Al-Qur'an",ar:'شرف القرآن',e:'🏅',c:'#ffb703',min:9000,div:3,d:"Kehormatan yang diraih lewat istiqomah bersama Al-Qur'an."},
{k:'Mythical Glory',n:"Majd Al-Qur'an",ar:'مجد القرآن',e:'💎',c:'#4cc9f0',min:13000,div:3,d:"Kemuliaan yang terpancar dari hati yang dekat dengan Al-Qur'an."},
{k:'Mythical Immortal',n:'Ahlullah',ar:'أهل الله',e:'🔥',c:'#f72585',min:18000,div:1,step:2000,d:"Ahlul Qur'an adalah keluarga Allah dan orang pilihan-Nya (HR. Ibnu Majah)."}];
function xpRow(row,fl){const W=XPW(),k=RK(fl).rank(row),p=[['Hadir',row.hadir,'× '+W.h,row.hadir*W.h],['Izin',row.izin,'× '+W.i,row.izin*W.i],['Alpa',row.alpa,'× −'+W.a,-row.alpa*W.a],['Setoran hafalan (nilai capaian)',f1(row.nCap),'× '+W.s,Math.round(row.nCap*W.s)]];
 if(row.total&&row.pct>=99.95&&W.full)p.push(['Bonus hadir 100%','','',W.full]);
 const mv=k===1?W.m1:k>0&&k<=3?W.m3:k>0&&k<=10?W.m10:0;if(mv)p.push(['Bonus MVP peringkat '+k,'','',mv]);
 return{parts:p,total:p.reduce((s,x)=>s+x[3],0)}}
function gmTotal(nama){let x=0;files.forEach(fl=>{const row=fl.rows.find(q=>q.nama===nama);if(row&&!/NON/i.test(row.status))x+=xpRow(row,fl).total});return Math.max(0,Math.round(x))}
function tierOf(xp){let i=0;TIERS.forEach((t,k)=>{if(xp>=t.min)i=k});const t=TIERS[i],nx=TIERS[i+1];let dv,lo,hi,lab,tg;
 if(nx){const w=(nx.min-t.min)/t.div;dv=Math.min(t.div-1,Math.floor((xp-t.min)/w));lo=t.min+dv*w;hi=lo+w;lab=GR[t.div-1-dv];tg=dv<t.div-1?t.k+' '+GR[t.div-2-dv]:nx.k+(nx.div>1?' '+GR[nx.div-1]:' ★1')}
 else{dv=Math.floor((xp-t.min)/t.step);lo=t.min+dv*t.step;hi=lo+t.step;lab='★'+(dv+1);tg=t.k+' ★'+(dv+2)}
 return{i,t,nx,lab,lo,hi,pc:Math.max(0,Math.min(100,(xp-lo)/(hi-lo)*100)),need:Math.ceil(hi-xp),tg,full:t.k+' '+lab}}
function gmEmblem(ti,lab,w){const t=TIERS[ti],c=t.c;return `<svg class="gme" viewBox="-14 0 148 144" width="${w}" aria-hidden="true"><defs><linearGradient id="gq${ti}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".55"/></linearGradient></defs>${ti>=4?`<path d="M14 36L-12 14L-6 60L14 74Z" fill="${c}" opacity=".85"/><path d="M106 36L132 14L126 60L106 74Z" fill="${c}" opacity=".85"/>`:''}<path d="M60 4L110 22V72Q110 114 60 138Q10 114 10 72V22Z" fill="url(#gq${ti})" stroke="rgba(255,255,255,.55)" stroke-width="3"/><path d="M60 16L98 30V70Q98 104 60 124Q22 104 22 70V30Z" fill="rgba(5,30,24,.62)"/><text x="60" y="78" text-anchor="middle" font-size="44">${t.e}</text><rect x="28" y="98" width="64" height="22" rx="11" fill="${c}"/><text x="60" y="114" text-anchor="middle" font-size="14" font-weight="800" fill="#10241d" font-family="Plus Jakarta Sans,system-ui,sans-serif">${lab}</text></svg>`}
function gmCalc(r,f){const H=files.map(fl=>({fl,row:fl.rows.find(x=>x.nama===r.nama)})).filter(x=>x.row&&!/NON/i.test(x.row.status)),T=TG();let xp=0,best=0,run=0;
 H.forEach(({fl,row})=>{xp+=xpRow(row,fl).total;run=row.pct>=T?run+1:0;best=Math.max(best,run)});xp=Math.max(0,Math.round(xp));
 const tr=tierOf(xp),k=RK(f).rank(r),pv=H.length>1?H[H.length-2]:null,pk=pv&&!f.merged?RK(pv.fl).rank(pv.row):0,hl=f.rows.filter(x=>x.halaqah===r.halaqah&&!/NON/i.test(x.status)).sort((a,b)=>b.avg-a.avg)[0];
 const B=[['💯','Full Attendance','Hadir 100% dalam satu periode',r.total&&r.pct>=99.95],['🎯','Santri Rajin','Kehadiran minimal 90%',r.pct>=90],['🌱','Mulai Konsisten','Kehadiran mencapai target '+T+'%',r.pct>=T],['🛡️','Anti Alpa','Nol alpa dalam satu periode',r.total&&r.alpa===0],['📖','Target Tercapai','Nilai capaian minimal 75',r.nCap>=75],['🌗','Separuh Target','Nilai capaian minimal 50',r.nCap>=50],['🌟','Nilai Cemerlang','Rata-rata nilai akhir minimal 90',r.avg>=90],['🔥','Top 10 Santri','Masuk 10 besar ma\'had',k>0&&k<=10],['🏆',"Podium Ma'had",'Peringkat 1 sampai 3',k>0&&k<=3],['👑','Juara Halaqah','Nilai tertinggi di halaqahnya',!!hl&&hl.nama===r.nama],['⚡','Streak 3 Periode','Hadir di atas target 3 periode berturut-turut',best>=3],['🚀','Naik Peringkat','Peringkat naik dari periode sebelumnya',!!pk&&k>0&&k<pk],['💪','Bangkit','Dari kehadiran di bawah 50% naik ke target',!!pv&&pv.row.pct<50&&r.pct>=T],['🌙','Rank Epic','Mencapai tier Epic (Hafizh Pilihan)',tr.i>=4],['⭐','Rank Mythic','Mencapai tier Mythic (As-Sabiqun)',tr.i>=6]];
 return{xp,tr,st:run,best,B,n:H.length,cur:xpRow(r,f)}}
const xpFmt=n=>Math.round(n).toLocaleString('id-ID');
function xpRules(){const W=XPW();return `<ul class="gmu"><li><b>+${W.h} EXP</b> setiap pertemuan <b>hadir</b></li><li><b>+${W.i} EXP</b> setiap <b>izin</b></li><li><b>−${W.a} EXP</b> setiap <b>alpa</b> (rank bisa turun)</li><li><b>+${W.s} EXP</b> untuk setiap poin <b>nilai setoran hafalan</b> (capaian 100 = ${xpFmt(100*W.s)} EXP)</li><li>Bonus hadir 100%: <b>+${W.full}</b> · Bonus MVP peringkat 1: <b>+${W.m1}</b>, peringkat 2-3: <b>+${W.m3}</b>, peringkat 4-10: <b>+${W.m10}</b></li></ul><p class="gmn">EXP dijumlahkan dari semua periode (season) sehingga rank terus naik selama konsisten. Total EXP tidak bisa di bawah 0, dan santri non aktif tidak masuk papan rank.</p>`}
function tierTable(ci,xp){return `<table class="gmtb"><tr><th>Rank</th><th>Gelar Islami</th><th>EXP</th><th>${xp==null?'Divisi':'Statusmu'}</th></tr>${TIERS.map((t,i)=>{const nx=TIERS[i+1];return `<tr class="${i===ci?'me':''}"><td>${t.e} <b style="color:${t.c}">${esc(t.k)}</b></td><td>${esc(t.n)}<br><small class="gmar">${t.ar}</small></td><td>${xpFmt(t.min)}${nx?' – '+xpFmt(nx.min-1):'+'}</td><td>${xp==null?(t.div>1?t.div+' divisi (' +GR[t.div-1]+'→I)':'★ per '+xpFmt(t.step)):(xp>=t.min?'✅ tercapai':'kurang '+xpFmt(t.min-xp))}</td></tr>`}).join('')}</table>`}
function gmCard(r,f){if(/NON/i.test(r.status))return'';const g=gmCalc(r,f),tr=g.tr,t=tr.t,cu=g.cur,got=g.B.filter(b=>b[3]).length,tt=Math.round(cu.total),
 brk=cu.parts.map(p=>`<tr><td>${esc(p[0])}</td><td>${esc(p[1]===''?'':p[1]+' '+p[2])}</td><td class="${p[3]<0?'bad':p[3]>0?'ok':''}">${p[3]>0?'+':p[3]<0?'−':''}${xpFmt(Math.abs(p[3]))}</td></tr>`).join('');
 return `<div class="gm" style="--tc:${t.c}"><h3 class="aprh">🎮 Rank &amp; EXP</h3>
 <div class="gmr"><div class="gmE">${gmEmblem(tr.i,tr.lab,118)}</div><div class="gmI"><small class="gmk">${esc(t.k.toUpperCase())}</small><b class="gmn1">${esc(t.k)} ${tr.lab}</b><span class="gmid">${t.e} ${esc(t.n)} <i>${t.ar}</i></span><em>${esc(t.d)}</em>
 <div class="gmb"><i data-w="${tr.pc}" style="width:${tr.pc}%"></i></div><small><b>${xpFmt(g.xp)}</b> EXP total · ${tr.need>0?'<b>'+xpFmt(tr.need)+'</b> EXP lagi menuju <b>'+esc(tr.tg)+'</b>':'rank tertinggi'}</small></div>
 <div class="gms"><span>🔥</span><b>${g.st}</b><small>streak hadir</small></div></div>
 <details class="gmd" open><summary>📊 EXP periode ini <b class="${tt<0?'bad':'ok'}">${tt>=0?'+':'−'}${xpFmt(Math.abs(tt))}</b></summary><table class="gmtb"><tr><th>Sumber</th><th>Perhitungan</th><th>EXP</th></tr>${brk}<tr class="me"><td colspan="2"><b>Total periode ini</b></td><td><b>${tt>=0?'+':'−'}${xpFmt(Math.abs(tt))}</b></td></tr></table><p class="gmn">Total EXP dihitung dari ${g.n} periode data. Alpa mengurangi EXP, jadi hadir terus adalah kunci naik rank.</p></details>
 <details class="gmd"><summary>🏅 Daftar rank &amp; gelar Islami</summary>${tierTable(tr.i,g.xp)}<h4 class="gmt">Cara mendapat EXP</h4>${xpRules()}</details>
 <h4 class="gmt">Koleksi Badge <small>${got} / ${g.B.length} terkumpul</small></h4><div class="gmg">${g.B.map(b=>`<div class="gbd ${b[3]?'on':''}" title="${esc(b[2])}"><span>${b[3]?b[0]:'🔒'}</span><b>${esc(b[1])}</b><small>${esc(b[2])}</small></div>`).join('')}</div></div>`}
/* --- Arena Rank (papan peringkat) --- */
function arenaRender(){const f=act(),el=$('#arena');if(!f){el.innerHTML='<p class="hint">Belum ada data.</p>';return}
 const A=f.rows.filter(r=>!/NON/i.test(r.status)),P=A.map(r=>{const x=gmTotal(r.nama);return{r,x,tr:tierOf(x)}}).sort((a,b)=>b.x-a.x||a.r.nama.localeCompare(b.r.nama)),n=P.length||1,cnt=TIERS.map((t,i)=>P.filter(o=>o.tr.i===i).length),top=cnt.map((c,i)=>c?i:-1).filter(i=>i>=0).pop()||0;
 const g={};P.forEach(o=>(g[o.r.halaqah]=g[o.r.halaqah]||[]).push(o));const sq=Object.keys(g).map(k=>({k,n:g[k].length,x:g[k].reduce((s,o)=>s+o.x,0)/g[k].length,mx:g[k].reduce((a,o)=>o.x>a.x?o:a,g[k][0])})).sort((a,b)=>b.x-a.x),mxx=Math.max(1,...sq.map(s=>s.x));
 const kp=(l,v,s)=>`<div class="st"><span>${l}</span><b>${v}</b><small style="color:var(--mut)">${s||''}</small></div>`;
 el.innerHTML=`<div class="glass dc"><h3>🏆 Arena Rank <small>${esc(f.merged?f.disp:f.name)} · season ${files.length} periode</small></h3><p class="leg" style="margin:0 0 12px">Kumpulkan EXP dari kehadiran dan setoran hafalan, naik rank seperti di game favoritmu. Dari Warrior sampai Mythical Immortal, lengkap dengan gelar Islaminya.</p>
 <div class="stats" style="margin-top:0">${kp('Pemain Aktif',P.length,'santri aktif')}${kp('Rata-rata EXP',xpFmt(P.reduce((s,o)=>s+o.x,0)/n),'season ini')}${kp('Rank Tertinggi',TIERS[top].e+' '+esc(TIERS[top].k),cnt[top]+' santri')}${kp('EXP Tertinggi',xpFmt(P[0]?P[0].x:0),P[0]?esc(P[0].r.nama.split(' ')[0]):'')}</div></div>
 <div class="glass dc"><h3>📊 Sebaran Rank</h3>${TIERS.map((t,i)=>[t,i]).reverse().map(([t,i])=>`<div class="bar"><div class="l"><span>${t.e} <b style="color:${t.c}">${esc(t.k)}</b> <small style="color:var(--mut)">· ${esc(t.n)}</small></span><b>${cnt[i]} <small style="color:var(--mut)">(${f1(cnt[i]/n*100)}%)</small></b></div><div class="track"><div class="fill" data-w="${cnt[i]/n*100}" style="background-color:${t.c}"></div></div></div>`).join('')}</div>
 <div class="glass dc"><h3>🥇 Top 10 EXP <small>papan peringkat season</small></h3>${P.slice(0,10).map((o,i)=>`<div class="rk"><span class="no">${['🥇','🥈','🥉'][i]||i+1}</span><div class="nm">${esc(o.r.nama)}<small>${o.tr.t.e} ${esc(o.tr.full)} · ${esc(o.tr.t.n)} · ${esc(o.r.halaqah)}</small></div><b>${xpFmt(o.x)}</b></div>`).join('')}</div>
 <div class="glass dc"><h3>🛡️ Squad Ranking <small>rata-rata EXP per halaqah</small></h3>${sq.map((s,i)=>`<div class="rk"><span class="no">${['🥇','🥈','🥉'][i]||i+1}</span><div class="nm">${esc(s.k)}<small>${s.n} santri · pemain terbaik: ${esc(s.mx.r.nama.split(' ').slice(0,2).join(' '))} (${s.mx.tr.t.e} ${esc(s.mx.tr.full)})</small><div class="track" style="margin-top:6px"><div class="fill" data-w="${s.x/mxx*100}" style="background-color:var(--gold)"></div></div></div><b>${xpFmt(s.x)}</b></div>`).join('')}</div>
 <div class="glass dc"><h3>📖 Aturan Main</h3>${xpRules()}<h4 class="gmt">Daftar Rank &amp; Gelar Islami</h4>${tierTable(-1,null)}<p class="gmn">Setiap rank punya beberapa divisi (misalnya Epic V → I). Tier Mythical Immortal berlanjut dengan bintang ★ tanpa batas.</p></div>`;
 requestAnimationFrame(()=>setTimeout(()=>el.querySelectorAll('.fill').forEach(e=>e.style.width=Math.max(+e.dataset.w,1.5)+'%'),60))}
const HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function idDate(n){const t=new Date(Date.UTC(1899,11,30)+Math.round(n)*864e5);return HARI[t.getUTCDay()]+' '+String(t.getUTCDate()).padStart(2,'0')+' '+BLN[t.getUTCMonth()]+' '+t.getUTCFullYear()}
const TG2={f:'all',h:''},fdm=ms=>{const t=new Date(ms);return t.getUTCDate()+' '+BLN[t.getUTCMonth()].slice(0,3)+' '+t.getUTCFullYear()};
function tgtModel(){const F=act(),A=F.rows.filter(r=>!/NON/i.test(r.status)&&r.tgt>0),set=daily?daily.set:[],sl=daily?daily.slots:[],DAY=864e5,day=d=>Date.parse(d+'T00:00:00Z'),
 dl=(track._cfg&&track._cfg.tenggat)||'2026-12-31',t1=sl.length?day(sl[sl.length-1].split('|')[0]):Date.now(),t0=sl.length?day(sl[0].split('|')[0]):t1,
 span=Math.min(28,Math.max(7,(t1-t0)/DAY+1)),from=t1-(span-1)*DAY,wl=Math.max(.1,(day(dl)-t1)/DAY/7),pg=new Map();
 set.forEach(([d,k,h])=>{if(day(d)>=from)pg.set(k,(pg.get(k)||0)+h)});
 const rows=A.map(r=>{const laju=(pg.get(mgKey(r))||0)/(span/7),sisa=Math.max(0,r.tgt-r.capH),eta=laju>0?sisa/laju:null;
  return{r,laju,sisa,butuh:sisa/wl,eta,etaMs:eta==null?null:t1+eta*7*DAY,st:sisa<=0?'done':laju<=0?'stag':eta<=wl+.01?'ok':'late',pct:Math.min(100,r.capH/r.tgt*100)}});
 return{rows,dl,wl,span,late:day(dl)<=t1}}
function tgtRender(){const el=$('#tgt');
 if(!admin){el.innerHTML='<p class="hint">Fitur ini hanya untuk admin. Masuk lewat Mode Admin.</p>';return}
 const F=act();if(!F||!F.rows.some(r=>r.tgt>0)){el.innerHTML='<p class="hint">Data target belum tersedia. Unggah workbook ABSENSI HALAQAH terbaru di Mode Admin.</p>';return}
 const M=tgtModel(),cnt=k=>M.rows.filter(x=>x.st===k).length,hs=[...new Set(M.rows.map(x=>x.r.halaqah))].sort(),
 LB={done:['Tercapai','var(--ok)'],ok:['Di jalur','var(--ok)'],late:['Terlambat','var(--mid)'],stag:['Belum bergerak','var(--bad)']},ORD={stag:0,late:1,ok:2,done:3},
 vis=M.rows.filter(x=>(TG2.f==='all'||x.st===TG2.f)&&(!TG2.h||x.r.halaqah===TG2.h)).sort((a,b)=>ORD[a.st]-ORD[b.st]||b.sisa-a.sisa),
 chip=(k,t)=>`<button class="btn gbs" data-tf="${k}" style="${TG2.f===k?'':'opacity:.55'}">${t}</button>`,
 hr=hs.map(h=>{const g=M.rows.filter(x=>x.r.halaqah===h);return`<tr><td>${esc(h)}</td><td>${g.length}</td><td>${f1(g.reduce((s,x)=>s+x.pct,0)/g.length)}%</td><td>${g.filter(x=>x.st==='late'||x.st==='stag').length}</td></tr>`}).join(''),
 stt=(l,v,c)=>`<div class="st"><span>${l}</span><b style="color:${c}">${v}</b></div>`;
 el.innerHTML=`<div class="glass" style="padding:18px"><h3 style="margin:0;color:var(--gold)">🎯 Target Setoran Ziyadah</h3>
 <p class="hint" style="text-align:left">Membandingkan capaian halaman tiap santri dengan target, lalu menghitung laju setoran yang dibutuhkan sampai tenggat.</p>
 <label style="font-size:13px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">Tenggat target <input type="date" id="tgd" value="${M.dl}" style="padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.25);color:var(--ink)"></label>
 ${M.late?'<p class="msg">Tenggat sudah lewat dari data terakhir, ubah tanggalnya agar perhitungan bermakna.</p>':''}
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0">${stt('Tercapai',cnt('done'),'var(--ok)')}${stt('Di jalur',cnt('ok'),'var(--ok)')}${stt('Terlambat',cnt('late'),'var(--mid)')}${stt('Belum bergerak',cnt('stag'),'var(--bad)')}</div>
 <div style="overflow-x:auto"><table class="tgt-t"><tr><th>Halaqah</th><th>Santri</th><th>Rata-rata progres</th><th>Terlambat / belum bergerak</th></tr>${hr}</table></div></div>
 <div class="glass" style="padding:18px;margin-top:14px"><div class="gabx">${chip('all','Semua')}${chip('stag','Belum bergerak')}${chip('late','Terlambat')}${chip('ok','Di jalur')}${chip('done','Tercapai')}
 <select id="tgh" style="padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.25);color:var(--ink)"><option value="">Semua halaqah</option>${hs.map(h=>`<option ${TG2.h===h?'selected':''} value="${esc(h)}">${esc(h)}</option>`).join('')}</select></div>
 <p class="hint" style="text-align:left;margin:4px 0 10px">Laju dihitung dari setoran ${Math.round(M.span)} hari terakhir. "Butuh" adalah sisa halaman dibagi ${f1(M.wl)} pekan tersisa sampai tenggat. Menampilkan ${Math.min(vis.length,80)} dari ${vis.length} santri.</p>
 ${vis.slice(0,80).map(x=>`<div class="file" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(x.r.nama)}</b><span class="chip" style="color:${LB[x.st][1]}">${LB[x.st][0]}</span></div><small>${esc(x.r.halaqah)}</small>
 <div style="height:8px;border-radius:99px;background:rgba(255,255,255,.12);margin:8px 0 5px"><div style="width:${x.pct}%;height:100%;border-radius:99px;background:${LB[x.st][1]}"></div></div>
 <small>${x.r.capH} dari ${x.r.tgt} halaman (${f1(x.pct)}%), laju ${f1(x.laju)} halaman per pekan${x.st==='done'?'':', butuh '+f1(x.butuh)+' per pekan'}${x.etaMs?', perkiraan selesai '+fdm(x.etaMs):''}</small></div>`).join('')||'<p class="hint">Tidak ada santri pada filter ini.</p>'}</div>`}
$('#tgt').addEventListener('click',e=>{const b=e.target.closest('[data-tf]');if(b){TG2.f=b.dataset.tf;tgtRender()}});
$('#tgt').addEventListener('change',e=>{const t=e.target;if(t.id==='tgh'){TG2.h=t.value;tgtRender()}else if(t.id==='tgd'&&t.value){track._cfg=track._cfg||{};track._cfg.tenggat=t.value;tsave();tgtRender()}});
$('#tT').onclick=()=>{wr().classList.remove('dv','zv','lv','qv','uv');wr().classList.add('tgv');tabs('tT');$('#login').hidden=true;tgtRender();window.scrollTo(0,0)};
$('#tA').onclick=()=>{wr().classList.remove('dv','zv','lv','qv','uv');wr().classList.add('arv');tabs('tA');$('#login').hidden=true;arenaRender();window.scrollTo(0,0)};
/* --- admin: pengaturan EXP --- */
function xpAdm(){const el=$('#xpAdm');if(!el)return;if(!admin){el.innerHTML='';return}const W=XPW();
 el.innerHTML=`<div class="musy"><h4>🎮 Pengaturan EXP &amp; Rank</h4><p class="leg" style="margin:0 0 10px">Atur nilai EXP per aktivitas. Perubahan dihitung ulang untuk semua santri dari semua periode dan langsung dipublikasikan. Batas rank (Warrior sampai Immortal) bersifat tetap.</p><div class="xpg">${[['h','Hadir (+ per pertemuan)'],['i','Izin (+ per izin)'],['a','Alpa (− per alpa)'],['s','Setoran (+ per poin capaian)'],['full','Bonus hadir 100%'],['m1','Bonus peringkat 1'],['m3','Bonus peringkat 2-3'],['m10','Bonus peringkat 4-10']].map(([k,l])=>`<label>${l}<input class="qin" type="number" min="0" step="1" data-xp="${k}" value="${W[k]}"></label>`).join('')}</div><button class="btn" data-xpa="save">Simpan</button> <button class="btn g" data-xpa="reset">Kembalikan default</button><span class="shm" id="xpm" style="margin-left:8px"></span></div>`}
$('#xpAdm').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!b.dataset.xpa)return;track._cfg=track._cfg||{};
 if(b.dataset.xpa==='reset')delete track._cfg.xp;else{const o={};$('#xpAdm').querySelectorAll('[data-xp]').forEach(i=>{const v=Math.max(0,Math.min(100000,+i.value||0));o[i.dataset.xp]=v});track._cfg.xp=o}
 xpAdm();const m=$('#xpm');if(m)m.textContent='Menyimpan…';tsave()});
$('.adm').addEventListener('toggle',xpAdm);

/* ===== BANDINGKAN SANTRI / HALAQAH ===== */
const BDC=['#e9c46a','#3ddc97','#7cc4ff','#ff7a59','#c08cf2'],BD={m:'s',s:[],h:[]};
function bdRadar(E,ax){const c=150,R=108,n=ax.length,pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[(c+R*v/100*Math.cos(a)).toFixed(1),(c+R*v/100*Math.sin(a)).toFixed(1)]};
 return`<svg viewBox="-50 -4 400 308" class="bdsv">${[25,50,75,100].map(l=>`<polygon points="${ax.map((_,i)=>pt(i,l).join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,.15)"/>`).join('')}${ax.map((a,i)=>{const p=pt(i,100),q=pt(i,124);return`<line x1="${c}" y1="${c}" x2="${p[0]}" y2="${p[1]}" stroke="rgba(255,255,255,.15)"/><text x="${q[0]}" y="${q[1]}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#cfe3da">${a}</text>`}).join('')}${E.map((e,k)=>`<polygon points="${e.v.map((v,i)=>pt(i,Math.max(0,Math.min(100,v))).join(',')).join(' ')}" fill="${BDC[k]}" fill-opacity=".16" stroke="${BDC[k]}" stroke-width="2.2"/>`).join('')}</svg>`}
function bdRender(){const f=act(),el=$('#bnd');if(!f){el.innerHTML='<p class="hint">Belum ada data.</p>';return}
 const A=f.rows.filter(r=>!/NON/i.test(r.status)),R=RK(f),hs=[...new Set(A.map(r=>r.halaqah))].sort(),S=BD.m==='s',sel=S?BD.s:BD.h;
 const pct=(x,n)=>n?100*x/n:0,hv=h=>{const L=A.filter(r=>r.halaqah===h),n=L.length,top=[...L].sort((a,b)=>b.avg-a.avg)[0];return{L,n,top,pct:avgOf(L,'pct'),nKeh:avgOf(L,'nKeh'),cap:avgOf(L,'nCap'),avg:avgOf(L,'avg'),red:pct(L.filter(r=>r.pct<50).length,n),f100:pct(L.filter(r=>r.pct>=99.95).length,n),baik:pct(L.filter(r=>/BAIK/.test(r.predikat)&&!/KURANG/.test(r.predikat)).length,n),xp:L.reduce((s,r)=>s+gmTotal(r.nama),0)/(n||1)}},
 hr=hs.map(h=>({h,avg:hv(h).avg})).sort((a,b)=>b.avg-a.avg).map(x=>x.h);
 let E,rows,ax,bars;
 if(S){E=BD.s.map(nm=>{const r=A.find(x=>x.nama===nm),xp=gmTotal(nm),tr=tierOf(xp);return{n:nm,sub:r.halaqah,r,xp,tr,v:[r.pct,r.nKeh,r.nCap,r.avg,r.total?100*(1-r.alpa/r.total):0]}});ax=['Kehadiran','Nilai Kehadiran','Capaian','Nilai Akhir','Disiplin'];
  rows=[['Halaqah',E.map(e=>lb(e.r.halaqah)),0],['Angkatan',E.map(e=>e.r.angkatan),0],['Peringkat ma\'had',E.map(e=>R.rank(e.r)||'-'),-1,E.map(e=>R.rank(e.r)||999)],['Predikat',E.map(e=>e.r.predikat),0],['Kehadiran (%)',E.map(e=>f1(e.r.pct)),1,E.map(e=>e.r.pct)],['Hadir / Izin / Alpa',E.map(e=>e.r.hadir+' / '+e.r.izin+' / '+e.r.alpa),0],['Alpa',E.map(e=>e.r.alpa),-1,E.map(e=>e.r.alpa)],['Nilai kehadiran',E.map(e=>f1(e.r.nKeh)),1,E.map(e=>e.r.nKeh)],['Capaian hafalan',E.map(e=>f1(e.r.nCap)),1,E.map(e=>e.r.nCap)],['Rata-rata nilai akhir',E.map(e=>f1(e.r.avg)),1,E.map(e=>e.r.avg)],['Disiplin (100 = tanpa alpa)',E.map(e=>f1(e.v[4])),1,E.map(e=>e.v[4])],['Total EXP',E.map(e=>xpFmt(e.xp)),1,E.map(e=>e.xp)],['Rank game',E.map(e=>e.tr.t.e+' '+e.tr.full),0]];
  bars=[['Kehadiran (%)',E.map(e=>e.r.pct)],['Capaian hafalan',E.map(e=>e.r.nCap)],['Rata-rata nilai akhir',E.map(e=>e.r.avg)]]}
 else{E=BD.h.map(h=>{const d=hv(h);return{n:h,sub:d.n+' santri',d,v:[d.pct,d.cap,d.avg,100-d.red,d.baik]}});ax=['Kehadiran','Capaian','Nilai Akhir','Bebas Zona Merah','Predikat Baik'];
  rows=[['Santri aktif',E.map(e=>e.d.n),0],['Peringkat halaqah',E.map(e=>hr.indexOf(e.n)+1),-1,E.map(e=>hr.indexOf(e.n))],['Kehadiran rata-rata (%)',E.map(e=>f1(e.d.pct)),1,E.map(e=>e.d.pct)],['Nilai kehadiran',E.map(e=>f1(e.d.nKeh)),1,E.map(e=>e.d.nKeh)],['Capaian hafalan',E.map(e=>f1(e.d.cap)),1,E.map(e=>e.d.cap)],['Rata-rata nilai akhir',E.map(e=>f1(e.d.avg)),1,E.map(e=>e.d.avg)],['Santri zona merah (%)',E.map(e=>f1(e.d.red)),-1,E.map(e=>e.d.red)],['Santri hadir 100% (%)',E.map(e=>f1(e.d.f100)),1,E.map(e=>e.d.f100)],['Predikat Baik ke atas (%)',E.map(e=>f1(e.d.baik)),1,E.map(e=>e.d.baik)],['Rata-rata EXP',E.map(e=>xpFmt(e.d.xp)),1,E.map(e=>e.d.xp)],['Santri terbaik',E.map(e=>e.d.top?e.d.top.nama.split(' ').slice(0,2).join(' ')+' ('+f1(e.d.top.avg)+')':'-'),0]];
  bars=[['Kehadiran (%)',E.map(e=>e.d.pct)],['Capaian hafalan',E.map(e=>e.d.cap)],['Rata-rata nilai akhir',E.map(e=>e.d.avg)],['Santri zona merah (%)',E.map(e=>e.d.red)]]}
 const ok=E.length>=2,mark=(r,i)=>{if(!r[3]||E.length<2)return'';const v=r[3],b=r[2]>0?Math.max(...v):Math.min(...v),w=r[2]>0?Math.min(...v):Math.max(...v);return v[i]===b&&b!==w?'bw':v[i]===w&&E.length>2&&b!==w?'bl':''};
 const ins=ok?rows.filter(r=>r[3]&&r[2]!==0&&!/Alpa$|Peringkat|Hadir/.test(r[0])).slice(0,5).map(r=>{const v=r[3],b=r[2]>0?Math.max(...v):Math.min(...v),i=v.indexOf(b),o=v.filter((x,k)=>k!==i),nx=r[2]>0?Math.max(...o):Math.min(...o);return b===nx?`<li><b>${r[0]}</b>: nilai tertinggi sama (${r[1][i]}).</li>`:`<li><b>${r[0]}</b>: <span style="color:${BDC[i]}">${esc(E[i].n)}</span> terbaik (${r[1][i]}), selisih ${f1(Math.abs(b-nx))} dari peringkat berikutnya.</li>`}).join(''):'';
 el.innerHTML=`<div class="glass dc"><h3>⚖️ Bandingkan <small>${esc(f.merged?f.disp:f.name)} · pilih 2 sampai 5</small></h3><div class="bdm"><button data-m="s" class="${S?'on':''}">👤 Santri</button><button data-m="h" class="${S?'':'on'}">🕌 Halaqah</button></div>
 ${S?`<div class="bdi"><input id="bdin" list="bdl" placeholder="Ketik nama santri lalu Enter…" autocomplete="off"><datalist id="bdl">${A.map(r=>`<option value="${esc(r.nama)}">`).join('')}</datalist><button class="btn g" data-a="add">Tambah</button><button class="btn g" data-a="top">⭐ 3 peringkat teratas</button></div>`:`<div class="bdh">${hs.map(h=>`<button data-h="${esc(h)}" class="${BD.h.includes(h)?'on':''}">${esc(h)}</button>`).join('')}</div><div class="bdi" style="margin-top:8px"><button class="btn g" data-a="top">⭐ 3 halaqah teratas</button></div>`}
 <div class="bdch">${sel.map((n,i)=>`<span class="bdc" style="border-color:${BDC[i]}"><i style="background:${BDC[i]}"></i>${esc(lb(n))}<button data-x="${i}" title="Hapus">×</button></span>`).join('')}${sel.length?'<button class="btn g" data-a="clr" style="padding:4px 10px">Kosongkan</button>':''}</div><small class="leg">${sel.length}/5 dipilih${sel.length>=5?' · batas maksimal':''}</small></div>
 ${ok?`<div class="glass dc"><h3>🕸️ Profil Perbandingan</h3><div class="bdg"><div>${bdRadar(E,ax)}<div class="bdlg">${E.map((e,i)=>`<span><i style="background:${BDC[i]}"></i>${esc(lb(e.n))}</span>`).join('')}</div></div><div>${bars.map(b=>`<div class="bdb"><b>${b[0]}</b>${b[1].map((v,i)=>`<div class="bdr"><span style="color:${BDC[i]}">${esc(lb(E[i].n).split(' ').slice(0,2).join(' '))}</span><div class="track"><div class="fill" data-w="${Math.min(100,v)}" style="background-color:${BDC[i]}"></div></div><em>${f1(v)}</em></div>`).join('')}</div>`).join('')}</div></div></div>
 <div class="glass dc"><h3>📋 Tabel Perbandingan</h3><div class="bdt"><table class="gmtb"><tr><th></th>${E.map((e,i)=>`<th style="color:${BDC[i]}">${esc(lb(e.n))}<br><small style="font-weight:400">${esc(lb(e.sub))}</small></th>`).join('')}</tr>${rows.map(r=>`<tr><td><b>${r[0]}</b></td>${r[1].map((c,i)=>`<td class="${mark(r,i)}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div><p class="gmn"><span class="bw">Hijau</span> = terbaik, <span class="bl">merah</span> = terendah (untuk alpa dan zona merah, lebih kecil lebih baik).</p></div>
 <div class="glass dc"><h3>💡 Ringkasan</h3><ul class="gmu">${ins}</ul></div>`:`<div class="glass dc"><p class="hint" style="margin:0">Pilih minimal 2 ${S?'santri':'halaqah'} untuk mulai membandingkan.</p></div>`}`;
 requestAnimationFrame(()=>setTimeout(()=>el.querySelectorAll('.fill').forEach(e=>e.style.width=Math.max(+e.dataset.w,1.5)+'%'),60));
 const add=()=>{const i=$('#bdin'),v=(i.value||'').trim().toLowerCase(),r=A.find(x=>x.nama.toLowerCase()===v);if(!r){i.setCustomValidity&&0;i.placeholder='Nama tidak ditemukan, pilih dari daftar';i.value='';return}if(BD.s.includes(r.nama)||BD.s.length>=5){i.value='';return}BD.s.push(r.nama);bdRender();$('#bdin').focus()};
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.m){BD.m=b.dataset.m;bdRender()}else if(b.dataset.x){sel.splice(+b.dataset.x,1);bdRender()}else if(b.dataset.h){const k=BD.h.indexOf(b.dataset.h);if(k>=0)BD.h.splice(k,1);else if(BD.h.length<5)BD.h.push(b.dataset.h);bdRender()}else if(b.dataset.a==='add')add();else if(b.dataset.a==='clr'){sel.length=0;bdRender()}else if(b.dataset.a==='top'){if(S)BD.s=[...A].sort((a,b)=>R.rank(a)-R.rank(b)).filter(r=>R.rank(r)>0).slice(0,3).map(r=>r.nama);else BD.h=hr.slice(0,3);bdRender()}};
 const inp=$('#bdin');if(inp)inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}};if(inp)inp.onchange=()=>{const v=inp.value.trim().toLowerCase();if(A.some(x=>x.nama.toLowerCase()===v))add()}}
$('#tB').onclick=()=>{wr().classList.remove('dv','zv','lv','qv','uv','arv');wr().classList.add('bnv');tabs('tB');$('#login').hidden=true;bdRender();window.scrollTo(0,0)};


try{if(sessionStorage.getItem('adm')==='1'){admin=true;{const tb=sessionStorage.getItem('tab');if(tb==='tZ')$('#tZ').click();else if(tb==='tL')$('#tL').click()}}}catch(e){}

/* ===== MODE MADING: poster dashboard dipecah ke lembar A4 (puzzle) ===== */
const MDS={c:2,r:2,o:'p',m:8,t:'l',top:1,sor:1},MMP=96/25.4;
const mdDims=()=>{const S=MDS,sw=S.o==='p'?210:297,sh=S.o==='p'?297:210,tw=sw-2*S.m,th=sh-2*S.m;return{sw,sh,tw,th,W:S.c*tw,H:S.r*th}};
const mdCode=(r,c)=>String.fromCharCode(65+r)+(c+1);
function mdPoster(f,W,H){
 const A=f.rows.filter(r=>!/NON/i.test(r.status)),n=A.length||1,per=perFull(f.name),R=RK(f),pa=avgOf(A,'pct'),ca=avgOf(A,'nCap'),va=avgOf(A,'avg'),
 red=A.filter(r=>r.pct<50).length,full=A.filter(r=>r.pct>=99.95).length,z=A.filter(r=>r.total&&!r.alpa).length,L=A.filter(r=>r.gender==='L'),P=A.filter(r=>r.gender==='P'),
 ang=grp(A,'angkatan').sort((a,b)=>a.k-b.k),hal=grp(A,'halaqah'),hK=[...hal].sort((a,b)=>b.pct-a.pct),hR=[...hal].sort((a,b)=>b.avg-a.avg),aK=[...ang].sort((a,b)=>b.pct-a.pct),
 top=A.filter(r=>R.rank(r)>0).sort((a,b)=>R.rank(a)-R.rank(b)).slice(0,10),MD=['🥇','🥈','🥉'],wide=W/H>1.15,
 PRD=[['SANGAT BAIK','#1b9e68'],['BAIK','#7bb82f'],['CUKUP','#d9b300'],['KURANG','#e08a00'],['SANGAT KURANG','#d83a3f']],
 mc=v=>v<50?'var(--bad)':v<75?'var(--mid)':'var(--ok)',
 bars=(it,clr,mx)=>it.map(i=>`<div class="mdbr"><div class="mdl"><span>${esc(i.l)}</span><b>${i.t}</b></div><div class="mdt"><i style="width:${Math.max(1.5,Math.min(100,i.v/(mx||100)*100))}%;background:${i.c||(typeof clr==='function'?clr(i.v):clr)}"></i>${clr===mc?'<u style="left:50%"></u><u style="left:75%"></u>':''}</div></div>`).join(''),
 blk=(t,b,g)=>`<section class="mdb" style="--g:${g||1}"><h3>${t}</h3>${b}</section>`,
 kp=(l,v,c)=>`<div class="mdk"><b style="color:${c||'inherit'}">${v}</b><span>${l}</span></div>`,
 it=(no,t,s,v)=>`<div class="mdi"><span class="n">${no}</span><div class="t">${esc(t)}<small>${s}</small></div><b>${v}</b></div>`,
 logos=[...document.querySelectorAll('.logos img')].map(g=>`<img src="${g.src}" alt="">`).join(''),
 hc=hal.length>30?3:hal.length>12?2:1,
 B={
 hdr:`<header class="mdh"><div class="mdlg">${logos}</div><div><small>MA'HAD TAHFIDZ AL-QUR'AN · UIN SUNAN GUNUNG DJATI BANDUNG</small><h1>Dashboard <em>Ketahfidzan</em></h1><small>Periode ${esc(per)}</small></div></header>`,
 kpi:`<div class="mdg" style="--kc:${wide?2:3}">${kp('Santri Aktif',A.length)}${kp('Rata-rata Kehadiran',f1(pa)+'%',mc(pa))}${kp('Capaian Target',f1(ca))}${kp('Rata-rata Nilai Akhir',f1(va))}${kp('Hadir 100%',full,'var(--ok)')}${kp('Zona Merah',red,red?'var(--bad)':'var(--ok)')}</div>`,
 pred:blk('🎓 Sebaran Predikat',bars(PRD.map(p=>{const c=A.filter(r=>r.predikat===p[0]).length;return{l:p[0],v:c,c:p[1],t:c+' · '+f1(100*c/n)+'%'}}),'#1b9e68',n)),
 gen:blk('👥 Putra vs Putri',bars([{l:'Kehadiran Putra',v:avgOf(L,'pct'),t:f1(avgOf(L,'pct'))+'%'},{l:'Kehadiran Putri',v:avgOf(P,'pct'),t:f1(avgOf(P,'pct'))+'%'},{l:'Capaian Putra',v:avgOf(L,'nCap'),t:f1(avgOf(L,'nCap'))},{l:'Capaian Putri',v:avgOf(P,'nCap'),t:f1(avgOf(P,'nCap'))}],'#2f80d8')),
 ang:blk('📅 Kehadiran per Angkatan',bars(ang.map(g=>({l:'Angkatan '+g.k,v:g.pct,t:f1(g.pct)+'%'})),mc)),
 sor:blk('💡 Sorotan',[`🏅 Halaqah paling rajin: <b>${esc(hK[0].k)}</b> (${f1(hK[0].pct)}%)`,`🔔 Perlu perhatian: <b>${esc(hK[hK.length-1].k)}</b> (${f1(hK[hK.length-1].pct)}%)`,`📅 Angkatan paling rajin: <b>Angkatan ${esc(aK[0].k)}</b> (${f1(aK[0].pct)}%)`,`🚨 <b>${red}</b> santri (${f1(100*red/n)}%) di zona merah`,`💯 <b>${full}</b> santri hadir 100%, <b>${z}</b> tanpa alpa`].map(x=>`<p>${x}</p>`).join('')),
 hal:blk('🕌 Kehadiran per Halaqah <small>('+hal.length+' halaqah)</small>',`<div style="column-count:${hc};column-gap:1.6em">${bars(hK.map(g=>({l:g.k,v:g.pct,t:f1(g.pct)+'%'})),mc)}</div>`,2),
 rkh:blk('🏆 Ranking Halaqah <small>(nilai akhir)</small>',hR.slice(0,10).map((g,i)=>it(MD[i]||i+1,g.k,g.n+' santri · hadir '+f1(g.pct)+'%',f1(g.avg))).join(''),2),
 top:blk('🌟 10 Santri Terbaik',top.map(r=>it(MD[R.rank(r)-1]||R.rank(r),r.nama,esc(r.halaqah)+' · hadir '+f1(r.pct)+'%',f1(r.avg))).join(''),2)};
 if(!MDS.top)delete B.top;if(!MDS.sor)delete B.sor;
 const pk=a=>a.filter(i=>B[i]),rw=(a,g)=>{a=pk(a);return a.length?`<div class="mdr" style="--g:${g}">${a.map(i=>B[i]).join('')}</div>`:''},cl=(a,g)=>`<div class="mdc" style="flex:${g}">${pk(a).map(i=>B[i]).join('')}</div>`,
 lay=wide?B.hdr+`<div class="mdr" style="--g:1">${cl(['kpi','pred','gen','sor'],1)}${cl(['hal','ang'],1.3)}${cl(['rkh','top'],1)}</div>`:B.hdr+B.kpi+rw(['pred','gen'],1.2)+rw(['ang','sor'],1)+rw(['hal'],2.6)+rw(['rkh','top'],2.2);
 return`<div class="mdp${MDS.t==='d'?' dk':''}" style="--w:${W};--h:${H};--fs:6"><div class="pi">${lay}<div class="mdf">Dicetak ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} · Dewan Ketahfidzan Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung</div></div></div>`}
/* cari ukuran huruf terbesar yang masih muat di poster */
function mdFit(el){const pi=el.querySelector('.pi');let lo=1.2,hi=18;for(let i=0;i<13;i++){const m=(lo+hi)/2;el.style.setProperty('--fs',m);if(pi.scrollHeight<=pi.clientHeight+1&&pi.scrollWidth<=pi.clientWidth+1)lo=m;else hi=m}el.style.setProperty('--fs',lo)}
function mdLay(){const st=$('#mdSt'),p=st&&st.querySelector('.mdp');if(!p)return;mdFit(p);const D=mdDims(),s=Math.min((st.clientWidth-36)/(D.W*MMP),(st.clientHeight-36)/(D.H*MMP),1.2),z=$('#mdSz');$('#mdSc').style.transform='scale('+s+')';z.style.width=D.W*MMP*s+'px';z.style.height=D.H*MMP*s+'px'}
function mdRender(){const f=act(),st=$('#mdSt'),D=mdDims(),S=MDS,N=S.c*S.r;let g='';
 for(let r=0;r<S.r;r++)for(let c=0;c<S.c;c++)g+=`<div class="mdgt" style="left:${c*D.tw}mm;top:${r*D.th}mm;width:${D.tw}mm;height:${D.th}mm"><span>${mdCode(r,c)}</span></div>`;
 st.innerHTML=`<div id="mdSz" style="position:relative"><div id="mdSc" style="position:absolute;left:0;top:0;transform-origin:0 0;width:${D.W}mm;height:${D.H}mm">${mdPoster(f,D.W,D.H)}${g}</div></div>`;
 mdLay();$('#mdInf').textContent=N+' lembar A4 '+(S.o==='p'?'portrait':'landscape')+' → poster jadi ± '+Math.round(D.W/10)+' × '+Math.round(D.H/10)+' cm';$('#mdPb').textContent='🖨️ Cetak '+N+' lembar';
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(mdLay)}
function mdPrint(){const D=mdDims(),S=MDS,p=$('#mdSt .mdp');if(!p)return;const old=$('#mdPrint');if(old)old.remove();
 const m=S.m,g=.8,k=Math.max(0,Math.min(m-g-.3,6)),fs=Math.min(2.6,m*.33),ph=p.outerHTML,N=S.c*S.r;let h='',i=0;
 for(let r=0;r<S.r;r++)for(let c=0;c<S.c;c++){i++;
  const mk=m>=2?[[m,m,-1,-1],[m+D.tw,m,1,-1],[m,m+D.th,-1,1],[m+D.tw,m+D.th,1,1]].map(([x,y,dx,dy])=>`<path d="M${x+dx*g} ${y}h${dx*k}M${x} ${y+dy*g}v${dy*k}"/>`).join(''):'';
  const nb=(x,y,t1,t2)=>`<text x="${x}" y="${y}" text-anchor="middle"><tspan x="${x}">${t1}</tspan><tspan x="${x}" dy="${fs*1.15}">${t2}</tspan></text>`;
  const tx=m>=6?`<g fill="#333" stroke="none" font-family="sans-serif" font-size="${fs}" font-weight="700"><text x="${D.sw/2}" y="${m/2+fs/3}" text-anchor="middle">LEMBAR ${mdCode(r,c)} · ${i}/${N}</text><text x="${D.sw/2}" y="${D.sh-m/2+fs/3}" text-anchor="middle">Baris ${r+1}/${S.r} · Kolom ${c+1}/${S.c}</text>${c>0?nb(m/2,D.sh/2-fs/2,'◀',mdCode(r,c-1)):''}${c<S.c-1?nb(D.sw-m/2,D.sh/2-fs/2,'▶',mdCode(r,c+1)):''}${r>0?`<text x="${D.sw*.8}" y="${m/2+fs/3}" text-anchor="middle">▲ ${mdCode(r-1,c)}</text>`:''}${r<S.r-1?`<text x="${D.sw*.8}" y="${D.sh-m/2+fs/3}" text-anchor="middle">▼ ${mdCode(r+1,c)}</text>`:''}</g>`:'';
  h+=`<div class="mdpg" style="width:${D.sw}mm;height:${D.sh}mm"><div class="mdw" style="left:${m}mm;top:${m}mm;width:${D.tw}mm;height:${D.th}mm"><div style="position:absolute;left:${-c*D.tw}mm;top:${-r*D.th}mm">${ph}</div></div><svg viewBox="0 0 ${D.sw} ${D.sh}" width="${D.sw}mm" height="${D.sh}mm" fill="none" stroke="#000" stroke-width=".18">${mk}${tx}</svg></div>`}
 const root=document.createElement('div');root.id='mdPrint';root.innerHTML=h;document.body.appendChild(root);
 let st=$('#mdPg');if(!st){st=document.createElement('style');st.id='mdPg';document.head.appendChild(st)}
 st.textContent='@page{size:'+D.sw+'mm '+D.sh+'mm;margin:0}';document.body.classList.add('mdprint');
 const end=()=>{document.body.classList.remove('mdprint');root.remove();st.remove();window.removeEventListener('afterprint',end)};
 window.addEventListener('afterprint',end);setTimeout(()=>{try{window.print()}catch(e){end()}},120)}
function madOpen(){if(!act())return;const o0=$('#mdOv');if(o0)o0.remove();const o=document.createElement('div');o.id='mdOv';
 const sel=(id,l,op,v)=>`<label>${l}<select id="${id}">${op.map(x=>`<option value="${x[0]}"${String(x[0])===String(v)?' selected':''}>${x[1]}</option>`).join('')}</select></label>`,n5=[1,2,3,4,5].map(i=>[i,i+' lembar']);
 o.innerHTML=`<div class="mdbar">${sel('mdC','Lebar poster',n5,MDS.c)}${sel('mdR','Tinggi poster',n5,MDS.r)}${sel('mdO','Kertas A4',[['p','Portrait'],['l','Landscape']],MDS.o)}${sel('mdM','Margin printer',[[0,'0 mm (tanpa tanda)'],[5,'5 mm'],[8,'8 mm'],[10,'10 mm'],[12,'12 mm']],MDS.m)}${sel('mdT','Tema',[['l','Terang (hemat tinta)'],['d','Gelap (hijau penuh)']],MDS.t)}
 <label class="mdck"><input type="checkbox" id="mdK1"${MDS.top?' checked':''}>Santri terbaik</label><label class="mdck"><input type="checkbox" id="mdK2"${MDS.sor?' checked':''}>Sorotan</label>
 <div class="mdinfo"><b id="mdInf"></b><br>Cetak dengan skala 100% / "Actual size". Potong margin mengikuti tanda siku di sudut, lalu rapatkan sesuai kode lembar (A1, A2, B1…). Panah di tepi menunjuk lembar tetangga. Garis kuning di bawah hanya pratinjau, tidak ikut tercetak.</div>
 <button class="btn" id="mdPb">🖨️ Cetak</button><button class="btn g" id="mdX">✖ Tutup</button></div><div id="mdSt"></div>`;
 o.onchange=()=>{const v=id=>$('#'+id).value;MDS.c=+v('mdC');MDS.r=+v('mdR');MDS.o=v('mdO');MDS.m=+v('mdM');MDS.t=v('mdT');MDS.top=$('#mdK1').checked?1:0;MDS.sor=$('#mdK2').checked?1:0;mdRender()};
 o.onclick=e=>{if(e.target.closest('#mdX'))o.remove();else if(e.target.closest('#mdPb'))mdPrint()};
 document.body.appendChild(o);mdRender()}
window.addEventListener('resize',mdLay);
document.addEventListener('click',e=>{if(e.target.closest('#mdgo'))madOpen()});
