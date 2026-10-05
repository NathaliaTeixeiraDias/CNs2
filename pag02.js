// vermelho, dourado, marrom, branco-areia
const PALETA = ["#8c3a2b", "#d41827", "#d4af37", "#8a6a3a", "#e8d6a8"];;
const COUNT = 3500;     // quantidade de partículas
const ROT_SPEED = 0.45; // velocidade do giro depois de formado
const FORM_TIME = 2.6;  // duração da formação (segundos)

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W, H, S, CX, CY;

function f(x, y, z) {
  const a = x * x + 2.25 * y * y + z * z - 1;
  return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z;
}
const rnd = (a, b) => a + Math.random() * (b - a);

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
    color: PALETA[Math.floor(Math.random() * PALETA.length)]
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

const btn = document.getElementById("btn");
let started = false, t0 = 0, rot = 0, startX = null, lastX = 0;

btn.addEventListener("click", () => {
  if (started) return;
  started = true;
  t0 = performance.now();
  btn.classList.add("escondido");
});

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
  g.addColorStop(0, `rgba(232, 214, 168, ${0.9 * a})`);
  g.addColorStop(0.5, `rgba(212, 175, 55, ${0.45 * a})`);
  g.addColorStop(1, `rgba(140, 58, 43, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.fill();
  ctx.lineWidth = S * 0.05;
  ctx.strokeStyle = `rgba(232, 214, 168, ${0.8 * a})`;
  ctx.shadowColor = `#d4af37`; ctx.shadowBlur = 25;
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