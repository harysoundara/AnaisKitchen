/* ==========================================================================
   AnaisKitchen — logique app (100% locale, données stockées dans localStorage
   du téléphone / navigateur : rien n'est envoyé sur un serveur)
   ========================================================================== */

const STORE_KEYS = { recettes:'ak_recettes', congelo:'ak_congelo', planning:'ak_planning', historique:'ak_historique' };
const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

const store = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){ console.warn('Stockage plein ou indisponible', e); } }
};

let recettes  = store.get(STORE_KEYS.recettes, []);
let congelo   = store.get(STORE_KEYS.congelo, []);
let planning  = store.get(STORE_KEYS.planning, {});
let historique= store.get(STORE_KEYS.historique, []);

function saveRecettes(){ store.set(STORE_KEYS.recettes, recettes); }
function saveCongelo(){ store.set(STORE_KEYS.congelo, congelo); }
function savePlanning(){ store.set(STORE_KEYS.planning, planning); }
function saveHistorique(){ store.set(STORE_KEYS.historique, historique); }

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove('show'), 1800);
}

/* ---------------------------------------------------------------------- */
/*  Navigation entre onglets                                              */
/* ---------------------------------------------------------------------- */
function goTab(name){
  document.querySelectorAll('.tab-section').forEach(s=>s.classList.toggle('active', s.id === 'tab-'+name));
  document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('active', b.dataset.tab === name));
  if(name==='choisir') renderChoisir();
  if(name==='favoris') renderFavoris();
  if(name==='planning') renderPlanning();
  if(name==='congelo') renderCongelo();
  if(name==='historique') renderHistorique();
  window.scrollTo(0,0);
}
document.querySelectorAll('.tabbar button').forEach(b=>b.addEventListener('click', ()=>goTab(b.dataset.tab)));

/* ---------------------------------------------------------------------- */
/*  Onglet PROFIL — ajouter une recette                                   */
/* ---------------------------------------------------------------------- */
const photoInput = document.getElementById('photo-input');
const photoDrop   = document.getElementById('photo-drop');
let photoData = null;

photoDrop.addEventListener('click', ()=>photoInput.click());
photoInput.addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    photoData = ev.target.result;
    photoDrop.style.backgroundImage = '';
    photoDrop.classList.add('has-photo');
    let img = photoDrop.querySelector('img');
    if(!img){ img = document.createElement('img'); photoDrop.appendChild(img); }
    img.src = photoData;
  };
  reader.readAsDataURL(file);
});

let modeChoisi = 'poele';
document.querySelectorAll('#mode-toggle button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#mode-toggle button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    modeChoisi = btn.dataset.mode;
  });
});

document.getElementById('form-recette').addEventListener('submit', e=>{
  e.preventDefault();
  const nom = document.getElementById('r-nom').value.trim();
  const temps = parseInt(document.getElementById('r-temps').value, 10);
  if(!nom || !temps){ toast('Nom et temps de préparation requis'); return; }
  recettes.push({
    id: uid(), nom, temps, mode: modeChoisi,
    photo: photoData, favori:false, createdAt: Date.now()
  });
  saveRecettes();
  toast('Recette enregistrée ✓');
  e.target.reset();
  photoData = null;
  photoDrop.classList.remove('has-photo');
  const img = photoDrop.querySelector('img'); if(img) img.remove();
  document.querySelectorAll('#mode-toggle button').forEach(b=>b.classList.remove('active'));
  document.querySelector('#mode-toggle button[data-mode=poele]').classList.add('active');
  modeChoisi = 'poele';
  renderListeRecettesProfil();
});

function renderListeRecettesProfil(){
  const wrap = document.getElementById('liste-recettes-profil');
  if(recettes.length===0){
    wrap.innerHTML = `<div class="empty"><div class="ico">🍲</div><p>Aucune recette pour l'instant.<br>Ajoute la première ci-dessus !</p></div>`;
    return;
  }
  wrap.innerHTML = recettes.slice().sort((a,b)=>b.createdAt-a.createdAt).map(r=>`
    <div class="freezer-item">
      <div class="qty">${r.temps}'</div>
      <div class="nom">${escapeHtml(r.nom)}</div>
      <span class="tag mode-${r.mode}">${labelMode(r.mode)}</span>
      <button class="del" title="Supprimer" onclick="supprimerRecette('${r.id}')">✕</button>
    </div>`).join('');
}

