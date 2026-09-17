/**
 * Definizione dei passi della guida Aura, una serie per schermata.
 *
 * I bersagli non usano classi CSS (si romperebbero a ogni restyling) ma
 * riferimenti stabili: href della navigazione, oppure il testo reale delle
 * intestazioni, da cui il motore risale alla card che le contiene.
 */

export type TourTarget =
  | { kind: 'selector'; value: string }
  | { kind: 'text'; value: string }
  | { kind: 'center' };

export interface TourStep {
  title: string;
  body: string;
  target: TourTarget;
  /** Nota secondaria, per avvertenze o dettagli operativi. */
  note?: string;
}

export interface TourScreen {
  label: string;
  intro: string;
  steps: TourStep[];
  /** Schermata suggerita al termine, per incatenare la visita. */
  nextRoute?: string;
  nextLabel?: string;
}

/** Passi comuni a ogni schermata: la navigazione e la casella di stato. */
const shell: TourStep[] = [
  {
    title: 'La barra di navigazione',
    body:
      'Da qui raggiungi ogni area di Aura. Le voci seguono il percorso naturale del lavoro: prima configuri le creator, poi osservi i risultati, infine intervieni dove serve.',
    target: { kind: 'selector', value: 'aside nav' },
  },
  {
    title: 'Stato del progetto',
    body:
      'Sempre visibile in alto a destra. Il pallino ambra indica che esiste un blocco aperto; cliccando entri nella sezione che spiega cosa manca e perché.',
    target: { kind: 'selector', value: 'a[href="/dashboard/status"]' },
  },
];

