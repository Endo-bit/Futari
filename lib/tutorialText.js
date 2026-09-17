/* Strings for the guided tour and its demo partner.

   Kept out of i18n.js on purpose: that file is already two thousand lines of UI
   labels, and burying a tour that we expect to keep rewriting inside it is how
   the last one went three versions without anyone touching the copy.

   Deliberately terse. The first draft explained each step in two or three
   sentences and the tour read as a wall of text over a dimmed page — which is
   the opposite of the point, since the instruction is almost always just "tap
   the thing that's lit up". A title and at most one line. The spotlight says
   where; the body only says why, and only when that isn't obvious.

   `{n}` in a title or body is the demo partner's name. */

export const TUTORIAL_T = {
  en: {
    tutStart: "Show me",
    tutNext: "Next",
    tutExit: "Exit the tour",
    tutYourTurn: "Your turn",

    tutWelcomeTitle: "Let's write one together",
    tutWelcomeBody: "A few taps on the real pages. No explaining.",

    tutPromptTitle: "Today's little prompt",
    tutPromptBody: "Tap the box and answer it. One line is plenty.",
    tutHappyTitle: "Something good",
    tutHappyBody: "The smaller the better. Tap the card.",
    tutMindTitle: "Something on your mind",
    tutMindBody: "For the heavier things. If it might sting, Futari offers a gentler wording.",
    tutMoodTitle: "How today felt",
    tutMoodBody: "Tap whichever is closest.",
    tutSaveTitle: "Save the page",
    tutSaveBody: "That's a day, kept.",
    tutJournalTitle: "Every page you keep",
    tutJournalBody: "Days you've written on are marked. Tap one to reopen it.",

    tutDemoIntroTitle: "Now the part for two",
    tutDemoIntroBody: "Try it with {n}, a stand-in, before inviting anyone. Nothing here is saved.",
    tutDemoCta: "Try it now",
    tutDemoPromptTitle: "{n} has already written",
    tutDemoPromptBody: "Sealed until you write too.",
    tutDemoHappyTitle: "One more line",
    tutDemoHappyBody: "Then you're both done.",
    tutDemoRevealTitle: "Open them together",
    tutDemoRevealBody: "This is the bit people stay for.",
    tutDemoPartnerTitle: "There they are",
    tutDemoPartnerBody: "Written without seeing yours. With a real partner it lands at the same moment.",
    tutDemoRespondTitle: "Say something back",
    tutDemoRespondBody: "A heart, or a line.",
    tutDemoDoneTitle: "That's Futari",
    tutDemoDoneBody: "Write apart, open together. Two things left.",

    tutNotifTitle: "One quiet nudge a day",
    tutNotifBody: "One in the evening, one when your partner finishes. Nothing else.",
    tutNotifCta: "Turn on reminders",
    tutNotifLater: "Not now",

    tutInviteTitle: "Now the real thing",
    tutInviteBody: "Send a link — one tap and you're paired. Your first five days are free.",
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
    tutYourTurn: "Te toca",

    tutWelcomeTitle: "Escribamos uno juntos",
    tutWelcomeBody: "Unos toques en las páginas de verdad. Sin explicaciones.",

    tutPromptTitle: "La pregunta de hoy",
    tutPromptBody: "Toca la caja y contéstala. Con una línea basta.",
    tutHappyTitle: "Algo bueno",
    tutHappyBody: "Cuanto más pequeño, mejor. Toca la tarjeta.",
    tutMindTitle: "Algo que te ronda",
    tutMindBody: "Para lo que pesa. Si puede doler, Futari propone una forma más suave.",
    tutMoodTitle: "Cómo se sintió hoy",
    tutMoodBody: "Toca el que más se acerque.",
    tutSaveTitle: "Guarda la página",
    tutSaveBody: "Un día, guardado.",
    tutJournalTitle: "Todas tus páginas",
    tutJournalBody: "Los días que escribiste quedan marcados. Toca uno para reabrirlo.",

    tutDemoIntroTitle: "Ahora la parte de dos",
    tutDemoIntroBody: "Pruébalo con {n}, alguien de mentira, antes de invitar a nadie. Nada se guarda.",
    tutDemoCta: "Probarlo ahora",
    tutDemoPromptTitle: "{n} ya ha escrito",
    tutDemoPromptBody: "Sellado hasta que escribas tú.",
    tutDemoHappyTitle: "Una línea más",
    tutDemoHappyBody: "Y ya estaréis los dos.",
    tutDemoRevealTitle: "Abridlas a la vez",
    tutDemoRevealBody: "Esto es por lo que la gente se queda.",
    tutDemoPartnerTitle: "Ahí está",
    tutDemoPartnerBody: "Escrita sin ver la tuya. Con alguien real llega en el mismo instante.",
    tutDemoRespondTitle: "Devuélvele algo",
    tutDemoRespondBody: "Un corazón, o una línea.",
    tutDemoDoneTitle: "Esto es Futari",
    tutDemoDoneBody: "Escribir aparte, abrir juntos. Quedan dos cosas.",

    tutNotifTitle: "Un aviso tranquilo al día",
    tutNotifBody: "Uno por la tarde, otro cuando tu pareja termine. Nada más.",
    tutNotifCta: "Activar recordatorios",
    tutNotifLater: "Ahora no",

    tutInviteTitle: "Ahora de verdad",
    tutInviteBody: "Manda un enlace: un toque y estáis vinculados. Los primeros cinco días son gratis.",
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
    tutYourTurn: "À toi",

    tutWelcomeTitle: "Écrivons-en une ensemble",
    tutWelcomeBody: "Quelques gestes sur les vraies pages. Sans explications.",

    tutPromptTitle: "La question du jour",
    tutPromptBody: "Touche le cadre et réponds. Une ligne suffit.",
    tutHappyTitle: "Quelque chose de bien",
    tutHappyBody: "Plus c'est petit, mieux c'est. Touche la carte.",
    tutMindTitle: "Ce qui te trotte dans la tête",
    tutMindBody: "Pour ce qui pèse. Si ça risque de piquer, Futari propose plus doux.",
    tutMoodTitle: "L'humeur du jour",
    tutMoodBody: "Touche celle qui s'en rapproche.",
    tutSaveTitle: "Enregistre la page",
    tutSaveBody: "Une journée, gardée.",
    tutJournalTitle: "Toutes tes pages",
    tutJournalBody: "Les jours écrits sont marqués. Touche-en un pour le rouvrir.",

    tutDemoIntroTitle: "Maintenant, à deux",
    tutDemoIntroBody: "Essaie avec {n}, une doublure, avant d'inviter qui que ce soit. Rien n'est enregistré.",
    tutDemoCta: "Essayer maintenant",
    tutDemoPromptTitle: "{n} a déjà écrit",
    tutDemoPromptBody: "Scellé tant que tu n'as pas écrit.",
    tutDemoHappyTitle: "Encore une ligne",
    tutDemoHappyBody: "Et vous aurez fini tous les deux.",
    tutDemoRevealTitle: "Ouvrez en même temps",
    tutDemoRevealBody: "C'est pour ce moment qu'on reste.",
    tutDemoPartnerTitle: "La voilà",
    tutDemoPartnerBody: "Écrite sans voir la tienne. Avec quelqu'un de réel, ça arrive au même instant.",
    tutDemoRespondTitle: "Réponds-lui",
    tutDemoRespondBody: "Un cœur, ou une ligne.",
    tutDemoDoneTitle: "Voilà Futari",
    tutDemoDoneBody: "Écrire séparément, ouvrir ensemble. Encore deux choses.",

    tutNotifTitle: "Un rappel discret par jour",
    tutNotifBody: "Un le soir, un quand ton partenaire a fini. Rien d'autre.",
    tutNotifCta: "Activer les rappels",
    tutNotifLater: "Pas maintenant",

    tutInviteTitle: "Passons au vrai",
    tutInviteBody: "Envoie un lien : une touche et vous êtes liés. Vos cinq premiers jours sont offerts.",
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
    tutYourTurn: "Du bist dran",

    tutWelcomeTitle: "Schreiben wir eine zusammen",
    tutWelcomeBody: "Ein paar Schritte auf den echten Seiten. Ohne Erklärungen.",

    tutPromptTitle: "Die Frage von heute",
    tutPromptBody: "Tippe das Feld an und antworte. Eine Zeile reicht.",
    tutHappyTitle: "Etwas Gutes",
    tutHappyBody: "Je kleiner, desto besser. Tippe die Karte an.",
    tutMindTitle: "Was dir im Kopf herumgeht",
    tutMindBody: "Für das Schwerere. Klingt es scharf, schlägt Futari etwas Sanfteres vor.",
    tutMoodTitle: "Wie sich heute anfühlte",
    tutMoodBody: "Tippe, was am nächsten kommt.",
    tutSaveTitle: "Seite sichern",
    tutSaveBody: "Ein Tag, behalten.",
    tutJournalTitle: "Alle deine Seiten",
    tutJournalBody: "Tage mit Eintrag sind markiert. Tippe einen an, um ihn zu öffnen.",

    tutDemoIntroTitle: "Jetzt der Teil zu zweit",
    tutDemoIntroBody: "Probier es mit {n}, einer Platzhalterin, bevor du jemanden einlädst. Nichts wird gespeichert.",
    tutDemoCta: "Jetzt ausprobieren",
    tutDemoPromptTitle: "{n} hat schon geschrieben",
    tutDemoPromptBody: "Versiegelt, bis du auch schreibst.",
    tutDemoHappyTitle: "Noch eine Zeile",
    tutDemoHappyBody: "Dann seid ihr beide fertig.",
    tutDemoRevealTitle: "Gemeinsam öffnen",
    tutDemoRevealBody: "Dafür bleiben die Leute.",
    tutDemoPartnerTitle: "Da ist sie",
    tutDemoPartnerBody: "Geschrieben, ohne deine zu sehen. Mit einem echten Menschen kommt das im selben Moment.",
    tutDemoRespondTitle: "Antworte etwas",
    tutDemoRespondBody: "Ein Herz, oder eine Zeile.",
    tutDemoDoneTitle: "Das ist Futari",
    tutDemoDoneBody: "Getrennt schreiben, gemeinsam öffnen. Noch zwei Dinge.",

    tutNotifTitle: "Einmal am Tag, leise",
    tutNotifBody: "Eine am Abend, eine wenn dein Gegenüber fertig ist. Sonst nichts.",
    tutNotifCta: "Erinnerungen einschalten",
    tutNotifLater: "Jetzt nicht",

    tutInviteTitle: "Und jetzt echt",
    tutInviteBody: "Schick einen Link — ein Tipp und ihr seid verbunden. Die ersten fünf Tage sind frei.",
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
    tutYourTurn: "Tocca a te",

    tutWelcomeTitle: "Scriviamone una insieme",
    tutWelcomeBody: "Pochi tocchi sulle pagine vere. Senza spiegazioni.",

    tutPromptTitle: "La domanda di oggi",
    tutPromptBody: "Tocca il riquadro e rispondi. Basta una riga.",
    tutHappyTitle: "Qualcosa di bello",
    tutHappyBody: "Più è piccolo, meglio è. Tocca la scheda.",
    tutMindTitle: "Qualcosa che ti gira in testa",
    tutMindBody: "Per le cose pesanti. Se può pungere, Futari propone un modo più gentile.",
    tutMoodTitle: "Com'è andata oggi",
    tutMoodBody: "Tocca quella che ci si avvicina di più.",
    tutSaveTitle: "Salva la pagina",
    tutSaveBody: "Un giorno, tenuto.",
    tutJournalTitle: "Tutte le tue pagine",
    tutJournalBody: "I giorni scritti restano segnati. Toccane uno per riaprirlo.",

    tutDemoIntroTitle: "Ora la parte in due",
    tutDemoIntroBody: "Provalo con {n}, una controfigura, prima di invitare qualcuno. Non si salva nulla.",
    tutDemoCta: "Provalo ora",
    tutDemoPromptTitle: "{n} ha già scritto",
    tutDemoPromptBody: "Sigillata finché non scrivi anche tu.",
    tutDemoHappyTitle: "Ancora una riga",
    tutDemoHappyBody: "Poi avrete finito entrambi.",
    tutDemoRevealTitle: "Apritele insieme",
    tutDemoRevealBody: "È per questo che la gente resta.",
    tutDemoPartnerTitle: "Eccola",
    tutDemoPartnerBody: "Scritta senza vedere la tua. Con una persona vera arriva nello stesso istante.",
    tutDemoRespondTitle: "Rispondi qualcosa",
    tutDemoRespondBody: "Un cuore, o una riga.",
    tutDemoDoneTitle: "Questo è Futari",
    tutDemoDoneBody: "Scrivere separati, aprire insieme. Mancano due cose.",

    tutNotifTitle: "Un promemoria discreto al giorno",
    tutNotifBody: "Uno la sera, uno quando l'altra persona ha finito. Nient'altro.",
    tutNotifCta: "Attiva i promemoria",
    tutNotifLater: "Non ora",

    tutInviteTitle: "Ora quello vero",
    tutInviteBody: "Manda un link: un tocco e siete collegati. I primi cinque giorni sono gratis.",
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
    tutYourTurn: "どうぞ",

    tutWelcomeTitle: "いっしょに1ページ書こう",
    tutWelcomeBody: "説明はしません。実際の画面を数回タップするだけ。",

    tutPromptTitle: "今日のお題",
    tutPromptBody: "枠をタップして、一行だけでも答えてみて。",
    tutHappyTitle: "うれしかったこと",
    tutHappyBody: "小さいほどいい。カードをタップ。",
    tutMindTitle: "気になっていること",
    tutMindBody: "重たいこと用。きつく聞こえそうなら、やさしい言い方を提案するよ。",
    tutMoodTitle: "今日の気分",
    tutMoodBody: "近いものをタップするだけ。",
    tutSaveTitle: "ページを保存",
    tutSaveBody: "これで一日がひとつ残る。",
    tutJournalTitle: "書いたページは全部ここ",
    tutJournalBody: "書いた日には印がつくよ。タップすれば開き直せる。",

    tutDemoIntroTitle: "ここからは、ふたり用",
    tutDemoIntroBody: "誰かを誘う前に、代役の{n}と試してみよう。この分は保存されないよ。",
    tutDemoCta: "試してみる",
    tutDemoPromptTitle: "{n}はもう書き終えてる",
    tutDemoPromptBody: "あなたが書くまで開けないよ。",
    tutDemoHappyTitle: "もう一行だけ",
    tutDemoHappyBody: "これでふたりとも書き終わり。",
    tutDemoRevealTitle: "せーので開こう",
    tutDemoRevealBody: "この瞬間のために続ける人が多いよ。",
    tutDemoPartnerTitle: "これが相手のページ",
    tutDemoPartnerBody: "あなたのを見ずに書いたもの。本物の相手とは同時に届くよ。",
    tutDemoRespondTitle: "何か返してみよう",
    tutDemoRespondBody: "ハートひとつでも、一行でも。",
    tutDemoDoneTitle: "これがFutari",
    tutDemoDoneBody: "別々に書いて、いっしょに開く。あと2つ。",

    tutNotifTitle: "1日1回だけ、そっと",
    tutNotifBody: "夜に1通と、相手が書き終わったとき1通。それだけ。",
    tutNotifCta: "リマインダーをオンにする",
    tutNotifLater: "いまはしない",

    tutInviteTitle: "じゃあ、本物の相手と",
    tutInviteBody: "リンクを送るだけ。タップでペア成立。最初の5日は無料。",
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
