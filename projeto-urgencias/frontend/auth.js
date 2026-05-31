const permissoes = {
  administrativo: [
    "2-painel.html",
    "3-tempo-espera.html",
    "4-utentes.html",
    "5-informacao-utente.html",
    "6-admissao.html"
  ],

  enfermeiro: [
    "2-painel.html",
    "3-tempo-espera.html",
    "5-informacao-utente.html",
    "5-historico-utentes.html",
    "7-aguardar-triagem.html",
    "8-triagem.html",
    "11-exames.html",
    "12-prescricoes.html",
    "13-internamentos.html"
  ],

  medico: [
    "2-painel.html",
    "3-tempo-espera.html",
    "5-informacao-utente.html",
    "5-historico-utentes.html",
    "9-consultas.html",
    "10-consulta.html",
    "11-exames.html",
    "12-prescricoes.html",
    "13-internamentos.html"
  ],

  admin: "ALL"
};

function todasAsPaginasPermitidas() {
  return [
    "2-painel.html",
    "3-tempo-espera.html",
    "4-utentes.html",
    "5-informacao-utente.html",
    "5-historico-utentes.html",
    "6-admissao.html",
    "7-aguardar-triagem.html",
    "8-triagem.html",
    "9-consultas.html",
    "10-consulta.html",
    "11-exames.html",
    "12-prescricoes.html",
    "13-internamentos.html",
    "14-relatorios.html",
    "15-profissionais.html",
    "16-hospitais.html"
  ];
}

function paginasPermitidasDoUtilizador() {
  const u = JSON.parse(localStorage.getItem("utilizador"));

  if (!u) return [];
  if (u.perfil === "admin" || permissoes[u.perfil] === "ALL") {
    return todasAsPaginasPermitidas();
  }

  return permissoes[u.perfil] || [];
}

function aplicarPermissoesMenu() {
  filtrarMenu();
}

function obterNomePerfil(perfil) {
  const nomes = {
    administrativo: "Administrativo",
    enfermeiro: "Enfermeiro",
    medico: "Médico",
    admin: "Administrador"
  };

  return nomes[perfil] || perfil || "Perfil";
}


function protegerPagina() {
  const u = JSON.parse(localStorage.getItem("utilizador"));

  if (!u) {
    window.location.href = "1-login.html";
    return;
  }

  if (u.perfil === "admin" || permissoes[u.perfil] === "ALL") return;

  const pagina = window.location.pathname.split("/").pop();
  const permitidas = permissoes[u.perfil] || [];

  if (!permitidas.includes(pagina)) {
    alert("Sem permissão");
    window.location.href = "2-painel.html";
  }
}

function filtrarMenu() {
  const u = JSON.parse(localStorage.getItem("utilizador"));
  if (!u) return;

  if (u.perfil === "admin" || permissoes[u.perfil] === "ALL") return;

  const permitidas = permissoes[u.perfil] || [];

  document.querySelectorAll(".sidebar a").forEach(link => {
    const href = link.getAttribute("href");

    if (!permitidas.includes(href)) {
      link.style.display = "none";
    }
  });
}

function terminarSessao() {
  localStorage.removeItem("utilizador");
  window.location.href = "1-login.html";
}

function obterUtilizador() {
  return JSON.parse(localStorage.getItem("utilizador"));
}

async function fazerLogin(event) {
  event.preventDefault();

  const erro = document.getElementById("loginErro");
  const btn = document.querySelector("#loginForm button[type='submit']");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (erro) erro.textContent = "";

  if (!username || !password) {
    if (erro) erro.textContent = "Preenche o utilizador e a palavra-passe.";
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "A iniciar sessão...";
    }

    const resposta = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados.erro || dados.mensagem || `Login falhou (${resposta.status})`);
    }

    localStorage.setItem("utilizador", JSON.stringify(dados));
    window.location.href = "2-painel.html";
  } catch (e) {
    console.error("Erro no login:", e);
    if (erro) erro.textContent = e.message || "Não foi possível iniciar sessão.";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Iniciar sessão";
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", fazerLogin);
  }
});
