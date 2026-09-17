'use client';

import Link from 'next/link';
import { Activity, AlertTriangle, Globe, Lock, Users, ArrowRight } from 'lucide-react';

type State = 'live' | 'wip' | 'blocked';

const pill: Record<State, string> = {
  live: 'bg-[#0C2414] text-[#34C759]',
  wip: 'bg-[#2A2011] text-[#E5A93C]',
  blocked: 'bg-[#2A0F0D] text-[#FF453A]',
};

function Pill({ state, children }: { state: State; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium tracking-wider uppercase ${pill[state]}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {children}
    </span>
  );
}

const services = [
  { name: 'API — Railway', detail: 'api.aurafullsuite.it · /health risponde ok', state: 'live' as State, tag: 'Live' },
  { name: 'Dashboard — Cloudflare Pages', detail: 'app.aurafullsuite.it', state: 'live' as State, tag: 'Live' },
  { name: 'Database — Supabase', detail: 'PostgreSQL Frankfurt · 9 tabelle · keepalive attivo', state: 'live' as State, tag: 'Live' },
  { name: 'Estensione Chrome', detail: 'Manifest V3 · caricabile come cartella non pacchettizzata', state: 'wip' as State, tag: 'Installabile' },
];

const built = [
  { title: 'Motore AI', desc: 'Persona engine, memory engine, router Haiku/Sonnet, compliance shield, churn detection.', state: 'live' as State, tag: 'Completo' },
  { title: 'Macchina di vendita', desc: 'Sei fasi da warmup ad aftercare, heat score 0-100, smart timing, PPV manager, agent scoring.', state: 'live' as State, tag: 'Completo' },
  { title: 'Estensione', desc: 'Content script, service worker, popup, pannello laterale con heat e takeover, multi-chat parallelo.', state: 'live' as State, tag: 'Completo' },
  { title: 'Dashboard', desc: 'Overview, creator, analytics, safety, takeover live, ranking agent, guida estensione.', state: 'live' as State, tag: 'Completo' },
  { title: 'Scraping OnlyFans', desc: 'Selettori DOM scritti con fallback multipli, mai verificati su pagine chat reali.', state: 'wip' as State, tag: 'Da validare' },
  { title: 'Media, PPV e voce via estensione', desc: 'Richiede il DOM di upload di OnlyFans. Bloccato dallo stesso motivo.', state: 'wip' as State, tag: 'Non avviato' },
];

const options = [
  {
    icon: Globe,
    title: 'Account di prova via VPN',
    verdict: 'Parziale',
    verdictState: 'wip' as State,
    body: 'Proposta di Filippo. La VPN risolve una sola cosa: le restrizioni geografiche in fase di registrazione. Non risolve il gate vero, che è la verifica dei documenti.',
    detail: 'Un account fan si apre in pochi minuti, ma mostra la chat dal lato sbagliato. L\'estensione legge la posta in arrivo del creator — selettori come .b-chats__item--unread esistono solo in quella vista. Un account creator richiede verifica con documento d\'identità, e la VPN non la aggira. Da tenere presente anche che mascherare la propria area geografica in fase di registrazione è in genere contrario ai termini di servizio della piattaforma.',
  },
  {
    icon: Users,
    title: 'Agenzia pilota',
    verdict: 'Consigliata',
    verdictState: 'live' as State,
    body: 'Un\'agenzia reale che ci dia accesso a un account creator attivo, in cambio di uso gratuito durante la fase beta.',
    detail: 'È la strada più veloce e l\'unica che produce due risultati insieme: sblocca la validazione dei selettori su chat vere e porta il primo cliente in casa. Il prodotto è B2B per agenzie, quindi questo contatto serve comunque — tanto vale cercarlo adesso invece che dopo il lancio. Chat reali significano anche poter misurare heat score e fasi di vendita su conversazioni autentiche, cosa che nessun account di prova permette.',
  },
  {
    icon: Lock,
    title: 'Creator singola disponibile',
    verdict: 'Alternativa',
    verdictState: 'wip' as State,
    body: 'Una creator già attiva che accetti di condividere temporaneamente l\'accesso per una sessione di test supervisionata.',
    detail: 'Più semplice da ottenere di un\'agenzia, ma dà meno volume di conversazioni e nessuna validazione del modello di business. Sufficiente per la sola verifica dei selettori DOM: serve mezza giornata davanti a una schermata chat reale per confermarli o correggerli.',
  },
];

const next = [
  { title: 'Validare i selettori su OnlyFans', desc: 'Mezza giornata con un account attivo. Sblocca tutto il resto.', state: 'blocked' as State, tag: 'Bloccato' },
  { title: 'Notifiche dentro l\'estensione', desc: 'Alert whale, blocchi compliance, errori. Solo lato client.', state: 'wip' as State, tag: 'Pronto' },
  { title: 'Statistiche live in dashboard', desc: 'Endpoint per le metriche dell\'estensione e widget di visualizzazione.', state: 'wip' as State, tag: 'Pronto' },
];

