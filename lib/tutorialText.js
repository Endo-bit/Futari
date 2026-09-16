/* Strings for the guided tour and its demo partner.

   Kept out of i18n.js on purpose: that file is already two thousand lines of UI
   labels, and burying a tour that we expect to keep rewriting inside it is how
   the last one went three versions without anyone touching the copy.

   `{n}` in a body is the demo partner's name. */

export const TUTORIAL_T = {
  en: {
    tutStart: "Show me",
    tutNext: "Next",
    tutExit: "Exit the tour",
    tutSkipStep: "Skip this bit",
    tutYourTurn: "Your turn — I'll wait",

    tutWelcomeTitle: "Let's write one together",
    tutWelcomeBody:
      "Rather than explain Futari, let's just do it. A few taps, on the real pages, and by the end you'll have written today and opened a page with someone.",

    tutPromptTitle: "Today's little prompt",
    tutPromptBody: "Every day brings a new one. Tap the box and answer it — one line is plenty.",
    tutHappyTitle: "Something good",
    tutHappyBody: "The smaller the better. A coffee, a text, ten quiet minutes. Tap the card and write it down.",
    tutMindTitle: "Something on your mind",
    tutMindBody:
      "This one's for the heavier things. If what you write sounds like it might sting, Futari offers a gentler way to say it.",
    tutMoodTitle: "How today felt",
    tutMoodBody: "Tap whichever one is closest. It's the fastest way to look back over a month.",
    tutSaveTitle: "Save the page",
    tutSaveBody: "That's a day, kept. Tap save.",
    tutJournalTitle: "Every page you keep",
    tutJournalBody:
      "Days you've written on are marked. Tap any one to reopen it, and add anniversaries you don't want to miss.",

    tutDemoIntroTitle: "Now the part for two",
    tutDemoIntroBody:
      "Futari is really about writing apart and opening together. You don't have anyone paired yet — so let's try it with {n}, a stand-in, right now. Nothing here is saved.",
    tutDemoPromptTitle: "{n} has already written",
    tutDemoPromptBody:
      "Their page is finished and sealed — you can't read a word of it yet. Write your own answer first.",
    tutDemoHappyTitle: "One more line",
    tutDemoHappyBody: "Something good from your day. Then you'll both be done.",
    tutDemoRevealTitle: "Open them together",
    tutDemoRevealBody: "You've both written, so the seal lifts. Tap reveal — this is the bit people stay for.",
    tutDemoPartnerTitle: "There they are",
    tutDemoPartnerBody: "{n}'s page, written without seeing yours. With a real partner this lands at the same moment for both of you.",
    tutDemoRespondTitle: "Say something back",
    tutDemoRespondBody: "Pick a heart, or write a line. Small replies are the whole point.",
    tutDemoDoneTitle: "That's Futari",
    tutDemoDoneBody: "Write apart, open together, answer each other. Two things left and you're set up.",

    tutNotifTitle: "One quiet nudge a day",
    tutNotifBody:
      "A diary you're never reminded of is a diary you stop writing. One notification in the evening, and one when your partner has finished their page. Nothing else, ever.",
    tutNotifCta: "Turn on reminders",
    tutNotifLater: "Not now",

    tutInviteTitle: "Now the real thing",
    tutInviteBody:
      "Send your partner a link. They tap it, and you're paired — no codes to read out. Your first five days together are free.",
    tutInviteCta: "Invite my partner",
    tutInviteLater: "I'll do it later",

    demoPartnerName: "Mio",
    demoPartnerHappy: "You laughed at something on the train and didn't notice me watching.",
    demoPartnerMind: "I've been quieter this week — it's tiredness, not you. I didn't want you wondering.",
    demoPartnerNext: "Let's walk the long way home on Sunday, with no plan.",
    demoPartnerPromptAnswer: "The way the kitchen smelled when I got in.",
    demoPartnerReply: "Reading that made my whole evening ♡",
    demoSharedGoal: "Be kinder about Sundays.",
    demoNextPlan: "That little place by the river.",
  },

  es: {
    tutStart: "Enséñame",
    tutNext: "Siguiente",
    tutExit: "Salir del tour",
    tutSkipStep: "Saltar esto",
    tutYourTurn: "Te toca — te espero",

    tutWelcomeTitle: "Escribamos uno juntos",
    tutWelcomeBody:
      "En vez de explicarte Futari, vamos a hacerlo. Unos toques, en las páginas de verdad, y al final habrás escrito el día de hoy y abierto una página con alguien.",

    tutPromptTitle: "La pregunta de hoy",
    tutPromptBody: "Cada día trae una nueva. Toca la caja y contéstala — con una línea basta.",
    tutHappyTitle: "Algo bueno",
    tutHappyBody: "Cuanto más pequeño, mejor. Un café, un mensaje, diez minutos de calma. Toca la tarjeta y escríbelo.",
    tutMindTitle: "Algo que te ronda",
    tutMindBody:
      "Esta es para lo que pesa. Si lo que escribes suena a que podría doler, Futari te ofrece una forma más suave de decirlo.",
    tutMoodTitle: "Cómo se sintió hoy",
    tutMoodBody: "Toca el que más se acerque. Es la forma más rápida de mirar atrás un mes entero.",
    tutSaveTitle: "Guarda la página",
    tutSaveBody: "Un día, guardado. Toca guardar.",
    tutJournalTitle: "Todas tus páginas",
    tutJournalBody:
      "Los días en los que escribiste quedan marcados. Toca cualquiera para volver a abrirlo, y añade las fechas que no quieres olvidar.",

    tutDemoIntroTitle: "Ahora la parte de dos",
    tutDemoIntroBody:
      "Futari va de escribir por separado y abrir a la vez. Todavía no tienes pareja vinculada — así que probémoslo con {n}, alguien de mentira, ahora mismo. Nada de esto se guarda.",
    tutDemoPromptTitle: "{n} ya ha escrito",
    tutDemoPromptBody: "Su página está terminada y sellada — aún no puedes leer ni una palabra. Escribe la tuya primero.",
    tutDemoHappyTitle: "Una línea más",
    tutDemoHappyBody: "Algo bueno de tu día. Y ya estaréis los dos.",
    tutDemoRevealTitle: "Abridlas a la vez",
    tutDemoRevealBody: "Habéis escrito los dos, así que el sello se levanta. Toca revelar — esto es por lo que la gente se queda.",
    tutDemoPartnerTitle: "Ahí está",
    tutDemoPartnerBody: "La página de {n}, escrita sin ver la tuya. Con una pareja real esto ocurre en el mismo instante para los dos.",
    tutDemoRespondTitle: "Devuélvele algo",
    tutDemoRespondBody: "Elige un corazón, o escribe una línea. Las respuestas pequeñas son justo el sentido de esto.",
    tutDemoDoneTitle: "Esto es Futari",
    tutDemoDoneBody: "Escribir aparte, abrir juntos, responderse. Dos cosas más y estás listo/a.",

    tutNotifTitle: "Un aviso tranquilo al día",
    tutNotifBody:
      "Un diario del que nadie te acuerda es un diario que dejas. Una notificación por la tarde, y otra cuando tu pareja termine su página. Nada más, nunca.",
    tutNotifCta: "Activar recordatorios",
    tutNotifLater: "Ahora no",

    tutInviteTitle: "Ahora de verdad",
    tutInviteBody:
      "Mándale un enlace a tu pareja. Lo toca y quedáis vinculados — sin códigos que dictar. Vuestros primeros cinco días juntos son gratis.",
    tutInviteCta: "Invitar a mi pareja",
    tutInviteLater: "Lo hago luego",

    demoPartnerName: "Mio",
    demoPartnerHappy: "Te reíste de algo en el tren y no notaste que te estaba mirando.",
    demoPartnerMind: "He estado más callada esta semana — es cansancio, no tú. No quería que le dieras vueltas.",
    demoPartnerNext: "Volvamos a casa por el camino largo el domingo, sin plan.",
    demoPartnerPromptAnswer: "Cómo olía la cocina al entrar.",
    demoPartnerReply: "Leer eso me ha hecho la tarde entera ♡",
    demoSharedGoal: "Ser más amables con los domingos.",
    demoNextPlan: "Ese sitio pequeño junto al río.",
  },

  fr: {
    tutStart: "Montre-moi",
    tutNext: "Suivant",
    tutExit: "Quitter le guide",
    tutSkipStep: "Passer cette étape",
    tutYourTurn: "À toi — je t'attends",

    tutWelcomeTitle: "Écrivons-en une ensemble",
    tutWelcomeBody:
      "Plutôt que d'expliquer Futari, faisons-le. Quelques gestes, sur les vraies pages, et à la fin tu auras écrit ta journée et ouvert une page avec quelqu'un.",

    tutPromptTitle: "La question du jour",
    tutPromptBody: "Il y en a une nouvelle chaque jour. Touche le cadre et réponds — une ligne suffit.",
    tutHappyTitle: "Quelque chose de bien",
    tutHappyBody: "Plus c'est petit, mieux c'est. Un café, un message, dix minutes au calme. Touche la carte et écris-le.",
    tutMindTitle: "Ce qui te trotte dans la tête",
    tutMindBody:
      "Celle-ci est pour ce qui pèse. Si ce que tu écris risque de piquer, Futari propose une façon plus douce de le dire.",
    tutMoodTitle: "L'humeur du jour",
    tutMoodBody: "Touche celle qui s'en rapproche le plus. C'est le moyen le plus rapide de relire un mois.",
    tutSaveTitle: "Enregistre la page",
    tutSaveBody: "Une journée, gardée. Touche enregistrer.",
    tutJournalTitle: "Toutes tes pages",
    tutJournalBody:
      "Les jours où tu as écrit sont marqués. Touche l'un d'eux pour le rouvrir, et ajoute les dates à ne pas manquer.",

    tutDemoIntroTitle: "Maintenant, à deux",
    tutDemoIntroBody:
      "Futari, c'est écrire chacun de son côté et ouvrir en même temps. Tu n'as encore personne — essayons donc avec {n}, une doublure, tout de suite. Rien de tout ça n'est enregistré.",
    tutDemoPromptTitle: "{n} a déjà écrit",
    tutDemoPromptBody: "Sa page est finie et scellée — tu n'en lis pas un mot pour l'instant. Écris d'abord la tienne.",
    tutDemoHappyTitle: "Encore une ligne",
    tutDemoHappyBody: "Quelque chose de bien dans ta journée. Et vous aurez fini tous les deux.",
    tutDemoRevealTitle: "Ouvrez en même temps",
    tutDemoRevealBody: "Vous avez écrit tous les deux, le sceau se lève. Touche révéler — c'est pour ce moment qu'on reste.",
    tutDemoPartnerTitle: "La voilà",
    tutDemoPartnerBody: "La page de {n}, écrite sans voir la tienne. Avec un vrai partenaire, ça arrive au même instant pour vous deux.",
    tutDemoRespondTitle: "Réponds-lui",
    tutDemoRespondBody: "Choisis un cœur, ou écris une ligne. Les petites réponses, c'est tout l'intérêt.",
    tutDemoDoneTitle: "Voilà Futari",
    tutDemoDoneBody: "Écrire séparément, ouvrir ensemble, se répondre. Encore deux choses et c'est prêt.",

    tutNotifTitle: "Un rappel discret par jour",
    tutNotifBody:
      "Un journal dont on ne te reparle jamais est un journal que tu arrêtes. Une notification le soir, et une quand ton partenaire a fini sa page. Rien d'autre, jamais.",
    tutNotifCta: "Activer les rappels",
    tutNotifLater: "Pas maintenant",

    tutInviteTitle: "Passons au vrai",
    tutInviteBody:
      "Envoie un lien à ton partenaire. Il le touche, et vous êtes liés — aucun code à dicter. Vos cinq premiers jours ensemble sont offerts.",
    tutInviteCta: "Inviter mon partenaire",
    tutInviteLater: "Plus tard",

    demoPartnerName: "Mio",
    demoPartnerHappy: "Tu as ri de quelque chose dans le train sans voir que je te regardais.",
    demoPartnerMind: "J'ai été plus silencieuse cette semaine — c'est la fatigue, pas toi. Je ne voulais pas que tu te poses la question.",
    demoPartnerNext: "Rentrons par le chemin le plus long dimanche, sans rien prévoir.",
    demoPartnerPromptAnswer: "L'odeur de la cuisine en rentrant.",
    demoPartnerReply: "Lire ça a illuminé toute ma soirée ♡",
    demoSharedGoal: "Être plus doux avec les dimanches.",
    demoNextPlan: "Ce petit endroit au bord de la rivière.",
  },

  de: {
    tutStart: "Zeig es mir",
    tutNext: "Weiter",
    tutExit: "Tour beenden",
    tutSkipStep: "Diesen Schritt überspringen",
    tutYourTurn: "Du bist dran — ich warte",

    tutWelcomeTitle: "Schreiben wir eine zusammen",
    tutWelcomeBody:
      "Statt Futari zu erklären, machen wir es einfach. Ein paar Schritte auf den echten Seiten, und am Ende hast du heute geschrieben und eine Seite mit jemandem geöffnet.",

    tutPromptTitle: "Die Frage von heute",
    tutPromptBody: "Jeden Tag eine neue. Tippe das Feld an und antworte — eine Zeile reicht.",
    tutHappyTitle: "Etwas Gutes",
    tutHappyBody: "Je kleiner, desto besser. Ein Kaffee, eine Nachricht, zehn ruhige Minuten. Tippe die Karte an und schreib es auf.",
    tutMindTitle: "Was dir im Kopf herumgeht",
    tutMindBody:
      "Die hier ist für das Schwerere. Klingt das Geschriebene, als könnte es wehtun, schlägt Futari eine sanftere Formulierung vor.",
    tutMoodTitle: "Wie sich heute anfühlte",
    tutMoodBody: "Tippe das, was am nächsten kommt. Nichts geht schneller, wenn man auf einen Monat zurückschaut.",
    tutSaveTitle: "Seite sichern",
    tutSaveBody: "Ein Tag, behalten. Tippe auf Speichern.",
    tutJournalTitle: "Alle deine Seiten",
    tutJournalBody:
      "Tage mit Eintrag sind markiert. Tippe einen an, um ihn wieder zu öffnen, und trag die Daten ein, die du nicht verpassen willst.",

    tutDemoIntroTitle: "Jetzt der Teil zu zweit",
    tutDemoIntroBody:
      "Bei Futari geht es darum, getrennt zu schreiben und gemeinsam zu öffnen. Du bist noch mit niemandem verbunden — probieren wir es also gleich mit {n}, einer Platzhalterin. Nichts davon wird gespeichert.",
    tutDemoPromptTitle: "{n} hat schon geschrieben",
    tutDemoPromptBody: "Ihre Seite ist fertig und versiegelt — noch kein Wort davon für dich. Schreib zuerst deine.",
    tutDemoHappyTitle: "Noch eine Zeile",
    tutDemoHappyBody: "Etwas Gutes von heute. Dann seid ihr beide fertig.",
    tutDemoRevealTitle: "Gemeinsam öffnen",
    tutDemoRevealBody: "Ihr habt beide geschrieben, das Siegel geht auf. Tippe auf Aufdecken — dafür bleiben die Leute.",
    tutDemoPartnerTitle: "Da ist sie",
    tutDemoPartnerBody: "{n}s Seite, geschrieben ohne deine zu sehen. Mit einem echten Menschen passiert das für euch beide im selben Moment.",
    tutDemoRespondTitle: "Antworte etwas",
    tutDemoRespondBody: "Ein Herz, oder eine Zeile. Genau um die kleinen Antworten geht es.",
    tutDemoDoneTitle: "Das ist Futari",
    tutDemoDoneBody: "Getrennt schreiben, gemeinsam öffnen, einander antworten. Noch zwei Dinge und du bist eingerichtet.",

    tutNotifTitle: "Einmal am Tag, leise",
    tutNotifBody:
      "Ein Tagebuch, an das dich nie jemand erinnert, ist ein Tagebuch, das du aufgibst. Eine Nachricht am Abend, und eine, wenn dein Gegenüber seine Seite fertig hat. Sonst nichts, nie.",
    tutNotifCta: "Erinnerungen einschalten",
    tutNotifLater: "Jetzt nicht",

    tutInviteTitle: "Und jetzt echt",
    tutInviteBody:
      "Schick einen Link. Antippen genügt, und ihr seid verbunden — keine Codes zum Vorlesen. Eure ersten fünf Tage zusammen sind kostenlos.",
    tutInviteCta: "Partner einladen",
    tutInviteLater: "Später",

    demoPartnerName: "Mio",
    demoPartnerHappy: "Du hast im Zug über irgendetwas gelacht und nicht gemerkt, dass ich zusehe.",
    demoPartnerMind: "Ich war diese Woche stiller — das ist Müdigkeit, nicht du. Ich wollte nicht, dass du grübelst.",
    demoPartnerNext: "Lass uns am Sonntag den langen Weg nach Hause nehmen, ohne Plan.",
    demoPartnerPromptAnswer: "Wie die Küche gerochen hat, als ich reinkam.",
    demoPartnerReply: "Das zu lesen hat mir den ganzen Abend gerettet ♡",
    demoSharedGoal: "Freundlicher mit Sonntagen umgehen.",
    demoNextPlan: "Der kleine Laden am Fluss.",
  },

  it: {
    tutStart: "Fammi vedere",
    tutNext: "Avanti",
    tutExit: "Esci dal tour",
    tutSkipStep: "Salta questo",
    tutYourTurn: "Tocca a te — ti aspetto",

    tutWelcomeTitle: "Scriviamone una insieme",
    tutWelcomeBody:
      "Invece di spiegarti Futari, facciamolo. Pochi tocchi, sulle pagine vere, e alla fine avrai scritto oggi e aperto una pagina con qualcuno.",

    tutPromptTitle: "La domanda di oggi",
    tutPromptBody: "Ogni giorno ne arriva una nuova. Tocca il riquadro e rispondi — basta una riga.",
    tutHappyTitle: "Qualcosa di bello",
    tutHappyBody: "Più è piccolo, meglio è. Un caffè, un messaggio, dieci minuti di quiete. Tocca la scheda e scrivilo.",
    tutMindTitle: "Qualcosa che ti gira in testa",
    tutMindBody:
      "Questa è per le cose pesanti. Se quello che scrivi sembra poter pungere, Futari propone un modo più gentile di dirlo.",
    tutMoodTitle: "Com'è andata oggi",
    tutMoodBody: "Tocca quella che ci si avvicina di più. È il modo più veloce per riguardare un mese.",
    tutSaveTitle: "Salva la pagina",
    tutSaveBody: "Un giorno, tenuto. Tocca salva.",
    tutJournalTitle: "Tutte le tue pagine",
    tutJournalBody:
      "I giorni in cui hai scritto restano segnati. Tocca uno qualsiasi per riaprirlo, e aggiungi le date che non vuoi perdere.",

    tutDemoIntroTitle: "Ora la parte in due",
    tutDemoIntroBody:
      "Futari è scrivere separati e aprire insieme. Non hai ancora nessuno collegato — proviamolo con {n}, una controfigura, adesso. Niente di tutto questo viene salvato.",
    tutDemoPromptTitle: "{n} ha già scritto",
    tutDemoPromptBody: "La sua pagina è finita e sigillata — non puoi leggerne una parola. Scrivi prima la tua.",
    tutDemoHappyTitle: "Ancora una riga",
    tutDemoHappyBody: "Qualcosa di bello della tua giornata. Poi avrete finito entrambi.",
    tutDemoRevealTitle: "Apritele insieme",
    tutDemoRevealBody: "Avete scritto tutti e due, il sigillo si apre. Tocca rivela — è per questo che la gente resta.",
    tutDemoPartnerTitle: "Eccola",
    tutDemoPartnerBody: "La pagina di {n}, scritta senza vedere la tua. Con una persona vera succede nello stesso istante per entrambi.",
    tutDemoRespondTitle: "Rispondi qualcosa",
    tutDemoRespondBody: "Scegli un cuore, o scrivi una riga. Le risposte piccole sono tutto il senso.",
    tutDemoDoneTitle: "Questo è Futari",
    tutDemoDoneBody: "Scrivere separati, aprire insieme, rispondersi. Ancora due cose e sei a posto.",

    tutNotifTitle: "Un promemoria discreto al giorno",
    tutNotifBody:
      "Un diario di cui nessuno ti ricorda è un diario che smetti di scrivere. Una notifica la sera, e una quando l'altra persona ha finito la sua pagina. Nient'altro, mai.",
    tutNotifCta: "Attiva i promemoria",
    tutNotifLater: "Non ora",

    tutInviteTitle: "Ora quello vero",
    tutInviteBody:
      "Manda un link alla tua persona. Lo tocca e siete collegati — nessun codice da dettare. I vostri primi cinque giorni insieme sono gratis.",
    tutInviteCta: "Invita il mio partner",
    tutInviteLater: "Lo farò dopo",

    demoPartnerName: "Mio",
    demoPartnerHappy: "Hai riso per qualcosa sul treno senza accorgerti che ti guardavo.",
    demoPartnerMind: "Questa settimana sono stata più zitta — è stanchezza, non sei tu. Non volevo che ci pensassi su.",
    demoPartnerNext: "Domenica torniamo a casa dalla strada lunga, senza programmi.",
    demoPartnerPromptAnswer: "Il profumo della cucina quando sono entrata.",
    demoPartnerReply: "Leggerlo mi ha sistemato tutta la serata ♡",
    demoSharedGoal: "Essere più gentili con le domeniche.",
    demoNextPlan: "Quel postino vicino al fiume.",
  },

  ja: {
    tutStart: "やってみる",
    tutNext: "次へ",
    tutExit: "チュートリアルを終える",
    tutSkipStep: "この手順を飛ばす",
    tutYourTurn: "どうぞ。待ってるね",

    tutWelcomeTitle: "いっしょに1ページ書こう",
    tutWelcomeBody:
      "説明するより、実際にやってみよう。本物の画面を数回タップするだけで、今日のページが書けて、誰かとページを開くところまでいけるよ。",

    tutPromptTitle: "今日のお題",
    tutPromptBody: "毎日ちがうお題が届くよ。枠をタップして答えてみて。一行で十分。",
    tutHappyTitle: "うれしかったこと",
    tutHappyBody: "小さいほどいい。コーヒー、届いた連絡、静かな10分。カードをタップして書いてみて。",
    tutMindTitle: "気になっていること",
    tutMindBody:
      "ここは重たいこと用。きつく聞こえそうな言葉を書くと、Futariがそっとやわらかい言い方を提案してくれるよ。",
    tutMoodTitle: "今日の気分",
    tutMoodBody: "近いものをタップするだけ。あとで1か月をふり返るとき、これがいちばん早いよ。",
    tutSaveTitle: "ページを保存",
    tutSaveBody: "これで一日がひとつ残る。保存をタップ。",
    tutJournalTitle: "書いたページは全部ここ",
    tutJournalBody:
      "書いた日には印がつくよ。どの日もタップすれば開き直せるし、忘れたくない記念日も足しておける。",

    tutDemoIntroTitle: "ここからは、ふたり用",
    tutDemoIntroBody:
      "Futariの本当のところは、別々に書いて同時に開くこと。まだ相手とつながっていないから、代役の{n}とここで試してみよう。この分は保存されないよ。",
    tutDemoPromptTitle: "{n}はもう書き終えてる",
    tutDemoPromptBody: "相手のページは完成して封がされた状態。まだ一文字も読めないよ。まずは自分の分を書こう。",
    tutDemoHappyTitle: "もう一行だけ",
    tutDemoHappyBody: "今日のよかったこと。これでふたりとも書き終わり。",
    tutDemoRevealTitle: "せーので開こう",
    tutDemoRevealBody: "ふたりとも書けたから、封がとける。「開く」をタップ。この瞬間のために続ける人が多いよ。",
    tutDemoPartnerTitle: "これが相手のページ",
    tutDemoPartnerBody: "{n}があなたのページを見ずに書いたもの。本物の相手となら、これがふたり同時に届くよ。",
    tutDemoRespondTitle: "何か返してみよう",
    tutDemoRespondBody: "ハートを選ぶだけでも、一行書いてもいい。この小さな返事がぜんぶ。",
    tutDemoDoneTitle: "これがFutari",
    tutDemoDoneBody: "別々に書いて、いっしょに開いて、返事をする。あと2つで準備完了。",

    tutNotifTitle: "1日1回だけ、そっと",
    tutNotifBody:
      "思い出さない日記は、そのうち書かなくなる。夜に1通と、相手が書き終わったときに1通。それ以外は送らないよ。",
    tutNotifCta: "リマインダーをオンにする",
    tutNotifLater: "いまはしない",

    tutInviteTitle: "じゃあ、本物の相手と",
    tutInviteBody:
      "リンクを送るだけ。相手がタップすればペアになるよ。コードを読み上げる必要はもうない。最初の5日間は無料。",
    tutInviteCta: "相手を招待する",
    tutInviteLater: "あとでやる",

    demoPartnerName: "ミオ",
    demoPartnerHappy: "電車で何かに笑ってたでしょ。見られてるの、気づいてなかったね。",
    demoPartnerMind: "今週ちょっと静かだったのは、疲れてるだけ。あなたのせいじゃないよ。気にさせたくなくて書いた。",
    demoPartnerNext: "日曜、遠回りして帰らない？予定は決めずに。",
    demoPartnerPromptAnswer: "帰ったときの、台所のにおい。",
    demoPartnerReply: "それ読んだだけで、今日の夜がぜんぶよくなった ♡",
    demoSharedGoal: "日曜をもう少しやさしく過ごす。",
    demoNextPlan: "川沿いの、あの小さい店。",
  },
};

