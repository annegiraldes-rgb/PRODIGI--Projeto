const API="/api";

async function apiGet(endpoint){
  const r=await fetch(API+endpoint);
  if(!r.ok) throw new Error(`GET ${endpoint} falhou: ${r.status}`);
  return await r.json();
}
async function apiPost(endpoint,dados){
  const r=await fetch(API+endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(dados)});
  const json=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(json.erro||json.mensagem||`POST ${endpoint} falhou: ${r.status}`);
  return json;
}
async function apiPut(endpoint,dados){
  const r=await fetch(API+endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(dados)});
  const json=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(json.detalhe||json.erro||json.mensagem||`PUT ${endpoint} falhou: ${r.status}`);
  return json;
}

function valor(v){return v===null||v===undefined||v===""?"—":v}
function hora(v){if(!v)return"—";return String(v).replace("T"," ").slice(0,16)}
function hojeLocal(){return new Date().toISOString().slice(0,16)}
function prioridadeNome(p){p=(p||"").toLowerCase();if(p.includes("vermelho"))return"Vermelho";if(p.includes("laranja"))return"Laranja";if(p.includes("amarelo"))return"Amarelo";if(p.includes("verde"))return"Verde";if(p.includes("azul"))return"Azul";return valor(p)}
function prioridadeClasse(p){p=(p||"").toLowerCase();if(p.includes("vermelho"))return"prioridade-vermelho";if(p.includes("laranja"))return"prioridade-laranja";if(p.includes("amarelo"))return"prioridade-amarelo";if(p.includes("verde"))return"prioridade-verde";if(p.includes("azul"))return"prioridade-azul";return""}
function dotPrioridade(p){return `<span class="dot ${prioridadeClasse(p).replace('prioridade-','')}"></span>`}
function obterUser(){try{return JSON.parse(localStorage.getItem('utilizador')||'null')}catch(e){return null}}



function hospitalAtivoId(){
  const guardado = localStorage.getItem('hospitalSelecionadoId');
  if (guardado) return guardado;
  const u = obterUser && obterUser();
  return (u && u.hospital_id) ? String(u.hospital_id) : '1';
}

function hospitalAtivoNome(){
  return localStorage.getItem('hospitalSelecionadoNome') || 'Hospital Central';
}

function guardarHospitalAtivo(id, nome){
  if (id) localStorage.setItem('hospitalSelecionadoId', String(id));
  if (nome) localStorage.setItem('hospitalSelecionadoNome', String(nome));
}

function filtrarHospital(dados){
  const hospitalId = Number(hospitalAtivoId());
  if (!Array.isArray(dados) || !hospitalId) return dados || [];
  return dados.filter(item => item && (item.hospital_id === undefined || item.hospital_id === null || Number(item.hospital_id) === hospitalId));
}

async function carregarSeletorHospital(recarregarAoMudar=true){
  const select = document.getElementById('hospitalSelect');
  if (!select) return;

  try{
    const hospitais = await apiGet('/hospitais');
    const ativos = (hospitais || []).filter(h => String(h.estado || 'ativo').toLowerCase() === 'ativo');
    const atual = hospitalAtivoId();

    select.innerHTML = '';
    ativos.forEach(h => {
      const op = document.createElement('option');
      op.value = h.id;
      op.textContent = h.nome;
      if (String(h.id) === String(atual)) op.selected = true;
      select.appendChild(op);
    });

    if (!select.value && ativos[0]) {
      select.value = ativos[0].id;
      guardarHospitalAtivo(ativos[0].id, ativos[0].nome);
    } else if (select.selectedOptions[0]) {
      guardarHospitalAtivo(select.value, select.selectedOptions[0].textContent);
    }

    select.onchange = () => {
      guardarHospitalAtivo(select.value, select.selectedOptions[0]?.textContent || '');
      if (recarregarAoMudar) location.reload();
    };
  }catch(e){
    console.error('Erro ao carregar hospitais:', e);
  }
}

