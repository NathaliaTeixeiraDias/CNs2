// Divide o texto longo do <template id="carta"> em páginas do diário, automaticamente.
// Carregue este arquivo ANTES do script.js.
(function () {
  'use strict';

  const faces = document.getElementById('faces');
  const carta = document.getElementById('carta');
  const marcador = faces && faces.content.querySelector('[data-carta]');

  // sem carta no HTML: o livro funciona do jeito antigo
  if (!carta || !marcador) return;

  const PW = 400;                                   // largura de teste (o texto escala junto com a página)
  const RATIO = { single: 1.5, double: 1 / 0.74 };  // mesma proporção usada no script.js
  const MARGEM = 0.985;                             // folga: mede com a linha um pouco mais estreita

  const cache = {};

  function fontesProntas() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const lista = Promise.all([
      document.fonts.load('40px Caveat'),
      document.fonts.load('40px "DM Serif Display"'),
      document.fonts.load('40px "Special Elite"'),
      document.fonts.load('40px minhaletra'),
      document.fonts.load('40px Kalam')
    ]).catch(() => {});
    const limite = new Promise((ok) => setTimeout(ok, 3000));   // não trava se a internet estiver lenta
    return Promise.race([lista, limite]);
  }

  function paginar(mode) {
    // palco invisível com as mesmas regras de CSS do livro
    const palco = document.createElement('div');
    palco.className = 'book no-anim';
    palco.dataset.mode = mode;
    palco.style.cssText =
      'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;' +
      '--pw:' + PW + 'px;--ph:' + Math.round(PW * RATIO[mode]) + 'px;';
    const folha = document.createElement('div');
    folha.className = 'leaf';
    palco.appendChild(folha);
    document.body.appendChild(palco);

    const paginas = [];   // artigos prontos (ou páginas inteiras vindas do HTML)
    let artigo = null;
    let conteudo = null;

    function novaPagina() {
      artigo = document.createElement('article');
      artigo.className = 'face paper right-page';
      conteudo = document.createElement('div');
      conteudo.className = 'page-content journal-content';
      artigo.appendChild(conteudo);
      // reduz um pouquinho a largura só na medição: quebra linhas mais cedo que o real
      conteudo.style.right = 'calc(var(--u) * 9 + ' + (PW * (1 - MARGEM)) + 'px)';
      folha.appendChild(artigo);
    }

    function fechar() {
      if (!artigo) return;
      if (!conteudo.childNodes.length) { folha.removeChild(artigo); artigo = conteudo = null; return; }
      conteudo.style.right = '';
      folha.removeChild(artigo);
      artigo.classList.remove('right-page');
      artigo.dataset.numerada = '1';
      paginas.push(artigo);
      artigo = conteudo = null;
    }

    function cabe() {
      const ult = conteudo.lastElementChild;
      return !ult || ult.offsetTop + ult.offsetHeight <= conteudo.clientHeight + 0.5;
    }

    function colocarBloco(no) {
      if (!artigo) novaPagina();
      conteudo.appendChild(no);
      if (cabe()) return;
      conteudo.removeChild(no);
      if (conteudo.childNodes.length) { fechar(); novaPagina(); }
      conteudo.appendChild(no);           // sozinho na página: fica, mesmo que sobre
    }

    function colocarData(modelo) {
      if (!artigo) novaPagina();
      const data = modelo.cloneNode(true);
      conteudo.appendChild(data);

      const lineHeight = parseFloat(getComputedStyle(conteudo).lineHeight);
      const espacoRestante = conteudo.clientHeight - data.offsetTop - data.offsetHeight;
      if (espacoRestante >= lineHeight * 2) return;

      conteudo.removeChild(data);
      if (conteudo.childNodes.length) fechar();
      if (!artigo) novaPagina();
      conteudo.appendChild(data);
    }

    function colocarParagrafo(modelo) {
      if (modelo.classList.contains('signature')) {
        colocarBloco(modelo.cloneNode(true));
        return;
      }

      const tokens = [];
      const texto = [];
      const walker = document.createTreeWalker(modelo, NodeFilter.SHOW_TEXT);
      let no;
      let inicioTexto = 0;
      while ((no = walker.nextNode())) {
        const indiceNo = texto.length;
        const conteudoNo = no.nodeValue || '';
        texto.push(conteudoNo);
        Array.from(conteudoNo.matchAll(/\S+/g)).forEach((palavra) => {
          tokens.push({
            no: indiceNo,
            texto: palavra[0],
            inicio: inicioTexto + palavra.index,
            fim: inicioTexto + palavra.index + palavra[0].length
          });
        });
        inicioTexto += conteudoNo.length;
      }

      const textoCompleto = texto.join('');
      if (!tokens.length) return;

      function fragmento(inicio, fim) {
        const paragrafo = modelo.cloneNode(true);
        const nos = [];
        const walker = document.createTreeWalker(paragrafo, NodeFilter.SHOW_TEXT);
        let no;
        while ((no = walker.nextNode())) nos.push(no);

        nos.forEach((noTexto, indiceNo) => {
          const selecionadas = [];
          for (let i = inicio; i < fim; i += 1) {
            if (tokens[i].no === indiceNo) selecionadas.push({ token: tokens[i], indice: i });
          }
          if (!selecionadas.length) {
            noTexto.nodeValue = '';
            return;
          }

          const primeira = selecionadas[0];
          const ultima = selecionadas[selecionadas.length - 1];
          let valor = selecionadas.map(({ token }) => token.texto).join(' ');
          if (primeira.indice > inicio) {
            const anterior = tokens[primeira.indice - 1];
            if (/\s/.test(textoCompleto.slice(anterior.fim, primeira.token.inicio))) valor = ' ' + valor;
          }
          if (ultima.indice < fim - 1) {
            const seguinte = tokens[ultima.indice + 1];
            if (/\s/.test(textoCompleto.slice(ultima.token.fim, seguinte.inicio))) valor += ' ';
          }
          noTexto.nodeValue = valor;
        });
        return paragrafo;
      }

      let total = tokens.length;
      let inicio = 0;
      while (inicio < total) {
        if (!artigo) novaPagina();

        let p = fragmento(inicio, total);
        conteudo.appendChild(p);
        if (cabe()) return;

        let lo = inicio + 1;
        let hi = total;
        while (lo < hi) {
          const meio = Math.ceil((lo + hi) / 2);
          const teste = fragmento(inicio, meio);
          p.replaceWith(teste);
          p = teste;
          if (cabe()) lo = meio; else hi = meio - 1;
        }
        let fim = lo;
        let prefixo = fragmento(inicio, fim);
        p.replaceWith(prefixo);
        p = prefixo;

        if (!cabe()) {
          conteudo.removeChild(p);
          if (conteudo.childNodes.length) {
            fechar();
            continue;
          }
          conteudo.appendChild(fragmento(inicio, inicio + 1));
          inicio += 1;
          fechar();
          continue;
        }

        if (fim < total && fim > inicio + 1) {
          const lineHeight = parseFloat(getComputedStyle(conteudo).lineHeight);
          while (fim > inicio + 1) {
            const restoPagina = fragmento(fim, total);
            conteudo.appendChild(restoPagina);
            const linhasRestantes = restoPagina.offsetHeight / lineHeight;
            conteudo.removeChild(restoPagina);
            if (linhasRestantes >= 2) break;
            fim -= 1;
          }
          if (fim !== lo) {
            p.replaceWith(fragmento(inicio, fim));
            p = conteudo.lastElementChild;
          }
        }

        if (fim < total) {
          inicio = fim;
          fechar();
          continue;
        }
        if (fim <= inicio) {
          fechar();
          continue;
        }
        return;
      }
    }

    Array.from(carta.content.children).forEach((el) => {
      if (el.classList.contains('face')) {            // página pronta (ex.: página de foto)
        fechar();
        paginas.push(el.cloneNode(true));
      } else if (el.matches('hr, .quebra')) {
        fechar();
      } else if (el.classList.contains('entry-date')) {
        colocarData(el);
      } else if (el.tagName === 'P') {
        colocarParagrafo(el);
      } else {
        colocarBloco(el.cloneNode(true));
      }
    });
    fechar();
    document.body.removeChild(palco);

    // numera só as páginas de texto, em sequência
    let n = 0;
    paginas.forEach((pg) => {
      if (!pg.dataset.numerada) return;
      n += 1;
      const num = document.createElement('span');
      num.className = 'page-number';
      num.textContent = String(n).padStart(2, '0');
      pg.appendChild(num);
    });
    return paginas;
  }

  function montar(mode) {
    const paginas = paginar(mode);
    const lista = [];
    Array.from(faces.content.children).forEach((no) => {
      if (no === marcador) paginas.forEach((p) => lista.push(p));
      else if (no.classList.contains('face')) lista.push(no);
    });
    // o total de faces precisa ser par (cada folha tem frente e verso):
    // a página em branco [data-par] só entra quando falta uma
    const total = lista.length;
    return lista.filter((f) => !(f.hasAttribute('data-par') && total % 2 === 1));
  }

  window.facesPara = function (mode) {
    // se a divisão falhou, usa as páginas que estiverem escritas direto no HTML
    if (!cache[mode]) return Array.from(faces.content.querySelectorAll('.face'));
    return cache[mode].map((f) => f.cloneNode(true));
  };

  window.cartaPronta = fontesProntas().then(() => {
    cache.single = montar('single');
    cache.double = montar('double');
  });
})();