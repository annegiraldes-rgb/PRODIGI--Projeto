inicializarPagina('Internamentos','INTERNAMENTOS');

conteudo.innerHTML=`<div class="workspace-2col"><div class="main-list"><section class="page-header"><div><h2>Internamentos</h2><p>Lista de internamentos ativos e altas.</p></div><div class="page-actions"><input id="pesquisa" class="search-input" placeholder="Pesquisar utente..." oninput="carregar()"><button onclick="carregar()">↻ Atualizar</button></div></section><div class="filter-tabs"><button>Todos</button><button class="blue">Internados</button><button class="green">Alta</button></div><section class="panel"><table id="tabela"></table></section><div class="pagination"><span id="contador">A mostrar internamentos</span></div></div><aside class="right-details" id="detalhe"></aside></div>`;

let cache=[];
let internamentoSelecionadoId=null;

function estadoNormalizado(i){
  const e=String(i.estado||'internado').toLowerCase();
  return e.includes('alta')?'alta':'internado';
}

function estadoBadge(i){
  const e=estadoNormalizado(i);
  return `<span class="badge ${e==='alta'?'prioridade-verde':'prioridade-azul'}">${e==='alta'?'alta':'internado'}</span>`;
}

function historicoLink(item){
  return `5-historico-utentes.html?id=${item.utente_id||''}`;
}

function selecionarInternamento(id){
  internamentoSelecionadoId=id;
  const item=cache.find(x=>Number(x.id)===Number(id));
  renderDetalhe(item||{});
}

function renderDetalhe(item={}){
  if(!item.id){
    detalhe.innerHTML='<h2>Sem internamento selecionado</h2><p>Selecione um utente na lista.</p>';
    return;
  }

  internamentoSelecionadoId=item.id;
  const alta=estadoNormalizado(item)==='alta';

  detalhe.innerHTML=`<a class="close-x">×</a><h2>${valor(item.utente)}</h2><div class="small-id">ID: UTE${String(item.utente_id||item.id).padStart(6,'0')}</div>${estadoBadge(item)}<div class="patient-mini-grid"><div><span>Serviço</span><strong>${valor(item.servico)}</strong></div><div><span>Cama atribuída automaticamente</span><strong>${valor(item.cama)}</strong></div><div><span>Entrada</span><strong>${hora(item.data_hora_entrada)}</strong></div><div><span>Alta</span><strong>${hora(item.data_hora_alta)}</strong></div></div><div class="detail-module"><h3>🛏 Internamento</h3><p>Médico responsável: ${valor(item.medico_responsavel)}</p><p>Diagnóstico: ${valor(item.diagnostico)}</p><p>Observações: ${valor(item.observacoes)}</p><textarea placeholder="Adicione observações sobre o internamento...">${item.observacoes||''}</textarea></div><div class="table-actions"><a class="btn secondary" href="${historicoLink(item)}">Ver histórico do paciente</a>${alta?'':`<button class="danger" onclick="darAlta(${item.id})">Dar alta</button>`}</div>`;
}

async function darAlta(id){
  try{
    if(!confirm('Confirmar alta do internamento e concluir o episódio?'))return;
    await apiPut('/internamentos/'+id+'/estado',{estado:'alta'});
    await carregar();
  }catch(e){
    alert(e.message);
  }
}

async function carregar(){
  try{
    cache=filtrarHospital(await apiGet('/internamentos'));

    const q=(pesquisa.value||'').toLowerCase();
    let dados=cache.filter(i=>
      (q || !['encerrado','concluido','concluído'].includes(String(i.estado_episodio||'').toLowerCase())) &&
      (!q || String(i.utente).toLowerCase().includes(q) || String(i.servico).toLowerCase().includes(q) || String(i.cama).toLowerCase().includes(q))
    );

    dados=dados.sort((a,b)=>new Date(a.data_hora_entrada||0)-new Date(b.data_hora_entrada||0));

    contador.textContent=`A mostrar ${dados.length} internamentos`;

    mostrarTabela(
      'tabela',
      ['Utente','Serviço','Cama','Médico','Entrada','Estado'],
      [
        i=>`<button class="link-button" onclick="selecionarInternamento(${i.id})"><strong>${valor(i.utente)}</strong></button><br><small>Episódio: ${valor(i.episodio_urgencia_id)}</small>`,
        'servico',
        'cama',
        'medico_responsavel',
        i=>hora(i.data_hora_entrada),
        estadoBadge
      ],
      dados,
      i=>`<button class="table-row-action" onclick="selecionarInternamento(${i.id})">›</button><a class="btn secondary" href="${historicoLink(i)}">Histórico</a>${estadoNormalizado(i)==='alta'?'':`<button class="danger" onclick="darAlta(${i.id})">Dar alta</button>`}`
    );

    const selecionado=dados.find(x=>Number(x.id)===Number(internamentoSelecionadoId)) || dados[0] || {};
    renderDetalhe(selecionado);
  }catch(e){
    conteudo.innerHTML+=mensagemErro(e);
  }
}

carregar();
