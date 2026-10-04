const HUE = 270;        // 270 = roxo, pra combinar com o resto do site
const COUNT = 3500;     // quantidade de partículas
const ROT_SPEED = 0.45; // velocidade do giro depois de formado
const FORM_TIME = 2.6;  // duração da formação (segundos)

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W, H, S, CX, CY;

// equação que define a superfície de um coração em 3D
function f(x, y, z) {
  const a = x * x + 2.25 * y * y + z * z - 1;
  return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z;
}
const rnd = (a, b) => a + Math.random() * (b - a);

// gera as partículas: cada uma tem um ponto de destino (dentro do
// coração) e um ponto de partida (espalhado ao redor)
const P = [];
for (let i = 0; i < COUNT; i++) {
  let x, y, z;
  do {
    x = rnd(-1.3, 1.3); y = rnd(-1.1, 1.1); z = rnd(-1.2, 1.4);
  } while (f(x, y, z) > 0);

  const u = Math.random() * 6.28, v = Math.acos(rnd(-1, 1)), r = rnd(1.8, 4.2);
  P.push({
    tx: x, ty: y, tz: z,
    sx: r * Math.sin(v) * Math.cos(u), sy: r * Math.sin(v) * Math.sin(u), sz: r * Math.cos(v),
    delay: Math.random() * FORM_TIME * 0.8,
    dur: FORM_TIME * 0.6,
    phase: Math.random() * 6.28,
    size: rnd(0.8, 2),
    color: `hsl(${HUE + rnd(-12, 12)}, 100%, ${rnd(55, 88)}%)`
  });
}

function resize() {
  W = innerWidth; H = innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  S = Math.min(W * 0.3, H * 0.2);
  CX = W / 2; CY = H * 0.42;
}
addEventListener("resize", resize);
resize();

// ---------- interação ----------
const btn = document.getElementById("btn");
const nav = document.getElementById("nav-mensagens");
const bolhas = document.getElementById("bolhas");
const modal = document.getElementById("modal-foto");
const fotoGrande = document.getElementById("foto-grande");
const fecharModal = document.getElementById("fechar-modal");

// cada bolha, ao ser clicada, coloca sua foto (guardada no
// atributo data-foto) dentro do <img> do modal e mostra o modal
document.querySelectorAll(".bolha").forEach(bolha => {
  bolha.addEventListener("click", () => {
    fotoGrande.src = bolha.dataset.foto;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("visivel"));
  });
});

function fecharFoto() {
  modal.classList.remove("visivel");
  setTimeout(() => { modal.hidden = true; }, 300); // espera a transition acabar
}
fecharModal.addEventListener("click", fecharFoto);
modal.addEventListener("click", (e) => {
  if (e.target === modal) fecharFoto(); // clicar fora da foto também fecha
});

let started = false, t0 = 0, rot = 0, startX = null, lastX = 0;

btn.addEventListener("click", () => {
  if (started) return;
  started = true;
  t0 = performance.now();
  btn.classList.add("escondido");

  // espera o tempo total da formação, depois mostra o menu de links.
  // o "hidden" faz o navegador parar de reservar espaço pro elemento;
  // sem ele aparecer de repente, esperamos um instante (requestAnimationFrame)
  // antes de adicionar "visivel", pra garantir que a transition anime.
  setTimeout(() => {
    nav.hidden = false;
    bolhas.hidden = false;
    requestAnimationFrame(() => nav.classList.add("visivel"));
  }, FORM_TIME * 1.4 * 1000);
});

// arrastar o dedo gira o coração, depois que ele já se formou
canvas.addEventListener("pointerdown", e => { startX = lastX = e.clientX; });
canvas.addEventListener("pointermove", e => {
  if (startX === null || !started) return;
  const dx = e.clientX - lastX; lastX = e.clientX;
  rot += dx * 0.012;
});
["pointerup", "pointercancel", "pointerleave"].forEach(ev =>
  canvas.addEventListener(ev, () => { startX = null; }));

const ease = k => 1 - Math.pow(1 - k, 3);

function drawBase(form, t) {
  if (form <= 0) return;
  const by = CY + S * 1.45, a = form * (0.85 + 0.15 * Math.sin(t * 2));
  ctx.save();
  ctx.translate(CX, by);
  ctx.scale(1, 0.22);
  const R = S * 1.15;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, `hsla(${HUE}, 100%, 75%, ${0.9 * a})`);
  g.addColorStop(0.5, `hsla(${HUE}, 100%, 55%, ${0.45 * a})`);
  g.addColorStop(1, `hsla(${HUE}, 100%, 50%, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.fill();
  ctx.lineWidth = S * 0.05;
  ctx.strokeStyle = `hsla(${HUE}, 100%, 80%, ${0.8 * a})`;
  ctx.shadowColor = `hsl(${HUE}, 100%, 60%)`; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, 6.28); ctx.stroke();
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  const clock = now / 1000;
  const tf = started ? (now - t0) / 1000 : 0;
  const form = Math.min(1, tf / (FORM_TIME * 1.4));
  rot += dt * (started ? ROT_SPEED : 0.1);
  const ca = Math.cos(rot), sa = Math.sin(rot);
  const beat = 1 + 0.025 * Math.sin(clock * 3) * form;

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 0, W, H);

  drawBase(form, clock);
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < COUNT; i++) {
    const p = P[i];
    const e = ease(Math.max(0, Math.min(1, (tf - p.delay) / p.dur)));
    const x = p.sx + (p.tx - p.sx) * e;
    const y = p.sy + (p.ty - p.sy) * e;
    const z = p.sz + (p.tz - p.sz) * e;
    const rx = x * ca - y * sa, ry = x * sa + y * ca;
    const persp = 7 / (7 + ry);
    const px = CX + rx * S * persp * beat;
    const py = CY - (z - 0.15) * S * persp * beat;
    const tw = 0.55 + 0.45 * Math.sin(clock * 3 + p.phase);
    ctx.globalAlpha = Math.min(1, (0.35 + 0.65 * tw) * (0.5 + 0.5 * persp * persp));
    ctx.fillStyle = p.color;
    const s = p.size * persp;
    ctx.fillRect(px, py, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);