function supprimerRecette(id){
  if(!confirm('Supprimer cette recette ?')) return;
  recettes = recettes.filter(r=>r.id!==id);
  saveRecettes();
  renderListeRecettesProfil();
  toast('Recette supprimée');
}

function labelMode(m){ return m==='four' ? 'Four' : m==='poele' ? 'Poêle' : 'Autre'; }

/* ---------------------------------------------------------------------- */
/*  Onglet CHOISIR — filtres + dé                                         */
/* ---------------------------------------------------------------------- */
let filtreTemps = 'tous';
let filtreMode = 'tous';
let choixSoir = null;

document.querySelectorAll('#chips-temps .chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('#chips-temps .chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    filtreTemps = c.dataset.val;
    renderChoisir();
  });
});
document.querySelectorAll('#chips-mode .chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('#chips-mode .chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    filtreMode = c.dataset.val;
    renderChoisir();
  });
});

function recettesFiltrees(){
  return recettes.filter(r=>{
    if(filtreMode!=='tous' && r.mode!==filtreMode) return false;
    if(filtreTemps==='tous') return true;
    const [min,max] = filtreTemps.split('-').map(Number);
    return r.temps >= min && r.temps < max;
  });
}

function renderChoisir(){
  const wrap = document.getElementById('grille-choisir');
  const liste = recettesFiltrees();
  document.getElementById('dice-btn').disabled = liste.length===0;
  if(recettes.length===0){
    wrap.innerHTML = `<div class="empty"><div class="ico">👩‍🍳</div><p>Ajoute des recettes dans l'onglet Profil pour commencer.</p></div>`;
    return;
  }
  if(liste.length===0){
    wrap.innerHTML = `<div class="empty"><div class="ico">🔎</div><p>Aucune recette ne correspond à ces filtres.</p></div>`;
    return;
  }
  wrap.innerHTML = `<div class="recipe-grid">${liste.map(cardHtml).join('')}</div>`;
  wrap.querySelectorAll('.recipe-card').forEach(el=>{
    el.addEventListener('click', ()=>{
      if(el.dataset.staronly==='1') return;
      selectionnerSoir(el.dataset.id);
    });
  });
  wrap.querySelectorAll('.fav-star').forEach(el=>{
    el.addEventListener('click', ev=>{ ev.stopPropagation(); toggleFavori(el.dataset.id); });
  });
  marquerSelection();
}

function cardHtml(r){
  const photo = r.photo
    ? `<img class="photo" src="${r.photo}" alt="${escapeHtml(r.nom)}">`
    : `<div class="photo placeholder">🍽️</div>`;
  return `
    <div class="recipe-card" data-id="${r.id}">
      <button class="fav-star ${r.favori?'on':''}" data-id="${r.id}">★</button>
      ${photo}
      <div class="infos">
        <div class="nom">${escapeHtml(r.nom)}</div>
        <div class="meta">
          <span class="tag">${r.temps} min</span>
          <span class="tag mode-${r.mode}">${labelMode(r.mode)}</span>
        </div>
      </div>
    </div>`;
}