function menuItems(ativa){
  const items=[
    ['2-painel.html','🏠','Painel de Urgências','Painel de Urgências'],
    ['3-tempo-espera.html','⏱','Tempos de espera','Tempos de espera','24h'],
    ['4-utentes.html','👥','Utentes','Utentes'],
    ['5-informacao-utente.html','📄','Informação utente','Informação utente'],
    ['5-historico-utentes.html','🕘','Histórico utente','Histórico utente'],
    ['sep'],
    ['6-admissao.html','📝','Admissão Urgência','Admissão Urgência'],
    ['7-aguardar-triagem.html','⏳','Aguardar Triagem','Aguardar Triagem'],
    ['8-triagem.html','🩺','Triagem','Triagem'],
    ['sep'],
    ['9-consultas.html','⏳','Aguardar consulta','Aguardar consulta'],
    ['10-consulta.html','👨‍⚕️','Consulta','Consulta'],
    ['sep'],
    ['11-exames.html','🧪','Exames','Exames'],
    ['12-prescricoes.html','💊','Prescrições','Prescrições'],
    ['13-internamentos.html','🛏','Internamentos','Internamentos'],
    ['sep'],
    ['14-relatorios.html','📊','Relatórios','Relatórios'],
    ['15-profissionais.html','👨‍⚕️','Profissionais','Profissionais'],
    ['16-hospitais.html','🏥','Hospitais','Hospitais']
  ];
  return items.map(it=>it[0]==='sep'?'<div class="sidebar-separator"></div>':`<a href="${it[0]}" class="${ativa===it[3]?'active':''}"><span class="nav-left"><b>${it[1]}</b>${it[2]}</span>${it[4]?`<em>${it[4]}</em>`:''}</a>`).join('');
}
function hospitalAtualNome(){return hospitalAtivoNome()}
function layoutTopoMenu(ativa,titulo=null){
  const u=obterUser()||{nome:'Enf. Maria Santos',perfil:'Enfermeiro'};
  const hospital=hospitalAtualNome();
  return `<header class="dashboard-topbar compact-topbar"><div class="topbar-left"><div class="topbar-logo">+</div><h1>${titulo||ativa}</h1></div><div class="topbar-center"><label>Hospital / Unidade:</label><select id="hospitalSelect"><option>${hospital}</option></select></div><div class="topbar-user" onclick="toggleMenu()"><div class="user-avatar">👤</div><div><strong>${u.nome}</strong><span>${u.perfil}</span></div><div class="dropdown-menu" id="userMenu"><button onclick="terminarSessao()">🚪 Terminar sessão</button></div></div></header><div class="app-layout"><aside class="sidebar"><div class="sidebar-title">Painel de Urgências</div>${menuItems(ativa)}<div class="sidebar-access">🔒<strong>Acesso restrito</strong><p>Esta área contém informação clínica sensível. O acesso é monitorizado.</p></div></aside><main class="dashboard-main page-content" id="conteudo"></main></div>`
}
function inicializarPagina(ativa,titulo){
  if(typeof protegerPagina==='function') protegerPagina();
  document.body.classList.add('internal-page');
  document.getElementById('app').innerHTML=layoutTopoMenu(ativa,titulo||ativa);
}
function toggleMenu(){const m=document.getElementById('userMenu');if(m)m.style.display=m.style.display==='block'?'none':'block'}
window.addEventListener('click',e=>{const u=document.querySelector('.topbar-user'),m=document.getElementById('userMenu');if(u&&m&&!u.contains(e.target))m.style.display='none'});
function mensagemErro(err){return `<div class="info-box erro">⚠️ ${err.message||err}</div>`}
function preencherSelect(id,dados,texto,textoItem){const s=document.getElementById(id);if(!s)return;s.innerHTML=`<option value="">${texto}</option>`;dados.forEach(i=>{const op=document.createElement('option');op.value=i.id;op.textContent=textoItem(i);s.appendChild(op)})}
function mostrarTabela(id,colunas,campos,dados,acoes=null){const t=document.getElementById(id);t.innerHTML=`<thead><tr>${colunas.map(c=>`<th>${c}</th>`).join('')}${acoes?'<th>Ações</th>':''}</tr></thead><tbody>${(dados||[]).map(item=>`<tr>${campos.map(c=>`<td>${typeof c==='function'?c(item):valor(item[c])}</td>`).join('')}${acoes?`<td>${acoes(item)}</td>`:''}</tr>`).join('')||`<tr><td colspan="${colunas.length+(acoes?1:0)}">Sem registos.</td></tr>`}</tbody>`}
function filtrosPrioridadeHTML(total=0){return `<div class="filter-row"><button class="secondary">Todos <span>${total}</span></button><button class="filter-red">Muito urgente</button><button class="filter-orange">Urgente</button><button class="filter-green">Pouco urgente</button><button class="filter-blue">Não urgente</button></div>`}
