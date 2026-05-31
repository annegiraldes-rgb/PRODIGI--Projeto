protegerPagina();
  filtrarMenu();

  const utilizador = obterUtilizador();

  if (utilizador) {
    document.getElementById("nomeUtilizador").textContent = utilizador.nome;
    document.getElementById("perfilUtilizador").textContent = utilizador.perfil;
  }

  function toggleMenu() {
    const menu = document.getElementById("userMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }

  window.addEventListener("click", function(e) {
    const user = document.querySelector(".topbar-user");
    const menu = document.getElementById("userMenu");

    if (user && menu && !user.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  function normalizarPrioridade(p) {
    const valor = (p || "Sem prioridade").toLowerCase();

    if (valor.includes("vermelho")) return "Vermelho";
    if (valor.includes("laranja")) return "Laranja";
    if (valor.includes("amarelo")) return "Amarelo";
    if (valor.includes("verde")) return "Verde";
    if (valor.includes("azul")) return "Azul";

    return "Sem prioridade";
  }

  function dotClass(prioridade) {
    const p = prioridade.toLowerCase();

    if (p.includes("vermelho")) return "vermelho";
    if (p.includes("laranja")) return "laranja";
    if (p.includes("amarelo")) return "amarelo";
    if (p.includes("verde")) return "verde";
    if (p.includes("azul")) return "azul";

    return "cinzento";
  }

  function contarPorPrioridade(triagens) {
    const contagem = {
      "Vermelho":0,
      "Laranja": 0,
      "Amarelo": 0,
      "Verde":   0,
      "Azul":    0
    };

    triagens.forEach(t => {
      const prioridade = normalizarPrioridade(t.prioridade);
      if (contagem[prioridade] !== undefined) {
        contagem[prioridade]++;
      }
    });

    return contagem;
  }

  function preencherTriagem(contagem) {
    const total = Object.values(contagem).reduce((a, b) => a + b, 0);
    const lista = document.getElementById("listaTriagem");

    lista.innerHTML = "";

    Object.entries(contagem).forEach(([prioridade, quantidade]) => {
      const percentagem = total > 0 ? Math.round((quantidade / total) * 100) : 0;

      lista.innerHTML += `
        <li>
          <span><i class="dot ${dotClass(prioridade)}"></i> ${prioridade}</span>
          <strong>${quantidade} (${percentagem}%)</strong>
        </li>
      `;
    });

    lista.innerHTML += `<li><strong>Total: ${total}</strong></li>`;
  }

  function preencherPrioridades(contagem) {
    const lista = document.getElementById("listaPrioridades");
    lista.innerHTML = "";

    let total = 0;

    Object.entries(contagem).forEach(([prioridade, quantidade]) => {
      total += quantidade;

      lista.innerHTML += `
        <li>
          <span><i class="dot ${dotClass(prioridade)}"></i> ${prioridade}</span>
          <strong>${quantidade}</strong>
        </li>
      `;
    });

    lista.innerHTML += `
      <li class="total-row">
        <span>Total</span>
        <strong>${total}</strong>
      </li>
    `;
  }

  function preencherUltimosEpisodios(episodios, triagens) {
    const tbody = document.getElementById("ultimosEpisodios");

    const ultimos = episodios.slice(-5).reverse();

    if (ultimos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Sem episódios registados.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    ultimos.forEach(e => {
      const triagem = triagens.find(t => Number(t.episodio_urgencia_id) === Number(e.id));
      const prioridade = triagem ? normalizarPrioridade(triagem.prioridade) : "—";

      tbody.innerHTML += `
        <tr>
          <td>EPI${String(e.id).padStart(8, "0")}</td>
          <td>${e.utente || "—"}</td>
          <td><i class="dot ${dotClass(prioridade)}"></i> ${prioridade}</td>
          <td>${hora(e.data_entrada)}</td>
        </tr>
      `;
    });
  }

  function preencherAlertas(contagem, episodios) {
    const caixa = document.getElementById("alertasPainel");
    caixa.innerHTML = "";

    if (contagem["Vermelho"] > 0) {
      caixa.innerHTML += `
        <div class="alert-box danger">
          ⚠️
          <div>
            <strong>${contagem["Vermelho"]} utente(s) com prioridade Vermelha</strong>
            <br>Aguardam atendimento imediato.
          </div>
        </div>
      `;
    }

    const abertos = episodios.filter(e => e.estado && e.estado.toLowerCase() !== "encerrado");

    if (abertos.length > 0) {
      caixa.innerHTML += `
        <div class="alert-box warning">
          🕒
          <div>
            <strong>${abertos.length} episódio(s) em aberto</strong>
            <br>Aguardam seguimento clínico.
          </div>
        </div>
      `;
    }

    caixa.innerHTML += `
      <div class="alert-box info">
        ℹ️
        <div>
          <strong>Atualização de protocolos</strong>
          <br>Novo protocolo de urgência disponível.
        </div>
      </div>
    `;
  }

  async function carregarHospitais() {
    await carregarSeletorHospital(false);
    const select = document.getElementById("hospitalSelect");
    if (select) {
      select.onchange = () => {
        guardarHospitalAtivo(select.value, select.selectedOptions[0]?.textContent || "");
        carregarPainel();
      };
    }
  }

  async function carregarPainel() {
    try {
      const utentes = await apiGet("/utentes");
      const episodios = filtrarHospital(await apiGet("/episodios"));
      const triagens = filtrarHospital(await apiGet("/triagens"));
      const atos = filtrarHospital(await apiGet("/atos"));
      const internamentos = filtrarHospital(await apiGet("/internamentos"));

      const consultas = atos.filter(a =>
        a.tipo && a.tipo.toLowerCase().includes("consulta")
      );

      const encerrados = episodios.filter(e =>
        e.estado && e.estado.toLowerCase() === "encerrado"
      );

      const aguardamConsulta = episodios.filter(e =>
        e.estado &&
        (
          e.estado.toLowerCase().includes("aguardar") ||
          e.estado.toLowerCase().includes("consulta")
        )
      );

      document.getElementById("kpiUtentes").textContent = new Set(episodios.map(e => e.utente_id).filter(Boolean)).size;
      document.getElementById("kpiConsultas").textContent = consultas.length;
      document.getElementById("kpiAguardamConsulta").textContent = aguardamConsulta.length;
      document.getElementById("kpiEmergencias").textContent = episodios.length;
      document.getElementById("kpiInternamentos").textContent = internamentos.length;
      document.getElementById("kpiEncerrados").textContent = encerrados.length;

      const contagem = contarPorPrioridade(triagens);

      preencherTriagem(contagem);
      preencherPrioridades(contagem);
      preencherUltimosEpisodios(episodios, triagens);
      preencherAlertas(contagem, episodios);

      const agora = new Date();
      document.getElementById("ultimaAtualizacao").textContent =
        "🕒 Última atualização: " + agora.toLocaleString("pt-PT");

    } catch (erro) {
      console.error("Erro ao carregar painel:", erro);
    }
  }

  carregarHospitais();
  carregarPainel();
