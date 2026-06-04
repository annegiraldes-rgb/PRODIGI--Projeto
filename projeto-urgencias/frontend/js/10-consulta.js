inicializarPagina('Aguardar consulta','LISTA DE UTENTES');

conteudo.innerHTML=`<section class="page-header"><div><h2>Consultas</h2><p>Lista de utentes aguardando ou em consulta.</p></div><div class="page-actions"><input id="pesquisa" class="search-input" placeholder="Pesquisar utente..."><button onclick="carregar()">↻ Atualizar</button></div></section>${filtrosPrioridadeHTML(0)}<div class="grid-2"><section class="panel"><table id="tabela"></table></section><aside><div class="side-card" id="detalhe">Selecione um utente.</div></aside></div>`;

function especialidadeDoEpisodio(atos, episodioId){
  const a=[...atos].reverse().find(x=>Number(x.episodio_urgencia_id)===Number(episodioId) && String(x.tipo||'').toLowerCase().includes('nova consulta'));
  return a?String(a.descricao||'').replace('Nova consulta - ',''):'—';
}

function ordemPrioridade(p){
  const n=prioridadeNome(p).toLowerCase();
  if(n.includes('vermelho'))return 1;
  if(n.includes('laranja'))return 2;
  if(n.includes('amarelo'))return 3;
  if(n.includes('verde'))return 4;
  if(n.includes('azul'))return 5;
  return 99;
}

function dataMs(v){
  const d=new Date(v);
  return isNaN(d.getTime())?0:d.getTime();
}

async function carregar(){
  try{
    const ep=filtrarHospital(await apiGet('/episodios'));
    const tri=filtrarHospital(await apiGet('/triagens'));
    const atos=filtrarHospital(await apiGet('/atos'));

    let dados=ep.filter(e=>
      (e.estado||'').toLowerCase().includes('consulta') ||
      (e.estado||'').toLowerCase().includes('aguardar')
    );

    const q=(pesquisa.value||'').toLowerCase();
    if(q){
      dados=dados.filter(e=>
        String(e.utente).toLowerCase().includes(q) ||
        especialidadeDoEpisodio(atos,e.id).toLowerCase().includes(q)
      );
    }

    dados=dados.sort((a,b)=>{
      const ta=tri.find(x=>Number(x.episodio_urgencia_id)===Number(a.id))||{};
      const tb=tri.find(x=>Number(x.episodio_urgencia_id)===Number(b.id))||{};
      const op=ordemPrioridade(ta.prioridade)-ordemPrioridade(tb.prioridade);
      if(op!==0)return op;
      return dataMs(a.data_entrada)-dataMs(b.data_entrada);
    });

    mostrarTabela(
      'tabela',
      ['Nº Episódio','Utente','Especialidade','Prioridade','Hora Triagem','Estado'],
      [
        e=>`EPI${String(e.id).padStart(8,'0')}`,
        'utente',
        e=>especialidadeDoEpisodio(atos,e.id),
        e=>{
          const t=tri.find(x=>Number(x.episodio_urgencia_id)===Number(e.id))||{};
          return `<span class="badge ${prioridadeClasse(t.prioridade)}">${prioridadeNome(t.prioridade)}</span>`;
        },
        e=>hora((tri.find(x=>Number(x.episodio_urgencia_id)===Number(e.id))||{}).data_hora),
        'estado'
      ],
      dados,
      e=>`<a class="btn" href="10-consulta.html?id=${e.id}&origem=aguardar-consulta">Admitir para consulta</a> <button class="btn secondary" onclick="pacienteNaoApareceu(${e.id})">Paciente não apareceu</button>`
    );

    if(dados[0]){
      detalhe.innerHTML=`<h2>${dados[0].utente}</h2><p>ID: UTE${String(dados[0].utente_id||dados[0].id).padStart(6,'0')}</p><p><strong>Especialidade:</strong> ${especialidadeDoEpisodio(atos,dados[0].id)}</p><hr><a class="btn secondary" href="5-historico-utentes.html?id=${dados[0].utente_id||''}">Ver histórico do utente</a>`;
    }else{
      detalhe.innerHTML='Sem utentes em espera.';
    }
  }catch(e){
    conteudo.innerHTML+=mensagemErro(e);
  }
}


async function pacienteNaoApareceu(id){
  if(!confirm('Confirmar que o paciente não apareceu e encerrar o episódio?')) return;
  try{
    const u=obterUser()||{};
    await apiPut(`/episodios/${id}/encerrar`,{
      data_hora_alta: hojeLocal(),
      motivo_alta: 'Paciente não apareceu',
      observacoes: 'Paciente chamado para consulta e não compareceu.',
      profissional_id: u.id || 1
    });
    await carregar();
  }catch(e){
    conteudo.innerHTML+=mensagemErro(e);
  }
}

carregar();

