inicializarPagina('Tempos de espera','TEMPO DE ESPERA E PREVISÃO');

conteudo.innerHTML=`
<section class="page-header">
  <div><h2>Tempo de Espera e Previsão</h2><p>Monitorização em tempo real e previsão de tempos de espera na urgência com dados PostgreSQL.</p></div>
  <div class="page-actions"><button onclick="carregar()">↻ Atualizar</button><select disabled><option>Últimas 24 horas</option></select></div>
</section>

<div id="erroTempo"></div>

<div class="cards">
  <div class="card"><h3>Tempo médio geral</h3><div class="number" id="mediaGeral">—</div></div>
  <div class="card"><h3>Tempo médio consulta</h3><div class="number" id="mediaConsulta">—</div></div>
  <div class="card"><h3>Tempo médio até triagem</h3><div class="number" id="mediaTriagem">—</div></div>
  <div class="card"><h3>Máximo de espera registado</h3><div class="number" id="maxEspera">—</div></div>
</div>

<div class="grid-2">
  <section class="panel">
    <h3>App de previsão de tempo de espera</h3>
    <p class="muted">Modelo Python no backend Flask, ligado à base de dados PostgreSQL.</p>
    <div class="form-grid">
      <div class="field"><label>Prioridade</label><select id="prevPrioridade"><option>Vermelho</option><option>Laranja</option><option selected>Amarelo</option><option>Verde</option><option>Azul</option></select></div>
      <div class="field"><label>Idade</label><input id="prevIdade" type="number" min="0" value="45"></div>
      <div class="field"><label>Hora de entrada</label><input id="prevHora" type="number" min="0" max="23" value="${new Date().getHours()}"></div>
      <div class="field"><label>Utentes em espera</label><input id="prevEspera" type="number" min="0" value="0"></div>
      <div class="field"><label>Profissionais disponíveis</label><input id="prevProfissionais" type="number" min="1" value="1"></div>
      <div class="field"><label>&nbsp;</label><button onclick="prever()">🔮 Prever</button></div>
    </div>
    <div class="prediction-result" id="resultadoPrevisao"><strong>Previsão:</strong> preenche os dados e clica em Prever.</div>
  </section>

  <section class="panel">
    <h3>Previsão automática por prioridade</h3>
    <table id="previsoesTabela"></table>
  </section>
</div>

<div class="grid-3">
  <section class="panel"><h3>Tempo médio por prioridade</h3><div class="bar-chart" id="graficoPrioridade"></div></section>
  <section class="panel"><h3>Resumo operacional</h3><div id="resumoOperacional" class="wait-summary"></div></section>
  <section class="panel"><h3>Tempo médio por prioridade</h3><table id="prioridadesTabela"></table></section>
</div>

<div class="grid-2">
  <section class="panel"><h3>Métricas por período</h3><table id="periodos"></table></section>
  <section class="panel"><h3>Alertas</h3><div id="alertasTempo"></div></section>
</div>
<footer class="dashboard-footer"><span>ℹ️ Os dados vêm da base PostgreSQL.</span><span id="ultimaAtualizacao">🕒 Última atualização: —</span></footer>`;

function classeBarra(prioridade){const p=(prioridade||'').toLowerCase();if(p.includes('vermelho'))return'red';if(p.includes('laranja'))return'orange';if(p.includes('amarelo'))return'yellow';if(p.includes('verde'))return'green';return''}
function alertaHTML(resumo){
  const m=resumo.media_geral_min||0, espera=resumo.em_espera||0;
  let arr=[];
  if(m>=120) arr.push('<div class="alert-box danger">⚠️ Tempo médio geral muito elevado</div>');
  else if(m>=60) arr.push('<div class="alert-box warning">🕒 Tempo médio geral em subida</div>');
  else arr.push('<div class="alert-box info">ℹ️ Tempo médio geral dentro do esperado</div>');
  if(espera>=20) arr.push('<div class="alert-box danger">⚠️ Muitos utentes ainda em espera</div>');
  else arr.push('<div class="alert-box info">👥 Utentes em espera: '+espera+'</div>');
  arr.push('<div class="alert-box info">🧠 Modelo: dados PostgreSQL + heurística Python explicável</div>');
  return arr.join('');
}
async function carregar(){
  try{
    document.getElementById('erroTempo').innerHTML='';
    const dados=await apiGet('/tempo_espera/previsao');
    const r=dados.resumo||{};
    mediaGeral.textContent=r.media_geral||'—'; mediaConsulta.textContent=r.media_consulta||'—'; mediaTriagem.textContent=r.media_triagem||'—'; maxEspera.textContent=r.max_espera||'—';
    prevEspera.value=r.em_espera||0; prevProfissionais.value=r.profissionais_ativos||1;
    mostrarTabela('prioridadesTabela',['Prioridade','Tempo médio'],['prioridade','media_formatada'],dados.por_prioridade||[]);
    mostrarTabela('previsoesTabela',['Prioridade','Previsão'],['prioridade','tempo'],dados.previsoes||[]);
    mostrarTabela('periodos',['Período','Consultas','Tempo médio geral','Entradas'],['periodo','consultas','media_formatada','entradas'],dados.periodos||[]);
    const max=Math.max(...(dados.por_prioridade||[]).map(x=>x.media_min||1),1);
    graficoPrioridade.innerHTML=(dados.por_prioridade||[]).slice(0,5).map(x=>`<div class="bar ${classeBarra(x.prioridade)}" style="height:${Math.max(22,Math.round((x.media_min/max)*190))}px"><span>${x.media_formatada}</span></div>`).join('');
    resumoOperacional.innerHTML=`<div class="info-box"><strong>Entradas 24h:</strong> ${r.entradas_24h||0}</div><div class="info-box"><strong>Em espera:</strong> ${r.em_espera||0}</div><div class="info-box"><strong>Profissionais ativos:</strong> ${r.profissionais_ativos||0}</div>`;
    alertasTempo.innerHTML=alertaHTML(r);
    ultimaAtualizacao.textContent='🕒 Última atualização: '+new Date().toLocaleString('pt-PT');
  }catch(err){document.getElementById('erroTempo').innerHTML=mensagemErro(err)}
}
async function prever(){
  try{
    const dados={prioridade:prevPrioridade.value,idade:prevIdade.value,hora:prevHora.value,em_espera:prevEspera.value,profissionais_disponiveis:prevProfissionais.value};
    const r=await apiPost('/tempo_espera/prever',dados);
    resultadoPrevisao.innerHTML=`<strong>Previsão:</strong> <span class="prediction-time">${r.tempo}</span><p>${r.explicacao}</p><small>Média histórica usada: ${r.media_historica_usada}</small>`;
  }catch(err){resultadoPrevisao.innerHTML=mensagemErro(err)}
}
carregar();
