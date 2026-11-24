/* The games' content: the love-type quiz, the this-or-that deck, the
   "how well do you know me" question bank and the diary-bingo squares.

   Plain data, one block per language. The backend (Futari/lib/playContent.js)
   keeps a byte-for-byte copy so the web page a partner opens from a shared link
   asks exactly the same questions — change one, change both.

   Love types: each of the six quiz questions has three answers, and each type
   is behind exactly three answers across the quiz, so no type is easier to land
   on than another. */

export const TYPE_KEYS = ["words", "time", "touch", "gifts", "help", "adventure"];

/* Which answer of each question counts for which type (same for every language). */
export const TYPE_QUIZ_KEYS = [
  ["words", "time", "touch"],
  ["words", "gifts", "adventure"],
  ["touch", "help", "time"],
  ["adventure", "time", "gifts"],
  ["help", "words", "adventure"],
  ["gifts", "touch", "help"],
];

/* The type that sits best beside each one (shown on the result card). */
export const TYPE_MATCH = { words: "touch", time: "adventure", touch: "words", gifts: "help", help: "gifts", adventure: "time" };

export const PLAY_CONTENT = {
  en: {
    types: {
      words: { name: "The Love-Letter Writer", line: "Words are how you hold someone. A small “thank you” stays with you all day.", tip: "Tell them out loud what you like about them — even the tiny things." },
      time: { name: "The Quiet Companion", line: "Being side by side is enough. You feel loved in unhurried time together.", tip: "Put the phones away for ten minutes, and just be together." },
      touch: { name: "The Warm Hugger", line: "A hand to hold says more than a speech. Warmth is your love language.", tip: "A hug at the door, a hand on the shoulder — often." },
      gifts: { name: "The Little-Surprise Giver", line: "“I saw this and thought of you” melts you. It's the thought that sparkles.", tip: "Bring back something small, with a story behind it." },
      help: { name: "The Quiet Helper", line: "You show love by making life lighter — and notice when someone does it for you.", tip: "Take one chore off their plate without being asked." },
      adventure: { name: "The Adventure Seeker", line: "Firsts together make your heart race. New places, new jokes, new memories.", tip: "Plan a small “first time” — a new café counts." },
    },
    typeQuiz: [
      { q: "After a long, tiring day, what helps most?", a: ["Hearing “you did so well today”", "Them just staying close, no words needed", "A long, tight hug"] },
      { q: "The anniversary gift you'd love most?", a: ["A handwritten letter", "Your favourite little treat", "A trip somewhere neither of you has been"] },
      { q: "After a fight, what makes up best?", a: ["Holding hands again", "They quietly do a chore for you", "Time to talk it through, slowly"] },
      { q: "Your ideal day off together?", a: ["Trying a café you've never been to", "Lazing at home, side by side", "Swapping little souvenirs"] },
      { q: "Which moment made you happiest?", a: ["They helped before you even asked", "They said “I love you” out of nowhere", "A lucky discovery on a trip"] },
      { q: "What do you love doing for them?", a: ["Buying something you know they'll like", "A shoulder rub", "Sorting out the plans so they don't have to"] },
    ],
    thisOrThat: [
      ["Morning date", "Night date"], ["Beach", "Mountains"], ["Text", "Call"], ["Cook at home", "Eat out"],
      ["Plan everything", "Go with the flow"], ["Sweet", "Savoury"], ["Movie at home", "Cinema"], ["Cats", "Dogs"],
      ["Surprise party", "Quiet dinner for two"], ["Summer", "Winter"], ["Say sorry first", "Wait it out"], ["Photos of everything", "Live in the moment"],
    ],
    memoryBank: [
      "My favourite food is…", "Where did we first meet?", "What I'd order at a café", "My dream trip is to…",
      "What I do when I'm stressed", "My favourite season", "The song I keep replaying", "What I was like as a kid",
      "Something I'm secretly proud of", "My comfort snack", "The best present I ever got", "My go-to karaoke song",
    ],
    bingo: [
      "Ate breakfast together", "Said thank you for something small", "Took a photo together", "Tried a new food",
      "Walked somewhere with no plan", "Sent a voice message", "Laughed until it hurt", "Cooked together",
      "Watched the sky together", "Shared a dessert", "Held hands in public", "Wrote in Futari three days in a row",
      "Talked about the future", "Made a playlist", "Said “I love you” first", "Had a phone-free hour",
      "Remembered a first date detail", "Gave a tiny gift", "Planned a trip", "Fell asleep on a call",
      "Danced in the kitchen", "Told a secret", "Watched the sunrise or sunset", "Re-read an old message",
    ],
  },

  es: {
    types: {
      words: { name: "Escritor de cartas de amor", line: "Las palabras son tu forma de abrazar. Un pequeño “gracias” te dura todo el día.", tip: "Dile en voz alta lo que te gusta de él o ella — hasta lo más pequeño." },
      time: { name: "Compañía tranquila", line: "Estar uno al lado del otro basta. Te sientes querido en el tiempo sin prisas.", tip: "Guarden el móvil diez minutos y simplemente estén juntos." },
      touch: { name: "Abrazo cálido", line: "Una mano que te sostiene dice más que un discurso. El calor es tu idioma.", tip: "Un abrazo en la puerta, una mano en el hombro — a menudo." },
      gifts: { name: "Pequeñas sorpresas", line: "“Lo vi y pensé en ti” te derrite. Lo que brilla es el detalle.", tip: "Trae algo pequeño, con una historia detrás." },
      help: { name: "Ayuda silenciosa", line: "Demuestras amor haciendo la vida más ligera — y notas cuando alguien lo hace por ti.", tip: "Quítale una tarea de encima sin que te lo pida." },
      adventure: { name: "Buscador de aventuras", line: "Las primeras veces juntos te aceleran el corazón. Lugares nuevos, recuerdos nuevos.", tip: "Planea una pequeña “primera vez” — un café nuevo cuenta." },
    },
    typeQuiz: [
      { q: "Tras un día agotador, ¿qué te ayuda más?", a: ["Oír “hoy lo hiciste genial”", "Que se quede cerca, sin palabras", "Un abrazo largo y fuerte"] },
      { q: "¿El regalo de aniversario que más te gustaría?", a: ["Una carta escrita a mano", "Tu dulce favorito", "Un viaje a un sitio nuevo para los dos"] },
      { q: "Después de una pelea, ¿qué ayuda a reconciliarse?", a: ["Volver a darse la mano", "Que haga una tarea por ti sin decir nada", "Tiempo para hablarlo con calma"] },
      { q: "¿Tu día libre ideal juntos?", a: ["Probar un café nuevo", "Quedarse en casa, uno al lado del otro", "Intercambiar pequeños recuerdos"] },
      { q: "¿Qué momento te hizo más feliz?", a: ["Te ayudó antes de que lo pidieras", "Te dijo “te quiero” de repente", "Un descubrimiento por casualidad en un viaje"] },
      { q: "¿Qué te encanta hacer por tu pareja?", a: ["Comprarle algo que sabes que le gustará", "Darle un masaje en los hombros", "Organizar los planes para que no tenga que hacerlo"] },
    ],
    thisOrThat: [
      ["Cita de mañana", "Cita de noche"], ["Playa", "Montaña"], ["Mensaje", "Llamada"], ["Cocinar en casa", "Comer fuera"],
      ["Planearlo todo", "Improvisar"], ["Dulce", "Salado"], ["Peli en casa", "Cine"], ["Gatos", "Perros"],
      ["Fiesta sorpresa", "Cena tranquila para dos"], ["Verano", "Invierno"], ["Pedir perdón primero", "Esperar"], ["Fotos de todo", "Vivir el momento"],
    ],
    memoryBank: [
      "Mi comida favorita es…", "¿Dónde nos conocimos?", "Lo que pediría en un café", "El viaje de mis sueños es a…",
      "Lo que hago cuando estoy estresado/a", "Mi estación favorita", "La canción que no paro de escuchar", "Cómo era de pequeño/a",
      "Algo de lo que estoy orgulloso/a en secreto", "Mi snack para consolarme", "El mejor regalo que he recibido", "Mi canción de karaoke",
    ],
    bingo: [
      "Desayunamos juntos", "Dimos las gracias por algo pequeño", "Nos hicimos una foto juntos", "Probamos una comida nueva",
      "Paseamos sin rumbo", "Mandé un audio", "Nos reímos hasta llorar", "Cocinamos juntos",
      "Miramos el cielo juntos", "Compartimos un postre", "Nos dimos la mano en la calle", "Escribimos en Futari tres días seguidos",
      "Hablamos del futuro", "Hicimos una playlist", "Dije “te quiero” primero", "Una hora sin móvil",
      "Recordamos un detalle de la primera cita", "Un pequeño regalo", "Planeamos un viaje", "Nos dormimos en una llamada",
      "Bailamos en la cocina", "Contamos un secreto", "Vimos el amanecer o el atardecer", "Releímos un mensaje antiguo",
    ],
  },

  fr: {
    types: {
      words: { name: "L'écrivain de lettres d'amour", line: "Les mots sont ta façon d'aimer. Un petit « merci » te réchauffe toute la journée.", tip: "Dis-lui à voix haute ce que tu aimes chez lui ou elle — même les petites choses." },
      time: { name: "Le compagnon tranquille", line: "Être côte à côte suffit. Tu te sens aimé·e dans le temps sans hâte.", tip: "Posez les téléphones dix minutes, et soyez simplement ensemble." },
      touch: { name: "Le câlin chaleureux", line: "Une main tenue dit plus qu'un discours. La chaleur est ta langue d'amour.", tip: "Un câlin à la porte, une main sur l'épaule — souvent." },
      gifts: { name: "Le roi des petites surprises", line: "« Je l'ai vu et j'ai pensé à toi » te fait fondre. C'est l'intention qui brille.", tip: "Rapporte une petite chose, avec une histoire derrière." },
      help: { name: "L'aide discrète", line: "Tu aimes en rendant la vie plus légère — et tu remarques quand on le fait pour toi.", tip: "Prends-lui une corvée sans qu'il ou elle ne demande." },
      adventure: { name: "L'aventurier", line: "Les premières fois à deux font battre ton cœur. Nouveaux lieux, nouveaux souvenirs.", tip: "Prévois une petite « première fois » — un nouveau café compte." },
    },
    typeQuiz: [
      { q: "Après une longue journée, qu'est-ce qui t'aide le plus ?", a: ["Entendre « tu as été génial·e aujourd'hui »", "Qu'il ou elle reste près de toi, sans un mot", "Un long câlin bien serré"] },
      { q: "Le cadeau d'anniversaire rêvé ?", a: ["Une lettre écrite à la main", "Ta petite gourmandise préférée", "Un voyage dans un endroit nouveau pour vous deux"] },
      { q: "Après une dispute, qu'est-ce qui réconcilie le mieux ?", a: ["Se reprendre la main", "Qu'il ou elle fasse une tâche pour toi, sans rien dire", "Du temps pour en parler calmement"] },
      { q: "Ton jour de repos idéal à deux ?", a: ["Tester un café inconnu", "Paresser à la maison, côte à côte", "S'échanger de petits souvenirs"] },
      { q: "Quel moment t'a rendu·e le plus heureux·se ?", a: ["Il ou elle a aidé avant même que tu demandes", "Un « je t'aime » sorti de nulle part", "Une découverte par hasard en voyage"] },
      { q: "Qu'aimes-tu faire pour l'autre ?", a: ["Acheter un truc qui lui plaira", "Un massage des épaules", "Organiser les plans à sa place"] },
    ],
    thisOrThat: [
      ["Rendez-vous le matin", "Rendez-vous le soir"], ["Plage", "Montagne"], ["Message", "Appel"], ["Cuisiner à la maison", "Restaurant"],
      ["Tout planifier", "Improviser"], ["Sucré", "Salé"], ["Film à la maison", "Cinéma"], ["Chats", "Chiens"],
      ["Fête surprise", "Dîner calme à deux"], ["Été", "Hiver"], ["S'excuser en premier", "Attendre"], ["Tout photographier", "Vivre le moment"],
    ],
    memoryBank: [
      "Mon plat préféré, c'est…", "Où s'est-on rencontrés ?", "Ce que je commanderais au café", "Mon voyage de rêve, c'est…",
      "Ce que je fais quand je suis stressé·e", "Ma saison préférée", "La chanson que j'écoute en boucle", "Comment j'étais enfant",
      "Un truc dont je suis secrètement fier·ère", "Mon snack réconfort", "Le plus beau cadeau que j'ai reçu", "Ma chanson de karaoké",
    ],
    bingo: [
      "Petit-déjeuner ensemble", "Dit merci pour une petite chose", "Pris une photo à deux", "Goûté un nouveau plat",
      "Marché sans but", "Envoyé un message vocal", "Ri aux larmes", "Cuisiné ensemble",
      "Regardé le ciel ensemble", "Partagé un dessert", "Main dans la main dehors", "Écrit sur Futari trois jours de suite",
      "Parlé de l'avenir", "Fait une playlist", "Dit « je t'aime » en premier", "Une heure sans téléphone",
      "Retrouvé un détail du premier rendez-vous", "Offert un petit cadeau", "Prévu un voyage", "Endormis pendant un appel",
      "Dansé dans la cuisine", "Confié un secret", "Vu le lever ou le coucher du soleil", "Relu un vieux message",
    ],
  },

  de: {
    types: {
      words: { name: "Liebesbrief-Schreiber", line: "Worte sind deine Art, jemanden zu halten. Ein kleines „Danke“ trägt dich durch den Tag.", tip: "Sag laut, was du an ihm oder ihr magst — auch die kleinen Dinge." },
      time: { name: "Stiller Begleiter", line: "Nebeneinander sein reicht. Du fühlst dich geliebt in Zeit ohne Eile.", tip: "Legt zehn Minuten die Handys weg und seid einfach zusammen." },
      touch: { name: "Warme Umarmung", line: "Eine Hand zu halten sagt mehr als eine Rede. Wärme ist deine Sprache.", tip: "Eine Umarmung an der Tür, eine Hand auf der Schulter — oft." },
      gifts: { name: "Kleine Überraschungen", line: "„Ich hab das gesehen und an dich gedacht“ lässt dich schmelzen.", tip: "Bring etwas Kleines mit — mit einer Geschichte dazu." },
      help: { name: "Stille Hilfe", line: "Du zeigst Liebe, indem du das Leben leichter machst — und merkst, wenn jemand es für dich tut.", tip: "Nimm ihm oder ihr eine Aufgabe ab, ungefragt." },
      adventure: { name: "Abenteurer", line: "Erste Male zu zweit lassen dein Herz rasen. Neue Orte, neue Erinnerungen.", tip: "Plant ein kleines „erstes Mal“ — ein neues Café zählt." },
    },
    typeQuiz: [
      { q: "Nach einem langen Tag — was hilft dir am meisten?", a: ["„Das hast du heute toll gemacht“ hören", "Dass er oder sie einfach da ist, ohne Worte", "Eine lange, feste Umarmung"] },
      { q: "Das schönste Jahrestagsgeschenk?", a: ["Ein handgeschriebener Brief", "Deine liebste kleine Leckerei", "Eine Reise an einen neuen Ort"] },
      { q: "Was versöhnt euch nach einem Streit am besten?", a: ["Wieder Händchen halten", "Er oder sie erledigt still etwas für dich", "Zeit, in Ruhe zu reden"] },
      { q: "Euer perfekter freier Tag?", a: ["Ein neues Café ausprobieren", "Zu Hause faulenzen, nebeneinander", "Kleine Mitbringsel tauschen"] },
      { q: "Welcher Moment hat dich am glücklichsten gemacht?", a: ["Hilfe, bevor du fragen konntest", "Ein „Ich liebe dich“ aus dem Nichts", "Eine zufällige Entdeckung auf Reisen"] },
      { q: "Was tust du gern für ihn oder sie?", a: ["Etwas kaufen, das gefallen wird", "Die Schultern massieren", "Die Planung übernehmen"] },
    ],
    thisOrThat: [
      ["Date am Morgen", "Date am Abend"], ["Strand", "Berge"], ["Schreiben", "Anrufen"], ["Zuhause kochen", "Essen gehen"],
      ["Alles planen", "Spontan sein"], ["Süß", "Herzhaft"], ["Film zu Hause", "Kino"], ["Katzen", "Hunde"],
      ["Überraschungsparty", "Ruhiges Dinner zu zweit"], ["Sommer", "Winter"], ["Zuerst entschuldigen", "Abwarten"], ["Alles fotografieren", "Im Moment leben"],
    ],
    memoryBank: [
      "Mein Lieblingsessen ist…", "Wo haben wir uns kennengelernt?", "Was ich im Café bestellen würde", "Meine Traumreise geht nach…",
      "Was ich tue, wenn ich gestresst bin", "Meine Lieblingsjahreszeit", "Der Song, den ich gerade dauernd höre", "Wie ich als Kind war",
      "Worauf ich heimlich stolz bin", "Mein Seelentröster-Snack", "Das beste Geschenk, das ich je bekam", "Mein Karaoke-Song",
    ],
    bingo: [
      "Zusammen gefrühstückt", "Für etwas Kleines Danke gesagt", "Ein Foto zu zweit", "Etwas Neues gegessen",
      "Ohne Ziel spaziert", "Eine Sprachnachricht geschickt", "Tränen gelacht", "Zusammen gekocht",
      "Zusammen in den Himmel geschaut", "Ein Dessert geteilt", "Draußen Händchen gehalten", "Drei Tage in Folge in Futari geschrieben",
      "Über die Zukunft geredet", "Eine Playlist gemacht", "Zuerst „Ich liebe dich“ gesagt", "Eine Stunde ohne Handy",
      "An ein Detail vom ersten Date erinnert", "Ein kleines Geschenk", "Eine Reise geplant", "Beim Telefonieren eingeschlafen",
      "In der Küche getanzt", "Ein Geheimnis erzählt", "Sonnenauf- oder -untergang gesehen", "Eine alte Nachricht wieder gelesen",
    ],
  },

  it: {
    types: {
      words: { name: "Scrittore di lettere d'amore", line: "Le parole sono il tuo modo di abbracciare. Un piccolo “grazie” ti resta addosso tutto il giorno.", tip: "Digli ad alta voce cosa ti piace di lui o lei — anche le piccole cose." },
      time: { name: "Compagnia tranquilla", line: "Stare fianco a fianco basta. Ti senti amato nel tempo senza fretta.", tip: "Mettete via i telefoni per dieci minuti e state semplicemente insieme." },
      touch: { name: "Abbraccio caldo", line: "Una mano da stringere dice più di un discorso. Il calore è la tua lingua.", tip: "Un abbraccio sulla porta, una mano sulla spalla — spesso." },
      gifts: { name: "Piccole sorprese", line: "“L'ho visto e ho pensato a te” ti scioglie. È il pensiero che brilla.", tip: "Porta qualcosa di piccolo, con una storia dietro." },
      help: { name: "Aiuto silenzioso", line: "Ami rendendo la vita più leggera — e te ne accorgi quando qualcuno lo fa per te.", tip: "Toglile o togligli una faccenda, senza che chieda." },
      adventure: { name: "Cercatore di avventure", line: "Le prime volte insieme ti fanno battere il cuore. Posti nuovi, ricordi nuovi.", tip: "Organizza una piccola “prima volta” — un bar nuovo vale." },
    },
    typeQuiz: [
      { q: "Dopo una giornata stancante, cosa ti aiuta di più?", a: ["Sentirsi dire “oggi sei stato bravissimo”", "Che resti vicino, senza parole", "Un abbraccio lungo e stretto"] },
      { q: "Il regalo d'anniversario che ameresti di più?", a: ["Una lettera scritta a mano", "Il tuo dolcetto preferito", "Un viaggio in un posto nuovo per entrambi"] },
      { q: "Dopo un litigio, cosa aiuta a fare pace?", a: ["Tornare a tenersi per mano", "Che faccia una faccenda per te, in silenzio", "Tempo per parlarne con calma"] },
      { q: "Il vostro giorno libero ideale?", a: ["Provare un bar mai visto", "Oziare a casa, uno accanto all'altro", "Scambiarsi piccoli souvenir"] },
      { q: "Quale momento ti ha reso più felice?", a: ["Ti ha aiutato prima che chiedessi", "Un “ti amo” all'improvviso", "Una scoperta per caso in viaggio"] },
      { q: "Cosa ami fare per l'altra persona?", a: ["Comprare qualcosa che le piacerà", "Un massaggio alle spalle", "Organizzare i piani al suo posto"] },
    ],
    thisOrThat: [
      ["Appuntamento al mattino", "Appuntamento la sera"], ["Mare", "Montagna"], ["Messaggio", "Chiamata"], ["Cucinare a casa", "Mangiare fuori"],
      ["Pianificare tutto", "Improvvisare"], ["Dolce", "Salato"], ["Film a casa", "Cinema"], ["Gatti", "Cani"],
      ["Festa a sorpresa", "Cena tranquilla a due"], ["Estate", "Inverno"], ["Chiedere scusa per primo", "Aspettare"], ["Foto di tutto", "Vivere il momento"],
    ],
    memoryBank: [
      "Il mio cibo preferito è…", "Dove ci siamo conosciuti?", "Cosa ordinerei al bar", "Il viaggio dei miei sogni è a…",
      "Cosa faccio quando sono stressato/a", "La mia stagione preferita", "La canzone che ascolto in loop", "Com'ero da piccolo/a",
      "Qualcosa di cui vado segretamente fiero/a", "Il mio snack consolatorio", "Il regalo più bello mai ricevuto", "La mia canzone da karaoke",
    ],
    bingo: [
      "Colazione insieme", "Detto grazie per una piccola cosa", "Una foto insieme", "Assaggiato un cibo nuovo",
      "Passeggiato senza meta", "Mandato un vocale", "Riso fino alle lacrime", "Cucinato insieme",
      "Guardato il cielo insieme", "Diviso un dolce", "Mano nella mano in giro", "Scritto su Futari tre giorni di fila",
      "Parlato del futuro", "Fatto una playlist", "Detto “ti amo” per primo", "Un'ora senza telefono",
      "Ricordato un dettaglio del primo appuntamento", "Un piccolo regalo", "Pianificato un viaggio", "Addormentati al telefono",
      "Ballato in cucina", "Raccontato un segreto", "Visto l'alba o il tramonto", "Riletto un vecchio messaggio",
    ],
  },

  pt: {
    types: {
      words: { name: "Escritor de cartas de amor", line: "Palavras são o seu jeito de abraçar. Um pequeno “obrigado” fica com você o dia todo.", tip: "Diga em voz alta o que você gosta nele ou nela — até as pequenas coisas." },
      time: { name: "Companhia tranquila", line: "Estar lado a lado basta. Você se sente amado no tempo sem pressa.", tip: "Larguem o celular por dez minutos e apenas fiquem juntos." },
      touch: { name: "Abraço quentinho", line: "Uma mão segurando a sua diz mais que um discurso. Calor é a sua língua.", tip: "Um abraço na porta, uma mão no ombro — sempre." },
      gifts: { name: "Pequenas surpresas", line: "“Vi isso e lembrei de você” derrete você. É o gesto que brilha.", tip: "Traga algo pequeno, com uma história por trás." },
      help: { name: "Ajuda silenciosa", line: "Você ama deixando a vida mais leve — e percebe quando alguém faz isso por você.", tip: "Tire uma tarefa das mãos dele ou dela sem que peça." },
      adventure: { name: "Caçador de aventuras", line: "As primeiras vezes a dois aceleram seu coração. Lugares novos, memórias novas.", tip: "Planeje uma pequena “primeira vez” — um café novo vale." },
    },
    typeQuiz: [
      { q: "Depois de um dia cansativo, o que mais ajuda?", a: ["Ouvir “você mandou muito bem hoje”", "Ficar pertinho, sem precisar falar", "Um abraço longo e apertado"] },
      { q: "O presente de aniversário de namoro que você mais amaria?", a: ["Uma carta escrita à mão", "Seu docinho favorito", "Uma viagem para um lugar novo para os dois"] },
      { q: "Depois de uma briga, o que ajuda a fazer as pazes?", a: ["Dar as mãos de novo", "Ele ou ela fazer uma tarefa por você, em silêncio", "Tempo para conversar com calma"] },
      { q: "O dia de folga ideal juntos?", a: ["Conhecer um café novo", "Ficar à toa em casa, lado a lado", "Trocar lembrancinhas"] },
      { q: "Qual momento te deixou mais feliz?", a: ["Ajudou antes mesmo de você pedir", "Um “eu te amo” do nada", "Uma descoberta por acaso numa viagem"] },
      { q: "O que você ama fazer pela outra pessoa?", a: ["Comprar algo que você sabe que ela vai gostar", "Uma massagem nos ombros", "Organizar os planos no lugar dela"] },
    ],
    thisOrThat: [
      ["Encontro de manhã", "Encontro à noite"], ["Praia", "Montanha"], ["Mensagem", "Ligação"], ["Cozinhar em casa", "Comer fora"],
      ["Planejar tudo", "Improvisar"], ["Doce", "Salgado"], ["Filme em casa", "Cinema"], ["Gatos", "Cachorros"],
      ["Festa surpresa", "Jantar tranquilo a dois"], ["Verão", "Inverno"], ["Pedir desculpas primeiro", "Esperar passar"], ["Foto de tudo", "Viver o momento"],
    ],
    memoryBank: [
      "Minha comida favorita é…", "Onde a gente se conheceu?", "O que eu pediria num café", "A viagem dos meus sonhos é para…",
      "O que eu faço quando estou estressado/a", "Minha estação favorita", "A música que não paro de ouvir", "Como eu era quando criança",
      "Algo de que tenho orgulho em segredo", "Meu lanche de conforto", "O melhor presente que já ganhei", "Minha música de karaokê",
    ],
    bingo: [
      "Tomamos café da manhã juntos", "Agradeci por algo pequeno", "Tiramos uma foto juntos", "Provamos uma comida nova",
      "Passeamos sem destino", "Mandei um áudio", "Rimos até chorar", "Cozinhamos juntos",
      "Olhamos o céu juntos", "Dividimos uma sobremesa", "De mãos dadas na rua", "Escrevemos no Futari três dias seguidos",
      "Falamos sobre o futuro", "Fizemos uma playlist", "Disse “eu te amo” primeiro", "Uma hora sem celular",
      "Lembramos um detalhe do primeiro encontro", "Um presentinho", "Planejamos uma viagem", "Dormimos numa ligação",
      "Dançamos na cozinha", "Contei um segredo", "Vimos o nascer ou o pôr do sol", "Relemos uma mensagem antiga",
    ],
  },

  id: {
    types: {
      words: { name: "Penulis Surat Cinta", line: "Kata-kata adalah caramu memeluk. “Terima kasih” kecil bisa bikin senang seharian.", tip: "Ucapkan apa yang kamu suka darinya — bahkan hal kecil." },
      time: { name: "Teman yang Tenang", line: "Berdampingan saja sudah cukup. Kamu merasa dicintai di waktu yang santai.", tip: "Simpan ponsel sepuluh menit, dan cukup bersama." },
      touch: { name: "Pelukan Hangat", line: "Genggaman tangan berkata lebih dari pidato. Kehangatan adalah bahasamu.", tip: "Peluk di pintu, tangan di bahu — sering-sering." },
      gifts: { name: "Pemberi Kejutan Kecil", line: "“Aku lihat ini dan ingat kamu” bikin kamu meleleh. Perhatiannya yang berkilau.", tip: "Bawakan sesuatu yang kecil, dengan cerita di baliknya." },
      help: { name: "Penolong Diam-diam", line: "Kamu mencintai dengan membuat hidup lebih ringan — dan sadar saat orang lain melakukannya untukmu.", tip: "Ambil alih satu pekerjaannya tanpa diminta." },
      adventure: { name: "Pencari Petualangan", line: "Pengalaman pertama berdua bikin jantung berdebar. Tempat baru, kenangan baru.", tip: "Rencanakan “pertama kali” kecil — kafe baru juga boleh." },
    },
    typeQuiz: [
      { q: "Setelah hari yang melelahkan, apa yang paling membantu?", a: ["Mendengar “kamu hebat hari ini”", "Dia ada di dekatmu, tanpa kata", "Pelukan yang lama dan erat"] },
      { q: "Hadiah anniversary yang paling kamu suka?", a: ["Surat tulisan tangan", "Camilan favoritmu", "Liburan ke tempat yang baru bagi kalian"] },
      { q: "Setelah bertengkar, apa yang paling cepat mendamaikan?", a: ["Bergandengan tangan lagi", "Dia diam-diam mengerjakan tugasmu", "Waktu untuk bicara pelan-pelan"] },
      { q: "Hari libur ideal berdua?", a: ["Mencoba kafe baru", "Bermalas-malasan di rumah, berdampingan", "Saling tukar oleh-oleh kecil"] },
      { q: "Momen mana yang paling membahagiakan?", a: ["Dia membantu sebelum kamu minta", "Dia bilang “aku sayang kamu” tiba-tiba", "Penemuan tak terduga saat liburan"] },
      { q: "Apa yang kamu suka lakukan untuknya?", a: ["Membelikan sesuatu yang pasti dia suka", "Memijat bahunya", "Mengatur rencana supaya dia tak perlu repot"] },
    ],
    thisOrThat: [
      ["Kencan pagi", "Kencan malam"], ["Pantai", "Gunung"], ["Chat", "Telepon"], ["Masak di rumah", "Makan di luar"],
      ["Semua direncanakan", "Mengalir saja"], ["Manis", "Gurih"], ["Nonton di rumah", "Bioskop"], ["Kucing", "Anjing"],
      ["Pesta kejutan", "Makan malam tenang berdua"], ["Musim panas", "Musim dingin"], ["Minta maaf duluan", "Menunggu reda"], ["Foto semuanya", "Nikmati saja momennya"],
    ],
    memoryBank: [
      "Makanan favoritku adalah…", "Di mana kita pertama bertemu?", "Yang akan kupesan di kafe", "Liburan impianku ke…",
      "Yang kulakukan saat stres", "Musim favoritku", "Lagu yang terus kuputar", "Aku waktu kecil seperti apa",
      "Hal yang diam-diam kubanggakan", "Camilan penghiburku", "Hadiah terbaik yang pernah kudapat", "Lagu karaoke andalanku",
    ],
    bingo: [
      "Sarapan bersama", "Berterima kasih untuk hal kecil", "Foto berdua", "Mencoba makanan baru",
      "Jalan-jalan tanpa tujuan", "Kirim voice note", "Tertawa sampai sakit perut", "Masak bersama",
      "Melihat langit bersama", "Berbagi satu dessert", "Bergandengan di luar", "Menulis di Futari tiga hari berturut-turut",
      "Bicara tentang masa depan", "Membuat playlist", "Bilang “aku sayang kamu” duluan", "Satu jam tanpa ponsel",
      "Mengingat detail kencan pertama", "Memberi hadiah kecil", "Merencanakan liburan", "Ketiduran saat telepon",
      "Berdansa di dapur", "Menceritakan rahasia", "Melihat matahari terbit atau terbenam", "Membaca ulang pesan lama",
    ],
  },

  ja: {
    types: {
      words: { name: "ラブレター派", line: "ことばで愛を伝えたい人。小さな「ありがとう」が一日中のこる。", tip: "好きなところを、口に出して伝えてあげて。小さなことでも。" },
      time: { name: "となりで過ごす派", line: "そばにいるだけで満たされる人。急がない時間に愛を感じる。", tip: "10分だけスマホを置いて、ただ一緒にいる時間を。" },
      touch: { name: "ぬくもり派", line: "手をつなぐほうが、長い言葉より伝わる人。あたたかさが合言葉。", tip: "玄関でのハグ、肩にそっと手を。こまめに。" },
      gifts: { name: "ちいさな贈りもの派", line: "「見かけて思い出した」に弱い人。気持ちのこもった小さなものが光る。", tip: "ちょっとしたお土産を、エピソードと一緒に。" },
      help: { name: "そっと支える派", line: "暮らしを軽くすることで愛を伝える人。してもらうと、ちゃんと気づく。", tip: "頼まれる前に、家事をひとつ引き受けて。" },
      adventure: { name: "はじめて探検派", line: "ふたりの「はじめて」に胸が高鳴る人。新しい場所、新しい思い出。", tip: "小さな「はじめて」を計画しよう。新しいカフェでも十分。" },
    },
    typeQuiz: [
      { q: "クタクタで帰った日、いちばんうれしいのは？", a: ["「今日もがんばったね」の一言", "何も言わずにそばにいてくれる", "ぎゅっと長めのハグ"] },
      { q: "記念日にもらっていちばんうれしいのは？", a: ["手書きの手紙", "大好きなお菓子をひとつ", "ふたりとも行ったことのない場所への旅"] },
      { q: "けんかのあと、仲直りのきっかけは？", a: ["もう一度手をつなぐ", "黙って家事をかわってくれる", "ゆっくり話す時間をとる"] },
      { q: "理想の休日は？", a: ["行ったことのないカフェを開拓", "家でのんびり、となりで過ごす", "ちょっとしたお土産を交換"] },
      { q: "いちばんうれしかったのは？", a: ["頼む前に助けてくれた", "急に「好きだよ」と言われた", "旅先での思いがけない発見"] },
      { q: "相手にしてあげたいのは？", a: ["喜びそうなものを見つけて買う", "肩をもんであげる", "予定を代わりに調べて決める"] },
    ],
    thisOrThat: [
      ["朝デート", "夜デート"], ["海", "山"], ["LINE", "電話"], ["おうちごはん", "外食"],
      ["きっちり計画", "行き当たりばったり"], ["甘いもの", "しょっぱいもの"], ["おうち映画", "映画館"], ["ねこ", "いぬ"],
      ["サプライズパーティー", "ふたりで静かなディナー"], ["夏", "冬"], ["先にあやまる", "落ち着くまで待つ"], ["なんでも写真に残す", "その瞬間を楽しむ"],
    ],
    memoryBank: [
      "わたしの好きな食べものは？", "ふたりが出会った場所は？", "カフェでわたしが頼むのは？", "わたしの夢の旅行先は？",
      "わたしがストレスを感じたときにすることは？", "わたしの好きな季節は？", "最近ずっと聴いている曲は？", "子どものころのわたしは？",
      "わたしがこっそり自慢に思っていることは？", "わたしの元気が出るおやつは？", "いままででいちばんうれしかったプレゼントは？", "わたしのカラオケの十八番は？",
    ],
    bingo: [
      "いっしょに朝ごはん", "小さなことに「ありがとう」", "ふたりで写真をとった", "はじめての食べもの",
      "目的なしでおさんぽ", "ボイスメッセージを送った", "おなかが痛くなるほど笑った", "いっしょに料理",
      "いっしょに空を見た", "デザートをはんぶんこ", "外で手をつないだ", "3日連続でFutariを書いた",
      "未来の話をした", "ふたりのプレイリスト", "先に「好き」と言った", "スマホなしの1時間",
      "初デートのことを思い出した", "小さなプレゼント", "旅行の計画をたてた", "電話しながら寝落ち",
      "キッチンでおどった", "ひみつをひとつ話した", "朝日か夕日を見た", "昔のメッセージを読み返した",
    ],
  },

  zh: {
    types: {
      words: { name: "情书派", line: "你用文字去拥抱一个人。一句小小的“谢谢”能温暖一整天。", tip: "把喜欢对方的地方说出口吧，哪怕是很小的事。" },
      time: { name: "陪伴派", line: "并肩待着就足够。你在不慌不忙的时光里感受到爱。", tip: "放下手机十分钟，就只是待在一起。" },
      touch: { name: "温暖拥抱派", line: "牵着的手胜过千言万语。温度就是你的爱的语言。", tip: "门口的拥抱、肩上的一只手——常常就好。" },
      gifts: { name: "小惊喜派", line: "“看到这个就想到你”会让你融化。闪光的是心意。", tip: "带回一件小东西，附上一个小故事。" },
      help: { name: "默默守护派", line: "你用让生活更轻松来表达爱，也会注意到别人为你这样做。", tip: "不等对方开口，就帮TA分担一件家务。" },
      adventure: { name: "探险派", line: "两个人的“第一次”让你心跳加速。新的地方，新的回忆。", tip: "安排一个小小的“第一次”——一家新咖啡馆也算。" },
    },
    typeQuiz: [
      { q: "累了一整天回到家，最需要的是？", a: ["一句“今天辛苦啦，你真棒”", "TA什么都不说，只是陪在身边", "一个长长的、紧紧的拥抱"] },
      { q: "纪念日最想收到的礼物？", a: ["一封手写信", "你最爱的小零食", "去一个你们都没去过的地方旅行"] },
      { q: "吵架之后，什么最能让你们和好？", a: ["重新牵起手", "TA默默帮你做了家务", "慢慢坐下来聊一聊"] },
      { q: "理想的休息日？", a: ["探索一家没去过的咖啡馆", "在家懒洋洋地待在一起", "互相交换小礼物"] },
      { q: "哪个瞬间让你最开心？", a: ["还没开口TA就帮了你", "TA突然说“我爱你”", "旅行中的意外发现"] },
      { q: "你最喜欢为TA做什么？", a: ["买一件TA一定会喜欢的东西", "帮TA揉揉肩", "替TA把计划都安排好"] },
    ],
    thisOrThat: [
      ["早上约会", "晚上约会"], ["海边", "山里"], ["发消息", "打电话"], ["在家做饭", "出去吃"],
      ["全部计划好", "走到哪算哪"], ["甜的", "咸的"], ["在家看电影", "去电影院"], ["猫", "狗"],
      ["惊喜派对", "两个人安静的晚餐"], ["夏天", "冬天"], ["先道歉", "等冷静下来"], ["什么都拍照", "享受当下"],
    ],
    memoryBank: [
      "我最喜欢的食物是？", "我们第一次见面在哪里？", "我在咖啡馆会点什么？", "我梦想去哪里旅行？",
      "我压力大的时候会做什么？", "我最喜欢的季节？", "我最近一直在听的歌？", "我小时候是什么样的？",
      "我偷偷引以为傲的事？", "能让我开心起来的零食？", "我收到过最好的礼物？", "我的K歌拿手曲？",
    ],
    bingo: [
      "一起吃早餐", "为小事说了谢谢", "一起拍了照", "尝试了新食物",
      "漫无目的地散步", "发了语音消息", "笑到肚子疼", "一起做饭",
      "一起看天空", "分享一份甜点", "在外面牵手", "连续三天写了Futari",
      "聊了聊未来", "做了一个歌单", "先说了“我爱你”", "一小时不碰手机",
      "想起初次约会的细节", "送了一个小礼物", "计划了一次旅行", "打着电话睡着了",
      "在厨房跳舞", "分享了一个秘密", "看了日出或日落", "重读了一条旧消息",
    ],
  },

  ko: {
    types: {
      words: { name: "러브레터파", line: "말로 사랑을 전하는 사람. 작은 “고마워” 한마디가 하루 종일 남아요.", tip: "좋아하는 점을 소리 내어 말해 주세요. 작은 것이라도요." },
      time: { name: "곁에 있는 파", line: "나란히 있는 것만으로 충분한 사람. 서두르지 않는 시간에서 사랑을 느껴요.", tip: "10분만 휴대폰을 내려놓고 그냥 함께 있어 주세요." },
      touch: { name: "따뜻한 포옹파", line: "잡은 손이 긴 말보다 더 많이 전해요. 따뜻함이 당신의 언어.", tip: "현관에서의 포옹, 어깨에 올린 손 — 자주요." },
      gifts: { name: "작은 선물파", line: "“이거 보고 네 생각났어”에 약한 사람. 마음이 담긴 작은 것이 빛나요.", tip: "작은 선물을 이야기와 함께 건네 보세요." },
      help: { name: "조용히 돕는 파", line: "삶을 가볍게 해 주는 것으로 사랑을 전하는 사람. 누가 해 주면 꼭 알아채요.", tip: "부탁받기 전에 집안일 하나를 맡아 주세요." },
      adventure: { name: "첫 경험 탐험파", line: "둘만의 ‘처음’에 가슴이 뛰는 사람. 새로운 곳, 새로운 추억.", tip: "작은 ‘처음’을 계획해 보세요. 새로운 카페도 충분해요." },
    },
    typeQuiz: [
      { q: "지친 하루 끝에 가장 힘이 되는 건?", a: ["“오늘도 잘했어” 한마디", "말없이 곁에 있어 주는 것", "꽉 안아 주는 긴 포옹"] },
      { q: "기념일에 가장 받고 싶은 선물은?", a: ["손편지", "제일 좋아하는 간식", "둘 다 가 본 적 없는 곳으로의 여행"] },
      { q: "싸운 뒤, 화해의 계기는?", a: ["다시 손을 잡는 것", "말없이 집안일을 대신해 주는 것", "천천히 이야기하는 시간"] },
      { q: "이상적인 휴일은?", a: ["가 본 적 없는 카페 탐방", "집에서 나란히 뒹굴기", "작은 기념품 교환"] },
      { q: "가장 행복했던 순간은?", a: ["부탁하기도 전에 도와줬을 때", "갑자기 “사랑해”라고 했을 때", "여행지에서의 뜻밖의 발견"] },
      { q: "상대에게 해 주고 싶은 건?", a: ["좋아할 만한 걸 발견해서 사 주기", "어깨 주물러 주기", "계획을 대신 알아보고 정하기"] },
    ],
    thisOrThat: [
      ["아침 데이트", "밤 데이트"], ["바다", "산"], ["카톡", "전화"], ["집밥", "외식"],
      ["철저한 계획", "즉흥 여행"], ["단 거", "짠 거"], ["집에서 영화", "영화관"], ["고양이", "강아지"],
      ["깜짝 파티", "둘만의 조용한 저녁"], ["여름", "겨울"], ["먼저 사과하기", "진정될 때까지 기다리기"], ["뭐든 사진으로", "그 순간을 즐기기"],
    ],
    memoryBank: [
      "내가 제일 좋아하는 음식은?", "우리가 처음 만난 곳은?", "내가 카페에서 시키는 건?", "내 꿈의 여행지는?",
      "내가 스트레스 받을 때 하는 건?", "내가 좋아하는 계절은?", "요즘 내가 계속 듣는 노래는?", "어릴 때 나는 어땠을까?",
      "내가 몰래 자랑스러워하는 건?", "기운 나는 내 간식은?", "내가 받은 최고의 선물은?", "내 노래방 18번은?",
    ],
    bingo: [
      "같이 아침 먹기", "작은 일에 “고마워”", "둘이 사진 찍기", "처음 먹어 보는 음식",
      "목적 없이 산책", "음성 메시지 보내기", "배 아플 때까지 웃기", "같이 요리하기",
      "같이 하늘 보기", "디저트 나눠 먹기", "밖에서 손잡기", "3일 연속 Futari 쓰기",
      "미래 이야기하기", "둘만의 플레이리스트", "먼저 “사랑해” 말하기", "휴대폰 없는 1시간",
      "첫 데이트 떠올리기", "작은 선물", "여행 계획 세우기", "통화하다 잠들기",
      "부엌에서 춤추기", "비밀 하나 말하기", "일출이나 일몰 보기", "옛날 메시지 다시 읽기",
    ],
  },
};

export function playContent(lang) {
  return PLAY_CONTENT[lang] || PLAY_CONTENT.en;
}