export default function StatusPage() {
  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#48484A] mb-3">
          <Activity size={13} className="text-[#C9A961]" strokeWidth={2} />
          Stato del progetto
        </div>
        <h1 className="text-white text-[32px] font-medium tracking-tight leading-tight max-w-2xl">
          Backend in produzione. Estensione pronta, non ancora validata sul campo.
        </h1>
        <p className="text-[#86868B] text-[15px] mt-4 max-w-2xl leading-relaxed">
          Infrastruttura live e funzionante: API, dashboard e database rispondono. L&apos;MVP a estensione
          Chrome è completo e si collega al backend. Manca un solo passaggio per il test end-to-end:
          un account OnlyFans reale su cui validare i selettori DOM.
        </p>
      </div>

      {/* Servizi */}
      <section>
        <h2 className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-[0.13em] mb-4">
          Servizi in produzione
        </h2>
        <div className="border-t border-[#1A1A1A]">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-4 py-4 border-b border-[#1A1A1A]">
              <div className="min-w-0">
                <div className="text-white text-[14px] font-medium">{s.name}</div>
                <div className="text-[#86868B] text-[12px] font-mono mt-0.5 break-words">{s.detail}</div>
              </div>
              <Pill state={s.state}>{s.tag}</Pill>
            </div>
          ))}
        </div>
      </section>

      {/* Costruito */}
      <section>
        <h2 className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-[0.13em] mb-4">
          Cosa è costruito
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
          {built.map((b) => (
            <div key={b.title} className="bg-[#0A0A0A] p-5 flex flex-col gap-2.5">
              <Pill state={b.state}>{b.tag}</Pill>
              <div className="text-white text-[14px] font-medium">{b.title}</div>
              <p className="text-[#86868B] text-[13px] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blocco */}
      <section>
        <h2 className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-[0.13em] mb-4">
          Il blocco
        </h2>
        <div className="bg-[#2A0F0D] border border-[#4A1C18] border-l-[3px] border-l-[#FF453A] p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-[#FF453A]" strokeWidth={2} />
            <Pill state="blocked">Critico</Pill>
          </div>
          <h3 className="text-white text-[20px] font-medium mb-2">
            Serve un account OnlyFans con chat vere.
          </h3>
          <p className="text-[#C9B5B2] text-[14px] leading-relaxed max-w-3xl">
            L&apos;estensione legge i messaggi facendo scraping del DOM di OnlyFans. I selettori attuali
            hanno fallback multipli ma non sono mai stati verificati su pagine reali: finché non lo sono,
            il bot non può intercettare nulla. È l&apos;unico passaggio tra dove siamo e un test end-to-end
            completo. Tutto il resto della catena — memoria fan, heat score, fase di vendita, generazione
            risposta, compliance — è già in produzione e testabile via API.
          </p>
        </div>
      </section>

      {/* Opzioni di accesso */}
      <section>
        <h2 className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-[0.13em] mb-2">
          Come ottenere l&apos;accesso
        </h2>
        <p className="text-[#86868B] text-[14px] mb-5 max-w-2xl leading-relaxed">
          Tre strade valutate. Vanno lette insieme: la prima è la più immediata ma risolve meno di quanto sembri,
          la seconda è più lenta da avviare e vale molto di più.
        </p>
        <div className="space-y-px bg-[#1F1F1F] border border-[#1F1F1F]">
          {options.map(({ icon: Icon, ...o }) => (
            <div key={o.title} className="bg-[#0A0A0A] p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className="text-[#C9A961]" strokeWidth={2} />
                  <span className="text-white text-[15px] font-medium">{o.title}</span>
                </div>
                <Pill state={o.verdictState}>{o.verdict}</Pill>
              </div>
              <p className="text-[#EDEAE3] text-[14px] leading-relaxed max-w-3xl">{o.body}</p>
              <p className="text-[#86868B] text-[13px] leading-relaxed max-w-3xl mt-2.5">{o.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prossimi passi */}
      <section>
        <h2 className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-[0.13em] mb-4">
          Prossimi passi
        </h2>
        <div className="border-t border-[#1A1A1A]">
          {next.map((n) => (
            <div key={n.title} className="flex items-center justify-between gap-4 py-4 border-b border-[#1A1A1A]">
              <div>
                <div className="text-white text-[14px] font-medium">{n.title}</div>
                <div className="text-[#86868B] text-[13px] mt-0.5">{n.desc}</div>
              </div>
              <Pill state={n.state}>{n.tag}</Pill>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 text-[11px] uppercase tracking-[0.16em] text-[#48484A]">
        <span>Aura · Presence, at scale</span>
        <Link href="/dashboard/extension" className="flex items-center gap-1.5 hover:text-[#C9A961] transition-colors">
          Guida estensione
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>

    </div>
  );
}
