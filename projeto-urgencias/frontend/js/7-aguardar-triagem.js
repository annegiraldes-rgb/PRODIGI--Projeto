inicializarPagina('Aguardar Triagem','ADMISSÃO URGÊNCIAS');

conteudo.innerHTML=`<section class="page-header"><div><h2>A aguardar triagem</h2><p>Lista de utentes por ordem de chegada à urgência. Admita o utente para triagem para iniciar o processo.</p></div><button onclick="carregar()">↻ Atualizar</button></section><section class="panel"><table id="tabela"></table></section><div class="info-box">ℹ️ Selecione “Admitir para Triagem” para iniciar o registo da triagem do utente.</div>`;

async function carregar(){
  try{
    const ep=filtrarHospital(await apiGet('/episodios')), tr=filtrarHospital(await apiGet('/triagens'));
    const dados=ep.filter(e=>!tr.some(t=>Number(t.episodio_urgencia_id)===Number(e.id)) && (e.estado||'').toLowerCase()!=='encerrado');

    mostrarTabela(
      'tabela',
      ['Nº Episódio','Nome do Utente','Hospital','Data/Hora Entrada'],
      [e=>`EPI${String(e.id).padStart(8,'0')}`,'utente','hospital',e=>hora(e.data_entrada)],
      dados,
      e=>`<a class="btn" href="8-triagem.html?id=${e.id}">Admitir para Triagem →</a> <button class="btn secondary" onclick="pacienteNaoApareceu(${e.id})">Paciente não apareceu</button>`
    );
  }catch(e){
    conteudo.innerHTML+=mensagemErro(e)
  }
}


async function pacienteNaoApareceu(id){
  if(!confirm('Confirmar que o paciente não apareceu e encerrar o episódio?')) return;
  try{
    const u=obterUser()||{};
    await apiPut(`/episodios/${id}/encerrar`,{
      data_hora_alta: hojeLocal(),
      motivo_alta: 'Paciente não apareceu',
      observacoes: 'Paciente chamado para triagem e não compareceu.',
      profissional_id: u.id || 1
    });
    await carregar();
  }catch(e){
    conteudo.innerHTML+=mensagemErro(e);
  }
}

carregar();