/* The message that goes out with a pairing link.

   Separate from `inviteFriendMessage`, which is the generic "you might like this
   app" share: this one carries a code and is addressed to one specific person,
   so it says what tapping it will do. `{url}` is the pairing link. */
export const INVITE_T = {
  en: {
    pairInviteMessage:
      "I've started a little shared diary on Futari and I'd like to keep it with you ♡ Tap this and we're paired — no code to type: {url}",
    pairInviteShareTitle: "Write with me on Futari",
  },
  es: {
    pairInviteMessage:
      "He empezado un diario compartido en Futari y me gustaría llevarlo contigo ♡ Toca esto y quedamos vinculados, sin códigos: {url}",
    pairInviteShareTitle: "Escribe conmigo en Futari",
  },
  fr: {
    pairInviteMessage:
      "J'ai commencé un petit journal partagé sur Futari et j'aimerais le tenir avec toi ♡ Touche ce lien et on est liés, sans code : {url}",
    pairInviteShareTitle: "Écris avec moi sur Futari",
  },
  de: {
    pairInviteMessage:
      "Ich habe auf Futari ein kleines gemeinsames Tagebuch angefangen und würde es gern mit dir führen ♡ Tippe hier, dann sind wir verbunden — ohne Code: {url}",
    pairInviteShareTitle: "Schreib mit mir auf Futari",
  },
  it: {
    pairInviteMessage:
      "Ho iniziato un piccolo diario condiviso su Futari e mi piacerebbe tenerlo con te ♡ Tocca qui e siamo collegati, senza codici: {url}",
    pairInviteShareTitle: "Scrivi con me su Futari",
  },
  ja: {
    pairInviteMessage:
      "Futariっていう、ふたりで書く日記を始めたよ。よかったら一緒にどう？このリンクを開くだけでペアになるよ（コード入力はいらない）: {url}",
    pairInviteShareTitle: "Futariでいっしょに書こう",
  },
};
