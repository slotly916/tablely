// Statisches Artikel-Array — bewusst KEIN CMS und KEINE Datenbank.
// Neuen Artikel anlegen = neues Objekt in POSTS einfügen.
// `content` ist von uns verfasstes, statisches HTML (kein Nutzer-Input),
// das im Artikel über die .prose-Klasse gerendert wird.

export type BlogPost = {
  slug: string;
  title: string;
  /** ISO-Datum, z.B. "2026-07-10" */
  date: string;
  teaser: string;
  content: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: "so-arbeitet-unsere-ki",
    title: "So arbeitet die KI von Butlery",
    date: "2026-08-04",
    teaser:
      "Was der Assistent auf WhatsApp und am Telefon tatsächlich macht, wo seine Grenzen liegen — und warum er sich immer als KI zu erkennen gibt.",
    content: `
      <p>Wenn ich Wirtinnen und Wirten erzähle, dass bei Butlery eine KI die Reservierungen annimmt, kommt fast immer dieselbe Frage: Was macht das Ding eigentlich genau? Deshalb hier ohne Marketing-Sprache, was der Assistent kann, was er nicht kann und woran deine Gäste erkennen, dass sie nicht mit einem Menschen schreiben.</p>

      <h2>Was die KI auf WhatsApp macht</h2>
      <p>Ein Gast schreibt auf die WhatsApp-Nummer deines Restaurants. Der Assistent liest die Nachricht und sucht darin vier Dinge: Name, Datum, Uhrzeit und Personenzahl. Das ist der eigentliche Kern — in der Fachsprache Slot-Filling.</p>
      <p>Das Knifflige daran: Menschen schreiben selten vollständig. Sie schreiben Samstag statt eines Datums, zu zweit statt einer Zahl, abends statt einer Uhrzeit. Der Assistent rechnet Wochentage in echte Daten um und fragt gezielt nach, was noch fehlt — eine Frage pro Nachricht, nicht ein Formular am Stück. Tippfehler und Dialekt sind kein Problem.</p>
      <p>Sind alle vier Angaben da, prüft Butlery die Öffnungszeiten und die Tischbelegung zum gewünschten Zeitpunkt, sucht den kleinsten passenden Tisch und trägt die Reservierung ein. Passt kein einzelner Tisch, versucht das System die Tischkombinationen, die du in den Einstellungen hinterlegt hast.</p>
      <p>Der Assistent kann auch stornieren. Schreibt ein Gast, dass er absagen muss, sucht Butlery die aktive Reservierung zu seiner Telefonnummer und setzt sie auf storniert — und du siehst das sofort im Dashboard.</p>

      <h2>Wo die KI bewusst aufhört</h2>
      <p>Es gibt Fälle, in denen ich nicht will, dass eine Maschine entscheidet. Ab einer größeren Runde — den Schwellenwert legst du in den Einstellungen fest — bucht der Assistent nicht mehr selbst. Er nimmt die Anfrage entgegen, sagt dem Gast ehrlich, dass sich das Team persönlich meldet, und legt die Reservierung als offen an. Du entscheidest.</p>
      <p>Dasselbe passiert, wenn kein passender Tisch frei ist. Der Assistent erfindet dann keine Lösung, sondern legt die Anfrage zur manuellen Prüfung an. Mir ist ein ehrliches Wir melden uns lieber als eine Buchung, die es gar nicht gibt.</p>
      <p>Und ein paar Dinge macht die KI grundsätzlich nicht: Sie bewertet keine Gäste, sie führt keine schwarzen Listen, sie trifft keine automatisierten Entscheidungen über Personen und sie verhandelt keine Preise. Sie nimmt Reservierungen an — mehr nicht.</p>

      <h2>Der Telefonassistent</h2>
      <p>Am Telefon ist das Prinzip dasselbe: abheben, zuhören, die vier Angaben sammeln, eintragen. Technisch ist das deutlich aufwendiger als eine Textnachricht, weil Sprache erkannt, verstanden und wieder gesprochen werden muss. Der Telefonassistent ist deshalb noch in Entwicklung und noch nicht bei allen Restaurants aktiv — ich schreibe das lieber dazu, als es auf der Startseite zu verschweigen.</p>

      <h2>Deine Gäste wissen immer, dass es eine KI ist</h2>
      <p>Das ist mir wichtig, und seit dem EU AI Act ist es auch Pflicht. In der ersten Nachricht einer neuen Unterhaltung stellt sich der Assistent als digitaler Assistent deines Restaurants vor. Am Telefon ist es die Begrüßung: Grüß Gott, hier ist der digitale Telefonassistent.</p>
      <p>Niemand soll das Gefühl haben, hereingelegt worden zu sein. Eine KI, die vorgibt ein Mensch zu sein, mag im ersten Moment beeindrucken — spätestens beim zweiten Kontakt kostet sie Vertrauen. Und Vertrauen ist in der Gastronomie die eigentliche Währung.</p>
      <p>Welche KI-Systeme bei Butlery laufen und wie sie gekennzeichnet sind, steht ausführlich auf der Seite zur <a href="/ki-transparenz">KI-Transparenz</a>.</p>

      <h2>Am besten selbst ausprobieren</h2>
      <p>Erklären ist das eine. In der <a href="/demo">Live-Demo</a> buchst du selbst als Gast und siehst zu, wie die Reservierung in Echtzeit im Dashboard auftaucht. Ohne Konto, ohne E-Mail.</p>
    `,
  },
  {
    slug: "warum-ich-tablely-gebaut-habe",
    title: "Warum ich Butlery gebaut habe",
    date: "2026-07-10",
    teaser:
      "Mit 18 die Firma angemeldet, mit 19 im letzten Lehrjahr — und dazwischen die Erkenntnis, dass das eigentliche Problem der Gastronomie am Telefon hängt.",
    content: `
      <p>Ich heiße Michael Kleinlercher, bin 19 Jahre alt und komme aus St. Veit im Defereggental. Das ist ein Tal in Osttirol, in dem man die Wirtinnen und Wirte, über die ich hier schreibe, nicht aus einer Marktstudie kennt, sondern weil man bei ihnen isst.</p>

      <h2>Der 18. Geburtstag</h2>
      <p>An meinem 18. Geburtstag habe ich mein Unternehmen angemeldet. Michael Kleinlercher e.U. — das war der erste Tag, an dem ich das rechtlich überhaupt durfte, und ich wollte keinen davon verschenken. Parallel dazu stecke ich bis heute in der Lehre, aktuell im letzten Lehrjahr.</p>
      <p>Das klingt nach wenig Schlaf, und das stimmt auch. Aber es hat einen Vorteil, den ich lange unterschätzt habe: Ich baue keine Software für eine Zielgruppe, die ich aus Interviews kenne. Ich baue sie für Leute, denen ich im Ort begegne.</p>

      <h2>Vorher: Slotly</h2>
      <p>Mein erstes Produkt hieß Slotly und war eine Terminbuchung für Friseure. Die Idee war simpel: Wer gerade die Haare schneidet, kann nicht ans Telefon. Also soll die Buchung online passieren.</p>
      <p>Was ich dabei gelernt habe, war wertvoller als das Produkt selbst. Nämlich, dass eine Online-Buchungsseite nur die halbe Antwort ist. Die Leute rufen trotzdem an. Sie schreiben auf WhatsApp. Sie stehen in der Tür. Ein System, das nur einen dieser Wege abdeckt, löst das Problem nicht — es verschiebt es.</p>

      <h2>Dann der Blick in die Gastronomie</h2>
      <p>In Restaurants ist dieses Problem größer als beim Friseur, weil die Stoßzeit brutaler ist. Genau dann, wenn die Küche läuft und jeder Handgriff sitzen muss, klingelt das Telefon. Jemand legt ab, geht ans Buch, blättert, rechnet, ob Tisch 3 noch passt — und in der Zwischenzeit wartet der Gast im Lokal.</p>
      <p>Dazu kommt der Rest: die WhatsApp-Nachricht, die um 23 Uhr hereinkommt und bis morgen liegen bleibt. Der Zettel, den niemand ins Buch übertragen hat. Die Doppelbuchung, die man erst merkt, wenn beide Gruppen dastehen. Und der Tisch, der um 20 Uhr leer bleibt, weil jemand einfach nicht kommt.</p>
      <p>Also habe ich Butlery gebaut. WhatsApp, Telefon und die eigene Buchungsseite laufen in ein einziges Dashboard. Egal wie ein Gast bucht — es landet an derselben Stelle.</p>

      <h2>Ja, das ist KI. Und trotzdem bin ich es, der abhebt.</h2>
      <p>Wenn ich das erzähle, kommt oft ein Satz zurück: Ist ja nur KI. Meistens schwingt mit: also unpersönlich, also Baukasten, also irgendwann wieder weg.</p>
      <p>Ich verstehe die Skepsis, aber ich sehe es genau umgekehrt. Ja, ich nutze KI — sie geht für deine Gäste ans Telefon, damit du das nicht mitten im Service tun musst. Und während die KI mit deinen Gästen spricht, bin ich persönlich für dich erreichbar. Kein Ticketsystem, keine Warteschleife, keine Support-Adresse in einem anderen Land.</p>
      <p>Jedes Pilot-Restaurant richte ich selbst ein. Ich komme vorbei, wir legen die Tische an, wir stellen die Öffnungszeiten ein, und ich bleibe erreichbar, wenn etwas nicht passt. Das ist kein Zusatzangebot, das ist der Kern.</p>
      <p>Und deshalb gibt sich die KI auch immer als KI zu erkennen — in der ersten WhatsApp-Nachricht und in der Begrüßung am Telefon. Wer glaubt, mit einem Menschen zu schreiben, und später das Gegenteil merkt, verliert das Vertrauen. Genau das kann sich in der Gastronomie niemand leisten.</p>

      <h2>Warum zuerst Osttirol</h2>
      <p>Butlery soll in ganz Österreich laufen. Angefangen habe ich aber bewusst zu Hause. Ich suche die ersten Restaurants in Osttirol, die nie wieder einen Anruf verpassen wollen — und die ich persönlich einrichten kann.</p>
      <p>Dass ORF Tirol heute, die Tiroler Tageszeitung und top.tirol im Juni darüber berichtet haben, hat geholfen. Das Wichtigere sind aber die Wirtinnen und Wirte, die sich danach gemeldet haben.</p>

      <h2>Schau es dir an</h2>
      <p>Am ehrlichsten ist ausprobieren. In der <a href="/demo">Live-Demo</a> buchst du selbst als Gast einen Tisch und siehst dabei zu, wie die Reservierung in Echtzeit im Dashboard auftaucht — ohne Konto, ohne E-Mail, ohne dass dich danach jemand anruft.</p>
    `,
  },
];

/** Artikel nach Datum, neueste zuerst. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
