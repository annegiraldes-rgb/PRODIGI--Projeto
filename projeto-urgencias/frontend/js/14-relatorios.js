inicializarPagina('Relatórios','GESTÃO HOSPITALAR');

    conteudo.innerHTML = `
      <section class="page-header">
        <div>
          <h2>Relatórios da Urgência</h2>
          <p>Indicadores estatísticos calculados com dados anonimizados/pseudonimizados.</p>
        </div>
        <div class="page-actions">
          <button class="secondary" onclick="mostrarPrivacidade()">Privacidade dos dados</button>
          <button onclick="carregar()">↻ Atualizar</button>
          <button onclick="exportarAnonimizado()">Exportar CSV anonimizado</button>
        </div>
      </section>

      <div class="info-box">
        🔒 <strong>Relatório anonimizado:</strong>
        esta página usa dados sem nome, NIF, Nº SNS, telefone ou morada. Os utentes são representados por códigos técnicos pseudonimizados.
      </div>

      <div class="report-toolbar">
        <label>Fonte dos dados</label>
        <select disabled><option>Dados anonimizados</option></select>
        <label>Finalidade</label>
        <select disabled><option>Relatórios / estatística / treino de modelos</option></select>
      </div>

      <div class="kpi-report">
        <div class="card"><div class="mini-icon">👤</div><div><h3>Total de utentes</h3><div class="number" id="rUtentes">0</div><div class="mini-change">Sem identificadores diretos</div></div></div>
        <div class="card"><div class="mini-icon">📄</div><div><h3>Total de episódios</h3><div class="number" id="rEpisodios">0</div><div class="mini-change">Pseudonimizados</div></div></div>
        <div class="card"><div class="mini-icon">🩺</div><div><h3>Consultas realizadas</h3><div class="number" id="rConsultas">0</div><div class="mini-change">Agregado</div></div></div>
        <div class="card"><div class="mini-icon">🧪</div><div><h3>Exames realizados</h3><div class="number" id="rExames">0</div><div class="mini-change">Agregado</div></div></div>
        <div class="card"><div class="mini-icon">💊</div><div><h3>Prescrições</h3><div class="number" id="rPresc">0</div><div class="mini-change">Agregado</div></div></div>
        <div class="card"><div class="mini-icon">🛏</div><div><h3>Internamentos</h3><div class="number" id="rInternamentos">0</div><div class="mini-change">Agregado</div></div></div>
      </div>

      <div class="grid-3">
        <section class="panel">
          <h3>Extração anonimizada por dia</h3>
          <table id="tabelaDias"></table>
        </section>

        <section class="panel">
          <h3>Distribuição por faixa etária</h3>
          <table id="tabelaIdades"></table>
        </section>

        <section class="panel">
          <h3>Distribuição por prioridade</h3>
          <table id="tabelaPrioridades"></table>
        </section>

        <section class="panel">
          <h3>Amostra de utentes pseudonimizados</h3>
          <p class="muted">Usado apenas para análise. Não contém nome, NIF, SNS, telefone ou morada.</p>
          <table id="tabelaUtentesAnon"></table>
        </section>

        <section class="panel">
          <h3>Amostra de episódios pseudonimizados</h3>
          <p class="muted">Os códigos técnicos permitem análise sem expor a identidade real do utente.</p>
          <table id="tabelaEpisodiosAnon"></table>
        </section>

        <section class="panel">
          <h3>Medidas de privacidade aplicadas</h3>
          <div id="medidasPrivacidade">
            <p>🔒 A carregar medidas...</p>
          </div>
        </section>
      </div>
    `;

    let cacheUtentesAnon = [];
    let cacheEpisodiosAnon = [];

    function codigoCurto(codigo) {
      if (!codigo) return '—';
      return String(codigo).slice(0, 10) + '...';
    }

    function dataCurta(v) {
      if (!v) return '—';
      return String(v).slice(0, 10);
    }

    function normalizarPrioridade(p) {
      return prioridadeNome(p || 'Sem triagem');
    }

    async function carregar() {
      try {
        const analitica = await apiGet('/analitica_anonimizada');
        cacheUtentesAnon = await apiGet('/utentes_anonimizados');
        cacheEpisodiosAnon = await apiGet('/episodios_anonimizados');

        const totais = analitica.totais || {};
        rUtentes.textContent = totais.utentes || 0;
        rEpisodios.textContent = totais.episodios || 0;
        rConsultas.textContent = totais.consultas || 0;
        rExames.textContent = totais.exames || 0;
        rPresc.textContent = totais.prescricoes || 0;
        rInternamentos.textContent = totais.internamentos || 0;

        mostrarTabela(
          'tabelaDias',
          ['Data', 'Utentes', 'Episódios', 'Consultas', 'Exames'],
          [d => dataCurta(d.data), 'utentes', 'episodios', 'consultas', 'exames'],
          analitica.por_dia || []
        );

        mostrarTabela(
          'tabelaIdades',
          ['Faixa etária', 'Total'],
          ['faixa_etaria', 'total'],
          analitica.por_faixa_etaria || []
        );

        mostrarTabela(
          'tabelaPrioridades',
          ['Prioridade', 'Total'],
          [p => `<span class="badge ${prioridadeClasse(p.prioridade)}">${normalizarPrioridade(p.prioridade)}</span>`, 'total'],
          analitica.por_prioridade || []
        );

        mostrarTabela(
          'tabelaUtentesAnon',
          ['Código utente', 'Idade', 'Faixa', 'Sexo', 'Grupo sangue'],
          [u => codigoCurto(u.codigo_utente), 'idade', 'faixa_etaria', 'sexo', 'grupo_sanguineo'],
          cacheUtentesAnon.slice(0, 8)
        );

        mostrarTabela(
          'tabelaEpisodiosAnon',
          ['Código episódio', 'Código utente', 'Estado', 'Prioridade', 'Data'],
          [e => codigoCurto(e.codigo_episodio), e => codigoCurto(e.codigo_utente), 'estado', e => normalizarPrioridade(e.prioridade), e => dataCurta(e.data_entrada)],
          cacheEpisodiosAnon.slice(0, 8)
        );

        const priv = analitica.privacidade || {};
        medidasPrivacidade.innerHTML = `
          <p><strong>Método:</strong> ${valor(priv.metodo)}</p>
          <p><strong>Finalidade:</strong> ${valor(priv.finalidade)}</p>
          <p><strong>Campos removidos:</strong></p>
          <ul>${(priv.campos_removidos || []).map(c => `<li>${c}</li>`).join('')}</ul>
          <p>✅ A análise é feita com dados minimizados e sem exposição direta da identidade dos utentes.</p>
        `;
      } catch (e) {
        conteudo.innerHTML += mensagemErro(e);
      }
    }

    function mostrarPrivacidade() {
      alert('Esta página usa endpoints anonimizados: /utentes_anonimizados, /episodios_anonimizados e /analitica_anonimizada. Identificadores como nome, NIF, Nº SNS, telefone e morada não são enviados para os relatórios.');
    }

    function exportarAnonimizado() {
      const linhas = [
        ['tipo', 'codigo', 'idade_ou_estado', 'faixa_ou_prioridade', 'data'],
        ...cacheUtentesAnon.map(u => ['utente', u.codigo_utente, u.idade, u.faixa_etaria, u.data_registo]),
        ...cacheEpisodiosAnon.map(e => ['episodio', e.codigo_episodio, e.estado, e.prioridade, e.data_entrada])
      ];

      const csv = linhas.map(l => l.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio_anonimizado.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    carregar();
