// src/contents/author.ts
// Who wrote the manifesto. Check the name and the contact before publishing.
import type { Locale } from "./manifest.config";

export const AUTHOR = {
  publisher: "Matteo Sonaglioni", // the human who directs, edits and publishes (check this)
  contact: "matteosonaglioni@proton.me",
  model: "Claude",
  modelVersion: "Claude Sonnet 5.5",
  maker: "Anthropic",
  makerUrl: "https://www.anthropic.com",
  version: "1.0 (draft)",
  date: "2026-10-20",
};

interface AboutText {
  lead: string; // the one-sentence statement shown large
  paragraphs: { title: string; text: string }[];
  facts: { label: string; value: string }[];
  cite: string;
}

const a = AUTHOR;

export const aboutText: Record<Locale, AboutText> = {
  en: {
    lead: "This manifest was written by an AI.",
    paragraphs: [
      {
        title: "Who",
        text: `The text of every chapter was drafted by ${a.modelVersion}, an AI model made by ${a.maker}, in a long conversation with ${a.publisher}. ${a.publisher} designed the project, chose the topics and their order, set the structure of each chapter, decided what to keep, change or reject, and publishes it. The AI wrote; the person answers for what is published here.`,
      },
      {
        title: "Why say it plainly",
        text: "This manifest asks others to be open about the use of AI and to keep responsibility with people. It would be strange to ask that and not do it. The authorship is stated here for the same reason that the manifest asks for AI-generated content to be labelled.",
      },
      {
        title: "How it was made",
        text: "Each chapter follows the same template: principle, risks, good practices, a concrete example, what must not be done, how to remedy. Facts that can change, such as laws, reports and dates, were checked by web search in October 2026, using primary sources where they could be found. The principles themselves are choices of value, not facts, and reasonable people disagree with some of them. Those disagreements were pointed out during the drafting, and the sources are listed above.",
      },
      {
        title: "Limits and interests",
        text: `An AI can make mistakes, state things with false confidence and reflect biases in its training data, and this text is a draft that no independent expert has yet reviewed. Please check important facts against the sources. ${a.model} was made by ${a.maker}, a company with a direct interest in several of the topics covered here, such as the development of advanced AI, copyright claims over training data and government rules on access to models. Readers should weigh those chapters with that in mind. ${a.model} does not speak for ${a.maker}, and this is not an official ${a.maker} document.`,
      },
      {
        title: "A living document",
        text: "Version 1.0 is a draft. The manifest will be reviewed regularly, corrected when it is wrong and open to criticism, as its last chapter says. Corrections and objections are welcome.",
      },
    ],
    facts: [
      { label: "Written by", value: `${a.modelVersion}, an AI model made by ${a.maker}` },
      { label: "Directed, edited and published by", value: a.publisher },
      { label: "Version", value: a.version },
      { label: "Date", value: a.date },
    ],
    cite: `${a.model} (${a.maker}) and ${a.publisher}, Manifest on the Ethics and Use of AI, version ${a.version}, October 2026.`,
  },
  it: {
    lead: "Questo manifesto è stato scritto da un'IA.",
    paragraphs: [
      {
        title: "Chi",
        text: `Il testo di ogni capitolo è stato redatto da ${a.modelVersion}, un modello di IA creato da ${a.maker}, in una lunga conversazione con ${a.publisher}. ${a.publisher} ha ideato il progetto, scelto gli argomenti e il loro ordine, definito la struttura di ogni capitolo, deciso cosa tenere, cambiare o scartare, e lo pubblica. L'IA ha scritto; la persona risponde di ciò che viene pubblicato qui.`,
      },
      {
        title: "Perché dirlo apertamente",
        text: "Questo manifesto chiede agli altri di essere aperti sull'uso dell'IA e di lasciare la responsabilità alle persone. Sarebbe strano chiederlo e non farlo. La paternità è dichiarata qui per lo stesso motivo per cui il manifesto chiede di etichettare i contenuti generati dall'IA.",
      },
      {
        title: "Come è stato fatto",
        text: "Ogni capitolo segue lo stesso schema: principio, rischi, buone pratiche, esempio concreto, cosa non si deve fare, come rimediare. I fatti che possono cambiare, come leggi, rapporti e date, sono stati verificati con ricerche sul web a ottobre 2026, usando fonti primarie quando è stato possibile trovarle. I principi in sé sono scelte di valore e non fatti, e persone ragionevoli possono dissentire su alcuni. Quei dissensi sono stati segnalati durante la stesura, e le fonti sono elencate qui sopra.",
      },
      {
        title: "Limiti e interessi",
        text: `Un'IA può sbagliare, affermare cose con falsa sicurezza e riflettere i pregiudizi dei dati con cui è stata addestrata, e questo testo è una bozza che nessun esperto indipendente ha ancora rivisto. Verifica le informazioni importanti sulle fonti. ${a.model} è stato creato da ${a.maker}, un'azienda con un interesse diretto in diversi temi trattati, come lo sviluppo dell'IA avanzata, le rivendicazioni di diritto d'autore sui dati di addestramento e le regole dei governi sull'accesso ai modelli. I lettori dovrebbero valutare quei capitoli tenendone conto. ${a.model} non parla a nome di ${a.maker}, e questo non è un documento ufficiale di ${a.maker}.`,
      },
      {
        title: "Un documento vivo",
        text: "La versione 1.0 è una bozza. Il manifesto sarà rivisto con regolarità, corretto quando sbaglia e aperto alle critiche, come dice il suo ultimo capitolo. Correzioni e obiezioni sono benvenute.",
      },
    ],
    facts: [
      { label: "Scritto da", value: `${a.modelVersion}, un modello di IA creato da ${a.maker}` },
      { label: "Ideato, curato e pubblicato da", value: a.publisher },
      { label: "Versione", value: a.version },
      { label: "Data", value: a.date },
    ],
    cite: `${a.model} (${a.maker}) e ${a.publisher}, Manifesto sull'etica e l'uso dell'IA, versione ${a.version}, ottobre 2026.`,
  },
};