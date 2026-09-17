'use client';

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { TOUR, type TourTarget } from './tour-steps';

const PAD = 10;       // respiro attorno alla sezione illuminata
const CARD_W = 372;   // larghezza del riquadro
const GAP = 16;       // distanza fra sezione e riquadro
const RADIUS = 12;    // raccordo degli angoli del ritaglio
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface Rect { top: number; left: number; width: number; height: number }

/** useLayoutEffect lato client, useEffect lato server: evita l'avviso in SSR. */
const useIsoLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------ */
/* Risoluzione del bersaglio                                           */
/* ------------------------------------------------------------------ */

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const cs = window.getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

/** Risale dall'intestazione alla card che la contiene. */
function findCard(el: HTMLElement): HTMLElement {
  if (el.tagName === 'H1') return el;

  let cur: HTMLElement = el;
  let best: HTMLElement = el;

  for (let i = 0; i < 6; i++) {
    const parent = cur.parentElement;
    if (!parent || parent.tagName === 'MAIN' || parent.tagName === 'BODY') break;

    const r = parent.getBoundingClientRect();
    if (r.width > window.innerWidth * 0.92) break;

    const cs = window.getComputedStyle(parent);
    const bordered =
      parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
    const filled =
      cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';

    cur = parent;
    best = parent;

    if ((bordered || filled) && r.height >= 56 && r.width >= 180) break;
  }

  return best;
}

function resolveTarget(t: TourTarget): HTMLElement | null {
  if (t.kind === 'center') return null;

  if (t.kind === 'selector') {
    const el = document.querySelector<HTMLElement>(t.value);
    return el && isVisible(el) ? el : null;
  }

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, p, span'),
  ).filter((n) => n.textContent?.trim() === t.value && isVisible(n));

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
  return findCard(candidates[0]);
}

/* ------------------------------------------------------------------ */
/* Geometria                                                           */
/* ------------------------------------------------------------------ */

/**
 * Ritaglio a finestra: un contorno esterno orario più un foro ANTIORARIO.
 * Con la regola di riempimento predefinita è il verso opposto a sottrarre
 * l'area; due contorni concordi produrrebbero un velo pieno, senza foro.
 * Il numero di punti è costante, così la transizione CSS interpola.
 */
function holePath(s: Rect): string {
  const { top: y, left: x, width: w, height: h } = s;
  const r = Math.min(RADIUS, w / 2, h / 2);
  const k = r * 0.45;
  const j = r * 0.13;

  const pts: Array<[number, number]> = [
    [x + r, y], [x + k, y + j], [x, y + r],
    [x, y + h - r], [x + k, y + h - j], [x + r, y + h],
    [x + w - r, y + h], [x + w - k, y + h - j], [x + w, y + h - r],
    [x + w, y + r], [x + w - k, y + j], [x + w - r, y],
  ];

  const hole = pts.map(([px, py]) => `${px.toFixed(1)}px ${py.toFixed(1)}px`).join(', ');
  const first = `${pts[0][0].toFixed(1)}px ${pts[0][1].toFixed(1)}px`;

  return `polygon(0px 0px, 100% 0px, 100% 100%, 0px 100%, 0px 0px, ${hole}, ${first})`;
}

function clampX(x: number, vw: number) {
  return Math.min(Math.max(x, 16), Math.max(vw - CARD_W - 16, 16));
}
function clampY(y: number, vh: number, ch: number) {
  return Math.min(Math.max(y, 16), Math.max(vh - ch - 16, 16));
}

