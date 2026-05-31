inicializarPagina('Utentes','INFORMAÇÃO DO UTENTE');

conteudo.innerHTML = `
  <section class="page-header">
    <div>
      <h2>Utentes</h2>
      <p>Registe, pesquise e consulte os utentes.</p>
    </div>
    <div class="page-actions">
      <input id="pesquisa" class="search-input" placeholder="Pesquisar utente...">
      <button onclick="carregar()">Pesquisar</button>
    </div>
  </section>

  <section class="panel">
    <h2>Adicionar utente</h2>
    <form id="formUtente" class="form-grid">
      <div class="field">
        <label>Nome completo *</label>
        <input id="nome" placeholder="Ex.: João Silva" required>
      </div>

      <div class="field">
        <label>Data de nascimento *</label>
        <input type="date" id="data_nascimento" required>
      </div>

      <div class="field">
        <label>NIF *</label>
        <input id="nif" placeholder="Ex.: 123456789" required>
      </div>

      <div class="field">
        <label>Nº SNS *</label>
        <input id="nss" placeholder="Ex.: 12345678901" required>
      </div>

      <div class="field">
        <label>Sexo</label>
        <select id="sexo">
          <option value="">Selecionar...</option>
          <option value="feminino">Feminino</option>
          <option value="masculino">Masculino</option>
          <option value="outro">Outro</option>
          <option value="não indicado">Não indicado</option>
        </select>
      </div>

      <div class="field">
        <label>Telefone</label>
        <input id="telefone" placeholder="Ex.: 912345678">
      </div>

      <div class="field">
        <label>Grupo sanguíneo</label>
        <select id="grupo_sanguineo">
          <option value="">Selecionar...</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>

      <div class="field full">
        <label>Morada</label>
        <input id="morada" placeholder="Rua, nº, localidade">
      </div>

      <div class="field full">
        <label>Alergias</label>
        <textarea id="alergias" rows="3" placeholder="Ex.: Penicilina, pólen, frutos secos..."></textarea>
      </div>

      <div class="field full">
        <label>Patologias</label>
        <textarea id="patologias" rows="3" placeholder="Ex.: Diabetes, hipertensão, asma..."></textarea>
      </div>

      <button>Adicionar utente</button>
    </form>
    <p id="resultado" class="resultado"></p>
  </section>

  <section class="panel">
    <h2>Lista de utentes</h2>
    <table id="tabela"></table>
  </section>
`;

async function carregar() {
  try {
    let dados = await apiGet('/utentes');
    const q = (pesquisa.value || '').toLowerCase();

    if (q) {
      dados = dados.filter(u =>
        String(u.nome || '').toLowerCase().includes(q) ||
        String(u.nif || '').includes(q) ||
        String(u.nss || '').includes(q) ||
        String(u.telefone || '').includes(q) ||
        String(u.grupo_sanguineo || '').toLowerCase().includes(q)
      );
    }

    mostrarTabela(
      'tabela',
      ['ID','Nome','Data nascimento','NIF','Nº SNS','Telefone','Grupo sanguíneo','Alergias','Patologias'],
      [
        'id',
        'nome',
        'data_nascimento',
        'nif',
        u => valor(u.nss),
        u => valor(u.telefone),
        u => valor(u.grupo_sanguineo),
        u => valor(u.alergias),
        u => valor(u.patologias)
      ],
      dados,
      u => `<div class="table-actions"><a class="btn secondary" href="5-informacao-utente.html?id=${u.id}">Ver info</a><a class="btn secondary" href="5-historico-utentes.html?id=${u.id}">Histórico</a></div>`
    );
  } catch(e) {
    conteudo.innerHTML += mensagemErro(e);
  }
}

formUtente.onsubmit = async e => {
  e.preventDefault();

  try {
    const r = await apiPost('/utentes', {
      nome: nome.value,
      data_nascimento: data_nascimento.value,
      nif: nif.value,
      nss: nss.value,
      sexo: sexo.value,
      telefone: telefone.value,
      morada: morada.value,
      grupo_sanguineo: grupo_sanguineo.value,
      alergias: alergias.value,
      patologias: patologias.value
    });

    resultado.textContent = r.mensagem || 'Utente criado';
    formUtente.reset();
    carregar();
  } catch(err) {
    resultado.textContent = err.message;
  }
};

carregar();
