/* Layout comum das páginas internas com menu filtrado por perfil */
const MENU_ITEMS = [
  {label:'Painel de Urgências', href:'2-painel.html', text:'🏠 Painel de Urgências'},
  {label:'Tempos de espera', href:'3-tempo-espera.html', text:'⏱ Tempos de espera', badge:'24h'},
  {label:'Utentes', href:'4-utentes.html', text:'👥 Utentes'},
  {label:'Informação utente', href:'5-informacao-utente.html', text:'📋 Informação utente'},
  {label:'Histórico utente', href:'5-historico-utentes.html', text:'🕘 Histórico utente'},
  'sep',
  {label:'Admissão Urgência', href:'6-admissao.html', text:'📝 Admissão Urgência'},
  {label:'Aguardar Triagem', href:'7-aguardar-triagem.html', text:'⏳ Aguardar Triagem'},
  {label:'Triagem', href:'8-triagem.html', text:'🩺 Triagem'},
  'sep',
  {label:'Aguardar consulta', href:'9-consultas.html', text:'⏳ Aguardar consulta'},
  {label:'Consulta', href:'10-consulta.html', text:'👨‍⚕️ Consulta'},
  'sep',
  {label:'Exames', href:'11-exames.html', text:'🧪 Exames'},
  {label:'Prescrições', href:'12-prescricoes.html', text:'💊 Prescrições'},
  {label:'Internamentos', href:'13-internamentos.html', text:'🛏 Internamentos'},
  'sep',
  {label:'Relatórios', href:'14-relatorios.html', text:'📊 Relatórios'},
  {label:'Profissionais', href:'15-profissionais.html', text:'👨‍⚕️ Profissionais'},
  {label:'Hospitais', href:'16-hospitais.html', text:'🏥 Hospitais'}
];

function layoutSidebarHTML(activeLabel) {
  const permitidas = typeof paginasPermitidasDoUtilizador === 'function' ? paginasPermitidasDoUtilizador() : [];
  let ultimoFoiSep = true;

  const html = MENU_ITEMS.map(item => {
    if (item === 'sep') {
      if (ultimoFoiSep) return '';
      ultimoFoiSep = true;
      return '<div class="sidebar-separator"></div>';
    }

    if (permitidas.length && !permitidas.includes(item.href)) return '';

    ultimoFoiSep = false;
    const active = item.label === activeLabel ? ' class="active"' : '';
    const badge = item.badge ? ` <span>${item.badge}</span>` : '';
    return `<a href="${item.href}"${active}>${item.text}${badge}</a>`;
  }).join('').replace(/<div class="sidebar-separator"><\/div>\s*$/, '');

  return `<aside class="sidebar">
    
    ${html}
    <div class="sidebar-access">🔒<strong>Acesso por perfil</strong><p>As opções visíveis dependem do tipo de login.</p></div>
  </aside>`;
}

function inicializarPagina(activeLabel, tituloTopo) {
  if (typeof protegerPagina === 'function' && protegerPagina() === false) return;

  document.body.classList.add('dashboard-body', 'internal-page');

  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="dashboard-topbar">
      <div class="topbar-left">
        <div class="topbar-logo">+</div>
        <h1>${tituloTopo || 'PAINEL DA URGÊNCIA'}</h1>
      </div>

      <div class="topbar-center">
        <label>Hospital / Unidade:</label>
        <select id="hospitalSelect"><option>A carregar...</option></select>
      </div>

      <div class="topbar-user" onclick="typeof toggleMenu === 'function' && toggleMenu()">
        <div class="user-avatar">👤</div>
        <div>
          <strong id="nomeUtilizador">Utilizador</strong>
          <span id="perfilUtilizador">Perfil</span>
        </div>
        <div class="dropdown-menu" id="userMenu">
          <button onclick="typeof terminarSessao === 'function' && terminarSessao()">🚪 Terminar sessão</button>
        </div>
      </div>
    </header>

    <div class="app-layout">
      ${layoutSidebarHTML(activeLabel)}
      <main class="dashboard-main page-content" id="conteudo"></main>
    </div>`;

  window.conteudo = document.getElementById('conteudo');

  const utilizador = typeof obterUtilizador === 'function' ? obterUtilizador() : null;
  if (utilizador) {
    const nome = document.getElementById('nomeUtilizador');
    const perfil = document.getElementById('perfilUtilizador');
    if (nome) nome.textContent = utilizador.nome || utilizador.username || 'Utilizador';
    if (perfil) perfil.textContent = typeof obterNomePerfil === 'function' ? obterNomePerfil(utilizador.perfil) : (utilizador.perfil || 'Perfil');
  }

  if (typeof aplicarPermissoesMenu === 'function') aplicarPermissoesMenu();
  if (typeof carregarSeletorHospital === 'function') carregarSeletorHospital(true);
}

function toggleMenu(){
  const m=document.getElementById('userMenu');
  if(m)m.style.display=m.style.display==='block'?'none':'block';
}

window.addEventListener('click',e=>{
  const u=document.querySelector('.topbar-user'),m=document.getElementById('userMenu');
  if(u&&m&&!u.contains(e.target))m.style.display='none';
});
