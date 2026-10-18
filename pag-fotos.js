(function () {
  'use strict';

  // carrega a fonte do "RASPE AQUI" desde o início, antes de ser desenhada
if (document.fonts && document.fonts.load) document.fonts.load('20px Rye');

  
  const PROXIMA_PAGINA = 'pag04.html';

  const FOTOS = [
    { src: 'imagens/Miss-im.jpg', legenda: 'Eu todos os dias pensando em você longe de mim.' },
    { frase: 'Você é a resposta mais linda das minhas orações.', legenda: 'Verso opcional: pode deixar vazio.' },
    { frase: 'Você é o meu valentine', legenda: 'Verso opcional: pode deixar vazio.' },
    { src: 'imagens/pink.jpg', legenda: 'E é verdade, viu?' },
    { src: 'fontes/catred.jpg', legenda: 'Passa seu coração, gatinho.' },
    { frase: 'Seus olhos são tão lindos como noites estreladas.', legenda: 'Verso opcional: pode deixar vazio.' }
  ];

  // Velocidade dos alvos, em pixels por segundo: 
  
  const VELOCIDADE = [240,310];

  // Palavrinhas que sobem depois de cada tiro

  const ACERTOS = ['BANG!', 'Na mosca!', 'Boa, cowboy!', 'Mira de ouro!'];
  const ERROS = ['Errou!', 'Quase!', 'Ops!'];

  /* ========================================================== */

  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sortear = (arr) => arr[(Math.random() * arr.length) | 0];

  const cena = $('#cena');
  const galeria = $('#galeria');
  const mesa = $('#mesa');
  const flash = $('#flash');
  const contador = $('#contador');
  const botaoContinuar = $('#continuar');
  const sub = $('#sub');
  const dica = $('#dica');

  const N = FOTOS.length;
  const alvos = [];
  let abatidos = 0;
  let revelados = 0;
  let zTopo = 10;
  let slots = null;

  botaoContinuar.href = PROXIMA_PAGINA;

  /* ---------- brasas de fundo ---------- */
  const cv = $('#brasas');
  const cx = cv.getContext('2d');
  const CORES = ['#ffd75e', '#ffffff', '#ff3b30', '#ffb02e', '#ff6a3d'];
  let W = 0, H = 0, brasas = [];

  function novaBrasa(aleatoria) {
    return {
      x: rand(0, W),
      y: aleatoria ? rand(0, H) : H + 10,
      s: rand(1, 2.6),
      v: rand(6, 26),
      a: rand(0.3, 1),
      f: rand(0, 6.28),
      c: sortear(CORES)
    };
  }

  function ajustarBrasas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(160, (W * H) / 9000));
    while (brasas.length < n) brasas.push(novaBrasa(true));
    brasas.length = n;
  }

  /* ---------- alvos ---------- */
  function criarAlvos() {
    FOTOS.forEach((f, i) => {
      const el = document.createElement('div');
      el.className = 'alvo';
      el.innerHTML = '<span class="fio"></span>' +
        '<div class="alvo-corpo" role="button" tabindex="0" aria-label="Alvo ' + (i + 1) + '"></div>';
      galeria.appendChild(el);

      const corpo = el.querySelector('.alvo-corpo');
      const tam = corpo.offsetWidth;
      const livre = Math.max(10, galeria.clientHeight - tam - 14);
      el.style.setProperty('--fio', rand(6, livre) + 'px');

      const gw = galeria.clientWidth;
      const a = {
        el, corpo, i, tam,
        x: ((i + rand(0.1, 0.9)) / N) * (gw + tam) - tam,
        v: rand(VELOCIDADE[0], VELOCIDADE[1]) * (i % 2 ? 1 : -1) * (gw < 720 ? 0.8 : 1),
        abatido: false
      };
      el.style.transform = 'translate3d(' + a.x + 'px,0,0)';
      alvos.push(a);

      corpo.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !a.abatido) {
          e.preventDefault();
          const r = corpo.getBoundingClientRect();
          acertar(a, r.left + r.width / 2, r.top + r.height / 2);
        }
      });
    });
    atualizarContador();
  }

  function atualizarContador() {
    contador.textContent = 'Alvos: ' + abatidos + ' / ' + N;
  }

  /* ---------- tiro ---------- */
  galeria.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const corpo = e.target.closest('.alvo-corpo');
    const a = corpo && alvos.find((x) => x.corpo === corpo);
    if (a && !a.abatido) acertar(a, e.clientX, e.clientY);
    else errar(e.clientX, e.clientY);
  });

  function clarao(x, y, forte) {
    flash.style.setProperty('--fx', x + 'px');
    flash.style.setProperty('--fy', y + 'px');
    flash.className = '';
    void flash.offsetWidth;
    flash.className = forte ? 'disparo' : 'fraco';
  }

  function tremor() {
    cena.classList.remove('tremor');
    void cena.offsetWidth;
    cena.classList.add('tremor');
  }

  function estouro(texto, x, y) {
    const s = document.createElement('span');
    s.className = 'estouro';
    s.textContent = texto;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    cena.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }

  function errar(x, y) {
    clarao(x, y, false);
    estouro(sortear(ERROS), x, y);
  }

  function acertar(a, x, y) {
    a.abatido = true;
    a.el.classList.add('abatido');

    const r = a.corpo.getBoundingClientRect();
    const furo = document.createElement('span');
    furo.className = 'furo';
    furo.style.left = ((x - r.left) / r.width) * 100 + '%';
    furo.style.top = ((y - r.top) / r.height) * 100 + '%';
    a.corpo.appendChild(furo);

    clarao(x, y, true);
    tremor();
    estouro(sortear(ACERTOS), x, y);

    abatidos++;
    atualizarContador();
    lancarPolaroid(a, r);

    setTimeout(() => a.el.remove(), 950);

    if (abatidos === N) {
      if (sub) sub.textContent = 'Todos os alvos abatidos. Agora raspe tudo!';
      contador.hidden = true;
    }
  }

  /* ---------- mesa: posições onde as polaroids caem ---------- */
  function medirPw() {
    const p = document.createElement('div');
    p.style.cssText = 'position:absolute;visibility:hidden;width:var(--pw)';
    mesa.appendChild(p);
    const w = p.offsetWidth;
    p.remove();
    return w;
  }

  function calcularSlots() {
    const pw = medirPw();
    const ph = pw * 1.24;
    const mw = mesa.clientWidth;
    const mh = mesa.clientHeight;
    let cols = Math.max(2, Math.min(N, Math.floor(mw / (pw * 0.9))));
    // com espaço sobrando na vertical, espalha em pelo menos 2 fileiras
    if (N >= 4 && mh >= ph * 1.7) cols = Math.min(cols, Math.ceil(N / 2));
    const rows = Math.ceil(N / cols);
    const cw = mw / cols;
    const livreV = Math.max(0, mh - ph - 22);
    const lista = [];

    for (let k = 0; k < N; k++) {
      const c = k % cols;
      const r = Math.floor(k / cols);
      let left = (c + 0.5) * cw - pw / 2 + rand(-cw * 0.1, cw * 0.1);
      let top = rows === 1 ? livreV / 2 : 8 + r * (livreV / (rows - 1)) + rand(-8, 8);
      left = clamp(left, 4, mw - pw - 4);
      top = clamp(top, 4, Math.max(4, mh - ph - 16));
      lista.push({ left, top });
    }

    for (let i = lista.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  /* ---------- polaroid ---------- */
  function placeholder(i) {
    const cores = [['#5b2a1a', '#c98b4a'], ['#1d3a2f', '#7fb08c'], ['#40213a', '#c27ba0'], ['#1f2f4a', '#7fa3d6']];
    const par = cores[i % 4];
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + par[0] + "'/><stop offset='1' stop-color='" + par[1] + "'/></linearGradient></defs>" +
      "<rect width='200' height='200' fill='url(#g)'/>" +
      "<text x='100' y='108' font-family='Georgia,serif' font-size='26' fill='rgba(255,255,255,.85)' text-anchor='middle'>FOTO " + (i + 1) + "</text></svg>";
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function lancarPolaroid(a, rectAlvo) {
    if (!slots) slots = calcularSlots();
    const slot = slots[abatidos - 1] || { left: 10, top: 10 };
    const f = FOTOS[a.i];

    const p = document.createElement('div');
    p.className = 'polaroid';
    p.innerHTML =
      '<div class="giro">' +
        '<div class="face frente">' +
          '<div class="foto"><img alt="" draggable="false"><canvas class="raspa"></canvas></div>' +
          '<div class="rotulo">raspe aqui</div>' +
        '</div>' +
        '<div class="face verso"><p></p><span class="ast">ˋˏ♡ˎˊ</span></div>' +
      '</div>';

    const img = p.querySelector('img');
    if (f.frase) {
      p.classList.add('so-frase');   // frase não vira
      // cartão de couro com a frase, em vez de foto
      const cartao = document.createElement('div');
      cartao.className = 'frase';
      const texto = document.createElement('p');
      texto.textContent = f.frase;
      const n = f.frase.length;
      cartao.style.setProperty('--fs', n < 30 ? 0.17 : n < 55 ? 0.13 : n < 80 ? 0.11 : 0.095);
      cartao.appendChild(texto);
      img.replaceWith(cartao);
    } else {
      img.alt = f.alt || 'Foto ' + (a.i + 1);
      img.onerror = () => { img.onerror = null; img.src = placeholder(a.i); };
      img.src = f.src;
    }
    p.querySelector('.verso p').textContent = f.legenda || '';

    // começa no lugar do alvo, pequenininha, girando
    const mr = mesa.getBoundingClientRect();
    const pw = medirPw();
    const ph = pw * 1.24;
    p.style.setProperty('--rot', rand(-9, 9) + 'deg');
    p.style.setProperty('--spin', '300deg');
    p.style.setProperty('--s', '0.25');
    p.style.left = rectAlvo.left + rectAlvo.width / 2 - mr.left - pw / 2 + 'px';
    p.style.top = rectAlvo.top + rectAlvo.height / 2 - mr.top - ph / 2 + 'px';
    p.style.opacity = '0';
    p.style.zIndex = ++zTopo;
    mesa.appendChild(p);

    iniciarRaspa(p, p.querySelector('canvas'));
    ativarArrasto(p, pw, ph);

    void p.offsetWidth;
    p.classList.add('voando');
    p.style.left = slot.left + 'px';
    p.style.top = slot.top + 'px';
    p.style.setProperty('--spin', '0deg');
    p.style.setProperty('--s', '1');
    p.style.opacity = '1';

    setTimeout(() => p.classList.remove('voando'), 1000);

    if (dica && dica.hidden) dica.hidden = false;
  }

  /* ---------- raspadinha ---------- */
  function iniciarRaspa(p, canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.scale(dpr, dpr);

    // película dourada
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#9c7326');
    g.addColorStop(0.3, '#f1d58a');
    g.addColorStop(0.5, '#b98d36');
    g.addColorStop(0.75, '#f6e3a6');
    g.addColorStop(1, '#8d6620');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    for (let k = 0; k < (w * h) / 60; k++) {
      c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(70,45,10,.16)';
      c.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
    }

    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(-Math.PI / 9);
    c.fillStyle = 'rgba(70,45,10,.55)';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'bold ' + w * 0.17 + 'px Rye, serif';
    c.fillText('RASPE', 0, -h * 0.07);
    c.font = w * 0.09 + 'px Rye, serif';
    c.fillText('AQUI', 0, h * 0.1);
    c.restore();

    let apertado = false;
    let ultimo = null;
    let ultimaChecagem = 0;
    let pronto = false;

    function riscar(a, b) {
      const lw = w * 0.17;
      c.globalCompositeOperation = 'destination-out';
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
      c.beginPath();
      c.arc(b.x, b.y, lw / 2, 0, Math.PI * 2);
      c.fill();
    }

    function checar() {
      if (pronto) return;
      const d = c.getImageData(0, 0, canvas.width, canvas.height).data;
      let vazio = 0;
      let total = 0;
      for (let i = 3; i < d.length; i += 4 * 37) {
        total++;
        if (d[i] < 40) vazio++;
      }
      if (vazio / total > 0.5) {
        pronto = true;
        canvas.classList.add('limpo');
        p.classList.add('revelada');
        p.querySelector('.rotulo').textContent = p.classList.contains('so-frase') ? '˗ˋˏ♡ˎˊ˗' : 'toque para virar';
        revelados++;
        if (revelados === N) {
          if (sub) sub.textContent = 'Só lembrança boa. Pode seguir, cowboy.';
          botaoContinuar.hidden = false;   // só aparece depois de raspar tudo
        }
      }
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (pronto) return;
      e.stopPropagation();
      canvas.setPointerCapture(e.pointerId);
      apertado = true;
      ultimo = { x: e.offsetX, y: e.offsetY };
      riscar(ultimo, ultimo);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!apertado) return;
      const n = { x: e.offsetX, y: e.offsetY };
      riscar(ultimo, n);
      ultimo = n;
      const t = performance.now();
      if (t - ultimaChecagem > 120) {
        ultimaChecagem = t;
        checar();
      }
    });

    const fim = () => {
      if (apertado) {
        apertado = false;
        checar();
      }
    };
    canvas.addEventListener('pointerup', fim);
    canvas.addEventListener('pointercancel', fim);
  }

  /* ---------- arrastar e virar ---------- */
  function ativarArrasto(p, pw, ph) {
    let arrasto = null;

    p.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || p.classList.contains('voando')) return;
      p.setPointerCapture(e.pointerId);
      arrasto = { sx: e.clientX, sy: e.clientY, l: p.offsetLeft, t: p.offsetTop, moveu: false };
      p.style.zIndex = ++zTopo;
    });

    p.addEventListener('pointermove', (e) => {
      if (!arrasto) return;
      const dx = e.clientX - arrasto.sx;
      const dy = e.clientY - arrasto.sy;
      if (!arrasto.moveu && Math.hypot(dx, dy) < 6) return;
      if (!arrasto.moveu) {
        arrasto.moveu = true;
        p.classList.add('arrastando');
      }
      const mw = mesa.clientWidth;
      const mh = mesa.clientHeight;
      p.style.left = clamp(arrasto.l + dx, -pw * 0.2, mw - pw * 0.8) + 'px';
      p.style.top = clamp(arrasto.t + dy, 0, mh - ph * 0.7) + 'px';
    });

    const soltar = () => {
      if (!arrasto) return;
      if (!arrasto.moveu && p.classList.contains('revelada') && !p.classList.contains('so-frase')) {
        p.classList.toggle('virada');
      }
      p.classList.remove('arrastando');
      arrasto = null;
    };
    p.addEventListener('pointerup', soltar);
    p.addEventListener('pointercancel', () => {
      p.classList.remove('arrastando');
      arrasto = null;
    });
  }

  /* ---------- loop de animação (alvos + brasas) ---------- */
  let t0 = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - t0) / 1000);
    t0 = t;

    const gw = galeria.clientWidth;
    alvos.forEach((a) => {
      if (a.abatido) return;
      a.x += a.v * dt;
      if (a.v > 0 && a.x > gw) a.x = -a.tam;
      if (a.v < 0 && a.x < -a.tam) a.x = gw;
      a.el.style.transform = 'translate3d(' + a.x + 'px,0,0)';
    });

    cx.clearRect(0, 0, W, H);
    const seg = t / 1000;
    for (let i = 0; i < brasas.length; i++) {
      const b = brasas[i];
      b.y -= b.v * dt;
      b.x += Math.sin(seg + b.f) * 6 * dt;
      if (b.y < -10) brasas[i] = novaBrasa(false);
      cx.globalAlpha = b.a * (0.6 + 0.4 * Math.sin(seg * 2 + b.f));
      cx.fillStyle = b.c;
      cx.fillRect(b.x, b.y, b.s, b.s);
    }
    cx.globalAlpha = 1;

    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', ajustarBrasas);

  ajustarBrasas();
  criarAlvos();
  requestAnimationFrame(loop);
})();