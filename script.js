const SEGUNDO_DO_TIRO = 3.5; // ajuste aqui se o tempo exato mudar
const SEGUNDO_DA_FOTO = 3.5; // ajuste aqui pro momento que a foto deve aparecer

const video = document.getElementById("video-fundo");
const flash = document.getElementById("flash");
const main = document.querySelector("main");
const fotoFundo = document.getElementById("foto-fundo");

let fotoRevelada = false;

let jaRevelado = false;


video.addEventListener("timeupdate", () => {

  // --- o tiro, que revela a página de entrada ---
  if (!jaRevelado && video.currentTime >= SEGUNDO_DO_TIRO) {
    jaRevelado = true;

    flash.classList.add("disparo");

    // espera o clarão ficar no auge antes de revelar o conteúdo,
    // pra dar a impressão de que o tiro "iluminou" a página de entrada
    setTimeout(() => {
      main.classList.add("revelado");
    }, 180);
  }

  // --- a foto, que aparece por cima do vídeo num segundo escolhido ---
  if (!fotoRevelada && video.currentTime >= SEGUNDO_DA_FOTO) {
    fotoRevelada = true;
    fotoFundo.classList.add("visivel");
  }
});

// ---------- revelar o campo de senha, sem sair da página ----------
const btnEntrar = document.getElementById("btn-entrar");
const formSenha = document.getElementById("form-senha");

btnEntrar.addEventListener("click", () => {
  btnEntrar.classList.add("escondido");
  formSenha.hidden = false;
  requestAnimationFrame(() => formSenha.classList.add("visivel"));
});

// ---------- logins e senhas aceitos ----------
// Pode colocar quantos quiser em cada lista.
// Maiúsculas, espaços nas pontas e acentos são ignorados.
const LOGINS_CORRETOS = ["Carlos Eduardo", "carlos eduardo", "cadu", "Cadu"];
const SENHAS_CORRETAS = ["25", "vinte e cinco", "25 anos"];

const campoLogin = document.getElementById("campo-login");

// tira acentos, espaços das pontas e maiúsculas
const limpar = (texto) =>
  texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

formSenha.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const login = limpar(campoLogin.value);
  const senha = limpar(campoSenha.value);

  const loginOk = LOGINS_CORRETOS.some((l) => limpar(l) === login);
  const senhaOk = SENHAS_CORRETAS.some((s) => limpar(s) === senha);

  if (loginOk && senhaOk) {
    window.location.href = "pag02.html";
  } else {
    campoSenha.value = "";
    campoSenha.placeholder = "Tente de novo...";
  }
});

// ---------- mostrar/esconder a senha digitada ----------
const campoSenha = document.getElementById("campo-senha");
const botaoOlho = document.getElementById("botao-olho");

botaoOlho.addEventListener("click", () => {
  const escondida = campoSenha.type === "password";

 
  campoSenha.type = escondida ? "text" : "password";
  botaoOlho.textContent = escondida ? "🙈" : "👁";
  botaoOlho.setAttribute("aria-label", escondida ? "Esconder senha" : "Mostrar senha");
});