// ---------------------------------------------------------
// 1) A "senha certa" fica guardada aqui.
//    Troque pelo que quiser: uma palavra, uma data, um apelido...
// ---------------------------------------------------------
const SENHA_CORRETA = "nathalia";

// ---------------------------------------------------------
// 2) Pegamos os elementos do HTML que vamos usar.
//    getElementById busca, no documento, o elemento que tem
//    aquele "id" (o mesmo id que você viu no index.html).
// ---------------------------------------------------------
const formulario = document.getElementById("form-senha");
const campoSenha = document.getElementById("campo-senha");
const mensagemErro = document.getElementById("mensagem-erro");
const cadeado = document.getElementById("cadeado");
const alca = document.getElementById("alca");

// ---------------------------------------------------------
// 3) addEventListener "escuta" um evento e roda uma função
//    quando ele acontece. Aqui, escutamos o evento "submit"
//    do formulário — ou seja, quando alguém aperta o botão
//    (ou dá Enter) para enviá-lo.
// ---------------------------------------------------------
formulario.addEventListener("submit", function (evento) {

  // Por padrão, um <form> recarrega a página ao ser enviado.
  // preventDefault() cancela esse comportamento, porque aqui
  // queremos decidir na mão o que acontece.
  evento.preventDefault();

  // .value pega o texto que a pessoa digitou no campo.
  // .trim() remove espaços em branco acidentais no início/fim.
  // .toLowerCase() deixa tudo minúsculo, para "Amor" e "amor"
  // contarem como a mesma resposta.
  const valorDigitado = campoSenha.value.trim().toLowerCase();

  if (valorDigitado === SENHA_CORRETA.toLowerCase()) {

    // Se acertou: escondemos o formulário e "destrancamos" o cadeado.
    formulario.hidden = true;
    mensagemErro.textContent = "O portal reconhece você...";
    mensagemErro.style.color = "var(--roxo-claro)";

    // a classe "aberta" na alça faz ela girar (definido no CSS
    // com transition + transform: rotate). a classe "aberto" no
    // cadeado inteiro dispara o brilho de uma vez só.
    alca.classList.add("aberta");
    cadeado.classList.add("aberto");

    // Só troca de página depois que a animação de abrir termina
    // (a transition da alça dura 1s — aqui damos uma folga de 1.3s).
    setTimeout(function () {
      window.location.href = "pagina2.html";
    }, 1300);

  } else {

    // Se errou: mostra uma mensagem e faz o campo "tremer".
    mensagemErro.textContent = "O selo não reconhece essa palavra...";
    campoSenha.classList.add("errado");
    campoSenha.value = "";

    // setTimeout espera um tempo (em milissegundos) antes de
    // rodar o que está dentro dele. Aqui, depois de 400ms,
    // removemos a classe "errado" para o tremor poder
    // acontecer de novo na próxima tentativa.
    setTimeout(function () {
      campoSenha.classList.remove("errado");
    }, 400);
  }
});