export const TOUR: Record<string, TourScreen> = {
  '/dashboard': {
    label: 'Overview',
    intro: 'La schermata da cui parte ogni giornata.',
    nextRoute: '/dashboard/creators',
    nextLabel: 'Creators',
    steps: [
      ...shell,
      {
        title: 'Workspace attivi',
        body:
          'Ogni riga è una creator con la sua Aura in funzione. È il primo posto in cui guardare: se una creator non compare qui, il suo bot non sta lavorando.',
        target: { kind: 'text', value: 'Active workspaces' },
      },
    ],
  },

  '/dashboard/creators': {
    label: 'Creators',
    intro: 'Dove nasce e si regola la personalità di ogni Aura.',
    nextRoute: '/dashboard/analytics',
    nextLabel: 'Analytics',
    steps: [
      {
        title: 'Creare una creator',
        body:
          'Nome e username servono a identificarla. Il campo decisivo è il prompt di persona: descrive chi è, come parla, cosa la diverte e cosa rifiuta.',
        target: { kind: 'text', value: 'New creator' },
        note: 'Più il prompt è specifico, meno le risposte suonano artificiali. Scrivilo come descriveresti una persona vera a chi non l\'ha mai incontrata.',
      },
      {
        title: 'Le creator esistenti',
        body:
          'Ogni scheda apre la configurazione completa: libreria media, esempi di conversazione per il RAG, clonazione vocale e collegamento a Telegram.',
        target: { kind: 'text', value: 'Creators' },
      },
    ],
  },

  '/dashboard/analytics': {
    label: 'Analytics',
    intro: 'Quanto ha prodotto Aura, e su quali fan.',
    nextRoute: '/dashboard/agents',
    nextLabel: 'Agents',
    steps: [
      {
        title: 'Attribuzione del fatturato',
        body:
          'La domanda a cui questa schermata risponde è una sola: quanto di questo fatturato esiste grazie ad Aura. È il numero che giustifica l\'abbonamento davanti a un\'agenzia.',
        target: { kind: 'text', value: 'Analytics' },
      },
      {
        title: 'Segmenti di fan',
        body:
          'I fan raggruppati per tier di spesa. La coda lunga in basso vale poco singolarmente ma molto in aggregato: è lì che l\'automazione rende di più, perché nessun operatore umano la coprirebbe a mano.',
        target: { kind: 'text', value: 'Fan segments' },
      },
    ],
  },

  '/dashboard/safety': {
    label: 'Safety',
    intro: 'Il freno di emergenza e la memoria di ciò che è successo.',
    nextRoute: '/dashboard/takeover',
    nextLabel: 'Live Chat',
    steps: [
      {
        title: 'Controlli del workspace',
        body:
          'Da qui fermi una singola creator o l\'intero network. Lo stop è immediato: i messaggi già in coda non partono.',
        target: { kind: 'text', value: 'Workspace controls' },
        note: 'È la funzione che rende Aura vendibile a un\'agenzia: chi firma vuole sapere di poter spegnere tutto in un secondo.',
      },
      {
        title: 'Registro di controllo',
        body:
          'Ogni messaggio bloccato dal filtro compare qui con il motivo. Non è solo diagnostica: è la prova documentale da mostrare se una piattaforma o un cliente contesta un comportamento.',
        target: { kind: 'text', value: 'Audit log' },
      },
    ],
  },

  '/dashboard/takeover': {
    label: 'Live Chat',
    intro: 'Quando serve una persona vera, si entra da qui.',
    nextRoute: '/dashboard/safety',
    nextLabel: 'Safety',
    steps: [
      {
        title: 'Elenco dei fan',
        body:
          'Le conversazioni aperte, ordinate per attività recente. Selezionane una per leggerla per intero.',
        target: { kind: 'text', value: 'Live Chat' },
      },
      {
        title: 'Subentrare nella conversazione',
        body:
          'Scrivendo in questo campo prendi il posto del bot: Aura si ferma su quel fan e riprende solo quando lo riattivi. I messaggi scritti da un umano restano marcati nello storico.',
        target: { kind: 'selector', value: '[placeholder="Type a message..."]' },
        note: 'Lo stesso comando esiste nel pannello dell\'estensione, per intervenire senza lasciare OnlyFans.',
      },
    ],
  },

  '/dashboard/agents': {
    label: 'Agents',
    intro: 'Quale configurazione vende di più.',
    nextRoute: '/dashboard/settings',
    nextLabel: 'Settings',
    steps: [
      {
        title: 'Classifica delle configurazioni',
        body:
          'Ogni Aura viene valutata sul fatturato che genera. Confrontando le prime con le ultime si capisce quale impostazione di persona funziona, e la si replica sulle altre.',
        target: { kind: 'text', value: 'Agents' },
        note: 'È il meccanismo che fa migliorare il sistema nel tempo: le conversazioni che chiudono una vendita rientrano nel RAG e alzano la media.',
      },
    ],
  },

  '/dashboard/settings': {
    label: 'Settings',
    intro: 'Come Aura ti avvisa quando qualcosa richiede attenzione.',
    nextRoute: '/dashboard/extension',
    nextLabel: 'Extension',
    steps: [
      {
        title: 'Notifiche Telegram',
        body:
          'Inserisci l\'identificativo del gruppo e Aura ti scrive quando un messaggio viene bloccato, quando un fan ad alto valore si muove, o quando qualcosa smette di funzionare.',
        target: { kind: 'text', value: 'Telegram Notifications' },
      },
    ],
  },

  '/dashboard/extension': {
    label: 'Extension',
    intro: 'Il componente che lavora dentro OnlyFans.',
    nextRoute: '/dashboard/status',
    nextLabel: 'Stato progetto',
    steps: [
      {
        title: 'Installazione',
        body:
          'L\'estensione si carica come cartella non pacchettizzata dalla pagina delle estensioni di Chrome. Non passa dallo store, quindi serve la modalità sviluppatore attiva.',
        target: { kind: 'text', value: 'Installation Guide' },
      },
      {
        title: 'Come lavora',
        body:
          'Legge le chat direttamente nella pagina, chiede la risposta al backend e la digita carattere per carattere con ritmo variabile. Dal punto di vista di OnlyFans è una persona che scrive.',
        target: { kind: 'text', value: 'How it works' },
      },
    ],
  },

  '/dashboard/status': {
    label: 'Stato progetto',
    intro: 'Cosa è pronto, cosa manca e cosa blocca.',
    steps: [
      {
        title: 'Servizi in produzione',
        body:
          'Lo stato reale dell\'infrastruttura. Se qualcosa qui non è verde, il problema è a monte e nessuna schermata funzionerà correttamente.',
        target: { kind: 'text', value: 'Servizi in produzione' },
      },
      {
        title: 'Il blocco aperto',
        body:
          'Il passaggio che separa il progetto da un test completo. Finché resta aperto, tutto il resto è pronto ma non verificato sul campo.',
        target: { kind: 'text', value: 'Il blocco' },
      },
      {
        title: 'Come ottenere l\'accesso',
        body:
          'Le tre strade valutate per arrivare a un account OnlyFans di prova, con il giudizio su ciascuna e il motivo della raccomandazione.',
        target: { kind: 'text', value: 'Come ottenere l\'accesso' },
      },
    ],
  },
};
