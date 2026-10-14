// Diário sem bibliotecas: as folhas viram com CSS 3D, o JS só controla qual está virada.
(window.cartaPronta || Promise.resolve()).then(function () {

  const book = document.getElementById('book');
  const tpl = document.getElementById('faces');
  const originalTemplates = Array.from(tpl.content.querySelectorAll('.face'));

  let mode = null;      // 'double' (duas páginas) ou 'single' (celular)
  let currentFaces = [];
  let leaves = [];      // folhas do livro
  let k = 0;            // quantas folhas já foram viradas
  let maxK = 0;
  let locked = false;
  let counter = 0;
  let ignoreClick = false;

  const duration = () =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur')) || 900;

  const wantedMode = () => (window.innerWidth <= 720 ? 'single' : 'double');

  function facesFor(m) {
    const faces = typeof window.facesPara === 'function'
      ? window.facesPara(m)
      : originalTemplates.map((face) => face.cloneNode(true));
    return m === 'single' ? faces.filter((face) => !face.hasAttribute('data-deco')) : faces;
  }

  function faceKey(face) {
    if (face.dataset.numerada) return 'page:' + face.querySelector('.page-number').textContent;
    if (face.hasAttribute('aria-label')) return 'label:' + face.getAttribute('aria-label');
    if (face.querySelector('.inside-note')) return 'dedication';
    return null;
  }

  // ---------- tamanho ----------
  function sizeBook(m) {
    const single = m === 'single';
    const ratio = single ? 1.5 : 1 / 0.74;
    const maxH = Math.max(280, window.innerHeight - 80);
    const maxW = single ? window.innerWidth - 28 : (window.innerWidth - 80) / 2;
    const pw = Math.round(Math.max(150, Math.min(480, maxW, maxH / ratio)));

    book.style.setProperty('--pw', pw + 'px');
    book.style.setProperty('--ph', Math.round(pw * ratio) + 'px');
  }

  // ---------- montagem ----------
  function build(m, startK) {
    mode = m;
    book.classList.add('no-anim');
    book.innerHTML = '';
    book.dataset.mode = m;
    sizeBook(m);
    const faces = facesFor(m);
    currentFaces = faces;

    const shadow = document.createElement('div');
    shadow.className = 'book-shadow';
    book.appendChild(shadow);

    let groups;

    if (m === 'double') {
      groups = [];
      for (let i = 0; i < faces.length; i += 2) groups.push([faces[i], faces[i + 1]]);
    } else {
      groups = faces.filter((f) => !f.hasAttribute('data-deco')).map((f) => [f]);
    }

    leaves = groups.map((group) => {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';

      group.forEach((face, side) => {
        face.classList.add(side === 0 ? 'face-front' : 'face-back');
        face.classList.add(m === 'single' || side === 0 ? 'right-page' : 'left-page');

        const shade = document.createElement('span');
        shade.className = 'shade';
        shade.setAttribute('aria-hidden', 'true');
        face.appendChild(shade);

        leaf.appendChild(face);
      });

      book.appendChild(leaf);
      return leaf;
    });

    maxK = m === 'double' ? leaves.length : leaves.length - 1;
    k = Math.max(0, Math.min(startK, maxK));

    leaves.forEach((leaf, i) => {
      leaf.classList.toggle('flipped', i < k);
      settle(leaf, i);
    });

    updateState();

    void book.offsetWidth;            // aplica o estado inicial sem animar
    book.classList.remove('no-anim');
  }

  // empilhamento: folhas da esquerda crescem para o fim, as da direita para o começo
  function settle(leaf, i) {
    leaf.style.zIndex = leaf.classList.contains('flipped') ? i + 1 : leaves.length - i;
  }

  function updateState() {
    let state = 'open';
    if (k === 0) state = 'front';
    else if (mode === 'double' && k === maxK) state = 'back';
    book.dataset.state = state;
  }

  // ---------- virar página ----------
  function go(dir) {
    if (locked) return;
    const target = k + dir;
    if (target < 0 || target > maxK) return;

    const D = duration();
    locked = true;
    setTimeout(() => { locked = false; }, D * 0.55);

    const idx = dir > 0 ? k : k - 1;
    const leaf = leaves[idx];
    const myToken = ++counter;

    leaf._token = myToken;
    leaf.style.zIndex = 100 + myToken;      // a folha que vira fica por cima de todas
    leaf.classList.remove('turning');
    void leaf.offsetWidth;
    leaf.classList.add('turning');
    leaf.classList.toggle('flipped', dir > 0);

    k = target;
    updateState();

    setTimeout(() => {
      if (leaf._token !== myToken) return;  // outra virada começou nessa folha
      leaf.classList.remove('turning');
      settle(leaf, idx);
    }, D + 30);
  }

  // abrir a capa: a lingueta solta e depois a capa vira
  function pull() {
    const strap = book.querySelector('.leather-strap');
    if (!strap) return go(1);
    if (strap.classList.contains('pulling') || locked) return;

    strap.classList.add('pulling');
    setTimeout(() => go(1), 220);
    setTimeout(() => strap.classList.remove('pulling'), duration() + 300);
  }

  const next = () => (k === 0 ? pull() : go(1));
  const prev = () => go(-1);

  // ---------- controles ----------
  book.addEventListener('click', (e) => {
    if (ignoreClick) return;
    const rect = book.getBoundingClientRect();
    const meio = rect.left + rect.width / 2;
    if (e.clientX >= meio) next();
    else prev();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });

  let startX = null;
  book.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 50) return;

    ignoreClick = true;
    setTimeout(() => { ignoreClick = false; }, 400);
    if (dx < 0) next();
    else prev();
  }, { passive: true });

  // ---------- ao redimensionar / girar o celular ----------
  function faceIndexNow() {
    if (mode === 'double') return k < leaves.length ? 2 * k : currentFaces.length - 1;
    return k;
  }

  function kFromFace(m, fi) {
    const targetFaces = facesFor(m);
    const currentFace = currentFaces[Math.max(0, Math.min(fi, currentFaces.length - 1))];
    const key = currentFace && faceKey(currentFace);
    const matchingIndex = key
      ? targetFaces.findIndex((face) => faceKey(face) === key)
      : -1;
    const targetIndex = matchingIndex >= 0
      ? matchingIndex
      : Math.min(fi, targetFaces.length - 1);
    return m === 'double' ? Math.ceil(targetIndex / 2) : targetIndex;
  }

  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const m = wantedMode();
      if (m !== mode) build(m, kFromFace(m, faceIndexNow()));
      else sizeBook(mode);
    }, 120);
  });

  build(wantedMode(), 0);
});