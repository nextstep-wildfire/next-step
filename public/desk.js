/* Next Step, the Desk. Chat on the left, the person's paper on the right.
   Every exchange can be done by tapping; typing and pasting always work too.
   Rules, numbers and phone lines come from /sources.json only. Chats are kept on this device only;
   a pasted insurer message is never saved. */
(function () {
  'use strict';
  var C = window.NS_CONTENT;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'ns-desk-v1';
  var SOURCES = {};
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = window.nsLang && window.nsLang.current() === 'es' ? 'es' : 'en';
  var LOCALE = LANG === 'es' ? 'es-US' : 'en-US';

  /* ---------- words: English, then Spanish (an unreviewed draft; strings for a native speaker are listed in docs/DESIGN.md) ---------- */
  var T_EN = {
    open: 'What’s happening with your insurer?',
    openSub: 'Tap what fits, or tell me in your own words. I’ll help you write to them, one clear ask at a time.',
    o_push: 'They pushed back on my claim', o_msg: 'I got a message from them', o_call: 'A call or visit is coming up',
    s_denied: 'They said no', s_low: 'They offered less', s_quiet: 'They went quiet', s_other: 'Something else',
    askSit: 'That’s a hard place to be, and putting it in writing is a good next step. What did they do?',
    askRole: 'Do you own the home, or rent it?',
    r_own: 'I own it', r_rent: 'I rent it', r_unsure: 'Not sure',
    askAsk: 'What do you want to ask them for? One ask per letter keeps it clear, and you can write another after.',
    askNotes: 'In a few words, what happened? Dates, amounts and names help. I’ll turn it into plain, polite sentences, and leave blanks for anything missing.',
    writeNow: 'Write my letter', skipNotes: 'Skip, leave blanks',
    writing: 'Writing your letter…', writingReply: 'Writing your reply…', reading: 'Reading their message…', editing: 'Changing your letter…',
    done: 'Your letter is ready. Fill in anything in [brackets], then copy it into an email to your adjuster.',
    doneNoBlanks: 'Your letter is ready. Read it through, then copy it into an email to your adjuster.',
    replyDoneNoBlanks: 'Your reply is ready, under the plain explanation of their message. Read it through before you send it.',
    doneEdit: 'To change it, type on the letter or tell me here.',
    doneMobile: 'Tap the card above to open it. To change it, type on it or tell me here.',
    next: 'Send it by email so there’s a record. The 15 days is your request, not a legal deadline. If you are still stuck, call the California Department of Insurance: ',
    another: 'Write another letter', anotherDiff: 'Ask for something different',
    changed: 'Done. The changed lines are highlighted on your letter.',
    lostFacts: 'I couldn’t make that change without losing other details in your letter, so I left it as it was. You can type the change right on the letter.',
    pasteAsk: 'Paste what they sent below. I’ll explain it in plain words and suggest what to ask for in your reply.',
    pastePrivacy: 'What you paste is sent to the AI to read and is not saved. Leave out anything you don’t want to share, like account numbers.',
    pasteHolder: 'Paste their message here',
    explainedRight: 'I\u2019ve put what their message says, in plain words, at the top of your paper.',
    suggest: 'For your reply, I’d ask them to:', suggested: 'suggested', otherAsk: 'Pick a different ask',
    replyDone: 'Your reply is ready, under the plain explanation of their message. Fill in anything in [brackets] before you send it.',
    callMsg: 'A call or visit with my insurer is coming up. How should I get ready?',
    isPaste: 'That looks like it could be a message from your insurer. Should I explain it and help you reply?',
    yesExplain: 'Yes, explain it', noJustChat: 'No, it’s my own words',
    pause: 'The assistant is paused right now, so I can’t answer this one. Nothing you typed is lost. Please try again in about 30 minutes. If you need someone today, these are public phone lines:',
    pauseQuota: 'The assistant has reached its free daily limit, so I can’t answer this one. Nothing you typed is lost. Please try again in about 30 minutes, or tomorrow. If you need someone today, these are public phone lines:',
    tryAgain: 'Try again', basic: 'Use a basic letter instead',
    basicNote: 'This basic letter was put together from your choices, not written by the assistant. Read it closely and add your details.',
    breathe: 'If it would help, take one minute to breathe before the next step. Or see the public phone lines.',
    breatheBtn: 'Take a breath', phonesBtn: 'Phone lines',
    phonesIntro: 'Next Step is not staffed, so no one here will call you back. These are public lines:',
    holder: 'Type what happened, or paste their message', holderNotes: 'What happened, in your own words', holderFree: 'Ask a question, or tell me what to change',
    kLetter: 'Your letter', kReply: 'Their message and your reply',
    copied: 'Copied. Paste it into an email.', copy: 'Copy',
    sourceOne: 'Source: ', sourceMany: 'Sources: ',
    newChat: 'New chat', untitled: 'New chat',
    kindQ: 'Which one is coming up?',
    k_call: 'A phone call with my insurer', k_visit: 'The adjuster is visiting my home',
    askCallSit: 'A little preparation makes a call easier. I’ll make you a sheet to keep open while you talk. What is the call about?',
    c_denied: 'They said no', c_low: 'Their offer', c_quiet: 'I need an update', c_other: 'Something else',
    askHome: 'It helps to be ready before they come. I’ll make you a sheet with what to have ready, what to ask and what to photograph. Is the home still standing?',
    h_standing: 'It’s standing, with damage', h_lost: 'It was destroyed',
    askCallAsk: 'What do you most want from this call? Pick one. The sheet lists a few more things to ask.',
    askCallNotes: 'Anything you want to raise on the call? Dates, amounts and names help. I’ll put it on your sheet and leave blanks for anything missing.',
    askVisitNotes: 'What do you want the adjuster to see? A few words about rooms, damage or worries. I’ll put it on your sheet.',
    skipSheet: 'Skip, make the sheet',
    writingCall: 'Making your call sheet…', writingVisit: 'Making your visit sheet…',
    callDone: 'Your call sheet is ready. Keep it open during the call and fill in the log as you go. When you hang up, save it to your Record, and I can write the follow-up email from it.',
    visitDone: 'Your visit sheet is ready. Keep it with you and fill in the log before the adjuster leaves. Afterward, save it to your Record, and I can write the follow-up email from it.',
    sheetMobile: 'Tap the card above to open it.',
    basicSheet: 'The assistant is paused, so this sheet has the checklist only. What to say first is a plain template, not written by the assistant.',
    useBasicSheet: 'Use the checklist without the assistant',
    kCall: 'Your call sheet', kVisit: 'Your visit sheet',
    saveRecord: 'Save to Record', savedRecord: 'Saved to your Record.', updateRecord: 'Update in Record',
    followup: 'Write the follow-up email', fuNeedLog: 'Fill in what they said first, then I can write the follow-up email.',
    fuLead: 'Here is a follow-up email from your log. It asks them to confirm what was said.',
    general: 'general guidance', sourcesH: 'Sources',
    care: 'This is a lot to carry. If it would help, take one minute before the next step. Nothing here will be lost.',
    careBreath: 'One minute to breathe', careLines: 'Or talk to someone. Next Step isn’t staffed, but these public lines are:',
    keepGoing: 'Keep going', careDone: 'Done. Come back to it whenever you need to.',
    msgLbl: 'Message', titleMsg: 'Their message', titleCall: 'Getting ready for a call', titleVisit: 'Getting ready for a visit', titleFu: 'Follow-up email',
    copiedShort: 'Copied', copiedSheet: 'Copied.', again: 'Again', breatheIn: 'Breathe in', breatheOut: 'Breathe out',
    callAbout: { denied: 'about their decision', low: 'about their offer', quiet: 'for an update on your claim', smoke: 'about smoke and ash', other: 'for your call with the insurer' },
    visitStanding: ' for a home that is still standing', visitLost: ' for a home that was destroyed',
    callLog: 'Call log', visitLog: 'Visit log', fromNotes: 'from your notes', genNote: 'Lines marked general guidance are common sense from us, not from a source. Your policy decides.',
    explainH: 'What their message says', pinReply: 'Your reply', pinExplained: 'Their message, explained', notSaved: '[Their message, not saved on this device]',
    histCall: ', call sheet', histVisit: ', visit sheet', histLetter: ', letter',
    recH: 'Record', recLead: 'Every letter you send, call you make and visit you have, in one place. It stays on this device only.', recCopy: 'Copy as a summary', recAdd: 'Add a call or visit',
    rfWhat: 'What', rfCall: 'A call', rfVisit: 'A visit', rfLetter: 'A letter I sent', rfDate: 'Date', rfWho: 'Who', rfWhoHolder: 'Name and job title', rfSum: 'What was said or sent', save: 'Save', cancel: 'Cancel',
    recEmpty: 'Nothing here yet. When you copy a letter or save a call or visit log, it shows up here.', recOpen: 'Open', recRemove: 'Remove', recCopied: 'Copied. Paste it wherever you keep your notes.', recTitle: 'My claim record',
    kind: { letter: 'Letter', call: 'Call', visit: 'Visit' }, recInsurer: 'Your insurer', recLetter: 'Letter to the insurer', recCall: 'Call with the insurer', recVisit: 'Adjuster visit', recNext: 'Next: ',
    back: 'Back to the chat', phH: 'Phone lines', phLead: 'Next Step is an AI guide and is not staffed, so no one here will call you back. These are public lines, open to anyone.', phMore: 'Other places to turn', ph911: 'If someone is in danger right now, call 911.', openLink: 'Open',
    stH: 'Steps of a claim', stLead: 'The usual order of a wildfire claim in California. Yours may differ. Your policy decides.', own: 'I own', rent: 'I rent', stGeneral: 'General guidance, not checked against an official source.', home: 'Home',
    brH: 'Take a breath', brLead: 'One minute. Breathe in while the circle grows, and out while it settles. You can stop any time.', start: 'Start', seconds: ' seconds', brDone: 'Done. Come back whenever you need to.',
    pdf: 'Download PDF', pdfDone: 'Saved as a PDF in your downloads.', pdfFooter: 'Next Step. General information from public sources, not legal or insurance advice.', pdfPage: 'Page',
    fileLetter: 'letter', fileReply: 'reply', fileCall: 'call-sheet', fileVisit: 'visit-sheet',
    langOther: 'Español', themeDark: 'Dark mode', themeLight: 'Light mode', settingsLbl: 'Settings',
    basicCtx: { denied: 'I received your decision on my claim.', low: 'I received your settlement offer on my claim.', quiet: 'I have not received a response to my recent requests.', smoke: 'My home is still standing, but smoke and ash got in.', other: '' },
    inMyWords: 'In my own words: ',
    openEmail: 'Open in email', emailOpened: 'Opening your email app. The letter is also copied, in case nothing opens.', emailLong: 'Your email app is opening with the subject. The letter is long, so it is copied: paste it into the email.',
    ciLead: 'It has been {n} days since the letter you copied on {date}. Did your insurer reply?', ciReplied: 'They replied. Explain it', ciNone: 'No reply yet. Write a follow-up', ciLater: 'Not now', ciDevice: 'This check uses only what is saved on this device.',
    ciFuLead: 'Here is a follow-up letter. It points back to your earlier one and asks them to answer in writing.', titleNr: 'Follow-up letter', ciNotes: 'I sent a letter on {date} titled “{subj}”. It has been {n} days and I have not received a reply.',
    tell: 'Something unclear? Tell us', tellLead: 'Tell us what was hard to follow. We read these to make the tool clearer, but we cannot reply and no one is on call. Please leave out names, claim numbers and account details.', tellHolder: 'What was unclear?', tellSend: 'Send', tellThanks: 'Thank you. We read these to make the tool clearer.', tellFail: 'That did not send. Nothing was lost, and you can try again later.',
    noteBlanks: 'Fill in anything in [brackets], then tap Copy and paste it into an email to your adjuster.', noteDone: 'Read it through, then tap Copy and paste it into an email to your adjuster.', noteCall: 'Keep this open during the call and fill in the log at the bottom as you go.', noteVisit: 'Keep this with you and fill in the log at the bottom before the adjuster leaves.'
  };
  var T_ES = {
    open: '¿Qué está pasando con su aseguradora?',
    openSub: 'Toque lo que corresponda o cuéntemelo con sus palabras. Le ayudo a escribirles, con un pedido claro a la vez.',
    o_push: 'Me pusieron trabas con el reclamo', o_msg: 'Recibí un mensaje de ellos', o_call: 'Tengo una llamada o una visita pronto',
    s_denied: 'Dijeron que no', s_low: 'Ofrecieron menos', s_quiet: 'Dejaron de responder', s_other: 'Otra cosa',
    askSit: 'Es una situación difícil, y ponerlo por escrito es un buen siguiente paso. ¿Qué hicieron?',
    askRole: '¿La vivienda es suya o la alquila?',
    r_own: 'Es mía', r_rent: 'La alquilo', r_unsure: 'No lo sé',
    askAsk: '¿Qué quiere pedirles? Un solo pedido por carta lo mantiene claro, y después puede escribir otra.',
    askNotes: 'En pocas palabras, ¿qué pasó? Las fechas, cantidades y nombres ayudan. Puede escribir en español: la carta va en inglés y le muestro lo que dice. Dejo espacios en blanco para lo que falte.',
    writeNow: 'Escribir mi carta', skipNotes: 'Saltar, dejar espacios en blanco',
    writing: 'Escribiendo su carta…', writingReply: 'Escribiendo su respuesta…', reading: 'Leyendo su mensaje…', editing: 'Cambiando su carta…',
    done: 'Su carta está lista. Va en inglés, que es lo que su aseguradora lee, y debajo está lo que dice en español. Rellene lo que está entre [corchetes] en la carta en inglés y luego cópiela en un correo para su ajustador.',
    doneNoBlanks: 'Su carta está lista. Va en inglés, que es lo que su aseguradora lee, y debajo está lo que dice en español. Léala completa y luego cópiela en un correo para su ajustador.',
    replyDoneNoBlanks: 'Su respuesta está lista, debajo de la explicación de su mensaje. Va en inglés, con lo que dice en español debajo. Léala completa antes de enviarla.',
    doneEdit: 'Para cambiarla, escriba sobre la carta o dígamelo aquí.',
    doneMobile: 'Toque la tarjeta de arriba para abrirla. Para cambiarla, escriba sobre ella o dígamelo aquí.',
    next: 'Envíela por correo electrónico para que quede constancia. Los 15 días son su pedido, no un plazo legal. Si sigue sin avances, llame al Departamento de Seguros de California: ',
    another: 'Escribir otra carta', anotherDiff: 'Pedir otra cosa',
    changed: 'Listo. Las líneas cambiadas están resaltadas en su carta.',
    lostFacts: 'No pude hacer ese cambio sin perder otros datos de su carta, así que la dejé como estaba. Puede escribir el cambio directamente en la carta.',
    pasteAsk: 'Pegue abajo lo que le enviaron. Se lo explico en palabras sencillas y le sugiero qué pedir en su respuesta.',
    pastePrivacy: 'Lo que pegue se envía a la IA para leerlo y no se guarda. No incluya nada que no quiera compartir, como números de cuenta.',
    pasteHolder: 'Pegue aquí su mensaje',
    explainedRight: 'Puse lo que dice su mensaje, en palabras sencillas, arriba en su hoja.',
    suggest: 'Para su respuesta, yo les pediría:', suggested: 'sugerido', otherAsk: 'Elegir otro pedido',
    replyDone: 'Su respuesta está lista, debajo de la explicación de su mensaje. Va en inglés, con lo que dice en español debajo. Rellene lo que está entre [corchetes] antes de enviarla.',
    callMsg: 'Tengo una llamada o una visita con mi aseguradora. ¿Cómo me preparo?',
    isPaste: 'Parece un mensaje de su aseguradora. ¿Quiere que se lo explique y le ayude a responder?',
    yesExplain: 'Sí, explíquemelo', noJustChat: 'No, son mis palabras',
    pause: 'El asistente está en pausa en este momento, así que no puedo responder esto. No se perdió nada de lo que escribió. Inténtelo de nuevo en unos 30 minutos. Si necesita a alguien hoy, estas son líneas telefónicas públicas:',
    pauseQuota: 'El asistente llegó a su límite gratuito del día, así que no puedo responder esto. No se perdió nada de lo que escribió. Inténtelo de nuevo en unos 30 minutos, o mañana. Si necesita a alguien hoy, estas son líneas telefónicas públicas:',
    tryAgain: 'Intentar de nuevo', basic: 'Usar una carta básica',
    basicNote: 'Esta carta básica se armó con lo que usted eligió; no la escribió el asistente. Léala con cuidado y agregue sus datos.',
    breathe: 'Si le ayuda, tómese un minuto para respirar antes del siguiente paso. O vea las líneas telefónicas públicas.',
    breatheBtn: 'Respirar un momento', phonesBtn: 'Líneas telefónicas',
    phonesIntro: 'Next Step no tiene personal, así que nadie de aquí le devolverá la llamada. Estas son líneas públicas:',
    holder: 'Escriba lo que pasó o pegue su mensaje', holderNotes: 'Lo que pasó, con sus palabras', holderFree: 'Haga una pregunta o dígame qué cambiar',
    kLetter: 'Su carta', kReply: 'Su mensaje y su respuesta',
    copied: 'Copiada. Péguela en un correo.', copy: 'Copiar',
    sourceOne: 'Fuente: ', sourceMany: 'Fuentes: ',
    newChat: 'Nueva conversación', untitled: 'Nueva conversación',
    kindQ: '¿Cuál de las dos?',
    k_call: 'Una llamada con mi aseguradora', k_visit: 'El ajustador va a visitar mi vivienda',
    askCallSit: 'Prepararse un poco facilita la llamada. Le hago una hoja para tener abierta mientras habla. ¿De qué trata la llamada?',
    c_denied: 'Dijeron que no', c_low: 'Su oferta', c_quiet: 'Necesito saber cómo va', c_other: 'Otra cosa',
    askHome: 'Ayuda estar listo antes de que lleguen. Le hago una hoja con qué tener listo, qué preguntar y qué fotografiar. ¿La vivienda sigue en pie?',
    h_standing: 'Sigue en pie, con daños', h_lost: 'Se destruyó',
    askCallAsk: '¿Qué es lo que más quiere lograr con esta llamada? Elija una cosa. La hoja incluye otras preguntas.',
    askCallNotes: '¿Hay algo que quiera mencionar en la llamada? Las fechas, cantidades y nombres ayudan. Lo pongo en su hoja y dejo espacios en blanco para lo que falte.',
    askVisitNotes: '¿Qué quiere que vea el ajustador? Unas palabras sobre habitaciones, daños o preocupaciones. Lo pongo en su hoja.',
    skipSheet: 'Saltar, hacer la hoja',
    writingCall: 'Preparando su hoja para la llamada…', writingVisit: 'Preparando su hoja para la visita…',
    callDone: 'Su hoja para la llamada está lista. Téngala abierta durante la llamada y llene el registro sobre la marcha. Al colgar, guárdela en su Historial, y puedo escribir el correo de seguimiento a partir de ella.',
    visitDone: 'Su hoja para la visita está lista. Llévela consigo y llene el registro antes de que se vaya el ajustador. Después, guárdela en su Historial, y puedo escribir el correo de seguimiento a partir de ella.',
    sheetMobile: 'Toque la tarjeta de arriba para abrirla.',
    basicSheet: 'El asistente está en pausa, así que esta hoja solo tiene la lista. Lo que decir primero es una plantilla sencilla, no la escribió el asistente.',
    useBasicSheet: 'Usar la lista sin el asistente',
    kCall: 'Su hoja para la llamada', kVisit: 'Su hoja para la visita',
    saveRecord: 'Guardar en el Historial', savedRecord: 'Guardado en su Historial.', updateRecord: 'Actualizar en el Historial',
    followup: 'Escribir el correo de seguimiento', fuNeedLog: 'Primero anote lo que dijeron; luego puedo escribir el correo de seguimiento.',
    fuLead: 'Aquí tiene un correo de seguimiento a partir de su registro. Les pide confirmar lo que se dijo. Va en inglés, con lo que dice en español debajo.',
    general: 'orientación general', sourcesH: 'Fuentes',
    care: 'Esto es mucho para cargar. Si le ayuda, tómese un minuto antes del siguiente paso. Aquí no se perderá nada.',
    careBreath: 'Un minuto para respirar', careLines: 'O hable con alguien. Next Step no tiene personal, pero estas líneas públicas sí:',
    keepGoing: 'Seguir', careDone: 'Listo. Vuelva a esto cuando lo necesite.',
    msgLbl: 'Mensaje', titleMsg: 'Su mensaje', titleCall: 'Preparación para una llamada', titleVisit: 'Preparación para una visita', titleFu: 'Correo de seguimiento',
    copiedShort: 'Copiado', copiedSheet: 'Copiada.', again: 'Otra vez', breatheIn: 'Inhale', breatheOut: 'Exhale',
    callAbout: { denied: 'sobre su decisión', low: 'sobre su oferta', quiet: 'para saber cómo va su reclamo', smoke: 'sobre el humo y la ceniza', other: 'para su llamada con la aseguradora' },
    visitStanding: ', vivienda que sigue en pie', visitLost: ', vivienda destruida',
    callLog: 'Registro de la llamada', visitLog: 'Registro de la visita', fromNotes: 'de sus notas', genNote: 'Las líneas marcadas como orientación general son sentido común nuestro, no de una fuente. Lo que cuenta es su póliza. Las fuentes están en inglés.',
    explainH: 'Lo que dice su mensaje', pinReply: 'Su respuesta', pinExplained: 'Su mensaje, explicado', notSaved: '[Su mensaje, no guardado en este dispositivo]',
    histCall: ', hoja para llamada', histVisit: ', hoja para visita', histLetter: ', carta',
    recH: 'Historial', recLead: 'Cada carta que envía, llamada que hace y visita que recibe, en un solo lugar. Se queda solo en este dispositivo.', recCopy: 'Copiar como resumen', recAdd: 'Agregar una llamada o visita',
    rfWhat: 'Qué', rfCall: 'Una llamada', rfVisit: 'Una visita', rfLetter: 'Una carta que envié', rfDate: 'Fecha', rfWho: 'Quién', rfWhoHolder: 'Nombre y cargo', rfSum: 'Qué se dijo o se envió', save: 'Guardar', cancel: 'Cancelar',
    recEmpty: 'Todavía no hay nada aquí. Cuando copie una carta o guarde el registro de una llamada o visita, aparecerá aquí.', recOpen: 'Abrir', recRemove: 'Quitar', recCopied: 'Copiado. Péguelo donde guarde sus notas.', recTitle: 'Historial de mi reclamo',
    kind: { letter: 'Carta', call: 'Llamada', visit: 'Visita' }, recInsurer: 'Su aseguradora', recLetter: 'Carta a la aseguradora', recCall: 'Llamada con la aseguradora', recVisit: 'Visita del ajustador', recNext: 'Lo que sigue: ',
    back: 'Volver a la conversación', phH: 'Líneas telefónicas', phLead: 'Next Step es una guía de IA y no tiene personal, así que nadie de aquí le devolverá la llamada. Estas son líneas públicas, abiertas para cualquier persona.', phMore: 'Otros lugares donde pedir ayuda', ph911: 'Si alguien está en peligro ahora mismo, llame al 911.', openLink: 'Abrir',
    stH: 'Pasos de un reclamo', stLead: 'El orden habitual de un reclamo por incendio en California. El suyo puede ser distinto. Lo que cuenta es su póliza.', own: 'Es mía', rent: 'La alquilo', stGeneral: 'Orientación general, no verificada con una fuente oficial.', home: 'Vivienda',
    brH: 'Respire un momento', brLead: 'Un minuto. Inhale mientras el círculo crece y exhale mientras se reduce. Puede parar cuando quiera.', start: 'Empezar', seconds: ' segundos', brDone: 'Listo. Vuelva cuando lo necesite.',
    pdf: 'Descargar PDF', pdfDone: 'Guardado como PDF en sus descargas.', pdfFooter: 'Next Step. Información general de fuentes públicas, no es asesoría legal ni de seguros.', pdfPage: 'Página',
    fileLetter: 'carta', fileReply: 'respuesta', fileCall: 'hoja-llamada', fileVisit: 'hoja-visita',
    langOther: 'English', themeDark: 'Modo oscuro', themeLight: 'Modo claro', settingsLbl: 'Ajustes',
    basicCtx: { denied: 'I received your decision on my claim.', low: 'I received your settlement offer on my claim.', quiet: 'I have not received a response to my recent requests.', smoke: 'My home is still standing, but smoke and ash got in.', other: '' },
    inMyWords: 'In my own words (written in Spanish): ',
    noteBlanks: 'Rellene lo que está entre [corchetes] en la carta en inglés, luego toque Copiar y péguela en un correo para su ajustador. Más abajo está lo que dice en español.', noteDone: 'Léala completa, luego toque Copiar y péguela en un correo para su ajustador. Más abajo está lo que dice en español.', noteCall: 'Téngala abierta durante la llamada y llene el registro de abajo sobre la marcha.', noteVisit: 'Llévela consigo y llene el registro de abajo antes de que se vaya el ajustador.',
    openEmail: 'Abrir en el correo', emailOpened: 'Abriendo su aplicación de correo. La carta también quedó copiada, por si no se abre nada.', emailLong: 'Su aplicación de correo se abre con el asunto. La carta es larga, así que quedó copiada: péguela en el correo.',
    ciLead: 'Han pasado {n} días desde la carta que copió el {date}. ¿Respondió su aseguradora?', ciReplied: 'Respondieron. Explíquemelo', ciNone: 'Aún no responden. Escribir un seguimiento', ciLater: 'Ahora no', ciDevice: 'Esta revisión usa solo lo que está guardado en este dispositivo.',
    ciFuLead: 'Aquí tiene una carta de seguimiento. Se refiere a su carta anterior y les pide responder por escrito.', titleNr: 'Carta de seguimiento', ciNotes: 'I sent a letter on {date} titled “{subj}”. It has been {n} days and I have not received a reply.',
    tell: '¿Algo no quedó claro? Cuéntenos', tellLead: 'Cuéntenos qué le costó entender. Leemos esto para que la herramienta sea más clara, pero no podemos responder y nadie está de guardia. No incluya nombres, números de reclamo ni datos de cuentas.', tellHolder: '¿Qué no quedó claro?', tellSend: 'Enviar', tellThanks: 'Gracias. Leemos esto para que la herramienta sea más clara.', tellFail: 'No se envió. No se perdió nada, y puede intentarlo más tarde.',
    esH: 'Lo que dice su carta, en español', esNote: 'Para que sepa lo que envía. La carta que se envía es la de arriba, en inglés.',
    esUntranslated: 'Este párrafo no se pudo traducir con seguridad, así que se muestra en inglés. Pida a alguien de confianza que se lo lea.',
    esStale: 'Cambió la carta. Esta copia es de antes del cambio.', esUpdate: 'Actualizar la copia en español', esFailed: 'La copia en español no está disponible en este momento. La carta en inglés está lista.', esWorking: 'Traduciendo…',
    sayEs: 'En español: ', sayIntro: 'Dígalo en inglés, o en español si tiene intérprete.'
  };
  var T = LANG === 'es' ? T_ES : T_EN;
  /* Spanish names for source labels and the handoff; the documents themselves are in English. */
  var LABEL_ES = { 'CDI bulletin 2025-2': 'boletín 2025-2 del CDI', 'CDI wildfire page': 'página del CDI sobre incendios', 'CDI smoke damage order': 'orden del CDI sobre daños por humo', 'CDI complaints': 'quejas ante el CDI', 'CDI SB 495 release': 'comunicado del CDI sobre la ley SB 495', 'CDI claim rights': 'derechos en el reclamo (CDI)', 'CDI living expenses': 'gastos de vida (CDI)', 'United Policyholders wildfire page': 'página de United Policyholders sobre incendios', 'LA County tenant guide': 'guía para inquilinos del Condado de Los Ángeles', 'FEMA rental assistance': 'ayuda de FEMA para el alquiler', 'CDI renters guide': 'guía del CDI para inquilinos', 'CDI top ten tips': 'diez consejos del CDI' };
  function srcLabel(d) { var l = SOURCES[d].label; return LANG === 'es' ? (LABEL_ES[l] || l) : l; }
  var HANDOFF_ES = { '23': { title: 'United Policyholders: Ask an Expert', notes: 'United Policyholders es una organización sin fines de lucro para personas aseguradas. Su página Ask an Expert es un foro público y gratuito de preguntas, en inglés. No es una línea telefónica.' } };

  /* Public lines. A number shows only if it appears in that source's notes. */
  var PHONES = [
    LANG === 'es' ? { src: '2', num: '1-800-927-4357', who: 'Departamento de Seguros de California', what: 'Preguntas sobre su póliza o un desacuerdo con su aseguradora' } : { src: '2', num: '1-800-927-4357', who: 'California Department of Insurance', what: 'Questions about your policy or a dispute with your insurer' },
    LANG === 'es' ? { src: '4', num: '1-800-621-3362', who: 'Asistencia por desastre de FEMA', what: 'Ayuda con necesidades que el seguro no cubre' } : { src: '4', num: '1-800-621-3362', who: 'FEMA disaster assistance', what: 'Help with needs insurance does not cover' },
    LANG === 'es' ? { src: '3', num: '1-800-321-2752', who: 'Junta Estatal de Licencias de Contratistas', what: 'Verificar la licencia de un contratista' } : { src: '3', num: '1-800-321-2752', who: 'Contractors State License Board', what: 'Check a contractor’s license' },
    LANG === 'es' ? { src: '25', num: '988', who: '988 Línea de Prevención del Suicidio y Crisis', what: 'Llame o envíe un mensaje de texto a cualquier hora, por estrés o angustia', care: true } : { src: '25', num: '988', who: '988 Suicide & Crisis Lifeline', what: 'Call or text any time, for stress or distress', care: true }
  ];
  /* Insurance lines by default; the care card and the Phone lines page add the 988 line. */
  function phones(withCare) { return PHONES.filter(function (p) { return (withCare || !p.care) && SOURCES[p.src] && SOURCES[p.src].notes.indexOf(p.num) !== -1; }); }
  /* Places to turn that are not phone lines. A source marked pending (TAC, until it approves) is never shown. */
  function handoffs() { return Object.keys(SOURCES).filter(function (k) { return SOURCES[k].handoff && !SOURCES[k].pending && SOURCES[k].url; }).map(function (k) { return Object.assign({ id: k }, SOURCES[k]); }); }
  function tel(n) { return 'tel:' + n.replace(/\D/g, ''); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function niceISO(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], m[2] - 1, +m[3]).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }) : (iso || ''); }

  /* ---------- state ---------- */
  var store = load();
  var chat = null;          // the open chat
  var pasteMem = {};        // pasted insurer messages, in memory only (never saved)
  var busy = false;

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.chats)) return s; } catch (e) {}
    return { chats: [], cur: null, record: [] };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }
  function newChat(seed) {
    var c = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), title: '', step: 'start', msgs: [] };
    if (seed) for (var k in seed) c[k] = seed[k];
    return c;
  }
  function persist() {
    if (!chat) return;
    if (chat.msgs.length && store.chats.indexOf(chat) === -1) store.chats.unshift(chat);
    store.chats = store.chats.slice(0, 30);
    store.cur = chat.id;
    save(); renderHistory();
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function L(m) { return m && (m[LANG] || m.en || m); }
  function tr(x) { return LANG === 'es' ? (C.SHEET_ES[x] || x) : x; }
  function isPhone() { return window.matchMedia('(max-width: 900px)').matches; }
  function count(ev, what) { if (window.nsCount) window.nsCount(ev, what); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  function niceDate(ts) { return new Date(ts).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' }); }
  function asksFor(sit) { return (C.ASKS[sit] || C.ASKS.other); }
  function askById(sit, id) { return asksFor(sit).filter(function (a) { return a[0] === id; })[0]; }
  var PICK_IF = LANG === 'es' ? {
    denied: { a1: 'Elija esto si no sabe exactamente por qué dijeron que no.', a2: 'Elija esto si quiere ver en qué se basó su decisión.', a3: 'Elija esto si tiene fotos, recibos o presupuestos que muestran la pérdida.' },
    low: { a1: 'Elija esto si no entiende cómo llegaron a su cifra.', a2: 'Elija esto si tiene el presupuesto de su propio contratista para enviar.', a3: 'Elija esto si no está seguro de lo que cubre su póliza.' },
    quiet: { a1: 'Elija esto si solo necesita saber en qué va su reclamo.', a2: 'Elija esto si ya intentó comunicarse con su ajustador más de una vez.', a3: 'Elija esto si quiere saber cuánto debe tardar cada paso.' },
    smoke: { a1: 'Elija esto si nadie le ha explicado cómo revisarán su vivienda.', a2: 'Elija esto si quiere que un profesional haga pruebas en su vivienda.' },
    other: { a1: 'Elija esto si no sabe qué necesitan para avanzar.', a2: 'Elija esto si ya le dijeron lo que necesitan y usted lo está enviando.' }
  } : {
    denied: { a1: 'Pick this if you don’t know exactly why they said no.', a2: 'Pick this if you want to see what their decision was based on.', a3: 'Pick this if you have photos, receipts or estimates that show the loss.' },
    low: { a1: 'Pick this if you can’t tell how they reached their number.', a2: 'Pick this if you have your own contractor’s estimate to send.', a3: 'Pick this if you’re not sure what your policy covers.' },
    quiet: { a1: 'Pick this if you just need to know where things stand.', a2: 'Pick this if you’ve already tried your adjuster more than once.', a3: 'Pick this if you want to know how long each step should take.' },
    smoke: { a1: 'Pick this if no one has explained how they will check your home.', a2: 'Pick this if you want a professional to test your home.' },
    other: { a1: 'Pick this if you’re not sure what they need to move forward.', a2: 'Pick this if they already told you what they need and you’re sending it.' }
  };

  /* Citations: [n] in a reply becomes a quiet source line under it. */
  function splitCites(text) {
    var ids = [];
    var clean = String(text || '').replace(/\s*\[(\d{1,2})\]/g, function (m, d) { if (SOURCES[d] && ids.indexOf(d) === -1) ids.push(d); return ''; });
    return { text: clean.replace(/ +([.,;:])/g, '$1').trim(), ids: ids };
  }
  function srcLine(ids) {
    if (!ids || !ids.length) return '';
    return '<p class="src">' + (ids.length > 1 ? T.sourceMany : T.sourceOne) + ids.map(function (d) { return '<a href="' + esc(SOURCES[d].url) + '" target="_blank" rel="noopener">' + esc(srcLabel(d)) + '</a>'; }).join(', ') + '</p>';
  }
  function linkNums(h) { return h.replace(/\b1-\d{3}-\d{3}-\d{4}\b/g, function (n) { return '<a class="num" href="' + tel(n) + '">' + n + '</a>'; }); }
  function linesHtml(list) {
    return '<ul class="lines">' + (list || phones()).map(function (p) { return '<li><span class="who">' + esc(p.who) + '</span><a href="' + tel(p.num) + '">' + esc(p.num) + '</a></li>'; }).join('') + '</ul>';
  }

  /* ---------- rendering the thread ---------- */
  var thread = $('thread');
  function scrollDown() { requestAnimationFrame(function () { thread.scrollTop = thread.scrollHeight; }); }

  function renderAll() {
    thread.innerHTML = '';
    if (!chat.msgs.length) renderOpening();
    chat.msgs.forEach(function (m, i) { thread.appendChild(renderMsg(m, i)); });
    renderPaper(false);
    setComposer();
    jumpDown();
  }
  function jumpDown() {
    // the check-in is the first thing to read, so a Desk that has one opens at the top, not the bottom
    var go = function () { thread.style.scrollBehavior = 'auto'; thread.scrollTop = thread.querySelector('.checkin') ? 0 : thread.scrollHeight; thread.style.scrollBehavior = ''; };
    go(); requestAnimationFrame(go);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  }

  function renderOpening() {
    var o = el('div', 'opening');
    o.innerHTML = '<h1 tabindex="-1">' + esc(T.open) + '</h1><p class="sub">' + esc(T.openSub) + '</p>';
    var ch = el('div', 'choices');
    [['push', T.o_push], ['msg', T.o_msg], ['call', T.o_call]].forEach(function (c) {
      var b = el('button', 'choice'); b.type = 'button'; b.dataset.open = c[0]; b.textContent = c[1];
      b.addEventListener('click', function () { if (!busy) startWith(c[0], c[1]); });
      ch.appendChild(b);
    });
    var due = dueLetter();
    if (due) o.appendChild(checkinBlock(due));
    o.appendChild(ch);
    var lg = el('p', 'lang-line');
    lg.innerHTML = '<button type="button" class="linkbtn" lang="' + (LANG === 'es' ? 'en' : 'es') + '" data-lang="' + (LANG === 'es' ? 'en' : 'es') + '">' + esc(T.langOther) + '</button>';
    o.appendChild(lg);
    thread.appendChild(o);
  }

  function renderMsg(m, i) {
    if (m.r === 'u') {
      var u = el('div', 'm-u' + (m.paste ? ' paste' : ''));
      var shown = m.paste ? (pasteMem[m.paste] || T.notSaved) : m.x;
      u.innerHTML = '<p>' + esc(shown) + '</p>';
      return u;
    }
    var a = el('div', 'm-a' + (m.k ? ' ' + m.k : ''));
    a.dataset.i = i;
    var html = '';
    if (m.x) { var c = splitCites(m.x); html += c.text.split(/\n{2,}/).map(function (p) { return '<p class="tx">' + linkNums(esc(p)) + '</p>'; }).join(''); html += srcLine(c.ids); }
    if (m.note) html += '<p class="note">' + esc(m.note) + '</p>';
    if (m.k === 'pause' || m.k === 'phones') html += linesHtml();
    if (m.k === 'care') html += careHtml();
    a.innerHTML = html;
    if (m.k === 'care') wireCare(a);
    if (m.ch) a.appendChild(renderChoices(m, i));
    return a;
  }

  function renderChoices(m, i) {
    var ch = el('div', 'choices' + (m.ch.inline ? ' inline' : '') + (m.ch.picked != null ? ' done' : ''));
    m.ch.opts.forEach(function (o) {
      var b = el('button', 'choice'); b.type = 'button';
      b.dataset.v = o.v; b.dataset.key = m.ch.key;
      b.innerHTML = esc(o.l) + (o.tag ? '<span class="tag">' + esc(o.tag) + '</span>' : '') + (o.n ? '<small>' + esc(o.n) + '</small>' : '');
      b.setAttribute('aria-pressed', m.ch.picked === o.v ? 'true' : 'false');
      if (m.ch.picked != null) b.disabled = true;
      b.addEventListener('click', function () {
        if (busy || m.ch.picked != null) return;
        m.ch.picked = o.v;
        ch.classList.add('done');
        b.setAttribute('aria-pressed', 'true');
        [].forEach.call(ch.children, function (x) { x.disabled = true; });
        onChoice(m.ch.key, o.v, o.l);
      });
      ch.appendChild(b);
    });
    return ch;
  }

  function say(m) {
    chat.msgs.push(m); var node = renderMsg(m, chat.msgs.length - 1); var op = thread.querySelector('.opening'); if (op) op.remove(); thread.appendChild(node); persist();
    // A question with its choices that is taller than the chat (the asks, on a phone): show it from its first line,
    // so the question and the first choices are in view and the rest is a scroll away, not hidden under the box.
    requestAnimationFrame(function () {
      if (node.offsetHeight > thread.clientHeight - 24) thread.scrollTop = Math.max(0, node.offsetTop - 12);
      else thread.scrollTop = thread.scrollHeight;
    });
    return node;
  }
  function me(text, extra) { var m = { r: 'u', x: text }; if (extra) for (var k in extra) m[k] = extra[k]; return say(m); }
  function status(text) { var n = el('div', 'm-a status', '<p class="tx">' + esc(text) + '</p>'); thread.appendChild(n); scrollDown(); return n; }

  /* ---------- the guided path ---------- */
  function startWith(kind, label) {
    if (kind === 'push') { chat.flow = 'letter'; me(label); askSit(); }
    else if (kind === 'msg') { me(label); askPaste(); }
    else if (kind === 'call') { me(label); askKind(); }
    title(kind === 'msg' ? T.titleMsg : '');
  }
  function title(t) { if (t && !chat.title) { chat.title = t; persist(); } }

  function askSit() {
    chat.step = 'sit';
    say({ r: 'a', x: T.askSit, ch: { key: 'sit', opts: [{ v: 'denied', l: T.s_denied }, { v: 'low', l: T.s_low }, { v: 'quiet', l: T.s_quiet }] } });
    setComposer();
  }
  function askKind() {
    chat.step = 'kind';
    say({ r: 'a', x: T.kindQ, ch: { key: 'kind', opts: [{ v: 'call', l: T.k_call }, { v: 'visit', l: T.k_visit }] } });
    setComposer();
  }
  function askCallSit() {
    chat.step = 'sit';
    say({ r: 'a', x: T.askCallSit, ch: { key: 'sit', opts: [{ v: 'denied', l: T.c_denied }, { v: 'low', l: T.c_low }, { v: 'quiet', l: T.c_quiet }, { v: 'other', l: T.c_other }] } });
    setComposer();
  }
  function askHome() {
    chat.step = 'home';
    say({ r: 'a', x: T.askHome, ch: { key: 'home', inline: true, opts: [{ v: 'standing', l: T.h_standing }, { v: 'lost', l: T.h_lost }] } });
    setComposer();
  }
  function isSheetFlow() { return chat.flow === 'call' || chat.flow === 'visit'; }
  /* The next question for whatever is still missing, in the order each exchange asks it. */
  function nextStep() {
    if (chat.flow === 'call') {
      if (!chat.sit) return askCallSit();
      if (!chat.role) return askRole();
      if (!chat.ask) return askAsk(T.askCallAsk);
      if (chat.notes == null) return askNotes();
      return writeSheet();
    }
    if (chat.flow === 'visit') {
      if (!chat.home) return askHome();
      if (!chat.role) return askRole();
      if (chat.notes == null) return askNotes();
      return writeSheet();
    }
    if (chat.flow === 'reply') return chat.role ? writeLetter() : askRole();
    if (!chat.sit) return askSit();
    if (!chat.role) return askRole();
    if (!chat.ask) return askAsk();
    if (chat.notes == null) return askNotes();
    return writeLetter();
  }
  function askRole() {
    chat.step = 'role';
    say({ r: 'a', x: T.askRole, ch: { key: 'role', inline: true, opts: [{ v: 'own', l: T.r_own }, { v: 'rent', l: T.r_rent }, { v: 'unsure', l: T.r_unsure }] } });
    setComposer();
  }
  function askAsk(lead) {
    chat.step = 'ask';
    var opts = asksFor(chat.sit).map(function (a) { return { v: a[0], l: L(a[2]), n: (PICK_IF[chat.sit] || {})[a[0]] }; });
    say({ r: 'a', x: lead || T.askAsk, ch: { key: 'ask', opts: opts } });
    setComposer();
  }
  function askNotes() {
    chat.step = 'notes';
    var sheet = isSheetFlow();
    say({ r: 'a', x: chat.flow === 'call' ? T.askCallNotes : chat.flow === 'visit' ? T.askVisitNotes : T.askNotes, ch: { key: 'notes', inline: true, opts: [{ v: 'skip', l: sheet ? T.skipSheet : T.skipNotes }] } });
    setComposer();
    if (!isPhone()) $('composerIn').focus();
  }
  function askPaste() {
    chat.step = 'paste';
    say({ r: 'a', x: T.pasteAsk, note: T.pastePrivacy });
    setComposer();
    $('composerIn').focus();
  }
  function nextAfterRole() {
    if (chat.flow === 'reply') return writeLetter();
    if (!chat.ask) return askAsk();
    if (chat.notes == null) return askNotes();
    writeLetter();
  }

  function onChoice(key, v, label) {
    if (key === 'kind') { chat.flow = v; me(label); title(v === 'call' ? T.titleCall : T.titleVisit); return nextStep(); }
    if (key === 'home') { chat.home = v; me(label); return nextStep(); }
    if (key === 'sit') { chat.sit = v; me(label); if (!isSheetFlow()) title(L(C.SIT_LABEL[v])); return nextStep(); }
    if (key === 'role') { chat.role = v; me(label); return nextStep(); }
    if (key === 'ask') { chat.ask = v; me(label); return nextStep(); }
    if (key === 'notes') { chat.notes = ''; me(label); return nextStep(); }
    if (key === 'more') {
      me(label);
      if (v === 'another') return anotherLetter();
      return;
    }
    if (key === 'isPaste') {
      var last = chat.msgs[chat.msgs.length - 2];
      me(label);
      if (v === 'yes') { var txt = chat.pendingText; chat.pendingText = null; return explain(txt, last); }
      var t2 = chat.pendingText; chat.pendingText = null;
      chat.msgs.forEach(function (m) { if (m.paste && m.paste === chat.pendingPaste) { delete m.paste; m.x = t2; } });
      chat.pendingPaste = null; renderAll(); return talk(t2, true);
    }
    if (key === 'pickAsk') {
      me(label);
      if (v === 'other') { chat.ask = null; return askAsk(T.askAsk); }
      chat.ask = v; return chat.role ? writeLetter() : askRole();
    }
    if (key === 'pause') {
      me(label);
      if (v === 'retry') return retry();
      if (v === 'basic') return basicLetter();
      if (v === 'basicSheet') return basicSheet();
    }
    if (key === 'care') {
      me(label);
      if (v === 'breathe') location.hash = '#/breathe';
      else if (v === 'phones') location.hash = '#/phones';
      else if (v === 'keep' && chat.afterCare) { var ac = chat.afterCare; chat.afterCare = null; act(ac.a, ac.t); }
      setComposer();
    }
  }

  function anotherLetter() {
    var seed = { role: chat.role, sit: chat.sit, notes: chat.notes, flow: 'letter', title: '' };
    openChat(newChat(seed));
    say({ r: 'a', x: T.askAsk, ch: { key: 'ask', opts: asksFor(chat.sit).map(function (a) { return { v: a[0], l: L(a[2]), n: (PICK_IF[chat.sit] || {})[a[0]] }; }) } });
    chat.step = 'ask'; title(L(C.SIT_LABEL[chat.sit]));
    setComposer();
  }

  /* ---------- coming back after a letter: did the insurer reply? Uses only the Record on this device ---------- */
  function daysSince(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return 0;
    var t = new Date(), a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()), b = Date.UTC(+m[1], m[2] - 1, +m[3]);
    return Math.round((a - b) / 86400000);
  }
  function plusDaysISO(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  /* The newest letter in the Record, if it is 15 days old or more and the person has not answered or put it off. */
  function dueLetter() {
    var letters = (store.record || []).filter(function (r) { return r.kind === 'letter'; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var r = letters[0]; if (!r || r.checked || (r.snooze && r.snooze > todayISO())) return null;
    var n = daysSince(r.date);
    return n >= 15 ? { r: r, n: n } : null;
  }
  function enDate(iso) { var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : iso; }
  function checkinBlock(due) {
    var b = el('div', 'checkin'); b.setAttribute('role', 'group'); b.setAttribute('aria-labelledby', 'ciLead');
    b.innerHTML = '<p class="ci-lead" id="ciLead">' + esc(T.ciLead.replace('{n}', due.n).replace('{date}', niceISO(due.r.date))) + '</p>' + (due.r.summary ? '<p class="ci-sub">' + esc(due.r.summary) + '</p>' : '') +
      '<div class="choices inline"><button type="button" class="choice" data-ci="replied">' + esc(T.ciReplied) + '</button><button type="button" class="choice" data-ci="none">' + esc(T.ciNone) + '</button></div>' +
      '<p class="ci-foot"><button type="button" class="linkbtn" data-ci="later">' + esc(T.ciLater) + '</button><span>' + esc(T.ciDevice) + '</span></p>';
    [].forEach.call(b.querySelectorAll('[data-ci]'), function (x) { x.addEventListener('click', function () { if (!busy) answerCheckin(due, x.dataset.ci); }); });
    return b;
  }
  function answerCheckin(due, how) {
    var r = due.r;
    if (how === 'later') { r.snooze = plusDaysISO(7); save(); return renderAll(); }
    r.checked = true; save();
    if (how === 'replied') return startWith('msg', T.ciReplied);
    // No reply: a follow-up letter that points back to the earlier one, from what is saved about it
    var old = store.chats.filter(function (x) { return x.id === r.chat; })[0] || {};
    var subj = (((old.letter || '').match(/^Subject:\s*(.+)$/m) || [])[1] || r.summary || '').replace(/\s+-\s+Claim .*$/, '').slice(0, 120);
    chat.flow = 'letter'; chat.ask = 'nr'; chat.sit = old.sit || 'other'; chat.role = old.role || ''; chat.title = T.titleNr;
    chat.notes = T_EN.ciNotes.replace('{date}', function () { return enDate(r.date); }).replace('{subj}', function () { return subj; }).replace('{n}', due.n);
    me(T.ciNone); say({ r: 'a', x: T.ciFuLead });
    writeLetter();
  }

  /* ---------- the composer ---------- */
  var input = $('composerIn');
  function setComposer() {
    var step = chat.step, form = $('composer');
    form.classList.toggle('tall', step === 'paste');
    input.placeholder = step === 'paste' ? T.pasteHolder : step === 'notes' ? T.holderNotes : (chat.letter || chat.sheet) ? T.holderFree : T.holder;
    $('composerLbl').textContent = step === 'paste' ? T.pasteHolder : T.msgLbl;
    autosize();
  }
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, window.innerHeight * 0.4) + 'px'; $('send').disabled = !input.value.trim() || busy; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && chat.step !== 'paste' && !isPhone()) { e.preventDefault(); $('composer').requestSubmit(); }
  });
  $('composer').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    input.value = ''; autosize();
    onTyped(text);
  });

  function looksPasted(t) { return t.length > 400 && /(dear|claim|policy|sincerely|regards|adjuster|estimad[oa]|reclamo|p[oó]liza|atentamente|ajustador|asegurad)/i.test(t) && (t.match(/[.!?]\s/g) || []).length >= 3; }

  function onTyped(text) {
    var step = chat.step;
    // A step that was waiting on a tap: the person typed instead, so the open choices are closed.
    var lastA = chat.msgs[chat.msgs.length - 1];
    var keep = { more: 1, care: 1 };
    if (lastA && lastA.ch && lastA.ch.picked == null && step !== 'notes' && !keep[lastA.ch.key]) { lastA.ch.picked = '_typed'; var nodes = thread.querySelectorAll('.choices:not(.done)'); [].forEach.call(nodes, function (n) { if (keep[n.firstChild && n.firstChild.dataset.key]) return; n.classList.add('done'); [].forEach.call(n.children, function (b) { b.disabled = true; }); }); }
    if (step === 'paste') { return explain(text); }
    if (step === 'notes') {
      if (lastA && lastA.ch) { lastA.ch.picked = '_typed'; var n2 = thread.querySelector('.choices:not(.done)'); if (n2) n2.classList.add('done'); }
      chat.notes = text; me(text); return nextStep();
    }
    if (!chat.letter && !chat.sheet && looksPasted(text)) {
      chat.pendingText = text;
      var id = 'p' + Date.now().toString(36); pasteMem[id] = text; chat.pendingPaste = id;
      me('', { paste: id });
      say({ r: 'a', x: T.isPaste, ch: { key: 'isPaste', inline: true, opts: [{ v: 'yes', l: T.yesExplain }, { v: 'no', l: T.noJustChat }] } });
      return;
    }
    if (chat.letter && looksLikeEdit(text)) { me(text); return revise(text); }
    talk(text);
  }
  // Clear requests to change the letter go straight to the rewrite, so they never depend on the chat model.
  function looksLikeEdit(t) {
    return t.length < 400 && (/^(please |can you |could you )?(make|change|add|remove|take out|delete|fix|replace|shorten|mention|include|put|use|sign|say)\b/i.test(t) || /\bmy (claim|policy) number is\b|\bmy name is\b|\b(shorter|more formal|more polite|less formal)\b/i.test(t) ||
      // the same requests in Spanish ("hágala más corta", "agregue que...", "mi número de reclamo es...")
      /^(por favor,? |puede |podr[ií]a )?(h[aá]g[ao]la|haz(la)?|cambi[ae]|agreg[ue]e?|a[nñ]ad[ae]|quit[ae]|borr[ae]|elimin[ae]|corrij[ae]|reemplac[ae]|acort[ae]|mencion[ae]|inclu[iy][ae]?|pon(ga)?|us[ae]|firm[ae]|dig[ae]|ponga)(?![\p{L}])/iu.test(t) ||
      /mi n[uú]mero de (reclamo|p[oó]liza|reclamaci[oó]n) es|mi nombre es|m[aá]s (corta|breve|formal|amable)|menos formal/i.test(t));
  }

  /* ---------- talking to the AI ---------- */
  var lastFail = null;
  function convo() {
    var out = [];
    chat.msgs.forEach(function (m) {
      if (m.paste || !m.x || m.k === 'pause' || m.k === 'status') return;
      var role = m.r === 'u' ? 'user' : 'assistant';
      var x = m.x;
      if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n' + x; else out.push({ role: role, content: x });
    });
    return out.slice(-8);
  }
  function fixedAsk(id) { return id === 'fu' || id === 'nr'; }
  function askOf(c) { if (c.ask === 'fu') return C.FOLLOWUP; if (c.ask === 'nr') return C.NOREPLY; return c.ask && askById(c.sit, c.ask); }
  function askSentence() { var a = askOf(chat); return a ? a[1] : ''; }
  function askEs() { if (LANG !== 'es') return ''; if (fixedAsk(chat.ask)) return C.ASK_ES[chat.ask]; return ((C.ASK_ES[chat.sit] || {})[chat.ask]) || ''; }
  function subjectsOf(c) { return { en: fixedAsk(c.ask) ? C.ASK_SUBJECT[c.ask] : (C.ASK_SUBJECT[c.sit] || {})[c.ask] || '', es: fixedAsk(c.ask) ? C.ASK_SUBJECT_ES[c.ask] : (C.ASK_SUBJECT_ES[c.sit] || {})[c.ask] || '' }; }

  function setBusy(b) { busy = b; $('send').disabled = b || !input.value.trim(); document.body.classList.toggle('busy', b); }

  /* Said plainly that it is too much: the care card comes once, whatever the model answers. */
  function soundsOverwhelmed(t) {
    return /overwhelm|exhaust|can.?t (do|take|handle|cope with) (this|it|any ?more)|too much for me|falling apart|breaking down|so tired of|hopeless|can.?t cope|give up|losing it|panic/i.test(t) ||
      // Spanish: agobiado, abrumado, no puedo más, ya no aguanto, es demasiado, estoy agotado, me rindo, sin esperanza
      /agobiad|abrumad|no puedo m[aá]s|ya no puedo|no (lo )?aguanto|ya no aguanto|es demasiado|demasiado para m[ií]|(muy |tan )?cansad[oa] de|agotad[oa]|me rindo|sin esperanza|desesperad[oa]|me estoy derrumbando|me siento perdid[oa]|ataque de p[aá]nico|no puedo con (esto|todo)/i.test(t);
  }
  function talk(text, alreadyShown) {
    if (!alreadyShown) me(text);
    var care = soundsOverwhelmed(text) && !store.breathe;
    if (!chat.title) title(text.length > 42 ? text.slice(0, 40).replace(/\s+\S*$/, '') + '…' : text);
    var node = el('div', 'm-a'); node.innerHTML = '<p class="tx"><span class="typing" aria-hidden="true"></span></p>';
    thread.appendChild(node); scrollDown(); setBusy(true);
    var body = { mode: 'chat', stream: true, lang: LANG, role: chat.role === 'unsure' ? '' : chat.role, messages: convo(), paper: !!chat.letter, ask: askSentence(), breatheOffered: !!store.breathe || care, sheet: chat.sheet ? chat.sheet.kind : '', stageLabel: chat.sit ? L(C.SIT_LABEL[chat.sit]) : '' };
    stream(body, function (soFar) {
      var c = splitCites(soFar);
      node.innerHTML = c.text.split(/\n{2,}/).map(function (p) { return '<p class="tx">' + esc(p) + '</p>'; }).join('').replace(/<\/p>$/, '<span class="typing" aria-hidden="true"></span></p>');
      scrollDown();
    }).then(function (fin) {
      node.remove(); setBusy(false);
      say({ r: 'a', x: fin.text });
      // With the care card up, the next step waits for "Keep going" instead of rushing on.
      if (care) { offerCare(); chat.afterCare = fin.action ? { a: fin.action, t: text } : null; persist(); return; }
      act(fin.action, text);
    }, function (err) {
      node.remove(); setBusy(false);
      if (care) offerCare();
      pause(err, function () { talk(text, true); });
    });
  }

  function act(a, userText) {
    if (!a) return;
    if (a.type === 'edit' && chat.letter) return revise(userText);
    if ((a.type === 'call' || a.type === 'visit') && !chat.letter && !chat.sheet) {
      chat.flow = a.type;
      if (chat.notes == null) chat.notes = userText;
      title(a.type === 'call' ? T.titleCall : T.titleVisit);
      return nextStep();
    }
    if (a.type === 'letter' && !chat.letter && !chat.sheet) {
      chat.sit = a.arg === 'smoke' || a.arg === 'other' || C.ASKS[a.arg] ? a.arg : 'other';
      chat.flow = 'letter';
      if (chat.notes == null) chat.notes = userText;
      title(L(C.SIT_LABEL[chat.sit]));
      return chat.role ? askAsk() : askRole();
    }
    if (a.type === 'choices' && !chat.letter) return askSit();
    if (a.type === 'paste') return askPaste();
    if (a.type === 'phones') return say({ r: 'a', k: 'phones', x: T.phonesIntro });
    if (a.type === 'breathe') offerCare();
  }
  /* The gentle card: once per device, never again. */
  function offerCare() {
    if (store.breathe) return;
    store.breathe = true; save();
    say({ r: 'a', k: 'care', x: T.care, ch: { key: 'care', inline: true, opts: [{ v: 'keep', l: T.keepGoing }] } });
  }
  function careHtml() {
    return '<div class="care-in"><button class="btn ghost sm care-go" type="button">' + esc(T.careBreath) + '</button>' +
      '<div class="care-breath" hidden><div class="ring"></div><p class="care-word" aria-live="polite"></p></div>' +
      '<p class="care-lbl">' + esc(T.careLines) + '</p>' + linesHtml(phones(true).filter(function (p) { return p.care || p.src === '2'; })) + '</div>';
  }
  function wireCare(node) {
    var go = node.querySelector('.care-go'); if (!go) return;
    go.addEventListener('click', function () {
      var box = node.querySelector('.care-breath'), ring = box.querySelector('.ring'), word = box.querySelector('.care-word');
      go.hidden = true; box.hidden = false;
      var end = Date.now() + 60000, inhale = true;
      (function cycle() {
        if (!document.body.contains(node)) return;
        if (Date.now() >= end) { ring.classList.remove('big'); word.textContent = T.careDone; go.hidden = false; go.textContent = T.again; return; }
        ring.classList.toggle('big', inhale); ring.classList.toggle('out', !inhale);
        word.textContent = inhale ? T.breatheIn : T.breatheOut;
        setTimeout(cycle, inhale ? 4000 : 6000); inhale = !inhale;
      })();
    });
  }

  /* Reads the server's event stream: {t} while writing, then {done,text,action} or {error}. */
  function stream(body, onText) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (!r.ok || ct.indexOf('text/event-stream') === -1) return r.json().catch(function () { return {}; }).then(function (j) { throw code(j.error || 'http_' + r.status); });
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '', fin = null;
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) { if (fin) return fin; throw code('empty'); }
          buf += dec.decode(x.value, { stream: true });
          var i;
          while ((i = buf.indexOf('\n\n')) !== -1) {
            var line = buf.slice(0, i); buf = buf.slice(i + 2);
            if (line.indexOf('data: ') !== 0) continue;
            var ev; try { ev = JSON.parse(line.slice(6)); } catch (e) { continue; }
            if (ev.error) throw code(ev.error);
            if (ev.t) onText(ev.t);
            if (ev.done) fin = ev;
          }
          return pump();
        });
      }
      return pump();
    });
  }
  function code(c) { var e = new Error(c); e.code = c; return e; }
  function api(body) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.error) throw code(j.error || 'http_' + r.status); return j; });
    }, function () { throw code('network'); });
  }

  /* The honest pause: no fake reply. Phone lines, try again later, and a plain basic letter if that is what they were doing. */
  function pause(err, again) {
    lastFail = again;
    var opts = [{ v: 'retry', l: T.tryAgain }];
    if (isSheetFlow() && chat.step === 'writing' && !chat.sheet) opts.push({ v: 'basicSheet', l: T.useBasicSheet });
    else if ((chat.step === 'writing' || chat.flow) && chat.sit && chat.ask && !chat.letter && !isSheetFlow()) opts.push({ v: 'basic', l: T.basic });
    say({ r: 'a', k: 'pause', x: err && err.code === 'quota' ? T.pauseQuota : T.pause, ch: { key: 'pause', inline: true, opts: opts } });
  }
  function retry() { if (lastFail) { var f = lastFail; lastFail = null; f(); } }

  /* ---------- the letter ---------- */
  function letterBody() {
    var notes = (chat.notes || '').trim();
    var subj = fixedAsk(chat.ask) ? C.ASK_SUBJECT[chat.ask] : (C.ASK_SUBJECT[chat.sit] || {})[chat.ask];
    var subjEs = fixedAsk(chat.ask) ? C.ASK_SUBJECT_ES[chat.ask] : (C.ASK_SUBJECT_ES[chat.sit] || {})[chat.ask];
    return { mode: 'letter', lang: LANG, subject: subj || '', subjectEs: subjEs || '', askEs: askEs(), sit: chat.sit, sitLabel: L(C.SIT_LABEL[chat.sit]), role: chat.role === 'rent' ? 'rent' : 'own', ask: askSentence(), notes: notes, paste: chat.flow === 'reply' && chat.pasteId ? (pasteMem[chat.pasteId] || '') : '', name: '', claim: '', insurer: '', who: 'me' };
  }
  function writeLetter() {
    chat.step = 'writing'; setComposer();
    var s = status(chat.flow === 'reply' ? T.writingReply : T.writing); setBusy(true);
    var body = letterBody();
    if (chat.flow === 'reply' && !body.paste) body.notes = (body.notes ? body.notes + '\n' : '') + 'I am replying to a message from my insurer.';
    api(body).then(function (j) {
      s.remove(); setBusy(false);
      chat.letterEs = LANG === 'es' ? (j.es || 'failed') : null; chat.esStale = false;
      placeLetter(j.text, true);
      finishLetter();
    }, function (err) {
      s.remove(); setBusy(false); chat.step = 'free';
      pause(err, writeLetter);
    });
  }
  function finishLetter(basic) {
    chat.step = 'free';
    var cdi = phones()[0];
    var blanks = /\[[^\]\n]{1,40}\]/.test(chat.letter || '');
    var msg = (basic ? T.basicNote + '\n\n' : '') + (chat.flow === 'reply' ? (blanks ? T.replyDone : T.replyDoneNoBlanks) : (blanks ? T.done : T.doneNoBlanks)) + ' ' + (isPhone() ? T.doneMobile : T.doneEdit) + '\n\n' + T.next + (cdi ? cdi.num + ' [' + cdi.src + '].' : '');
    say({ r: 'a', x: msg, ch: { key: 'more', inline: true, opts: [{ v: 'another', l: T.another }] } });
    setComposer();
    if (isPhone()) openPaper();
  }
  function basicLetter() {
    var a = askSentence(), home = chat.role === 'rent' ? 'rental home' : 'home';
    var ctx = T_EN.basicCtx[chat.sit] || '';
    var out = ['Subject: ' + (C.SIT_SUBJECT[chat.sit] || C.SIT_SUBJECT.other), '', 'Dear Claims Team,', '', 'I am writing about my claim for my ' + home + ', which was affected by the California wildfire. ' + ctx];
    if ((chat.notes || '').trim()) out.push('', T.inMyWords + chat.notes.trim().slice(0, 1200));
    out.push('', a, '', 'Please reply in writing within 15 calendar days of receiving this letter. I am keeping a record of all communication on this claim.', '', 'Thank you,', '[your name]');
    if (LANG === 'es') {
      // every line of the basic letter is ours, so its Spanish copy needs no model
      var ctxEs = { denied: 'Recibí su decisión sobre mi reclamo.', low: 'Recibí su oferta de liquidación de mi reclamo.', quiet: 'No he recibido respuesta a mis pedidos recientes.', smoke: 'Mi vivienda sigue en pie, pero entró humo y ceniza.', other: '' }[chat.sit] || '';
      var es = ['Asunto: ' + (C.SIT_SUBJECT_ES[chat.sit] || C.SIT_SUBJECT_ES.other), 'Estimado equipo de reclamos:', 'Les escribo sobre mi reclamo por mi ' + (chat.role === 'rent' ? 'vivienda alquilada' : 'vivienda') + ', afectada por el incendio forestal de California. ' + ctxEs];
      if ((chat.notes || '').trim()) es.push('En mis propias palabras (escritas en español): ' + chat.notes.trim().slice(0, 1200));
      es.push(askEs(), 'Les pido que respondan por escrito dentro de los 15 días calendario siguientes a la recepción de esta carta. Llevo un registro de toda la comunicación sobre este reclamo.', 'Gracias,\n[su nombre]');
      chat.letterEs = es.map(function (x) { return x.trim(); }); chat.esStale = false;
    }
    placeLetter(out.join('\n'), true);
    chat.basic = true;
    finishLetter(true);
  }

  /* ---------- call and visit sheets ---------- */
  function sheetBody() {
    var a = askOf(chat);
    return { mode: 'sheet', lang: LANG, kind: chat.flow, sit: chat.sit || 'other', sitLabel: chat.sit ? L(C.SIT_LABEL[chat.sit]) : '', home: chat.home || 'standing', role: chat.role === 'unsure' ? '' : chat.role, ask: a ? a[1] : '', notes: (chat.notes || '').trim(), name: '', claim: '' };
  }
  function writeSheet() {
    chat.step = 'writing'; setComposer();
    var s = status(chat.flow === 'call' ? T.writingCall : T.writingVisit); setBusy(true);
    api(sheetBody()).then(function (j) {
      s.remove(); setBusy(false);
      placeSheet({ kind: chat.flow, say: j.say, points: j.points || [], sayEs: j.sayEs || null, pointsEs: j.pointsEs || null });
      finishSheet();
    }, function (err) {
      s.remove(); setBusy(false);
      pause(err, writeSheet);
      chat.step = 'free';
    });
  }
  function basicSheet() {
    var a = askOf(chat);
    var say = chat.flow === 'call'
      ? 'Hi, my name is [your name], and I am calling about claim [claim number].' + (a ? ' I would like to ask you to ' + a[2].en.charAt(0).toLowerCase() + a[2].en.slice(1) + '.' : '')
      : 'Hi, I am [your name], and this is the home on claim [claim number]. I would like to show you all of the damage, and to get a written scope of work afterward.';
    var sayEs = LANG !== 'es' ? null : chat.flow === 'call'
      ? 'Hola, me llamo [su nombre] y llamo por el reclamo [número de reclamo].' + (a ? ' Quisiera pedirles: ' + a[2].es.charAt(0).toLowerCase() + a[2].es.slice(1) + '.' : '')
      : 'Hola, soy [su nombre] y esta es la vivienda del reclamo [número de reclamo]. Quisiera mostrarle todos los daños y recibir después un alcance de trabajo por escrito.';
    placeSheet({ kind: chat.flow, say: say, points: [], basic: true, sayEs: sayEs });
    finishSheet(true);
  }
  function finishSheet(basic) {
    chat.step = 'free';
    say({ r: 'a', x: (basic ? T.basicSheet + '\n\n' : '') + (chat.flow === 'call' ? T.callDone : T.visitDone) + (isPhone() ? ' ' + T.sheetMobile : '') });
    setComposer();
    if (isPhone()) openPaper();
  }
  function placeSheet(sh) {
    sh.log = sh.log || {};
    chat.sheet = sh; persist();
    document.querySelector('.paperscroll').scrollTop = 0;
    renderPaper(false, true);
  }
  /* Which checklist lines apply: a line can be only for some situations, a standing or lost home, or renters. */
  function applies(item) {
    if (!item.only) return true;
    return item.only.some(function (k) { return k === chat.sit || k === chat.home || (k === 'rent' && chat.role === 'rent') || (k === 'es' && LANG === 'es'); });
  }
  function sheetHtml(fresh) {
    var sh = chat.sheet, def = C.SHEETS[sh.kind], used = [], gen = false;
    function ref(item) {
      if (item.general) { gen = true; return ' <span class="gen">' + esc(T.general) + '</span>'; }
      return '<sup>' + item.src.map(String).filter(function (d) { return SOURCES[d]; }).map(function (d) { if (used.indexOf(d) === -1) used.push(d); return used.indexOf(d) + 1; }).sort(function (x, y) { return x - y; }).join(', ') + '</sup>';
    }
    var a = askOf(chat);
    var out = ['<p class="subj">' + esc(sheetHead()) + '</p><p class="meta">' + esc(tr(def.meta)) + '</p>'];
    def.sections.forEach(function (sec) {
      var h = '<section class="ss"><h3>' + esc(tr(sec.h)) + '</h3>';
      if (sec.say) {
        h += '<p class="say"' + (LANG === 'es' ? ' lang="en"' : '') + '>' + paraText(sh.say) + '</p>';
        if (LANG === 'es') h += sh.sayEs ? '<p class="es-line">' + esc(T.sayEs) + paraText(sh.sayEs) + '</p><p class="es-hint">' + esc(T.sayIntro) + '</p>' : (sh.sayEs === null ? '<p class="es-hint">' + esc(T.esUntranslated) + '</p>' : '');
      }
      var lis = [];
      if (sec.ask && a) lis.push('<li class="main">' + esc(L(a[2])) + '</li>');
      if (pointsHere(sec, sh)) sh.points.forEach(function (pt, i) {
        var es = LANG === 'es' && sh.pointsEs ? sh.pointsEs[i] : '';
        lis.push('<li class="mine"><span' + (LANG === 'es' ? ' lang="en"' : '') + '>' + paraText(pt) + '</span> <span class="gen">' + esc(T.fromNotes) + '</span>' + (es ? '<span class="es-line">' + esc(T.sayEs) + paraText(es) + '</span>' : '') + '</li>');
      });
      (sec.items || []).filter(applies).forEach(function (it) { lis.push('<li>' + esc(tr(it.t)) + ref(it) + '</li>'); });
      if (lis.length) h += '<ul>' + lis.join('') + '</ul>';
      if (sec.followup) h += '<p class="sheetbtns"><button class="btn ghost sm" type="button" data-sheet="followup">' + esc(T.followup) + '</button></p>';
      out.push(h + '</section>');
    });
    out.push('<section class="ss log"><h3>' + esc(sh.kind === 'call' ? T.callLog : T.visitLog) + '</h3><div class="fields">' + def.log.map(function (f) {
      var v = esc(sh.log[f[0]] || (f[0] === 'date' ? '' : ''));
      var input = f[2] === 'long' ? '<textarea rows="3" data-log="' + f[0] + '" id="lg-' + f[0] + '">' + v + '</textarea>' : '<input type="' + (f[2] || 'text') + '" data-log="' + f[0] + '" id="lg-' + f[0] + '" value="' + v + '"' + (f[3] ? ' placeholder="' + esc(tr(f[3])) + '"' : '') + '>';
      return '<label class="field' + (f[2] === 'long' ? ' wide' : '') + '" for="lg-' + f[0] + '"><span>' + esc(tr(f[1])) + '</span>' + input + '</label>';
    }).join('') + '</div><p class="sheetbtns"><button class="btn sm" type="button" data-sheet="record">' + esc(sh.recorded ? T.updateRecord : T.saveRecord) + '</button></p></section>');
    if (used.length || gen) out.push('<section class="ss srcs"><h3>' + esc(T.sourcesH) + '</h3><ol>' + used.map(function (d) { return '<li><a href="' + esc(SOURCES[d].url) + '" target="_blank" rel="noopener">' + esc(SOURCES[d].title) + '</a></li>'; }).join('') + '</ol>' + (gen ? '<p class="gennote">' + esc(T.genNote) + '</p>' : '') + '</section>');
    return out.join('');
  }
  function sheetHead() {
    var sh = chat.sheet, def = C.SHEETS[sh.kind];
    return sh.kind === 'call' ? tr(def.title) + ' ' + (T.callAbout[chat.sit] || T.callAbout.other) : tr(def.title) + (chat.home === 'lost' ? T.visitLost : T.visitStanding);
  }
  function pointsHere(sec, sh) { return (sec.ask || (sh.kind === 'visit' && /show/i.test(sec.h))) && sh.points && sh.points.length; }
  function paraText(t) { return esc(t).replace(/\[[^\]\n]{1,40}\]/g, function (m) { return '<span class="blank">' + m + '</span>'; }); }
  function sheetText() {
    var sh = chat.sheet, def = C.SHEETS[sh.kind], a = askOf(chat), lines = [];
    lines.push(sheetHead(), '');
    def.sections.forEach(function (sec) {
      lines.push(tr(sec.h).toUpperCase());
      if (sec.say) { lines.push(sh.say); if (LANG === 'es' && sh.sayEs) lines.push(T.sayEs + sh.sayEs); }
      if (sec.ask && a) lines.push('- ' + L(a[2]));
      if (pointsHere(sec, sh)) sh.points.forEach(function (pt, i) { lines.push('- ' + pt + (LANG === 'es' && sh.pointsEs && sh.pointsEs[i] ? ' (' + T.sayEs + sh.pointsEs[i] + ')' : '')); });
      (sec.items || []).filter(applies).forEach(function (it) { lines.push('- ' + tr(it.t)); });
      lines.push('');
    });
    lines.push((sh.kind === 'call' ? T.callLog : T.visitLog).toUpperCase());
    def.log.forEach(function (f) { lines.push(tr(f[1]) + ': ' + (f[0] === 'date' ? niceISO(sh.log.date) : (sh.log[f[0]] || ''))); });
    return lines.join('\n');
  }
  /* The same paper as blocks for the PDF: the sheet with its source numbers, the log and the sources at the end. */
  function sheetBlocks() {
    var sh = chat.sheet, def = C.SHEETS[sh.kind], a = askOf(chat), b = [], used = [], gen = false;
    function ref(it) {
      if (it.general) { gen = true; return '  (' + T.general + ')'; }
      return ' ' + it.src.map(String).filter(function (d) { return SOURCES[d]; }).map(function (d) { if (used.indexOf(d) === -1) used.push(d); return used.indexOf(d) + 1; }).sort(function (x, y) { return x - y; }).map(function (n) { return '[' + n + ']'; }).join('');
    }
    b.push({ k: 'subj', t: sheetHead() }, { k: 'meta', t: tr(def.meta) });
    def.sections.forEach(function (sec) {
      b.push({ k: 'label', t: tr(sec.h).toUpperCase() });
      if (sec.say) { b.push({ k: 'say', t: sh.say }); if (LANG === 'es' && sh.sayEs) b.push({ k: 'p', t: T.sayEs + sh.sayEs }); }
      if (sec.ask && a) b.push({ k: 'lim', t: L(a[2]) });
      if (pointsHere(sec, sh)) sh.points.forEach(function (pt, i) { b.push({ k: 'li', t: pt + '  (' + T.fromNotes + ')' + (LANG === 'es' && sh.pointsEs && sh.pointsEs[i] ? '\n' + T.sayEs + sh.pointsEs[i] : '') }); });
      (sec.items || []).filter(applies).forEach(function (it) { b.push({ k: 'li', t: tr(it.t) + ref(it) }); });
    });
    b.push({ k: 'label', t: (sh.kind === 'call' ? T.callLog : T.visitLog).toUpperCase() });
    def.log.forEach(function (f) { b.push({ k: 'field', l: tr(f[1]), t: f[0] === 'date' ? niceISO(sh.log.date) : (sh.log[f[0]] || '') }); });
    if (used.length || gen) {
      b.push({ k: 'label', t: T.sourcesH.toUpperCase() });
      used.forEach(function (d, i) { b.push({ k: 'small', t: (i + 1) + '. ' + SOURCES[d].title + '. ' + SOURCES[d].url }); });
      if (gen) b.push({ k: 'small', t: T.genNote });
    }
    return b;
  }
  function letterBlocks() {
    return paras(chat.letter).map(function (p, i) { return { k: i === 0 && /^Subject:/i.test(p) ? 'subj' : 'p', t: p }; });
  }
  function downloadPdf() {
    var sheet = !!chat.sheet, kind = sheet ? (chat.sheet.kind === 'call' ? T.fileCall : T.fileVisit) : chat.flow === 'reply' ? T.fileReply : T.fileLetter;
    var r = window.nsPdf.download(sheet ? sheetBlocks() : letterBlocks(), { title: sheet ? sheetHead() : ((chat.letter.match(/^Subject:\s*(.+)$/m) || [])[1] || 'Letter'), file: 'next-step-' + kind + '-' + todayISO() + '.pdf', footer: sheet ? T.pdfFooter : '', pageWord: T.pdfPage });
    toast(T.pdfDone);
    window.__lastPdf = r;
  }
  function logSummary(sh) {
    var l = sh.log || {}, bits = [];
    var when = [l.date ? 'On ' + niceISO(l.date) : '', l.time ? 'at ' + l.time : ''].filter(Boolean).join(' ');
    bits.push((when ? when + ', ' : '') + (sh.kind === 'call' ? 'I spoke by phone with ' : 'your adjuster visited my home: ') + (l.who || '[name]') + '.');
    if (l.looked) bits.push('They looked at: ' + l.looked);
    if (l.said) bits.push('They said: ' + l.said);
    if (l.next) bits.push('They said the next step is: ' + l.next);
    return bits.join('\n');
  }
  function sheetRecord() {
    var sh = chat.sheet, l = sh.log || {};
    recordPut({ chat: chat.id, kind: sh.kind, date: l.date || todayISO(), who: l.who || '', summary: [l.said, l.next ? T.recNext + l.next : ''].filter(Boolean).join(' ') || (sh.kind === 'call' ? T.recCall : T.recVisit) });
    sh.recorded = true; persist();
    var b = $('sheetDoc').querySelector('[data-sheet="record"]'); if (b) b.textContent = T.updateRecord;
    toast(T.savedRecord);
  }
  function followUp() {
    var sh = chat.sheet, l = sh.log || {};
    if (!(l.said || l.next || l.looked)) { toast(T.fuNeedLog); var f = $('lg-said'); if (f) f.focus(); return; }
    if (!sh.recorded) sheetRecord();
    var seed = { role: chat.role, sit: chat.sit || 'other', ask: 'fu', notes: logSummary(sh), flow: 'letter', title: T.titleFu };
    openChat(newChat(seed));
    say({ r: 'a', x: T.fuLead });
    writeLetter();
  }
  var sheetDoc = $('sheetDoc');
  sheetDoc.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.log; if (!k || !chat.sheet) return;
    chat.sheet.log[k] = e.target.value; clearTimeout(sheetDoc.t); sheetDoc.t = setTimeout(persist, 250);
  });
  sheetDoc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sheet]'); if (!b || !chat.sheet) return;
    if (b.dataset.sheet === 'record') sheetRecord();
    if (b.dataset.sheet === 'followup') followUp();
  });

  /* ---------- the Record: every letter, call and visit, on this device only ---------- */
  function recordPut(e) {
    store.record = store.record || [];
    var i = -1;
    store.record.forEach(function (r, j) { if (e.chat && r.chat === e.chat && r.kind === e.kind) i = j; });
    e.id = i === -1 ? 'r' + Date.now().toString(36) : store.record[i].id;
    if (i === -1) store.record.unshift(e); else store.record[i] = e;
    save();
  }
  function letterRecord() {
    if (!chat.letter) return;
    var subj = (chat.letter.match(/^Subject:\s*(.+)$/m) || [])[1] || T.recLetter;
    // in Spanish the Record shows the Spanish subject, so the person can read their own list
    if (LANG === 'es') { var se = subjectsOf(chat).es; if (se) subj = se; }
    recordPut({ chat: chat.id, kind: 'letter', date: todayISO(), who: T.recInsurer, summary: subj.replace(/\s+-\s+Claim .*$/, '') });
  }
  var KIND_LABEL = T.kind;
  function recordSorted() { return (store.record || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }); }
  function recordText() {
    return [T.recTitle, ''].concat(recordSorted().map(function (r) { return niceISO(r.date) + '. ' + KIND_LABEL[r.kind] + (r.who ? ', ' + r.who : '') + '. ' + r.summary; })).join('\n');
  }
  function pageRecord(adding) {
    var list = recordSorted();
    var rows = list.map(function (r) {
      var c = store.chats.filter(function (x) { return x.id === r.chat; })[0];
      return '<li><span class="r-date">' + esc(niceISO(r.date)) + '</span><div class="r-body"><p class="r-what">' + esc(KIND_LABEL[r.kind]) + (r.who ? '<span>' + esc(r.who) + '</span>' : '') + '</p><p class="r-sum">' + esc(r.summary) + '</p></div>' +
        '<span class="r-act">' + (c ? '<a href="#/c/' + esc(c.id) + '">' + esc(T.recOpen) + '</a>' : '') + '<button type="button" class="linkbtn" data-del="' + esc(r.id) + '">' + esc(T.recRemove) + '</button></span></li>';
    }).join('');
    showPage('record', '<h1>' + esc(T.recH) + '</h1><p class="lead">' + esc(T.recLead) + '</p>' +
      '<div class="row rec-btns">' + (list.length ? '<button class="btn" type="button" id="recCopy">' + esc(T.recCopy) + '</button>' : '') + '<button class="btn ' + (list.length ? 'ghost' : '') + '" type="button" id="recAdd"' + (adding ? ' hidden' : '') + '>' + esc(T.recAdd) + '</button></div>' +
      (adding ? '<form class="rec-form" id="recForm"><div class="fields">' +
        '<label class="field"><span>' + esc(T.rfWhat) + '</span><select id="rfKind"><option value="call">' + esc(T.rfCall) + '</option><option value="visit">' + esc(T.rfVisit) + '</option><option value="letter">' + esc(T.rfLetter) + '</option></select></label>' +
        '<label class="field"><span>' + esc(T.rfDate) + '</span><input type="date" id="rfDate" value="' + todayISO() + '"></label>' +
        '<label class="field wide"><span>' + esc(T.rfWho) + '</span><input type="text" id="rfWho" placeholder="' + esc(T.rfWhoHolder) + '"></label>' +
        '<label class="field wide"><span>' + esc(T.rfSum) + '</span><textarea id="rfSum" rows="3"></textarea></label></div>' +
        '<div class="row"><button class="btn" type="submit">' + esc(T.save) + '</button><button class="btn ghost" type="button" id="rfCancel">' + esc(T.cancel) + '</button></div></form>' : '') +
      (list.length ? '<ul class="record">' + rows + '</ul>' : '<p class="empty">' + esc(T.recEmpty) + '</p>'));
    var pg = $('page');
    var cp = $('recCopy'); if (cp) cp.addEventListener('click', function () { copyText(recordText(), function () { cp.textContent = T.copiedShort; toast(T.recCopied); setTimeout(function () { cp.textContent = T.recCopy; }, 2000); }); });
    $('recAdd').addEventListener('click', function () { pageRecord(true); $('rfWho').focus(); });
    var f = $('recForm');
    if (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); var sum = $('rfSum').value.trim(); if (!sum && !$('rfWho').value.trim()) { $('rfSum').focus(); return; } recordPut({ kind: $('rfKind').value, date: $('rfDate').value || todayISO(), who: $('rfWho').value.trim(), summary: sum }); pageRecord(false); });
      $('rfCancel').addEventListener('click', function () { pageRecord(false); });
    }
    [].forEach.call(pg.querySelectorAll('[data-del]'), function (b) { b.addEventListener('click', function () { store.record = store.record.filter(function (r) { return r.id !== b.dataset.del; }); save(); pageRecord(false); }); });
  }

  /* ---------- their message ---------- */
  function explain(text, existing) {
    var id = chat.pendingPaste || ('p' + Date.now().toString(36));
    chat.pendingPaste = null;
    pasteMem[id] = text; chat.pasteId = id; chat.flow = 'reply';
    if (!existing) me('', { paste: id });
    title(T.titleMsg);
    chat.step = 'reading'; setComposer();
    var s = status(T.reading); setBusy(true);
    api({ mode: 'explain', lang: LANG, paste: text }).then(function (j) {
      s.remove(); setBusy(false);
      chat.sit = j.sit; chat.explain = j.text;
      var sug = askById(j.sit, j.ask) ? j.ask : asksFor(j.sit)[0][0];
      // Side by side, the explanation lives on the paper; on a phone the paper is tucked away, so it is said in the chat.
      say({ r: 'a', x: isPhone() ? j.text : T.explainedRight });
      var opts = [{ v: sug, l: L(askById(j.sit, sug)[2]), tag: T.suggested, n: (PICK_IF[j.sit] || {})[sug] }];
      opts.push({ v: 'other', l: T.otherAsk });
      chat.step = 'pickAsk';
      say({ r: 'a', x: T.suggest, ch: { key: 'pickAsk', opts: opts } });
      renderPaper(false);
      setComposer();
    }, function (err) {
      s.remove(); setBusy(false); chat.step = 'paste';
      pause(err, function () { explain(text, true); });
    });
  }

  /* ---------- the paper ---------- */
  var letterEl = $('letter');
  function paras(text) { return String(text || '').replace(/\r/g, '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean); }
  function paraHtml(p, i, cls) {
    var h = esc(p).replace(/\[[^\]\n]{1,40}\]/g, function (m) { return '<span class="blank">' + m + '</span>'; });
    return '<p class="' + (cls || '') + (i === 0 && /^(Subject|Asunto):/i.test(p) ? ' subj' : '') + '">' + h + '</p>';
  }
  function placeLetter(text, fresh, changedIdx) {
    chat.letter = text; persist();
    if (fresh) document.querySelector('.paperscroll').scrollTop = 0;
    var ps = paras(text);
    letterEl.innerHTML = ps.map(function (p, i) { return paraHtml(p, i, (fresh && !reduced ? 'in' : '') + (changedIdx && changedIdx.indexOf(i) !== -1 ? ' changed' : '')); }).join('');
    if (fresh && !reduced) [].forEach.call(letterEl.children, function (p, i) { p.style.animationDelay = (i * 110) + 'ms'; });
    renderPaper(true);
    if (changedIdx && changedIdx.length) setTimeout(function () { [].forEach.call(letterEl.querySelectorAll('.changed'), function (p) { p.classList.remove('changed'); }); }, reduced ? 3000 : 1400);
  }
  function renderPaper(keepLetter, freshSheet) {
    var has = !!(chat.letter || chat.explain || chat.sheet);
    var sd = $('sheetDoc');
    if (chat.sheet) {
      sd.hidden = false; sd.innerHTML = sheetHtml();
      if (freshSheet && !reduced) [].forEach.call(sd.children, function (n, i) { n.classList.add('in'); n.style.animationDelay = (i * 90) + 'ms'; });
    } else { sd.hidden = true; sd.innerHTML = ''; }
    var hadPaper = $('desk').classList.contains('has-paper');
    $('desk').classList.toggle('has-paper', has);
    if (has && !hadPaper) sideForPaper(true); else if (!has && hadPaper) sideForPaper(false);
    var em = $('emailBtn'); em.hidden = !(chat.letter && !chat.sheet); if (chat.letter) em.setAttribute('href', mailtoUrl(chat.letter).url);
    $('paperwrap').hidden = !has;
    $('pin').hidden = !has;
    var kind = chat.sheet ? (chat.sheet.kind === 'call' ? T.kCall : T.kVisit) : chat.flow === 'reply' ? T.kReply : T.kLetter;
    $('paperKind').textContent = kind; $('pinKind').textContent = chat.sheet ? kind : chat.flow === 'reply' ? (chat.letter ? T.pinReply : T.pinExplained) : T.kLetter;
    var ex = $('explain');
    if (chat.explain) {
      var c = splitCites(chat.explain);
      ex.hidden = false; ex.classList.toggle('withletter', !!chat.letter);
      ex.innerHTML = '<h2>' + esc(T.explainH) + '</h2>' + c.text.split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    } else { ex.hidden = true; ex.innerHTML = ''; }
    if (!keepLetter) letterEl.innerHTML = chat.letter ? paras(chat.letter).map(function (p, i) { return paraHtml(p, i, ''); }).join('') : '';
    letterEl.hidden = !chat.letter;
    renderEs(); renderNote();
    $('copyBtn').disabled = !(chat.letter || chat.sheet); $('printBtn').disabled = !(chat.letter || chat.sheet);
    $('sheet').classList.toggle('is-sheet', !!chat.sheet);
    // One solid button per screen: on a sheet it is Save to Record, so Copy steps back to a ghost.
    $('copyBtn').classList.toggle('ghost', !!chat.sheet);
    $('emailBtn').textContent = T.openEmail;
  }
  // Typing on the paper: keep the saved letter in step with what is on the sheet.
  var editT;
  letterEl.addEventListener('input', function () {
    clearTimeout(editT);
    editT = setTimeout(function () {
      chat.letter = readSheet(); renderNote();
      if (LANG === 'es' && chat.letterEs && !chat.esStale) { chat.esStale = true; renderEs(); }
      persist();
    }, 300);
  });

  /* On a phone the paper opens over the chat, so the one line that says how to finish goes on the paper itself. */
  function renderNote() {
    var n = $('paperNote'), t = '';
    // (a sheet already says how to use it in its own first line, so only a letter gets this)
    if (chat.letter && !chat.sheet) t = /\[[^\]\n]{1,40}\]/.test(chat.letter) ? T.noteBlanks : T.noteDone;
    n.textContent = t; n.hidden = !t;
  }

  /* The Spanish copy under the letter: one paragraph per paragraph of the English letter, checked on the server.
     A paragraph that could not be translated safely is shown in English and said so. */
  function renderEs() {
    var box = $('esCopy');
    if (LANG !== 'es' || !chat.letter || !chat.letterEs) { box.hidden = true; box.innerHTML = ''; return; }
    var h = '<h2>' + esc(T.esH) + '</h2><p class="es-note">' + esc(T.esNote) + '</p>';
    if (chat.letterEs === 'failed') h += '<p class="es-note">' + esc(T.esFailed) + '</p>';
    else {
      var en = paras(chat.letter);
      h += chat.letterEs.map(function (p, i) {
        if (p) return paraHtml(p, i, '');
        return en[i] ? '<p class="es-raw" lang="en">' + esc(en[i]) + '</p><p class="es-hint">' + esc(T.esUntranslated) + '</p>' : '';
      }).join('');
    }
    if (chat.esStale || chat.letterEs === 'failed') h += '<p class="es-stale">' + (chat.esStale ? esc(T.esStale) + ' ' : '') + '<button type="button" class="btn ghost sm" id="esUpdate">' + esc(T.esUpdate) + '</button></p>';
    box.innerHTML = h; box.hidden = false;
    var up = $('esUpdate'); if (up) up.addEventListener('click', updateEs);
  }
  function updateEs() {
    var b = $('esUpdate'); if (b) { b.disabled = true; b.textContent = T.esWorking; }
    var sj = subjectsOf(chat);
    api({ mode: 'gloss', lang: 'es', text: chat.letter = readSheet(), ask: askSentence(), askEs: askEs(), subject: sj.en, subjectEs: sj.es }).then(function (j) {
      chat.letterEs = j.es; chat.esStale = false; persist(); renderEs();
    }, function () { if (b) { b.disabled = false; b.textContent = T.esUpdate; } toast(T.esFailed); });
  }
  letterEl.addEventListener('paste', function (e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  function readSheet() { return [].map.call(letterEl.querySelectorAll('p'), function (p) { return p.innerText.replace(/\n+$/, ''); }).filter(function (x) { return x.trim(); }).join('\n\n') || letterEl.innerText.trim(); }

  function revise(instruction) {
    chat.letter = readSheet();
    var before = paras(chat.letter);
    var s = status(T.editing); setBusy(true);
    var sj = subjectsOf(chat);
    api({ mode: 'revise', lang: LANG, sit: chat.sit, ask: askSentence(), askEs: askEs(), subject: sj.en, subjectEs: sj.es, letter: chat.letter, instruction: instruction }).then(function (j) {
      s.remove(); setBusy(false);
      if (LANG === 'es') { chat.letterEs = j.es || 'failed'; chat.esStale = false; }
      var after = paras(j.text), changed = [];
      after.forEach(function (p, i) { if (before.indexOf(p) === -1) changed.push(i); });
      placeLetter(j.text, false, changed);
      say({ r: 'a', x: T.changed });
      if (isPhone()) openPaper();
    }, function (err) {
      s.remove(); setBusy(false);
      if (err && err.code === 'lost_facts') return say({ r: 'a', x: T.lostFacts });
      pause(err, function () { revise(instruction); });
    });
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    else { fallbackCopy(text); done(); }
  }
  $('copyBtn').addEventListener('click', function () {
    var text;
    if (chat.sheet) text = sheetText();
    else { text = chat.letter = readSheet(); letterRecord(); persist(); }
    count('copy', chat.sheet ? 'sheet' : 'letter');
    copyText(text, function () { var b = $('copyBtn'); b.textContent = T.copiedShort; toast(chat.sheet ? T.copiedSheet : T.copied); setTimeout(function () { b.textContent = T.copy; }, 2000); });
  });
  function fallbackCopy(t) { var ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); window.getSelection().removeAllRanges(); }
  /* A real PDF of the paper, made on the device: the letter (in English, the one that is sent), or the whole sheet. */
  $('printBtn').addEventListener('click', function () { if (chat.letter && !chat.sheet) { chat.letter = readSheet(); letterRecord(); persist(); } count('pdf', chat.sheet ? 'sheet' : 'letter'); downloadPdf(); });
  /* Open in email: the person's own email app, with the subject and the letter filled in. No address is guessed;
     the letter is also copied, because a computer with no email app set up opens nothing. */
  var MAIL_MAX = 6000;
  function mailtoUrl(text) {
    var ps = paras(text), subj = '';
    if (ps.length && /^Subject:/i.test(ps[0])) { subj = ps[0].replace(/^Subject:\s*/i, ''); ps = ps.slice(1); }
    var body = ps.join('\n\n').replace(/\r?\n/g, '\r\n');
    var url = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
    return url.length > MAIL_MAX ? { url: 'mailto:?subject=' + encodeURIComponent(subj), long: true } : { url: url, long: false };
  }
  $('emailBtn').addEventListener('click', function () {
    if (!chat.letter || chat.sheet) return;
    chat.letter = readSheet(); letterRecord(); persist();
    var m = mailtoUrl(chat.letter);
    this.setAttribute('href', m.url);
    count('email', 'letter');
    copyText(chat.letter, function () { toast(m.long ? T.emailLong : T.emailOpened); });
  });
  function openPaper() { if (!isPhone()) return; $('paperwrap').classList.add('open'); document.body.style.overflow = 'hidden'; $('paperClose').focus(); }
  function closePaper() { $('paperwrap').classList.remove('open'); document.body.style.overflow = ''; $('pin').focus(); }
  $('pin').addEventListener('click', openPaper);
  $('paperClose').addEventListener('click', closePaper);

  /* ---------- sidebar and history ---------- */
  function renderHistory() {
    var ul = $('history'); ul.innerHTML = '';
    var list = store.chats.filter(function (c) { return c.msgs && c.msgs.length; });
    $('histEmpty').hidden = list.length > 0;
    list.forEach(function (c) {
      var li = el('li'), a = el('a');
      a.href = '#/c/' + c.id;
      a.innerHTML = esc(c.title || T.untitled) + '<small>' + esc(niceDate(c.at)) + (c.sheet ? (c.sheet.kind === 'call' ? T.histCall : T.histVisit) : c.letter ? T.histLetter : '') + '</small>';
      if (chat && c.id === chat.id && !location.hash.match(/^#\/(steps|breathe|phones|record)/)) a.setAttribute('aria-current', 'true');
      li.appendChild(a); ul.appendChild(li);
    });
  }
  function openChat(c) {
    chat = c; store.cur = c.id; save();
    document.querySelector('.paperscroll').scrollTop = 0;
    closePage(); renderAll(); renderHistory(); closeSide();
    var h = thread.querySelector('.opening h1'); if (h && !isPhone()) input.focus();
  }
  function fresh() { if (chat && !chat.msgs.length) { closePage(); closeSide(); renderAll(); return; } openChat(newChat()); if (location.hash) history_replace(''); }
  function history_replace(h) { try { history.replaceState(null, '', location.pathname + h); } catch (e) {} }
  $('newChat').addEventListener('click', fresh);
  $('newChatTop').addEventListener('click', fresh);
  function openSide() { $('side').classList.add('open'); $('scrim').hidden = false; $('sideOpen').setAttribute('aria-expanded', 'true'); $('sideClose').focus(); }
  function closeSide() { if (!$('side').classList.contains('open')) return; $('side').classList.remove('open'); $('scrim').hidden = true; $('sideOpen').setAttribute('aria-expanded', 'false'); }
  $('sideOpen').addEventListener('click', openSide);
  // On a computer the sidebar folds away and the chat and paper take the room; the choice stays on this device.
  var autoShut = false;
  function foldSide(shut, auto) {
    var d = document.documentElement;
    if (shut) d.setAttribute('data-side', 'shut'); else d.removeAttribute('data-side');
    $('sideFold').setAttribute('aria-expanded', shut ? 'false' : 'true');
    $('sideUnfold').setAttribute('aria-expanded', shut ? 'false' : 'true');
    autoShut = !!auto;
    if (auto) return;                      // closed or reopened by the page itself: not remembered, focus stays where it is
    try { localStorage.setItem('ns-side', shut ? 'shut' : 'open'); } catch (e) {}
    $(shut ? 'sideUnfold' : 'sideFold').focus();
  }
  /* On a medium screen (about 900 to 1150 px) the sidebar steps aside when a paper opens, so the letter is not squeezed,
     and comes back when there is no paper again. It never overrides what the person chose by hand. */
  function sideForPaper(open) {
    if (isPhone()) return;
    var shut = document.documentElement.getAttribute('data-side') === 'shut';
    if (open && window.innerWidth <= 1150 && !shut) foldSide(true, true);
    else if (!open && autoShut && shut) foldSide(false, true);
  }
  $('sideFold').addEventListener('click', function () { foldSide(true); });
  $('sideUnfold').addEventListener('click', function () { foldSide(false); });
  $('newChatRail').addEventListener('click', fresh);
  if (document.documentElement.getAttribute('data-side') === 'shut') $('sideFold').setAttribute('aria-expanded', 'false');
  $('sideClose').addEventListener('click', function () { closeSide(); $('sideOpen').focus(); });
  $('scrim').addEventListener('click', closeSide);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if ($('paperwrap').classList.contains('open')) return closePaper();
    if ($('side').classList.contains('open')) { closeSide(); $('sideOpen').focus(); return; }
    if (!$('page').hidden) location.hash = '';
  });

  /* ---------- pages: steps of a claim, take a breath, phone lines ---------- */
  var breathTimer = null;
  function closePage() { $('page').hidden = true; $('page').innerHTML = ''; clearInterval(breathTimer); [].forEach.call(document.querySelectorAll('.side-links a'), function (a) { a.removeAttribute('aria-current'); }); }
  function showPage(name, html) {
    var p = $('page');
    if ($('paperwrap').classList.contains('open')) { $('paperwrap').classList.remove('open'); document.body.style.overflow = ''; }
    p.innerHTML = '<div class="page-in"><a class="back" href="#">← ' + esc(T.back) + '</a>' + html + '</div>';
    p.hidden = false; p.scrollTop = 0;
    p.querySelector('.back').addEventListener('click', function (e) { e.preventDefault(); location.hash = ''; });
    [].forEach.call(document.querySelectorAll('.side-links a'), function (a) { if (a.dataset.page === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    closeSide(); renderHistory();
    var h = p.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function pagePhones() {
    showPage('phones', '<h1>' + esc(T.phH) + '</h1><p class="lead">' + esc(T.phLead) + '</p>' +
      '<ul class="lines">' + phones(true).map(function (p) { return '<li><span class="who"><b>' + esc(p.who) + '</b>' + esc(p.what) + '</span><a href="' + tel(p.num) + '">' + esc(p.num) + '</a></li>'; }).join('') + '</ul>' +
      srcLine(phones(true).map(function (p) { return p.src; }).filter(function (v, i, a) { return a.indexOf(v) === i; })) +
      (handoffs().length ? '<h2 class="h-more">' + esc(T.phMore) + '</h2><ul class="lines handoffs">' + handoffs().map(function (h) { var x = LANG === 'es' && HANDOFF_ES[h.id] ? HANDOFF_ES[h.id] : { title: h.title.replace(/^United Policyholders, /, 'United Policyholders: '), notes: h.notes }; return '<li><span class="who"><b>' + esc(x.title) + '</b>' + esc(x.notes) + '</span><a href="' + esc(h.url) + '" target="_blank" rel="noopener">' + esc(T.openLink) + '</a></li>'; }).join('') + '</ul>' : '') +
      '<p class="note">' + esc(T.ph911) + '</p>');
  }
  var stageRole = 'own';
  function pageSteps() {
    if (chat && chat.role === 'rent') stageRole = 'rent';
    var order = stageRole === 'rent' ? C.RENT_ORDER : C.OWN_ORDER;
    var items = order.map(function (id) {
      var s = C.STAGES[id]; if (!s) return '';
      var srcIds = (s.src || []).map(String).filter(function (d) { return SOURCES[d]; });
      return '<li><div><p class="when">' + esc(L(s.label)) + '</p><h2>' + esc(L(s.title)) + '</h2><ul>' + s.steps.map(function (x) { return '<li>' + esc(L(x)) + '</li>'; }).join('') + '</ul>' + (s.general ? '<p class="src">' + esc(T.stGeneral) + '</p>' : srcLine(srcIds)) + '</div></li>';
    }).join('');
    showPage('steps', '<h1>' + esc(T.stH) + '</h1><p class="lead">' + esc(T.stLead) + '</p>' +
      '<div class="seg" role="group" aria-label="' + esc(T.home) + '"><button type="button" data-r="own" aria-pressed="' + (stageRole === 'own') + '">' + esc(T.own) + '</button><button type="button" data-r="rent" aria-pressed="' + (stageRole === 'rent') + '">' + esc(T.rent) + '</button></div>' +
      '<ol class="stages">' + items + '</ol>');
    [].forEach.call($('page').querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { stageRole = b.dataset.r; pageSteps(); $('page').querySelector('.seg button[data-r="' + stageRole + '"]').focus(); }); });
  }
  function pageBreathe() {
    showPage('breathe', '<h1>' + esc(T.brH) + '</h1><p class="lead">' + esc(T.brLead) + '</p>' +
      '<div class="breath" aria-hidden="true"><div class="ring" id="ring"></div></div><p class="breath-word" id="bword" aria-live="polite"></p><p class="breath-left" id="bleft"></p>' +
      '<div class="row" style="justify-content:center;margin-top:28px"><button class="btn" type="button" id="bstart">' + esc(T.start) + '</button></div>');
    $('bstart').addEventListener('click', function () {
      var btn = $('bstart'); btn.hidden = true;
      var end = Date.now() + 60000, phase = 0, ring = $('ring');
      function step() {
        var left = Math.max(0, Math.round((end - Date.now()) / 1000));
        if (left <= 0) { clearInterval(breathTimer); $('bword').textContent = T.brDone; $('bleft').textContent = ''; ring.classList.remove('big'); btn.hidden = false; btn.textContent = T.again; return; }
        $('bleft').textContent = left + T.seconds;
      }
      function cycle() {
        if (Date.now() >= end) return;
        if (phase === 0) { ring.classList.remove('out'); ring.classList.add('big'); $('bword').textContent = T.breatheIn; phase = 1; setTimeout(cycle, 4000); }
        else { ring.classList.add('out'); ring.classList.remove('big'); $('bword').textContent = T.breatheOut; phase = 0; setTimeout(cycle, 6000); }
      }
      clearInterval(breathTimer); breathTimer = setInterval(step, 500); step(); cycle();
    });
  }

  function route() {
    var h = location.hash;
    if (h === '#/steps') return pageSteps();
    if (h === '#/breathe') return pageBreathe();
    if (h === '#/phones') return pagePhones();
    if (h === '#/record') return pageRecord(false);
    var st = h.match(/^#\/start\/(letter|msg|call|visit)$/);
    if (st) {
      history_replace('');
      if (!chat || chat.msgs.length) openChat(newChat()); else { closePage(); renderAll(); }
      if (st[1] === 'letter') return startWith('push', T.o_push);
      if (st[1] === 'msg') return startWith('msg', T.o_msg);
      chat.flow = st[1]; me(st[1] === 'call' ? T.k_call : T.k_visit); title(st[1] === 'call' ? T.titleCall : T.titleVisit); return nextStep();
    }
    var m = h.match(/^#\/c\/([\w]+)/);
    if (m) {
      var c = store.chats.filter(function (x) { return x.id === m[1]; })[0];
      if (c && c !== chat) return openChat(c);
    }
    closePage(); renderHistory();
  }
  window.addEventListener('hashchange', route);

  /* ---------- the words that live in the page itself, and the two settings ---------- */
  var STATIC_ES = {
    skip: 'Ir al cuadro de mensaje', newChat: 'Nueva conversación', histLbl: 'Conversaciones', histEmpty: 'Sus conversaciones se quedan en este dispositivo.',
    record: 'Historial', steps: 'Pasos de un reclamo', breathe: 'Respire un momento', phones: 'Líneas telefónicas',
    fine: 'Información general de fuentes públicas, no es asesoría legal ni de seguros. Guía de IA, sin personal. Español: borrador sin revisar.',
    tap: 'Toque para abrir', close: 'Cerrar', paperfine: 'Es un borrador. Revise cada fecha, número y nombre antes de enviarla.',
    letterAria: 'Su carta. Puede escribir sobre ella.', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú', newChatRail: 'Nueva conversación', sidePrivacy: 'Solo contamos cuántas personas visitan el sitio, abren el Escritorio, copian o envían una carta por correo, o descargan un PDF, sin cookies y sin nada que diga quién es usted.', foldSide: 'Cerrar la barra lateral', unfoldSide: 'Abrir la barra lateral', send: 'Enviar', paperAria: 'Su hoja', chatAria: 'Conversación', sideAria: 'Conversaciones y ayuda', helpAria: 'Ayuda'
  };
  function applyStatic() {
    document.title = 'Next Step';
    if (LANG === 'es') {
      [].forEach.call(document.querySelectorAll('[data-t]'), function (n) { var v = STATIC_ES[n.dataset.t]; if (v) n.textContent = v; });
      [].forEach.call(document.querySelectorAll('[data-ta]'), function (n) { var v = STATIC_ES[n.dataset.ta]; if (v) { n.setAttribute('aria-label', v); if (n.title) n.title = v; } });
      $('composerIn').placeholder = T.holder;
    }
    $('copyBtn').textContent = T.copy; $('printBtn').textContent = T.pdf; $('pinKind').textContent = T.kLetter; $('paperKind').textContent = T.kLetter;
    var lb = $('langBtn'); lb.textContent = T.langOther; lb.setAttribute('lang', LANG === 'es' ? 'en' : 'es');
    setThemeLabel();
  }
  function setThemeLabel() { var d = window.nsTheme && window.nsTheme.current() === 'dark'; var b = $('themeBtn'); b.textContent = d ? T.themeLight : T.themeDark; b.setAttribute('aria-pressed', d ? 'true' : 'false'); }
  $('themeBtn').addEventListener('click', function () { if (window.nsTheme) window.nsTheme.toggle(); setThemeLabel(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang], #langBtn');
    if (!b || !window.nsLang) return;
    persist(); window.nsLang.set(LANG === 'es' ? 'en' : 'es');
  });

  /* ---------- "Something unclear? Tell us": built, and hidden until TAC gives us an inbox (public/config.js, feedback) ---------- */
  function wireTell() {
    var on = window.NS_CONFIG && window.NS_CONFIG.feedback === true, line = $('tell'), form = $('tellForm');
    if (!on || !line || !form) return;
    line.hidden = false;
    $('tellBtn').textContent = T.tell; $('tellLead').textContent = T.tellLead; $('tellIn').placeholder = T.tellHolder; $('tellIn').setAttribute('aria-label', T.tellHolder); $('tellSend').textContent = T.tellSend; $('tellCancel').textContent = T.cancel;
    $('tellBtn').addEventListener('click', function () { form.hidden = false; line.hidden = true; $('talk').classList.add('telling'); $('tellIn').focus(); });
    $('tellCancel').addEventListener('click', function () { form.hidden = true; line.hidden = false; $('talk').classList.remove('telling'); $('tellBtn').focus(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = $('tellIn').value.trim(); if (!text || $('tellHp').value) return;
      $('tellSend').disabled = true;
      fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: text, lang: LANG, where: chat.sheet ? 'sheet' : chat.letter ? 'letter' : 'chat' }) }).then(function (r) {
        $('tellSend').disabled = false;
        if (!r.ok) throw new Error('x');
        $('tellIn').value = ''; form.hidden = true; line.hidden = false; $('talk').classList.remove('telling'); toast(T.tellThanks);
      }, function () { throw new Error('x'); }).catch(function () { $('tellSend').disabled = false; toast(T.tellFail); });
    });
  }

  /* ---------- start ---------- */
  function boot() {
    applyStatic();
    var cur = store.chats.filter(function (c) { return c.id === store.cur; })[0];
    chat = cur || newChat();
    // Back after 15 days or more with a letter that may have had a reply: start on a clean Desk where the check-in shows.
    if (!location.hash && dueLetter() && chat.msgs.length && new Date(chat.at).toDateString() !== new Date().toDateString()) chat = newChat();
    // A chat left mid-way while writing: settle it so it never shows a stuck state.
    if (chat.step === 'writing' || chat.step === 'reading') chat.step = (chat.letter || chat.sheet) ? 'free' : (chat.flow === 'reply' ? 'paste' : 'notes');
    renderAll(); renderHistory(); route(); wireTell();
    count('desk');
    window.addEventListener('resize', function () { if (!isPhone()) closePaper(); });
  }
  fetch('/sources.json').then(function (r) { return r.json(); }).then(function (s) { SOURCES = s; }, function () {}).then(boot);
  window.__desk = { state: function () { return { chat: chat, store: store, paste: Object.keys(pasteMem).length }; } };
})();