function marquerSelection(){
  document.querySelectorAll('#grille-choisir .recipe-card').forEach(el=>{
    el.classList.toggle('selected', choixSoir && el.dataset.id===choixSoir.id);
  });
  const bar = document.getElementById('choix-actuel');
  if(choixSoir){
    bar.innerHTML = `Ce soir : <strong>${escapeHtml(choixSoir.nom)}</strong>
      <button class="btn btn-primary" id="btn-valider-soir" style="margin-left:10px;padding:8px 16px;font-size:13px;">Valider ✓</button>`;
    document.getElementById('btn-valider-soir').addEventListener('click', validerSoir);
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function selectionnerSoir(id){
  choixSoir = recettes.find(r=>r.id===id) || null;
  marquerSelection();
}

function validerSoir(){
  if(!choixSoir) return;
  historique.push({ id: uid(), recetteId: choixSoir.id, nom: choixSoir.nom, date: new Date().toISOString() });
  saveHistorique();
  toast(`Bon appétit avec « ${choixSoir.nom} » ! 🍽️`);
  choixSoir = null;
  marquerSelection();
}

document.getElementById('dice-btn').addEventListener('click', ()=>{
  const liste = recettesFiltrees();
  if(liste.length===0) return;
  const btn = document.getElementById('dice-btn');
  btn.classList.add('rolling');
  let i = 0;
  const anim = setInterval(()=>{
    btn.textContent = ['🎲','🎯','🍳','🎲'][i % 4];
    i++;
  }, 90);
  setTimeout(()=>{
    clearInterval(anim);
    btn.textContent = '🎲';
    btn.classList.remove('rolling');
    const pick = liste[Math.floor(Math.random()*liste.length)];
    choixSoir = pick;
    renderChoisir();
    document.getElementById(`card-${pick.id}`);
    document.querySelector(`.recipe-card[data-id="${pick.id}"]`)?.scrollIntoView({behavior:'smooth', block:'center'});
  }, 550);
});

function toggleFavori(id){
  const r = recettes.find(r=>r.id===id);
  if(!r) return;
  r.favori = !r.favori;
  saveRecettes();
  renderChoisir();
  renderFavoris();
}

/* ---------------------------------------------------------------------- */
/*  Onglet FAVORIS                                                        */
/* ---------------------------------------------------------------------- */
function renderFavoris(){
  const wrap = document.getElementById('grille-favoris');
  const liste = recettes.filter(r=>r.favori);
  if(liste.length===0){
    wrap.innerHTML = `<div class="empty"><div class="ico">♥</div><p>Pas encore de coup de cœur.<br>Touche l'étoile sur une recette pour l'ajouter ici.</p></div>`;
    return;
  }
  wrap.innerHTML = `<div class="recipe-grid">${liste.map(cardHtml).join('')}</div>`;
  wrap.querySelectorAll('.fav-star').forEach(el=>{
    el.addEventListener('click', ev=>{ ev.stopPropagation(); toggleFavori(el.dataset.id); });
  });
  wrap.querySelectorAll('.recipe-card').forEach(el=>{
    el.addEventListener('click', ()=>{ selectionnerSoir(el.dataset.id); goTab('choisir'); });
  });
}

/* ---------------------------------------------------------------------- */
/*  Onglet PLANNING de la semaine                                         */
/* ---------------------------------------------------------------------- */
function renderPlanning(){
  const wrap = document.getElementById('liste-planning');
  if(recettes.length===0){
    wrap.innerHTML = `<div class="empty"><div class="ico">📅</div><p>Ajoute des recettes pour pouvoir composer ton planning.</p></div>`;
    return;
  }
  wrap.innerHTML = JOURS.map(j=>{
    const val = planning[j] || '';
    return `
      <div class="plan-day ${val?'filled':''}">
        <div class="jour">${j}</div>
        <select data-jour="${j}">
          <option value="">— libre —</option>
          ${recettes.map(r=>`<option value="${r.id}" ${r.id===val?'selected':''}>${escapeHtml(r.nom)}</option>`).join('')}
        </select>
      </div>`;
  }).join('');
  wrap.querySelectorAll('select').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      planning[sel.dataset.jour] = sel.value || null;
      if(!sel.value) delete planning[sel.dataset.jour];
      savePlanning();
      renderPlanning();
    });
  });
}

document.getElementById('btn-vider-planning').addEventListener('click', ()=>{
  if(!confirm('Vider tout le planning de la semaine ?')) return;
  planning = {};
  savePlanning();
  renderPlanning();
});