/** Sotto, sopra, a destra, a sinistra; da ultimo l'angolo che copre meno. */
function place(spot: Rect, ch: number): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = clampX(spot.left + spot.width / 2 - CARD_W / 2, vw);

  if (vh - (spot.top + spot.height) - GAP >= ch) return { top: spot.top + spot.height + GAP, left: cx };
  if (spot.top - GAP >= ch) return { top: spot.top - ch - GAP, left: cx };
  if (vw - (spot.left + spot.width) - GAP >= CARD_W)
    return { top: clampY(spot.top, vh, ch), left: spot.left + spot.width + GAP };
  if (spot.left - GAP >= CARD_W)
    return { top: clampY(spot.top, vh, ch), left: spot.left - CARD_W - GAP };

  return { top: spot.top < vh * 0.4 ? Math.max(vh - ch - 20, 16) : 20, left: cx };
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function AuraTour() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(210);

  const cardRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const screen = useMemo(() => TOUR[pathname], [pathname]);
  const steps = useMemo(() => screen?.steps ?? [], [screen]);

  // L'indice resta sempre nei limiti: passando a una schermata con meno passi,
  // un indice residuo non deve far sparire la guida.
  const count = steps.length;
  const i = count > 0 ? Math.min(index, count - 1) : 0;
  const step = count > 0 ? steps[i] : undefined;
  const isLast = i === count - 1;

  const dur = reduced ? '0ms' : '300ms';

  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const id = 'aura-tour-font';
    if (typeof document === 'undefined' || document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(link);
  }, []);

  // Cambiando schermata la guida NON si chiude: riparte dal primo passo.
  useEffect(() => { setIndex(0); }, [pathname]);

  const measure = useCallback(() => {
    if (!step) return;
    const el = resolveTarget(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Porta la sezione in vista e misura. Dopo un cambio di schermata il DOM
  // della pagina nuova non è pronto: si ritenta per circa un secondo.
  useEffect(() => {
    if (!open || !step) return;

    let cancelled = false;
    let attempts = 0;
    const timers: number[] = [];

    const attempt = () => {
      if (cancelled) return;
      const el = resolveTarget(step.target);

      if (el) {
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        measure();
        timers.push(window.setTimeout(() => { if (!cancelled) measure(); }, reduced ? 0 : 380));
        return;
      }

      attempts += 1;
      if (attempts < 10) timers.push(window.setTimeout(attempt, 120));
      else setRect(null);
    };

    attempt();
    return () => { cancelled = true; timers.forEach(window.clearTimeout); };
  }, [open, step, i, pathname, measure, reduced]);

  // Altezza reale del riquadro: serve a decidere sopra o sotto.
  useIsoLayout(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && Math.abs(h - cardH) > 2) setCardH(h);
  });

  // Tiene la cornice allineata durante scroll e ridimensionamenti.
  useEffect(() => {
    if (!open) return;
    const onChange = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [open, measure]);

  const close = useCallback(() => {
    setOpen(false);
    setIndex(0);
    setRect(null);
  }, []);

  const next = useCallback(() => {
    setIndex((p) => Math.min(p + 1, Math.max(count - 1, 0)));
  }, [count]);

  const prev = useCallback(() => setIndex((p) => Math.max(p - 1, 0)), []);

  /** Schermata successiva SENZA chiudere la guida. */
  const goNextScreen = useCallback((route: string) => {
    setIndex(0);
    router.push(route);
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, next, prev]);

  if (!screen || count === 0 || !step) return null;

  /* --------------------------- geometria --------------------------- */

  const spot: Rect | null = rect
    ? {
        top: Math.max(rect.top - PAD, 0),
        left: Math.max(rect.left - PAD, 0),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const pos = spot && mounted
    ? place(spot, cardH)
    : { top: -1, left: -1 };

  /* ---------------------------- render ----------------------------- */

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Guida della schermata"
    >
      <style>{`
        @keyframes auraStepIn { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
        .aura-step-in { animation: auraStepIn ${reduced ? '0ms' : '260ms'} ${EASE} both; }
      `}</style>

      {/* Velo: un solo elemento, con la finestra ritagliata. Trasparente ai
          click, così non può mai bloccare l'interfaccia. */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'rgba(4, 4, 5, 0.66)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          clipPath: spot ? holePath(spot) : undefined,
          transition: `clip-path ${dur} ${EASE}`,
        }}
      />

      {spot && (
        <div
          className="fixed pointer-events-none rounded-xl"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            border: '1px solid rgba(201, 169, 97, 0.85)',
            boxShadow: '0 0 0 1px rgba(201,169,97,0.12), 0 0 34px rgba(201,169,97,0.22)',
            transition: `all ${dur} ${EASE}`,
          }}
        />
      )}

      {/* Riquadro esplicativo */}
      <div
        ref={cardRef}
        className="fixed rounded-2xl border border-[#2A2A32] bg-[#0B0B0E] shadow-2xl pointer-events-auto"
        style={{
          width: CARD_W,
          ...(pos.top >= 0
            ? { top: pos.top, left: pos.left }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
          transition: `top ${dur} ${EASE}, left ${dur} ${EASE}`,
        }}
      >
        <div className="h-[2px] w-full overflow-hidden rounded-t-2xl bg-[#1A1A20]">
          <div
            className="h-full bg-gradient-to-r from-[#8B7439] to-[#E5CB90]"
            style={{ width: `${((i + 1) / count) * 100}%`, transition: `width ${dur} ease-out` }}
          />
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-[15px] w-[15px] rounded-full border-[1.5px] border-[#C9A961]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#56565E]">
                {screen.label} · {i + 1}/{count}
              </span>
            </div>
            <button
              onClick={close}
              aria-label="Chiudi la guida"
              className="rounded-md p-1 text-[#56565E] transition-colors hover:bg-[#17171C] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A961]"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          <div key={`${pathname}-${i}`} className="aura-step-in">
            <h3
              className="mb-2 text-[22px] leading-tight text-white"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 }}
            >
              {step.title}
            </h3>
            <p className="text-[13.5px] leading-relaxed text-[#9A9AA2]">{step.body}</p>
            {step.note && (
              <p className="mt-3 border-l-2 border-[#6E5A31] pl-3 text-[12.5px] leading-relaxed text-[#7C7C85]">
                {step.note}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={i === 0}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-[#86868B] transition-colors hover:bg-[#17171C] hover:text-white disabled:pointer-events-none disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A961]"
            >
              <ArrowLeft size={13} strokeWidth={2} />
              Indietro
            </button>

            {isLast ? (
              screen.nextRoute ? (
                <button
                  onClick={() => goNextScreen(screen.nextRoute as string)}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#C9A961] to-[#B08F4A] px-3.5 py-2 text-[12px] font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5CB90]"
                >
                  {screen.nextLabel}
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={close}
                  className="rounded-lg bg-gradient-to-b from-[#C9A961] to-[#B08F4A] px-3.5 py-2 text-[12px] font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5CB90]"
                >
                  Ho capito
                </button>
              )
            ) : (
              <button
                onClick={next}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#C9A961] to-[#B08F4A] px-3.5 py-2 text-[12px] font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5CB90]"
              >
                Avanti
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => { setIndex(0); setOpen(true); }}
        title={screen.intro}
        className="group flex items-center gap-2 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-3.5 py-2.5 transition-all hover:border-[#C9A961]/40 hover:bg-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A961]"
      >
        <BookOpen size={14} strokeWidth={2} className="text-[#48484A] transition-colors group-hover:text-[#C9A961]" />
        <span className="text-[12px] font-medium text-white">Guida</span>
        <Sparkles size={11} strokeWidth={2} className="text-[#C9A961] opacity-70" />
      </button>

      {mounted && open && createPortal(overlay, document.body)}
    </>
  );
}