/* ---------------------------------------------------------------------- */
/*  Onglet CONGÉLATEUR                                                    */
/* ---------------------------------------------------------------------- */
document.getElementById('form-congelo').addEventListener('submit', e=>{
  e.preventDefault();
  const qty = parseInt(document.getElementById('c-qty').value, 10) || 1;
  const nom = document.getElementById('c-nom').value.trim();
  const date = document.getElementById('c-date').value;
  if(!nom || !date){ toast('Nom et date de péremption requis'); return; }
  congelo.push({ id: uid(), qty, nom, peremption: date });
  saveCongelo();
  e.target.reset();
  document.getElementById('c-qty').value = 1;
  renderCongelo();
  toast('Ajouté au congélateur ✓');
});

function renderCongelo(){
  const wrap = document.getElementById('liste-congelo');
  if(congelo.length===0){
    wrap.innerHTML = `<div class="empty"><div class="ico">🧊</div><p>Le congélateur est vide pour l'instant.</p></div>`;
    return;
  }
  const tri = congelo.slice().sort((a,b)=> new Date(a.peremption) - new Date(b.peremption));
  const auj = new Date(); auj.setHours(0,0,0,0);
  wrap.innerHTML = tri.map(it=>{
    const d = new Date(it.peremption);
    const jours = Math.round((d - auj) / 86400000);
    let cls = '', txt = '';
    if(jours < 0){ cls='expired'; txt = 'Périmé'; }
    else if(jours === 0){ cls='expired'; txt = "Aujourd'hui"; }
    else if(jours <= 7){ cls='warn'; txt = `dans ${jours} j`; }
    else { txt = `dans ${jours} j`; }
    return `
      <div class="freezer-item ${cls}">
        <div class="qty">${it.qty}</div>
        <div class="nom">${escapeHtml(it.nom)}</div>
        <div class="date">${d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit', year:'numeric'})}<span class="j">${txt}</span></div>
        <button class="del" title="Supprimer" onclick="supprimerCongelo('${it.id}')">✕</button>
      </div>`;
  }).join('');
}

function supprimerCongelo(id){
  congelo = congelo.filter(i=>i.id!==id);
  saveCongelo();
  renderCongelo();
}

/* ---------------------------------------------------------------------- */
/*  Onglet HISTORIQUE & STATISTIQUES                                      */
/* ---------------------------------------------------------------------- */
function renderHistorique(){
  const statWrap = document.getElementById('stats-grid');
  const total = historique.length;
  const moisActuel = new Date().getMonth();
  const cesMois = historique.filter(h=> new Date(h.date).getMonth()===moisActuel).length;
  const compte = {};
  historique.forEach(h=>{ compte[h.nom] = (compte[h.nom]||0)+1; });
  let topNom = '—', topN = 0;
  Object.entries(compte).forEach(([nom,n])=>{ if(n>topN){ topN=n; topNom=nom; } });

  statWrap.innerHTML = `
    <div class="stat-box"><div class="num">${total}</div><div class="lbl">Repas au total</div></div>
    <div class="stat-box"><div class="num">${cesMois}</div><div class="lbl">Ce mois-ci</div></div>
    <div class="stat-box" style="grid-column:1/-1;"><div class="num" style="font-size:18px;">${escapeHtml(topNom)}</div><div class="lbl">Recette la plus cuisinée${topN?` (${topN}×)`:''}</div></div>
  `;

  const listWrap = document.getElementById('liste-historique');
  if(historique.length===0){
    listWrap.innerHTML = `<div class="empty"><div class="ico">📖</div><p>Ton historique de repas apparaîtra ici.</p></div>`;
    return;
  }
  listWrap.innerHTML = historique.slice().reverse().map(h=>`
    <div class="history-item">
      <span>${escapeHtml(h.nom)}</span>
      <span class="d">${new Date(h.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'})}</span>
    </div>`).join('');
}

/* ---------------------------------------------------------------------- */
/*  Utils                                                                  */
/* ---------------------------------------------------------------------- */
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------------------------------------------------------------------- */
/*  Init                                                                   */
/* ---------------------------------------------------------------------- */
renderListeRecettesProfil();
renderChoisir();

/* Enregistrement du service worker pour un usage hors-ligne sur l'écran d'accueil */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
