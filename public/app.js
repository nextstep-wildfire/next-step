/* Next Step guide. A few guided screens that end in a finished letter, plus the claim stages, a record of what
   was sent, real phone numbers and a breathing pause. Facts and numbers come from content.js and /sources.json.
   Everything the person saves stays in this browser (localStorage key next-step-v5). */
(function () {
  'use strict';
  var C = window.NS_CONTENT, M = C.M;
  var view = document.getElementById('view');
  var SOURCES = {};

  /* ---------- saved state ---------- */
  var KEY = 'next-step-v5';
  var state = { lang: 'en', role: null, who: 'me', whoName: '', draft: {}, letters: [], contacts: [], done: {}, plan: null };
  function load() {
    var raw = null; try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (raw && typeof raw === 'object') { Object.keys(state).forEach(function (k) { if (raw[k] != null) state[k] = raw[k]; }); return; }
    // Bring letters, the contact log and ticks over from the previous version (chats).
    try {
      var old = JSON.parse(localStorage.getItem('next-step-v4') || 'null');
      if (old && old.chats) old.chats.forEach(function (c) {
        (c.letters || []).forEach(function (l) { state.letters.push({ id: 'm' + Math.random().toString(36).slice(2, 8), d: l.d, sub: l.sub, text: l.text, sent: false }); });
        state.contacts = state.contacts.concat(c.contacts || []);
        Object.keys(c.done || {}).forEach(function (k) { state.done[k] = true; });
        if (c.plan && !state.plan) state.plan = c.plan;
        if (c.role && !state.role) state.role = c.role;
      });
      if (old && old.lang) state.lang = old.lang;
    } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} updateClaimLink(); }
  load();
  var q = new URLSearchParams(location.search).get('lang');
  if (q === 'es' || q === 'zh' || q === 'en') state.lang = q;

  /* ---------- words on screen (English, Spanish, Chinese; Spanish and Chinese are unreviewed drafts) ---------- */
  var S = {
    menu: ['Menu', 'Menú', '菜单'], close: ['Close', 'Cerrar', '关闭'], language: ['Language', 'Idioma', '语言'], theme: ['Theme', 'Tema', '主题'], light: ['Light', 'Claro', '浅色'], dark: ['Dark', 'Oscuro', '深色'],
    navLetter: ['Write a letter', 'Escribir una carta', '写一封信'], navStages: ['Steps of a claim', 'Pasos de un reclamo', '理赔步骤'], navClaim: ['My claim', 'Mi reclamo', '我的理赔'],
    navQuestion: ['Ask a question', 'Hacer una pregunta', '提一个问题'], navWords: ['Insurance words', 'Términos de seguros', '保险术语'], navHelp: ['Phone numbers for help', 'Teléfonos de ayuda', '求助电话'], navBreathe: ['Take a breath', 'Respirar un momento', '深呼吸一下'],
    fine: ['General information, not legal or insurance advice. A student project from Fung Fellowship.', 'Información general, no asesoría legal ni de seguros. Proyecto estudiantil de Fung Fellowship.', '仅为一般信息，不构成法律或保险建议。Fung Fellowship 学生项目。'],
    stepOf: ['Step {n} of 4', 'Paso {n} de 4', '第 {n} 步，共 4 步'], back: ['Back', 'Volver', '返回'], cont: ['Continue', 'Continuar', '继续'],
    roleTitle: ['First, is it your home, or do you rent?', 'Primero, ¿la vivienda es suya o la alquila?', '首先，房子是您自己的还是租的？'],
    roleLead: ['This changes which steps and letters fit you.', 'Esto cambia qué pasos y cartas le corresponden.', '这会决定哪些步骤和信件适合您。'],
    own: ['I own the home', 'Soy dueño(a)', '房子是我的'], rent: ['I rent', 'Alquilo', '我是租客'], unsure: ['Not sure', 'No estoy seguro(a)', '不确定'],
    forOther: ['Writing for someone else?', '¿Escribe por otra persona?', '在替别人写？'], otherName: ['Their name (optional)', 'Su nombre (opcional)', '对方姓名（可选）'],
    forOtherOn: ['Letters will say you are writing on their behalf.', 'Las cartas dirán que escribe en su nombre.', '信中会说明您是代对方写信。'],
    whatTitle: ['What did your insurance company do?', '¿Qué hizo su compañía de seguros?', '保险公司做了什么？'],
    whatLead: ['Pick the closest one. You can change it later.', 'Elija la más cercana. Puede cambiarla después.', '选最接近的一项，之后可以更改。'],
    c_denied: ['They said no', 'Dijeron que no', '他们拒赔了'], c_denied_s: ['My claim, or part of it, was denied', 'Mi reclamo, o una parte, fue rechazado', '我的理赔（或其中一部分）被拒'],
    c_low: ['They offered less', 'Ofrecieron menos', '他们赔得太少'], c_low_s: ['The offer seems too low', 'La oferta parece demasiado baja', '赔付金额似乎太低'],
    c_quiet: ['They went quiet', 'Dejaron de responder', '他们不回复了'], c_quiet_s: ['No answer from my adjuster', 'Mi ajustador no responde', '理赔员没有回复'],
    somethingElse: ['Something else', 'Otra cosa', '其他情况'],
    moreTitle: ['What is closest?', '¿Qué se parece más?', '哪一项最接近？'],
    c_smoke: ['Smoke or ash got in', 'Entró humo o ceniza', '进了烟或灰'], c_smoke_s: ['My home is still standing', 'Mi vivienda sigue en pie', '房子还在'],
    c_other: ['Another request', 'Otra solicitud', '其他请求'], c_other_s: ['Ask what they need from me to move the claim', 'Preguntar qué necesitan de mí para avanzar', '询问推进理赔需要我提供什么'],
    askTitle: ['What do you want them to do?', '¿Qué quiere que hagan?', '您希望他们做什么？'],
    askLead: ['Pick the one that matters most right now. One ask per letter gets the clearest reply, and you can write another letter for a different ask afterwards.', 'Elija la que más importa ahora. Una petición por carta obtiene la respuesta más clara, y después puede escribir otra carta con otra petición.', '选出眼下最重要的一项。每封信只提一个要求，得到的答复最清楚；之后可以再写一封信提另一个要求。'],
    askOwn: ['Something else', 'Otra cosa', '其他'], askOwnHint: ['Write it in your own words.', 'Escríbala con sus propias palabras.', '用您自己的话写。'], askOwnPh: ['What do you want them to do?', '¿Qué quiere que hagan?', '您希望他们做什么？'],
    needAsk: ['Pick the one thing you want them to do.', 'Elija lo que quiere que hagan.', '请选择您希望他们做的一件事。'], needOwn: ['Write what you want them to do, or pick one above.', 'Escriba qué quiere que hagan, o elija una opción de arriba.', '请写下您希望他们做什么，或选择上面的一项。'],
    notesTitle: ['What happened, in your own words?', '¿Qué pasó, con sus propias palabras?', '发生了什么？请用您自己的话说'],
    notesLead: ['Rough notes are fine. They become clear, polite sentences in the letter.', 'Las notas aproximadas sirven. Se convierten en frases claras y amables en la carta.', '粗略的笔记就可以，信里会改写成清楚、礼貌的句子。'],
    notesLbl: ['What happened', 'Qué pasó', '发生了什么'],
    extraLbl: ['Numbers, dates or names to include (optional)', 'Cifras, fechas o nombres que incluir (opcional)', '需要写进去的金额、日期或姓名（可选）'],
    extraPh: ['Example: Reported on Jan 12. Adjuster: Dana Lee. My contractor’s estimate: $96,000.', 'Ejemplo: Reportado el 12 de enero. Ajustador: Dana Lee. Presupuesto de mi contratista: $96,000.', '例如：1 月 12 日报案。理赔员：Dana Lee。我的承包商报价：$96,000。'],
    moreLbl: ['Add your name, claim number or their message (optional)', 'Agregar su nombre, número de reclamo o su mensaje (opcional)', '添加您的姓名、理赔编号或他们的来信（可选）'],
    phName: ['Your name', 'Su nombre', '您的姓名'], phClaim: ['Claim number', 'Número de reclamo', '理赔编号'], phInsurer: ['Insurance company', 'Compañía de seguros', '保险公司'],
    pasteLbl: ['Their latest message (optional)', 'Su último mensaje (opcional)', '他们最近的来信（可选）'], pastePh: ['Paste the key lines from their letter or email', 'Pegue las líneas clave de su carta o correo', '粘贴来信或邮件中的关键内容'],
    priv: ['Please leave out Social Security and bank account numbers.', 'Por favor no incluya números de Seguro Social ni de cuentas bancarias.', '请不要填写社会安全号码或银行账号。'],
    write: ['Write my letter', 'Escribir mi carta', '生成我的信'],
    writing: ['Writing your letter', 'Escribiendo su carta', '正在写您的信'], writingSub: ['This usually takes a few seconds.', 'Suele tardar unos segundos.', '通常只需几秒钟。'],
    readyTitle: ['Your letter is ready', 'Su carta está lista', '您的信已写好'],
    yourAsk: ['Your ask:', 'Su petición:', '您的要求：'],
    draftNotice: ['<b>This is a draft, not legal advice.</b> Check every date, number and name, and attach your documents before you send it. The letter is in English so it is easy to send.', '<b>Esto es un borrador, no asesoría legal.</b> Revise cada fecha, cifra y nombre, y adjunte sus documentos antes de enviarla. La carta está en inglés para que sea fácil de enviar.', '<b>这是草稿，不是法律建议。</b>发送前请核对每个日期、数字和姓名，并附上您的文件。信件为英文，方便直接发送。'],
    fallbackNote: ['Live rewording is not available right now, so this is a standard letter that uses your notes as you wrote them. Read it over before you send it.', 'La redacción en vivo no está disponible ahora, así que esta es una carta estándar que usa sus notas tal como las escribió. Revísela antes de enviarla.', '实时润色暂时不可用，所以这是一封使用您原话的标准信。发送前请通读一遍。'],
    quotaNote: ['Live rewording is paused for today (the free daily limit was reached), so this is a standard letter that uses your notes as you wrote them.', 'La redacción en vivo está en pausa por hoy (se alcanzó el límite diario gratuito), así que esta es una carta estándar que usa sus notas tal como las escribió.', '今天的实时润色已暂停（已达每日免费额度），所以这是一封使用您原话的标准信。'],
    editHint: ['You can edit the letter right here.', 'Puede editar la carta aquí mismo.', '您可以直接在这里修改这封信。'],
    copy: ['Copy letter', 'Copiar carta', '复制信件'], copied: ['Copied. Paste it into an email to your insurance company.', 'Copiada. Péguela en un correo a su compañía de seguros.', '已复制。请粘贴到发给保险公司的邮件中。'],
    copyFail: ['Your browser blocked copying. Press and hold in the letter, choose Select All, then Copy.', 'Su navegador bloqueó la copia. Mantenga presionado dentro de la carta, elija Seleccionar todo y luego Copiar.', '浏览器阻止了复制。请在信件中长按，选择“全选”，再选“复制”。'],
    shorter: ['Make it shorter', 'Hacerla más corta', '改得更短'], changeAsk: ['Change what I ask for', 'Cambiar lo que pido', '更改我的要求'],
    sentTitle: ['After you send it', 'Después de enviarla', '发送之后'],
    sentBtn: ['I sent it. Add it to my record', 'La envié. Agregarla a mi registro', '我已发送，记入我的记录'],
    sentDone: ['Added to your record on {d}.', 'Agregada a su registro el {d}.', '已于 {d} 记入您的记录。'], openClaim: ['Open My claim', 'Abrir Mi reclamo', '打开“我的理赔”'],
    nextTitle: ['What happens next', 'Qué sigue', '接下来会怎样'],
    next1: ['Send it by email if you can, so there is a written record. Attach photos, receipts or estimates that support it.', 'Envíela por correo electrónico si puede, para que quede constancia escrita. Adjunte fotos, recibos o presupuestos que la respalden.', '如有可能请用电子邮件发送，以留下书面记录。附上支持您请求的照片、收据或报价。'],
    next2: ['Keep a log of every call and message: the date, the time, who you spoke with and what they said. Keep every receipt.', 'Lleve un registro de cada llamada y mensaje: la fecha, la hora, con quién habló y qué le dijeron. Guarde todos los recibos.', '记录每一次通话和消息：日期、时间、对方是谁、说了什么。保留每一张收据。'],
    next3: ['Your letter asks for a written reply within 15 calendar days. That is your request, not a legal deadline.', 'Su carta pide una respuesta por escrito en 15 días naturales. Es su petición, no un plazo legal.', '您的信要求对方在 15 个日历日内书面答复。这是您的请求，不是法定期限。'],
    next4: ['No answer, or still stuck? Call the California Department of Insurance hotline at {tel}, or file a formal complaint with the department.', '¿Sin respuesta o sigue sin avances? Llame a la línea del Departamento de Seguros de California al {tel}, o presente una queja formal ante el departamento.', '没有答复或仍然卡住？请致电加州保险局热线 {tel}，或向该局提交正式投诉。'],
    another: ['Write another letter', 'Escribir otra carta', '再写一封信'], seeSteps: ['See the steps of my claim', 'Ver los pasos de mi reclamo', '查看我的理赔步骤'],
    stagesTitle: ['The steps of a claim', 'Los pasos de un reclamo', '理赔的步骤'],
    stagesLead: ['Most claims move through these steps in this order. Open the one you are in for a short checklist.', 'La mayoría de los reclamos pasan por estos pasos en este orden. Abra el paso en que está para ver una lista corta.', '大多数理赔按这个顺序进行。打开您所在的步骤，查看简短清单。'],
    stagesRent: ['Showing the steps for renters.', 'Se muestran los pasos para inquilinos.', '显示的是租客的步骤。'], stagesOwn: ['Showing the steps for homeowners.', 'Se muestran los pasos para propietarios.', '显示的是房主的步骤。'], switchRole: ['Switch', 'Cambiar', '切换'],
    alsoTitle: ['Also', 'También', '另外'], doneOf: ['{d} of {n} done', '{d} de {n} hechos', '已完成 {d}/{n}'],
    checklist: ['Your checklist', 'Su lista', '您的清单'], checklistSub: ['Tick items as you do them. Saved on this device.', 'Marque cada punto al hacerlo. Se guarda en este dispositivo.', '完成一项就勾选一项，保存在此设备上。'],
    sources: ['Sources', 'Fuentes', '来源'], generalNote: ['General guidance from people who have been through claims, not checked against official sources. Confirm with your insurer.', 'Orientación general de personas que han pasado por reclamos, no verificada con fuentes oficiales. Confírmelo con su aseguradora.', '来自经历过理赔的人的一般建议，未与官方来源核对。请向保险公司确认。'],
    nextStage: ['Next step: {s}', 'Siguiente paso: {s}', '下一步：{s}'], allSteps: ['All steps', 'Todos los pasos', '全部步骤'],
    toolReply: ['Write a letter about this', 'Escribir una carta sobre esto', '就此写一封信'], toolDates: ['Work out my key dates', 'Calcular mis fechas clave', '计算我的关键日期'], toolLog: ['Log a call or message', 'Anotar una llamada o mensaje', '记录一次通话或消息'], toolInv: ['Start my list of belongings', 'Empezar mi lista de pertenencias', '开始列我的物品清单'],
    claimTitle: ['My claim', 'Mi reclamo', '我的理赔'], claimSub: ['Saved only in this browser. Nothing here is sent anywhere.', 'Se guarda solo en este navegador. Nada de esto se envía.', '仅保存在此浏览器中，不会发送到任何地方。'],
    letters: ['Letters', 'Cartas', '信件'], noLetters: ['No letters yet.', 'Aún no hay cartas.', '还没有信件。'], sentOn: ['Sent', 'Enviada', '已发送'], notSent: ['Not marked as sent', 'No marcada como enviada', '未标记为已发送'],
    markSent: ['Mark as sent', 'Marcar como enviada', '标记为已发送'], copyShort: ['Copy', 'Copiar', '复制'], del: ['Delete', 'Eliminar', '删除'], delSure: ['Tap again to delete', 'Toque de nuevo para eliminar', '再点一次即删除'], show: ['Show letter', 'Ver carta', '查看信件'],
    log: ['Calls and messages', 'Llamadas y mensajes', '通话和消息'], logSub: ['Write down each call or message with your insurer, adjuster or landlord.', 'Anote cada llamada o mensaje con su aseguradora, ajustador o arrendador.', '记录与保险公司、理赔员或房东的每一次通话或消息。'],
    logDate: ['Date', 'Fecha', '日期'], logWho: ['Who (name and company)', 'Con quién (nombre y empresa)', '联系对象（姓名和公司）'], logWhat: ['What was said or promised', 'Qué se dijo o prometió', '说了什么或承诺了什么'], logAdd: ['Add to log', 'Agregar al registro', '添加到记录'], noLog: ['Nothing logged yet.', 'Aún no hay registros.', '还没有记录。'],
    progress: ['Checklists', 'Listas', '清单'], noProgress: ['No checklist started yet.', 'Aún no empezó ninguna lista.', '还没有开始任何清单。'],
    dates: ['Key dates', 'Fechas clave', '关键日期'], copySummary: ['Copy my claim summary', 'Copiar el resumen de mi reclamo', '复制我的理赔摘要'], summaryCopied: ['Summary copied.', 'Resumen copiado.', '摘要已复制。'],
    sentLog: ['Sent a letter: ', 'Envié una carta: ', '已发送信件：'], insurer: ['Insurer', 'Aseguradora', '保险公司'],
    helpTitle: ['Phone numbers for help', 'Teléfonos de ayuda', '求助电话'],
    helpLead: ['Next Step is a guide, not a service. No one here will call you back. These are public lines answered by real people.', 'Next Step es una guía, no un servicio. Nadie aquí le devolverá la llamada. Estas son líneas públicas atendidas por personas reales.', 'Next Step 是一份指南，不是服务机构，这里不会有人回电。以下是由真人接听的公共热线。'],
    hInsTitle: ['Your insurance claim', 'Su reclamo de seguro', '您的保险理赔'], hHouseTitle: ['Housing and government aid', 'Vivienda y ayuda del gobierno', '住房和政府援助'], hHireTitle: ['Before you hire help', 'Antes de contratar ayuda', '雇人帮忙之前'], hOverTitle: ['If it is all too much', 'Si todo es demasiado', '如果实在太难受'],
    hCdi: ['California Department of Insurance hotline, for questions about your insurance or a dispute with your insurer.', 'Línea del Departamento de Seguros de California, para preguntas sobre su seguro o una disputa con su aseguradora.', '加州保险局热线，咨询保险问题或与保险公司的纠纷。'],
    hComplaint: ['The department urges survivors with delays, disputes or smoke damage problems to file a formal complaint. It says it needs one to act.', 'El departamento insta a los sobrevivientes con retrasos, disputas o problemas por humo a presentar una queja formal. Dice que la necesita para actuar.', '保险局鼓励遇到拖延、纠纷或烟熏问题的幸存者提交正式投诉，并表示需要投诉才能采取行动。'],
    hLac: ['Local Assistance Centers offer in-person help.', 'Los Centros de Asistencia Local ofrecen ayuda en persona.', '本地援助中心提供当面帮助。'],
    hUp: ['United Policyholders has free wildfire claim guides and sample letters.', 'United Policyholders tiene guías gratuitas y cartas modelo para reclamos por incendios.', 'United Policyholders 提供免费的野火理赔指南和信函范本。'],
    hFema: ['FEMA. File your insurance claim first, and tell FEMA about all your coverage. Apply at DisasterAssistance.gov or by phone.', 'FEMA. Presente primero su reclamo al seguro e informe a FEMA de toda su cobertura. Solicite en DisasterAssistance.gov o por teléfono.', 'FEMA。请先向保险公司提出理赔，并向 FEMA 说明全部保险。可在 DisasterAssistance.gov 或电话申请。'],
    hStay: ['If your home is not safe to live in, your policy may pay additional living expenses such as a hotel, food and clothing. Keep every receipt.', 'Si su vivienda no es segura para vivir, su póliza puede pagar gastos adicionales de vida, como hotel, comida y ropa. Guarde todos los recibos.', '如果房子不安全、无法居住，保单可能赔付酒店、餐饮和衣物等额外生活费用。请保留所有收据。'],
    hAdvance: ['For a covered total loss in a state of emergency, you can ask your insurer in writing to advance at least four months of living expenses.', 'En una pérdida total cubierta durante un estado de emergencia, puede pedir por escrito a su aseguradora que adelante al menos cuatro meses de gastos de vida.', '在紧急状态下发生承保全损时，您可以书面要求保险公司预付至少四个月的生活费用。'],
    hTemp: ['FEMA may help with short-term hotel stays and rent if you are displaced. The original deadline for the January 2025 fires has passed, so ask FEMA whether you can still apply.', 'FEMA puede ayudar con estadías cortas en hotel y con el alquiler si está desplazado(a). El plazo original para los incendios de enero de 2025 ya pasó, así que pregunte a FEMA si aún puede solicitar.', '如果您流离失所，FEMA 可能提供短期酒店住宿和租金援助。2025 年 1 月火灾的原截止日期已过，请询问 FEMA 是否仍可申请。'],
    hAdj: ['A public adjuster works for you, for a fee. Take your time and check that the person is licensed and in good standing, at {tel}.', 'Un ajustador público trabaja para usted, por una tarifa. Tómese su tiempo y verifique que tenga licencia y esté en buenos términos, al {tel}.', '公共理赔员是您付费聘请的。请不要着急，并致电 {tel} 核实其执照和信誉。'],
    hCslb: ['Check a contractor’s license with the Contractors State License Board at {tel} or cslb.ca.gov before you sign.', 'Verifique la licencia de un contratista con la Junta de Licencias de Contratistas al {tel} o en cslb.ca.gov antes de firmar.', '签约之前，请致电 {tel} 或访问 cslb.ca.gov，向加州承包商执照委员会核实承包商执照。'],
    hTenant: ['Renters: talk to a tenant attorney or legal aid before you stop paying rent. Los Angeles County has a guide for landlords and tenants after a disaster.', 'Inquilinos: hable con un abogado de inquilinos o asistencia legal antes de dejar de pagar el alquiler. El Condado de Los Ángeles tiene una guía para arrendadores e inquilinos después de un desastre.', '租客：在停付房租之前，请先咨询租客律师或法律援助。洛杉矶县有一份灾后房东与租客指南。'],
    h911: ['If you are in danger, call', 'Si está en peligro, llame al', '如果您身处危险，请拨打'], h988: ['For emotional support, call or text', 'Para apoyo emocional, llame o envíe un mensaje al', '需要情绪支持，请致电或发短信至'],
    hWait: ['Claims take months. Taking a break today does not cost you your claim.', 'Los reclamos toman meses. Descansar hoy no le hace perder su reclamo.', '理赔需要几个月。今天休息一下不会让您失去理赔。'],
    breatheTitle: ['Take a breath', 'Respire un momento', '深呼吸一下'], breatheLead: ['One minute. Breathe in as the circle grows, hold, and breathe out as it shrinks.', 'Un minuto. Inhale mientras el círculo crece, sostenga, y exhale mientras se encoge.', '一分钟。圆圈变大时吸气，停一下，圆圈缩小时呼气。'],
    bStart: ['Start', 'Empezar', '开始'], bStop: ['Stop', 'Parar', '停止'], bIn: ['Breathe in', 'Inhale', '吸气'], bHold: ['Hold', 'Sostenga', '屏住'], bOut: ['Breathe out', 'Exhale', '呼气'], bDone: ['Done. Take your time.', 'Listo. Tómese su tiempo.', '完成了。慢慢来。'], bAgain: ['Again', 'Otra vez', '再来一次'],
    qTitle: ['Ask a question', 'Haga una pregunta', '提一个问题'], qLead: ['Ask about your claim in your own words. Answers use public sources and show them.', 'Pregunte sobre su reclamo con sus propias palabras. Las respuestas usan fuentes públicas y las muestran.', '用您自己的话询问理赔问题。回答基于公开来源，并会标出来源。'],
    qPh: ['Example: How long does my insurer have to answer?', 'Ejemplo: ¿Cuánto tiempo tiene mi aseguradora para responder?', '例如：保险公司必须在多长时间内答复？'], qAsk: ['Ask', 'Preguntar', '提问'], qAnother: ['Ask another question', 'Hacer otra pregunta', '再问一个问题'],
    qNote: ['Answers are written by a computer from public sources. They can be wrong. No person reads your question.', 'Las respuestas las escribe una computadora a partir de fuentes públicas. Pueden estar equivocadas. Ninguna persona lee su pregunta.', '回答由计算机根据公开来源生成，可能有误。没有人会阅读您的问题。'],
    qDown: ['Live answers are not available right now. These may help:', 'Las respuestas en vivo no están disponibles ahora. Esto puede ayudar:', '实时回答暂时不可用。以下内容可能有帮助：'],
    qQuota: ['Live answers are paused for today (the free daily limit was reached). These may help:', 'Las respuestas en vivo están en pausa por hoy (se alcanzó el límite diario gratuito). Esto puede ayudar:', '今天的实时回答已暂停（已达每日免费额度）。以下内容可能有帮助：'],
    qPerson: ['Next Step has no staff to talk to. Real people answer these public lines:', 'Next Step no tiene personal con quien hablar. Personas reales atienden estas líneas públicas:', 'Next Step 没有工作人员可以对话。以下公共热线由真人接听：'],
    insurerNote: ['There are no checked, insurer-specific forms here. The most reliable way is to ask that insurer in writing for its list of required documents and forms. Next Step can write that letter.', 'Aquí no hay formularios verificados de cada aseguradora. Lo más confiable es pedir por escrito a esa aseguradora su lista de documentos y formularios requeridos. Next Step puede escribir esa carta.', '这里没有经过核实的各保险公司专属表格。最可靠的办法是书面向该保险公司索取所需文件和表格清单。Next Step 可以帮您写这封信。'],
    wordsTitle: ['Insurance words in plain language', 'Términos de seguros en lenguaje sencillo', '用通俗语言解释保险术语'], wordsNote: ['General definitions with example numbers only. Your policy controls.', 'Definiciones generales con cifras de ejemplo. Su póliza es la que rige.', '一般性定义，数字仅为示例。以您的保单为准。'],
    datesLbl: ['When did you first report the claim?', '¿Cuándo reportó el reclamo por primera vez?', '您第一次报案是什么时候？'], datesBuild: ['Work out my dates', 'Calcular mis fechas', '计算我的日期'],
    datesNote: ['Dates are estimates. Check your policy and ask your insurer in writing.', 'Las fechas son estimaciones. Revise su póliza y pregunte por escrito a su aseguradora.', '日期仅为估算。请核对保单，并书面询问保险公司。'],
    invRoom: ['Room', 'Habitación', '房间'], invItem: ['Item', 'Artículo', '物品'], invVal: ['Value $', 'Valor $', '金额 $'], invAdd: ['Add', 'Agregar', '添加'], invCopy: ['Copy as a spreadsheet', 'Copiar como hoja de cálculo', '复制为表格'], invTot: ['{n} items, about ${t}', '{n} artículos, aproximadamente ${t}', '共 {n} 件，约 ${t}'],
    invNote: ['Rough values are fine. This list is not saved when you leave the page, so copy it when you are done.', 'Los valores aproximados sirven. Esta lista no se guarda al salir de la página, así que cópiela al terminar.', '大致金额即可。离开页面后此清单不会保存，完成后请复制。'],
    newLetterTitle: ['Write a new letter?', '¿Escribir una carta nueva?', '要写一封新信吗？'],
    resumeLead: ['Your letters are saved in My claim.', 'Sus cartas están guardadas en Mi reclamo.', '您的信件保存在“我的理赔”中。'],
    langDraft: ['Spanish and Chinese are drafts that a native speaker has not reviewed yet.', 'El español es un borrador que aún no ha revisado un hablante nativo.', '中文为草稿，尚未经母语人士审校。']
  };
  function t(k, v) { var a = S[k]; if (!a) return k; var s = state.lang === 'es' ? a[1] : state.lang === 'zh' ? a[2] : a[0]; return fmt(s || a[0], v); }
  function L(o) { return typeof o === 'string' ? o : (o[state.lang] || o.en); }
  function fmt(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  var LOCALE = { en: 'en-US', es: 'es-US', zh: 'zh-CN' };

  /* New copy: when each ask fits. General guidance, not rules. */
  var HINTS = {
    denied: { a1: M('Pick this if you do not know exactly why they said no.', 'Elija esta si no sabe exactamente por qué dijeron que no.', '如果您不清楚他们拒赔的确切原因，请选这一项。'), a2: M('Pick this if you want to see what their decision was based on.', 'Elija esta si quiere ver en qué basaron su decisión.', '如果您想看他们做决定的依据，请选这一项。'), a3: M('Pick this if you have photos, receipts or estimates that show the loss.', 'Elija esta si tiene fotos, recibos o presupuestos que muestran la pérdida.', '如果您有能证明损失的照片、收据或报价，请选这一项。') },
    low: { a1: M('Pick this if you cannot tell how they reached their number.', 'Elija esta si no entiende cómo llegaron a su cifra.', '如果您看不懂他们的金额是怎么得出的，请选这一项。'), a2: M('Pick this if you have your own contractor’s estimate to send.', 'Elija esta si tiene el presupuesto de su propio contratista para enviar.', '如果您有自己承包商的报价可以寄送，请选这一项。'), a3: M('Pick this if you are not sure what your policy covers.', 'Elija esta si no está seguro(a) de lo que cubre su póliza.', '如果您不确定保单涵盖什么，请选这一项。') },
    quiet: { a1: M('Pick this if you just need to know where things stand.', 'Elija esta si solo necesita saber cómo va todo.', '如果您只是想知道目前进展到哪一步，请选这一项。'), a2: M('Pick this if you have already tried your adjuster more than once.', 'Elija esta si ya intentó contactar a su ajustador más de una vez.', '如果您已经多次联系理赔员无果，请选这一项。'), a3: M('Pick this if you want to know how long each step should take.', 'Elija esta si quiere saber cuánto debería tardar cada paso.', '如果您想知道每一步应该需要多长时间，请选这一项。') },
    smoke: { a1: M('Pick this if no one has explained how they will check your home.', 'Elija esta si nadie le ha explicado cómo revisarán su vivienda.', '如果还没有人说明他们将如何检查您的房子，请选这一项。'), a2: M('Pick this if you want a professional to test your home.', 'Elija esta si quiere que un profesional evalúe su vivienda.', '如果您希望由专业人员检测房屋，请选这一项。') },
    other: { a1: M('Pick this if you are not sure what they need to move forward.', 'Elija esta si no sabe qué necesitan para avanzar.', '如果您不确定他们需要什么才能推进，请选这一项。') }
  };
  var NOTES_PH = {
    denied: M('Example: They denied my claim on Oct 3 and said the damage was not from the fire.', 'Ejemplo: Rechazaron mi reclamo el 3 de octubre y dijeron que el daño no fue por el incendio.', '例如：他们在 10 月 3 日拒赔，并说损坏不是火灾造成的。'),
    low: M('Example: They offered much less than my contractor quoted for the same repairs.', 'Ejemplo: Ofrecieron mucho menos de lo que cotizó mi contratista por las mismas reparaciones.', '例如：他们赔的比我的承包商对同样维修的报价少很多。'),
    quiet: M('Example: I sent photos in January and my adjuster has not answered my calls or emails for 7 weeks.', 'Ejemplo: Envié fotos en enero y mi ajustador no responde mis llamadas ni correos desde hace 7 semanas.', '例如：我 1 月提交了照片，理赔员 7 周来没有回复我的电话和邮件。'),
    smoke: M('Example: My home is standing, but there is a smoke smell and ash inside, and no one has tested it.', 'Ejemplo: Mi vivienda sigue en pie, pero hay olor a humo y ceniza adentro, y nadie lo ha evaluado.', '例如：房子还在，但里面有烟味和灰，也没有人来检测。'),
    other: M('Example: I need to know what they still need from me.', 'Ejemplo: Necesito saber qué más necesitan de mí.', '例如：我需要知道他们还需要我提供什么。')
  };

  /* ---------- small helpers ---------- */
  var events = [], t0 = Date.now();
  function log(type, detail) { var s = Math.round((Date.now() - t0) / 1000); events.push(('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2) + '  ' + type + (detail ? ': ' + detail : '')); document.getElementById('logOut').textContent = events.join('\n'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tel(n, label) { return '<a class="tel" href="tel:' + n.replace(/[^0-9]/g, '') + '">' + esc(label || n) + '</a>'; }
  function isRent() { return state.role === 'rent'; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function niceDate(d) { return (d || new Date()).toLocaleDateString(LOCALE[state.lang], { month: 'long', day: 'numeric', year: 'numeric' }); }
  function srcRow(ids) {
    ids = ids.filter(function (n) { return SOURCES[n]; });
    if (!ids.length) return '';
    return '<div class="srcs"><span>' + esc(t('sources')) + '</span>' + ids.map(function (n) { var s = SOURCES[n]; return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(s.title) + '">' + esc(s.label) + '</a>'; }).join('') + '</div>';
  }
  var toastT = null;
  function toast(msg) { var d = document.getElementById('toast'); d.textContent = msg; d.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { d.classList.remove('show'); }, 2600); }
  function copyText(text, ok, fail) {
    function fb() { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'; document.body.appendChild(ta); ta.select(); var good = false; try { good = document.execCommand('copy'); } catch (e) {} ta.remove(); if (good) ok(); else if (fail) fail(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fb); else fb();
  }
  function head(stepN, title, lead, backTo) {
    var h = '';
    if (stepN) h += '<div class="steprow"><a class="backlink" href="' + backTo + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' + esc(t('back')) + '</a><p class="stepn">' + esc(t('stepOf', { n: stepN })) + '</p></div><div class="segs" aria-hidden="true">' + [1, 2, 3, 4].map(function (i) { return '<i' + (i <= stepN ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
    else if (backTo) h += '<div class="steprow"><a class="backlink" href="' + backTo + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' + esc(t('back')) + '</a></div>';
    h += '<h1 tabindex="-1">' + esc(title) + '</h1>';
    if (lead) h += '<p class="lead">' + esc(lead) + '</p>';
    return h;
  }
  function screen(cls, html) { view.innerHTML = ''; var s = el('section', 'screen v-' + (cls || 'x'), html); view.appendChild(s); return s; }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  /* ---------- step 1: own or rent ---------- */
  function vStart() {
    var s = screen('start', head(1, t('roleTitle'), t('roleLead'), '/') +
      '<div class="choices">' + ['own', 'rent', 'unsure'].map(function (r) { return '<button type="button" class="choice" data-role="' + r + '"><b>' + esc(t(r)) + '</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>'; }).join('') + '</div>' +
      '<div class="other"><label class="check"><input type="checkbox" id="forOther"' + (state.who === 'other' ? ' checked' : '') + '><span>' + esc(t('forOther')) + '</span></label>' +
      '<div class="otherbox" id="otherBox"' + (state.who === 'other' ? '' : ' hidden') + '><label class="lbl" for="otherName">' + esc(t('otherName')) + '</label><input type="text" id="otherName" maxlength="40" value="' + esc(state.whoName) + '"><p class="hint">' + esc(t('forOtherOn')) + '</p></div></div>');
    s.querySelectorAll('.choice').forEach(function (b) {
      b.addEventListener('click', function () { state.role = b.getAttribute('data-role'); save(); log('role', state.role); go('#/what'); });
    });
    var fo = s.querySelector('#forOther'), box = s.querySelector('#otherBox'), nm = s.querySelector('#otherName');
    fo.addEventListener('change', function () { state.who = fo.checked ? 'other' : 'me'; box.hidden = !fo.checked; save(); if (fo.checked) nm.focus(); });
    nm.addEventListener('input', function () { state.whoName = nm.value.trim(); save(); });
  }

  /* ---------- step 2: what did the insurer do ---------- */
  function sitButtons(list) {
    return '<div class="choices">' + list.map(function (k) { return '<button type="button" class="choice" data-sit="' + k + '"><span><b>' + esc(t('c_' + k)) + '</b><small>' + esc(t('c_' + k + '_s')) + '</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>'; }).join('') + '</div>';
  }
  function bindSits(s) {
    s.querySelectorAll('.choice[data-sit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sit');
        if (state.draft.sit !== k) state.draft = { sit: k, notes: state.draft.notes || '', extra: state.draft.extra || '', name: state.draft.name || '', claim: state.draft.claim || '', insurer: state.draft.insurer || '', paste: '' };
        save(); log('situation', k); go('#/ask/' + k);
      });
    });
  }
  function vWhat() {
    if (!state.role) return go('#/start');
    var s = screen('what', head(2, t('whatTitle'), t('whatLead'), '#/start') + sitButtons(['denied', 'low', 'quiet']) +
      '<p class="quietlink"><a href="#/more">' + esc(t('somethingElse')) + '</a></p>');
    bindSits(s);
  }
  function vMore() {
    var s = screen('what', head(2, t('moreTitle'), '', '#/what') + sitButtons(['smoke', 'other']));
    bindSits(s);
  }

  /* ---------- step 3: the one ask, with a plain note on when each fits ---------- */
  function vAsk(sit) {
    if (!C.ASKS[sit]) return go('#/what');
    state.draft.sit = sit;
    var d = state.draft, asks = C.ASKS[sit];
    var s = screen('ask', head(3, t('askTitle'), t('askLead'), sit === 'smoke' || sit === 'other' ? '#/more' : '#/what') +
      '<fieldset class="asks"><legend class="sr">' + esc(t('askTitle')) + '</legend>' + asks.map(function (a) {
        return '<label class="ask"><input type="radio" name="ask" value="' + a[0] + '"' + (d.ask === a[0] ? ' checked' : '') + '><span class="dot" aria-hidden="true"></span><span><b>' + esc(L(a[2])) + '</b><small>' + esc(L(HINTS[sit][a[0]])) + '</small></span></label>';
      }).join('') +
      '<label class="ask"><input type="radio" name="ask" value="x"' + (d.ask === 'x' ? ' checked' : '') + '><span class="dot" aria-hidden="true"></span><span><b>' + esc(t('askOwn')) + '</b><small>' + esc(t('askOwnHint')) + '</small></span></label>' +
      '<div class="ownask" id="ownWrap"' + (d.ask === 'x' ? '' : ' hidden') + '><label class="sr" for="ownAsk">' + esc(t('askOwnPh')) + '</label><textarea id="ownAsk" rows="2" maxlength="200" placeholder="' + esc(t('askOwnPh')) + '">' + esc(d.own || '') + '</textarea></div></fieldset>' +
      '<p class="err" id="askErr" role="alert" hidden></p>' +
      '<div class="actions"><button type="button" class="btn" id="askGo">' + esc(t('cont')) + '</button></div>');
    var own = s.querySelector('#ownAsk'), wrap = s.querySelector('#ownWrap'), err = s.querySelector('#askErr');
    s.querySelector('.asks').addEventListener('change', function (e) {
      if (e.target.name !== 'ask') return;
      d.ask = e.target.value; wrap.hidden = d.ask !== 'x'; err.hidden = true; save();
      if (d.ask === 'x') own.focus();
      else { var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; s.querySelector('#askGo').scrollIntoView({ block: 'nearest', behavior: rm ? 'auto' : 'smooth' }); }
    });
    own.addEventListener('input', function () { d.own = own.value; save(); });
    s.querySelector('#askGo').addEventListener('click', function () {
      var sel = s.querySelector('input[name="ask"]:checked');
      if (!sel) { err.textContent = t('needAsk'); err.hidden = false; return; }
      if (sel.value === 'x' && !own.value.trim()) { err.textContent = t('needOwn'); err.hidden = false; own.focus(); return; }
      d.ask = sel.value; save(); log('ask', sit + '/' + d.ask); go('#/notes/' + sit);
    });
  }
  function askSentence(d) {
    var sit = d.sit;
    if (d.ask === 'x') {
      var a = (d.own || '').trim(); if (!a) return '';
      if (!/[.?!]$/.test(a)) a += '.';
      if (!/^please/i.test(a)) a = 'Please ' + a.charAt(0).toLowerCase() + a.slice(1);
      return a;
    }
    var hit = (C.ASKS[sit] || []).filter(function (x) { return x[0] === d.ask; })[0];
    if (!hit) return '';
    var txt = hit[1];
    if (state.who === 'other') txt = txt.replace(/\bfrom me\b/g, 'from them').replace(/\bmy\b/g, 'their');
    return txt;
  }
  function askLabel(d) {
    if (d.ask === 'x') { var o = (d.own || '').trim(); return o.charAt(0).toUpperCase() + o.slice(1); }
    var hit = (C.ASKS[d.sit] || []).filter(function (x) { return x[0] === d.ask; })[0];
    return hit ? L(hit[2]) : '';
  }

  /* ---------- step 4: their words, and a place for details ---------- */
  function vNotes(sit) {
    var d = state.draft;
    if (d.sit !== sit || !d.ask) return go('#/ask/' + sit);
    var s = screen('notes', head(4, t('notesTitle'), t('notesLead'), '#/ask/' + sit) +
      '<div class="field"><label class="lbl" for="nNotes">' + esc(t('notesLbl')) + '</label><textarea id="nNotes" rows="5" maxlength="1200" placeholder="' + esc(L(NOTES_PH[sit])) + '">' + esc(d.notes || '') + '</textarea></div>' +
      '<div class="field"><label class="lbl" for="nExtra">' + esc(t('extraLbl')) + '</label><textarea id="nExtra" rows="3" maxlength="600" placeholder="' + esc(t('extraPh')) + '">' + esc(d.extra || '') + '</textarea></div>' +
      '<details class="more"' + (d.name || d.claim || d.insurer || d.paste ? ' open' : '') + '><summary>' + esc(t('moreLbl')) + '</summary>' +
      '<div class="two"><div class="field"><label class="lbl" for="nName">' + esc(t('phName')) + '</label><input type="text" id="nName" maxlength="60" value="' + esc(d.name || '') + '" autocomplete="name"></div>' +
      '<div class="field"><label class="lbl" for="nClaim">' + esc(t('phClaim')) + '</label><input type="text" id="nClaim" maxlength="40" value="' + esc(d.claim || '') + '"></div></div>' +
      '<div class="field"><label class="lbl" for="nInsurer">' + esc(t('phInsurer')) + '</label><input type="text" id="nInsurer" maxlength="60" value="' + esc(d.insurer || '') + '"></div>' +
      '<div class="field"><label class="lbl" for="nPaste">' + esc(t('pasteLbl')) + '</label><textarea id="nPaste" rows="4" maxlength="1500" placeholder="' + esc(t('pastePh')) + '">' + esc(d.paste || '') + '</textarea></div></details>' +
      '<p class="hint">' + esc(t('priv')) + '</p>' +
      '<div class="actions"><button type="button" class="btn" id="writeBtn">' + esc(t('write')) + '</button></div>');
    var map = { nNotes: 'notes', nExtra: 'extra', nName: 'name', nClaim: 'claim', nInsurer: 'insurer', nPaste: 'paste' };
    Object.keys(map).forEach(function (id) { var f = s.querySelector('#' + id); f.addEventListener('input', function () { d[map[id]] = f.value; save(); }); });
    s.querySelector('#writeBtn').addEventListener('click', function () { state.current = null; save(); log('letter requested', sit + '/' + d.ask); go('#/letter'); });
  }

  /* ---------- the letter ---------- */
  function letterInput(short) {
    var d = state.draft, notes = (d.notes || '').trim(), extra = (d.extra || '').trim();
    var all = notes + (extra ? (notes ? '\n' : '') + 'Details to include: ' + extra : '');
    return { mode: 'letter', lang: state.lang, who: state.who, whoName: state.whoName, sit: d.sit, sitLabel: L(C.SIT_LABEL[d.sit]), role: state.role, ask: askSentence(d), notes: all, paste: (d.paste || '').trim(), name: (d.name || '').trim(), claim: (d.claim || '').trim(), insurer: (d.insurer || '').trim(), short: !!short };
  }
  function template(o) {
    var out = [], oth = o.who === 'other', pn = o.whoName || '[policyholder name]', home = isRent() ? 'rental home' : 'home';
    out.push('Subject: ' + C.SIT_SUBJECT[o.sit] + (o.claim ? ' - Claim ' + o.claim : ''), '', 'Dear Claims Team,', '');
    out.push(oth ? 'I am writing on behalf of ' + pn + ' about their claim for their ' + home + ', which was affected by the California wildfire.' : 'I am writing about my claim for my ' + home + ', which was affected by the California wildfire.');
    var ctx = (oth ? { denied: 'They received your decision on the claim.', low: 'They received your settlement offer on the claim.', quiet: 'They have not received a response to their recent requests.', smoke: 'Their home is still standing, but smoke and ash got in.', other: '' } : { denied: 'I received your decision on my claim.', low: 'I received your settlement offer on my claim.', quiet: 'I have not received a response to my recent requests.', smoke: 'My home is still standing, but smoke and ash got in.', other: '' })[o.sit];
    if (ctx) out.push(ctx);
    if (o.notes) out.push('', 'In my own words: ' + o.notes.slice(0, 1200));
    if (o.paste) out.push('', 'Your message included: "' + o.paste.slice(0, 500) + '"');
    out.push('', o.ask, '', 'Please reply in writing within 15 calendar days of receiving this letter. I am keeping a record of all communication on this claim.', '', 'Thank you,', o.name || '[your name]');
    return out.join('\n');
  }
  var aiUntil = 0, aiCode = '';
  function aiDown(code) { aiCode = code || 'error'; aiUntil = Date.now() + (code === 'quota' ? 30 * 60 * 1000 : 3 * 60 * 1000); log('live unavailable', aiCode); }
  function api(body) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'http_' + r.status); e.code = j.error || 'http_' + r.status; throw e; } return j; });
    });
  }
  function storeLetter(text, sit) {
    var m = text.match(/^Subject:\s*(.*)$/m);
    var rec = { id: 'L' + Date.now().toString(36), d: niceDate(), sit: sit, sub: m ? m[1].slice(0, 90) : C.SIT_SUBJECT[sit], text: text, sent: false };
    state.letters.unshift(rec); state.letters = state.letters.slice(0, 20); save();
    return rec;
  }
  function vLetter() {
    var d = state.draft;
    if (!d.sit || !d.ask || !askSentence(d)) return go('#/what');
    var cur = state.current && state.letters.filter(function (l) { return l.id === state.current.id; })[0];
    if (cur) return showLetter(cur);
    var s = screen('writing', '<div class="wait"><div class="pulse" aria-hidden="true"></div><h1 tabindex="-1">' + esc(t('writing')) + '</h1><p class="lead">' + esc(t('writingSub')) + '</p></div>');
    s.setAttribute('aria-busy', 'true');
    makeLetter(false);
  }
  function makeLetter(short) {
    var o = letterInput(short), sit = o.sit;
    function done(text, fb) {
      if (location.hash !== '#/letter') return;
      var rec;
      if (short && state.current) { rec = state.letters.filter(function (l) { return l.id === state.current.id; })[0]; if (rec) { rec.text = text; save(); } }
      if (!rec) rec = storeLetter(text, sit);
      state.current = { id: rec.id, fallback: fb ? (aiCode === 'quota' ? 'quota' : 'off') : '' }; save();
      showLetter(rec);
    }
    if (Date.now() < aiUntil) { done(template(o), true); return; }
    api(o).then(function (r) { log('letter live', r.text.length + ' chars'); done(r.text, false); })
      .catch(function (e) { aiDown(e && e.code); done(template(o), true); });
  }
  function showLetter(rec) {
    var d = state.draft, fb = state.current && state.current.fallback;
    var s = screen('letter', '<h1 tabindex="-1">' + esc(t('readyTitle')) + '</h1>' +
      '<p class="lead">' + esc(t('yourAsk')) + ' <b>' + esc(askLabel(d)) + '</b></p>' +
      '<div class="notice">' + t('draftNotice') + (fb ? '<br><br>' + esc(t(fb === 'quota' ? 'quotaNote' : 'fallbackNote')) : '') + '</div>' +
      '<div class="paper"><label class="sr" for="letterText">' + esc(t('readyTitle')) + '</label><textarea id="letterText" class="letterEdit" spellcheck="true"></textarea></div>' +
      '<p class="hint">' + esc(t('editHint')) + '</p>' +
      '<div class="actions stack"><button type="button" class="btn" id="copyBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><span>' + esc(t('copy')) + '</span></button>' +
      '<p class="copied" id="copied" role="status" hidden></p>' +
      '<div class="row">' + (fb ? '' : '<button type="button" class="btn quiet" id="shortBtn">' + esc(t('shorter')) + '</button>') + '<a class="btn quiet" href="#/ask/' + d.sit + '">' + esc(t('changeAsk')) + '</a></div></div>' +
      '<section class="block"><h2>' + esc(t('sentTitle')) + '</h2><div id="sentArea"></div></section>' +
      '<section class="block"><h2>' + esc(t('nextTitle')) + '</h2><ol class="nums">' +
        '<li><span>' + esc(t('next1')) + '</span></li><li><span>' + esc(t('next2')) + '</span></li><li><span>' + esc(t('next3')) + '</span></li><li><span>' + t('next4', { tel: tel('1-800-927-4357') }) + '</span></li></ol>' + srcRow([2, 6]) +
      '<div class="actions row"><button type="button" class="btn quiet" id="anotherBtn">' + esc(t('another')) + '</button><a class="btn quiet" href="#/stages">' + esc(t('seeSteps')) + '</a></div></section>');
    var ta = s.querySelector('#letterText');
    ta.value = rec.text;
    function fit() { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 4) + 'px'; }
    fit(); setTimeout(fit, 60); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    ta.addEventListener('input', function () { rec.text = ta.value; var m = ta.value.match(/^Subject:\s*(.*)$/m); if (m) rec.sub = m[1].slice(0, 90); save(); fit(); });
    var copied = s.querySelector('#copied');
    s.querySelector('#copyBtn').addEventListener('click', function () {
      copyText(ta.value, function () { copied.textContent = t('copied'); copied.hidden = false; log('letter copied'); },
        function () { copied.textContent = t('copyFail'); copied.hidden = false; ta.focus(); ta.select(); });
    });
    var sb = s.querySelector('#shortBtn');
    if (sb) sb.addEventListener('click', function () { sb.disabled = true; sb.textContent = t('writing') + '…'; log('shorter'); makeLetter(true); });
    s.querySelector('#anotherBtn').addEventListener('click', function () { d.ask = null; d.own = ''; state.current = null; save(); go('#/ask/' + d.sit); });
    function paintSent() {
      var a = s.querySelector('#sentArea');
      if (rec.sent) a.innerHTML = '<p class="saved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' + esc(t('sentDone', { d: rec.sentOn || rec.d })) + '</p><p><a class="go" id="openClaim" href="#/claim">' + esc(t('openClaim')) + ' →</a></p>';
      else { a.innerHTML = '<button type="button" class="btn quiet" id="sentBtn">' + esc(t('sentBtn')) + '</button>'; a.querySelector('#sentBtn').addEventListener('click', function () { markSent(rec); paintSent(); s.querySelector('#openClaim').focus(); }); }
    }
    paintSent();
  }
  function markSent(rec) {
    rec.sent = true; rec.sentOn = niceDate();
    state.contacts.unshift({ d: today(), w: (state.draft.insurer || '').trim() || t('insurer'), s: t('sentLog') + rec.sub });
    save(); log('letter logged');
  }

  /* ---------- stages: a numbered column in the usual order ---------- */
  function stats(id) { var st = C.STAGES[id], n = st.steps.length, k = 0, i; for (i = 0; i < n; i++) if (state.done[id + '.' + i]) k++; return { n: n, d: k }; }
  function stageRow(id, num) {
    var st = C.STAGES[id], p = stats(id);
    return '<li><a class="stage" href="#/stage/' + id + '">' + (num ? '<span class="n" aria-hidden="true">' + num + '</span>' : '<span class="n dotn" aria-hidden="true"></span>') + '<span class="st"><b>' + esc(L(st.label)) + '</b>' + (p.d ? '<small>' + esc(t('doneOf', p)) + '</small>' : '') + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a></li>';
  }
  function vStages() {
    var order = isRent() ? C.RENT_ORDER : C.OWN_ORDER;
    var s = screen('stages', head(0, t('stagesTitle'), t('stagesLead'), '') +
      '<p class="rolenote">' + esc(t(isRent() ? 'stagesRent' : 'stagesOwn')) + ' <button type="button" class="linkbtn" id="switchRole">' + esc(t('switchRole')) + '</button></p>' +
      '<ol class="stagelist">' + order.map(function (id, i) { return stageRow(id, i + 1); }).join('') + '</ol>' +
      '<h2 class="sub2">' + esc(t('alsoTitle')) + '</h2><ul class="stagelist">' + ['sm'].concat(isRent() ? [] : ['td', 'tl', 'ts']).map(function (id) { return stageRow(id, 0); }).join('') + '</ul>' +
      '<p class="quietlink"><a href="#/words">' + esc(t('wordsTitle')) + '</a></p>');
    s.querySelector('#switchRole').addEventListener('click', function () { state.role = isRent() ? 'own' : 'rent'; save(); vStages(); });
  }
  var TOOL = { reply: 'toolReply', dates: 'toolDates', log: 'toolLog', inventory: 'toolInv' };
  function vStage(id) {
    var st = C.STAGES[id]; if (!st) return go('#/stages');
    var order = isRent() ? C.RENT_ORDER : C.OWN_ORDER, ix = order.indexOf(id), nextId = ix >= 0 && ix < order.length - 1 ? order[ix + 1] : null;
    var p = stats(id);
    var s = screen('stage', head(0, L(st.label), L(st.title), '#/stages') +
      '<section class="check"><div class="checkhead"><h2>' + esc(t('checklist')) + '</h2><p class="prog" id="prog">' + esc(t('doneOf', p)) + '</p></div><p class="hint">' + esc(t('checklistSub')) + '</p>' +
      '<ul class="ticks">' + st.steps.map(function (x, i) { var k = id + '.' + i; return '<li><label class="tick"><input type="checkbox" data-k="' + k + '"' + (state.done[k] ? ' checked' : '') + '><span class="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="tx">' + esc(L(x)) + '</span></label></li>'; }).join('') + '</ul></section>' +
      (st.general ? '<p class="hint">' + esc(t('generalNote')) + '</p>' : srcRow(st.src)) +
      '<div id="toolArea"></div>' +
      '<div class="actions row">' + (st.tool ? '<button type="button" class="btn quiet" id="toolBtn">' + esc(t(TOOL[st.tool])) + '</button>' : '') + (nextId ? '<a class="btn quiet" href="#/stage/' + nextId + '">' + esc(t('nextStage', { s: L(C.STAGES[nextId].label) })) + '</a>' : '<a class="btn quiet" href="#/stages">' + esc(t('allSteps')) + '</a>') + '</div>');
    s.querySelector('.ticks').addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      if (e.target.checked) state.done[k] = true; else delete state.done[k];
      save(); s.querySelector('#prog').textContent = t('doneOf', stats(id)); log('tick', k + (e.target.checked ? ' on' : ' off'));
    });
    var tb = s.querySelector('#toolBtn');
    if (tb) tb.addEventListener('click', function () {
      var area = s.querySelector('#toolArea');
      if (st.tool === 'reply') { var sit = { td: 'denied', tl: 'low', ts: 'quiet', sm: 'smoke' }[id] || 'other'; state.draft = { sit: sit }; save(); return go('#/ask/' + sit); }
      tb.hidden = true;
      if (st.tool === 'dates') datesTool(area); else if (st.tool === 'log') logTool(area, true); else if (st.tool === 'inventory') invTool(area);
    });
  }
  function datesTool(area) {
    area.innerHTML = '<section class="block tool"><div class="field"><label class="lbl" for="dIn">' + esc(t('datesLbl')) + '</label><input type="date" id="dIn"></div><button type="button" class="btn quiet" id="dGo">' + esc(t('datesBuild')) + '</button><div id="dOut"></div></section>';
    area.querySelector('#dGo').addEventListener('click', function () {
      var v = area.querySelector('#dIn').value; if (!v) { area.querySelector('#dIn').focus(); return; }
      var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]), ack = new Date(d.getTime()); ack.setDate(ack.getDate() + 15);
      var T3 = function (a, b, c) { return state.lang === 'es' ? b : state.lang === 'zh' ? c : a; };
      var lines = [
        fmt(T3('Reported: {d}.', 'Reportado: {d}.', '报案日期：{d}。'), { d: niceDate(d) }),
        fmt(T3('Your insurer should acknowledge the claim and begin investigating by {d} (15 days after notice).', 'Su aseguradora debe acusar recibo del reclamo y comenzar a investigar a más tardar el {d} (15 días después del aviso).', '保险公司应在 {d} 前（通知后 15 天内）确认理赔并开始调查。'), { d: niceDate(ack) }),
        T3('Once you send proof of claim, it should accept or deny within 40 days. Write down the day you send it and add 40 days.', 'Una vez que envíe la prueba del reclamo, debe aceptarlo o rechazarlo en un plazo de 40 días. Anote el día en que la envíe y sume 40 días.', '您提交理赔证明后，保险公司应在 40 天内接受或拒绝。请记下提交日期，再加 40 天。')];
      if (isRent()) lines.push(T3('Living expenses: renters policies often pay only until you can move back or have had a reasonable time to find a rental. Ask your insurer in writing for your end date.', 'Gastos de vida: las pólizas de inquilinos suelen pagar solo hasta que usted pueda volver o haya tenido un tiempo razonable para encontrar un alquiler. Pida por escrito a su aseguradora su fecha final.', '生活费用：租客保险通常只赔到您能搬回去，或已有合理时间另找住处为止。请书面向保险公司询问截止日期。'));
      else { lines.push(T3('Replacement cost: at least 36 months from your first actual cash value payment.', 'Costo de reposición: al menos 36 meses desde su primer pago de valor real en efectivo.', '重置成本：自第一笔实际现金价值赔付起至少 36 个月。')); lines.push(T3('Living expenses: at least 24 months after a state of emergency, plus extensions. Check your policy limits.', 'Gastos de vida: al menos 24 meses después de un estado de emergencia, más prórrogas. Revise los límites de su póliza.', '生活费用：紧急状态宣布后至少 24 个月，另有延期。请核对保单额度。')); }
      state.plan = t('dates') + '\n' + lines.join('\n') + '\n' + t('datesNote'); save(); log('dates built');
      area.querySelector('#dOut').innerHTML = '<ol class="nums">' + lines.map(function (l) { return '<li><span>' + esc(l) + '</span></li>'; }).join('') + '</ol><p class="hint">' + esc(t('datesNote')) + '</p>' + srcRow(isRent() ? [10, 11] : [1, 10]);
    });
  }
  function logTool(area, inStage) {
    area.innerHTML = '<section class="block tool"><h2>' + esc(t('log')) + '</h2><p class="hint">' + esc(t('logSub')) + '</p>' +
      '<div class="two"><div class="field"><label class="lbl" for="lgD">' + esc(t('logDate')) + '</label><input type="date" id="lgD" value="' + today() + '"></div><div class="field"><label class="lbl" for="lgW">' + esc(t('logWho')) + '</label><input type="text" id="lgW" maxlength="80"></div></div>' +
      '<div class="field"><label class="lbl" for="lgS">' + esc(t('logWhat')) + '</label><input type="text" id="lgS" maxlength="200"></div><button type="button" class="btn quiet" id="lgAdd">' + esc(t('logAdd')) + '</button><ul class="loglist" id="lgList"></ul></section>';
    function paint() { var ul = area.querySelector('#lgList'); ul.innerHTML = state.contacts.length ? state.contacts.slice(0, inStage ? 5 : 50).map(function (c) { return '<li><span class="ld">' + esc(c.d) + '</span><span><b>' + esc(c.w) + '</b> ' + esc(c.s) + '</span></li>'; }).join('') : '<li class="empty">' + esc(t('noLog')) + '</li>'; }
    paint();
    area.querySelector('#lgAdd').addEventListener('click', function () {
      var w = area.querySelector('#lgW').value.trim(), s = area.querySelector('#lgS').value.trim();
      if (!w && !s) { area.querySelector('#lgW').focus(); return; }
      state.contacts.unshift({ d: area.querySelector('#lgD').value || today(), w: w || '-', s: s || '-' }); save(); log('contact logged');
      area.querySelector('#lgW').value = ''; area.querySelector('#lgS').value = ''; paint();
    });
  }
  function invTool(area) {
    var items = [];
    area.innerHTML = '<section class="block tool"><p class="hint">' + esc(t('invNote')) + '</p><div class="inv"><input type="text" id="iR" placeholder="' + esc(t('invRoom')) + '" aria-label="' + esc(t('invRoom')) + '"><input type="text" id="iI" placeholder="' + esc(t('invItem')) + '" aria-label="' + esc(t('invItem')) + '"><input type="number" id="iV" min="0" placeholder="' + esc(t('invVal')) + '" aria-label="' + esc(t('invVal')) + '"><button type="button" class="btn quiet" id="iAdd">' + esc(t('invAdd')) + '</button></div><ul class="loglist" id="iList"></ul><p id="iTot" class="hint"></p><button type="button" class="btn quiet" id="iCopy">' + esc(t('invCopy')) + '</button></section>';
    area.querySelector('#iAdd').addEventListener('click', function () {
      var r = area.querySelector('#iR').value.trim(), i = area.querySelector('#iI').value.trim(), v = parseFloat(area.querySelector('#iV').value) || 0;
      if (!i) { area.querySelector('#iI').focus(); return; }
      items.push({ r: r || t('invRoom'), i: i, v: v }); area.querySelector('#iI').value = ''; area.querySelector('#iV').value = ''; area.querySelector('#iI').focus();
      area.querySelector('#iList').innerHTML = items.map(function (x) { return '<li><span>' + esc(x.r) + '</span><span><b>' + esc(x.i) + '</b> $' + x.v.toLocaleString() + '</span></li>'; }).join('');
      area.querySelector('#iTot').textContent = t('invTot', { n: items.length, t: items.reduce(function (a, b) { return a + b.v; }, 0).toLocaleString() });
    });
    area.querySelector('#iCopy').addEventListener('click', function () {
      var csv = 'Room,Item,Estimated value\n' + items.map(function (x) { return '"' + x.r.replace(/"/g, '""') + '","' + x.i.replace(/"/g, '""') + '",' + x.v; }).join('\n');
      copyText(csv, function () { toast(t('copied').split('.')[0] + '.'); });
    });
  }

  /* ---------- my claim: letters, the log, ticks and dates ---------- */
  function claimSummary() {
    var lines = [t('claimTitle'), (state.role ? t(state.role) : ''), state.who === 'other' ? (state.whoName || '') : ''];
    var order = (isRent() ? C.RENT_LIST : C.OWN_LIST).concat(['td', 'tl', 'ts']);
    order.forEach(function (id) { var p = stats(id); if (p.d) lines.push('- ' + L(C.STAGES[id].label) + ': ' + p.d + '/' + p.n); });
    if (state.letters.length) { lines.push('', t('letters') + ':'); state.letters.forEach(function (l) { lines.push('  ' + l.d + ' | ' + l.sub + (l.sent ? ' | ' + t('sentOn') : '')); }); }
    if (state.contacts.length) { lines.push('', t('log') + ':'); state.contacts.forEach(function (c) { lines.push('  ' + c.d + ' | ' + c.w + ' | ' + c.s); }); }
    if (state.plan) lines.push('', state.plan);
    return lines.filter(function (x, i) { return x !== '' || i > 2; }).join('\n');
  }
  function vClaim() {
    var started = (isRent() ? C.RENT_LIST : C.OWN_LIST).concat(['td', 'tl', 'ts']).filter(function (id) { return stats(id).d; });
    var s = screen('claim', head(0, t('claimTitle'), t('claimSub'), '') +
      '<section class="block"><h2>' + esc(t('letters')) + '</h2><ul class="letters" id="letterList"></ul></section>' +
      '<div id="logArea"></div>' +
      '<section class="block"><h2>' + esc(t('progress')) + '</h2>' + (started.length ? '<ul class="stagelist">' + started.map(function (id) { return stageRow(id, 0); }).join('') + '</ul>' : '<p class="empty">' + esc(t('noProgress')) + ' <a href="#/stages">' + esc(t('navStages')) + '</a></p>') + '</section>' +
      (state.plan ? '<section class="block"><h2>' + esc(t('dates')) + '</h2><pre class="plan">' + esc(state.plan) + '</pre></section>' : '') +
      '<div class="actions"><button type="button" class="btn quiet" id="sumBtn">' + esc(t('copySummary')) + '</button></div>');
    function paintLetters() {
      var ul = s.querySelector('#letterList');
      if (!state.letters.length) { ul.innerHTML = '<li class="empty">' + esc(t('noLetters')) + ' <a href="#/start">' + esc(t('navLetter')) + '</a></li>'; return; }
      ul.innerHTML = state.letters.map(function (l, i) {
        return '<li><details><summary><span class="lt"><b>' + esc(l.sub) + '</b><small>' + esc(l.sent ? t('sentOn') + ' ' + (l.sentOn || l.d) : l.d + ', ' + t('notSent')) + '</small></span></summary>' +
          '<pre class="letterview">' + esc(l.text) + '</pre><div class="row"><button type="button" class="btn quiet" data-a="copy" data-i="' + i + '">' + esc(t('copyShort')) + '</button>' + (l.sent ? '' : '<button type="button" class="btn quiet" data-a="sent" data-i="' + i + '">' + esc(t('markSent')) + '</button>') + '<button type="button" class="btn quiet" data-a="del" data-i="' + i + '">' + esc(t('del')) + '</button></div></details></li>';
      }).join('');
    }
    paintLetters();
    s.querySelector('#letterList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var i = +b.getAttribute('data-i'), l = state.letters[i], a = b.getAttribute('data-a'); if (!l) return;
      if (a === 'copy') copyText(l.text, function () { toast(t('copied')); });
      if (a === 'sent') { markSent(l); vClaim(); }
      if (a === 'del') { if (b.getAttribute('data-arm')) { state.letters.splice(i, 1); save(); paintLetters(); } else { b.setAttribute('data-arm', '1'); b.textContent = t('delSure'); } }
    });
    logTool(s.querySelector('#logArea'), false);
    s.querySelector('#sumBtn').addEventListener('click', function () { copyText(claimSummary(), function () { toast(t('summaryCopied')); }); });
  }

  /* ---------- help: real public lines, no pretend person ---------- */
  function vHelp() {
    var row = function (txt, src) { return '<li>' + txt + (src ? srcRow(src) : '') + '</li>'; };
    var s = screen('help', head(0, t('helpTitle'), t('helpLead'), '') +
      '<details class="group" open><summary><h2>' + esc(t('hInsTitle')) + '</h2></summary><ul class="helplist">' +
        row('<p class="big">' + tel('1-800-927-4357') + '</p><p>' + esc(t('hCdi')) + '</p>', [2]) + row('<p>' + esc(t('hComplaint')) + '</p>', [6]) + row('<p>' + esc(t('hLac')) + '</p>', [2]) + row('<p>' + esc(t('hUp')) + '</p>', [12]) + '</ul></details>' +
      '<details class="group"><summary><h2>' + esc(t('hHouseTitle')) + '</h2></summary><ul class="helplist">' +
        row('<p class="big">' + tel('1-800-621-3362') + '</p><p>' + esc(t('hFema')) + '</p>', [4, 5]) + row('<p>' + esc(t('hStay')) + '</p>', [11]) + row('<p>' + esc(t('hAdvance')) + '</p>', [1]) + row('<p>' + esc(t('hTemp')) + '</p>', [14]) + '</ul></details>' +
      '<details class="group"><summary><h2>' + esc(t('hHireTitle')) + '</h2></summary><ul class="helplist">' +
        row('<p>' + t('hAdj', { tel: tel('1-800-927-4357') }) + '</p>', [2]) + row('<p>' + t('hCslb', { tel: tel('1-800-321-2752') }) + '</p>', [3]) + (isRent() ? row('<p>' + esc(t('hTenant')) + '</p>', [13]) : '') + '</ul></details>' +
      '<details class="group"><summary><h2>' + esc(t('hOverTitle')) + '</h2></summary><ul class="helplist">' +
        row('<p>' + esc(t('h911')) + ' ' + tel('911') + '.</p>') + row('<p>' + esc(t('h988')) + ' ' + tel('988') + '.</p>') + row('<p>' + esc(t('hWait')) + '</p><p><a class="go" href="#/breathe">' + esc(t('navBreathe')) + ' →</a></p>') + '</ul></details>');
    return s;
  }

  /* ---------- breathing: a soft aura that grows and settles ---------- */
  var breathTimer = null;
  function stopBreath() { clearTimeout(breathTimer); breathTimer = null; }
  function vBreathe() {
    var s = screen('breathe', head(0, t('breatheTitle'), t('breatheLead'), '') +
      '<div class="aura" id="aura" data-phase="rest" aria-hidden="true"><div class="glow"></div><div class="core"></div></div>' +
      '<p class="bword" id="bword" aria-live="polite">&nbsp;</p><p class="bcount" id="bcount" aria-hidden="true">&nbsp;</p>' +
      '<div class="actions center"><button type="button" class="btn" id="bBtn">' + esc(t('bStart')) + '</button></div>');
    var aura = s.querySelector('#aura'), word = s.querySelector('#bword'), cnt = s.querySelector('#bcount'), btn = s.querySelector('#bBtn');
    var phases = [['in', 'bIn'], ['holdin', 'bHold'], ['out', 'bOut'], ['holdout', 'bHold']];
    function run() {
      var pi = 0, cyc = 0, sec = 4; btn.textContent = t('bStop'); log('breathing', 'started');
      function tick() {
        if (sec === 4) { aura.setAttribute('data-phase', phases[pi][0]); word.textContent = t(phases[pi][1]); }
        cnt.textContent = sec;
        breathTimer = setTimeout(function () {
          sec--;
          if (sec === 0) { sec = 4; pi++; if (pi === 4) { pi = 0; cyc++; if (cyc === 4) { finish(); return; } } }
          tick();
        }, 1000);
      }
      tick();
    }
    function finish() { stopBreath(); aura.setAttribute('data-phase', 'rest'); word.textContent = t('bDone'); cnt.innerHTML = '&nbsp;'; btn.textContent = t('bAgain'); log('breathing', 'finished'); }
    btn.addEventListener('click', function () { if (breathTimer) { finish(); } else run(); });
  }

  /* ---------- one question, one answer (live, grounded in the sources, streamed) ---------- */
  var qHistory = [];
  function renderAnswer(text, partial) {
    var cited = [];
    var html = esc(text).replace(/\n/g, '<br>').replace(/\[(\d{1,2})\]/g, function (m, d) {
      var n = +d; if (!SOURCES[n]) return '';
      if (cited.indexOf(n) === -1) cited.push(n);
      return '<sup class="cite"><a href="' + esc(SOURCES[n].url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(SOURCES[n].title) + '">' + n + '</a></sup>';
    });
    cited.sort(function (a, b) { return a - b; });
    return html + (cited.length && !partial ? srcRow(cited) : '');
  }
  function apiStream(body, onText) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ stream: true }, body)) }).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (!r.ok || ct.indexOf('text/event-stream') === -1 || !r.body || !r.body.getReader) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'http_' + r.status); e.code = j.error || 'http_' + r.status; throw e; } return j; });
      }
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '', final = null;
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) { if (final) return final; var c = new Error('stream_cut'); c.code = 'stream_cut'; throw c; }
          buf += dec.decode(x.value, { stream: true });
          var i;
          while ((i = buf.indexOf('\n\n')) !== -1) {
            var chunk = buf.slice(0, i); buf = buf.slice(i + 2);
            chunk.split('\n').forEach(function (line) {
              if (line.indexOf('data:') !== 0) return;
              var j; try { j = JSON.parse(line.slice(5)); } catch (e) { return; }
              if (j.error) { var er = new Error(j.error); er.code = j.error; throw er; }
              if (j.done) final = j; else if (typeof j.t === 'string') onText(j.t);
            });
          }
          return pump();
        });
      }
      return pump().catch(function (e) { try { reader.cancel(); } catch (x) {} throw e; });
    });
  }
  var SIT_OF = { denied: 1, low: 1, quiet: 1, smoke: 1, other: 1 };
  function actionLink(a) {
    if (!a) return '';
    var x = a.arg;
    if (a.type === 'letter' || a.type === 'choices') { var sit = SIT_OF[x] ? x : ''; return '<a class="btn quiet" data-sit="' + sit + '" href="' + (sit ? '#/ask/' + sit : '#/start') + '">' + esc(t('navLetter')) + '</a>'; }
    if (a.type === 'stage') { var rid = isRent() && C.RENT_MAP[x] ? C.RENT_MAP[x] : x; if (!C.STAGES[rid]) return ''; return '<a class="btn quiet" href="#/stage/' + rid + '">' + esc(L(C.STAGES[rid].label)) + '</a>'; }
    if (a.type === 'help' || a.type === 'handoff') return '<a class="btn quiet" href="#/help">' + esc(t('navHelp')) + '</a>';
    if (a.type === 'words') return '<a class="btn quiet" href="#/words">' + esc(t('navWords')) + '</a>';
    if (a.type === 'breathe') return '<a class="btn quiet" href="#/breathe">' + esc(t('navBreathe')) + '</a>';
    if (a.type === 'dates') return '<a class="btn quiet" href="#/stage/' + (isRent() ? 'r2' : 's2') + '">' + esc(t('toolDates')) + '</a>';
    if (a.type === 'log') return '<a class="btn quiet" href="#/claim">' + esc(t('toolLog')) + '</a>';
    if (a.type === 'inventory') return '<a class="btn quiet" href="#/stage/' + (isRent() ? 'r3' : 's3') + '">' + esc(t('toolInv')) + '</a>';
    return '';
  }
  function offline(txt, code) {
    var x = txt.toLowerCase(), links = [];
    if (/(smoke|ash|soot|humo|ceniza|烟|灰)/.test(x)) links.push('<a class="btn quiet" href="#/stage/sm">' + esc(L(C.STAGES.sm.label)) + '</a>');
    if (/(denied|deny|rechaz|拒)/.test(x)) links.push('<a class="btn quiet" href="#/ask/denied">' + esc(t('navLetter')) + '</a>');
    else if (/(offer|low|oferta|少)/.test(x)) links.push('<a class="btn quiet" href="#/ask/low">' + esc(t('navLetter')) + '</a>');
    else if (/(respond|answer|quiet|ghost|responde|回复)/.test(x)) links.push('<a class="btn quiet" href="#/ask/quiet">' + esc(t('navLetter')) + '</a>');
    if (/(word|deductible|ale|depreciat|deducible|术语|免赔)/.test(x)) links.push('<a class="btn quiet" href="#/words">' + esc(t('navWords')) + '</a>');
    if (/(stay|hotel|housing|fema|quedar|vivienda|住)/.test(x)) links.push('<a class="btn quiet" href="#/help">' + esc(t('navHelp')) + '</a>');
    links.push('<a class="btn quiet" href="#/stages">' + esc(t('navStages')) + '</a>');
    return '<p>' + esc(t(code === 'quota' ? 'qQuota' : 'qDown')) + '</p><div class="row">' + links.slice(0, 3).join('') + '</div>';
  }
  var HUMAN_RE = /(talk to|speak to|real person|a person|human|call me|hablar con|persona real|una persona|humano|真人|人工)/i;
  var INSURER_RE = /(state farm|allstate|progressive|farmers|mercury|geico|liberty mutual|usaa|chubb|travelers|nationwide|american family|safeco|hartford|fair plan)/i;
  function vQuestion() {
    var s = screen('question', head(0, t('qTitle'), t('qLead'), '') +
      '<form id="qForm" class="qform" autocomplete="off"><label class="sr" for="qIn">' + esc(t('qTitle')) + '</label><textarea id="qIn" rows="3" maxlength="800" placeholder="' + esc(t('qPh')) + '"></textarea><div class="actions"><button type="submit" class="btn" id="qGo">' + esc(t('qAsk')) + '</button></div></form>' +
      '<div id="qOut" class="answer" aria-live="polite" hidden></div><p class="hint">' + esc(t('qNote')) + '</p>');
    var form = s.querySelector('#qForm'), inp = s.querySelector('#qIn'), out = s.querySelector('#qOut'), btn = s.querySelector('#qGo');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var txt = inp.value.trim(); if (!txt) { inp.focus(); return; }
      log('question', txt.length + ' chars');
      out.hidden = false; out.innerHTML = '<p class="asked">' + esc(txt) + '</p><div class="abody"><p class="wait small">…</p></div>';
      var body = out.querySelector('.abody');
      if (HUMAN_RE.test(txt)) { body.innerHTML = '<p>' + esc(t('qPerson')) + '</p><p class="big">' + tel('1-800-927-4357') + '</p><div class="row"><a class="btn quiet" href="#/help">' + esc(t('navHelp')) + '</a></div>'; return; }
      if (INSURER_RE.test(txt) && /(form|questionnaire|document|paperwork|require|need|portal|formulario|documento|表格|文件)/i.test(txt)) {
        body.innerHTML = '<p>' + esc(t('insurerNote')) + '</p><div class="row"><a class="btn quiet" href="#/ask/other">' + esc(t('navLetter')) + '</a></div>'; return;
      }
      if (Date.now() < aiUntil) { body.innerHTML = offline(txt, aiCode); return; }
      btn.disabled = true; out.setAttribute('aria-busy', 'true');
      var pending = null, raf = 0;
      function paint() { raf = 0; if (pending != null) body.innerHTML = '<p>' + renderAnswer(pending, true) + '</p>'; }
      var msgs = qHistory.slice(-4).concat([{ role: 'user', content: txt }]);
      apiStream({ mode: 'chat', lang: state.lang, role: state.role, who: state.who, whoName: state.whoName, stageLabel: '', stress: 'not asked', messages: msgs }, function (x) { pending = x; if (!raf) raf = requestAnimationFrame(paint); })
        .then(function (r) {
          if (raf) cancelAnimationFrame(raf);
          qHistory.push({ role: 'user', content: txt }, { role: 'assistant', content: r.text });
          body.innerHTML = '<p>' + renderAnswer(r.text, false) + '</p>' + (actionLink(r.action) ? '<div class="row">' + actionLink(r.action) + '</div>' : '');
          log('answered live', r.text.length + ' chars' + (r.action ? ', action ' + r.action.type : ''));
        })
        .catch(function (e) { if (raf) cancelAnimationFrame(raf); aiDown(e && e.code); body.innerHTML = offline(txt, aiCode); })
        .then(function () { btn.disabled = false; out.removeAttribute('aria-busy'); inp.value = ''; });
    });
  }

  function vWords() {
    var cites = [];
    var s = screen('words', head(0, t('wordsTitle'), t('wordsNote'), '#/stages') + '<dl class="words">' + C.WORDS.map(function (x) {
      var d = esc(L(x[1])).replace(/\s*\[(\d{1,2})\]/g, function (m, n) { if (SOURCES[+n] && cites.indexOf(+n) === -1) cites.push(+n); return ''; });
      return '<div><dt>' + esc(L(x[0])) + '</dt><dd>' + d + '</dd></div>';
    }).join('') + '</dl>' + srcRow(cites.sort(function (a, b) { return a - b; })));
    return s;
  }

  /* ---------- header, menu, language ---------- */
  var NAV = [['#/start', 'navLetter'], ['#/stages', 'navStages'], ['#/claim', 'navClaim'], ['#/question', 'navQuestion'], ['#/help', 'navHelp'], ['#/breathe', 'navBreathe']];
  var menu = document.getElementById('menu'), menuBtn = document.getElementById('menuBtn');
  function openMenu() { paintMenu(); menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); document.body.classList.add('menuopen'); document.getElementById('menuClose').focus(); }
  function closeMenu(noFocus) { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menuopen'); if (!noFocus) menuBtn.focus(); }
  function paintMenu() {
    document.getElementById('menuList').innerHTML = NAV.map(function (n) { return '<li><a href="' + n[0] + '"' + (location.hash.indexOf(n[0]) === 0 ? ' aria-current="page"' : '') + '>' + esc(t(n[1])) + (n[1] === 'navClaim' && state.letters.length ? ' <span class="count">' + state.letters.length + '</span>' : '') + '</a></li>'; }).join('');
    document.querySelectorAll('#langSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === state.lang ? 'true' : 'false'); });
    var th = window.nsTheme ? window.nsTheme.current() : 'light';
    document.getElementById('thLight').setAttribute('aria-pressed', th === 'light' ? 'true' : 'false');
    document.getElementById('thDark').setAttribute('aria-pressed', th === 'dark' ? 'true' : 'false');
  }
  menuBtn.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
  document.getElementById('menuClose').addEventListener('click', function () { closeMenu(); });
  menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(); if (e.target.closest('#menuList a')) closeMenu(true); });
  document.querySelectorAll('#langSeg button').forEach(function (b) { b.addEventListener('click', function () { state.lang = b.getAttribute('data-lang'); save(); log('language', state.lang); applyLang(); paintMenu(); route(); }); });
  document.querySelectorAll('#themeSeg button').forEach(function (b) { b.addEventListener('click', function () { var want = b.getAttribute('data-theme-set'); if (window.nsTheme.current() !== want) window.nsTheme.toggle(); log('theme', want); paintMenu(); }); });
  function updateClaimLink() {
    var a = document.getElementById('claimLink'), n = state.letters.length + state.contacts.length;
    a.hidden = !n; document.getElementById('claimCount').textContent = state.letters.length ? state.letters.length : '';
    document.getElementById('claimCount').setAttribute('aria-label', state.letters.length + ' ' + t('letters'));
  }
  function applyLang() {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang;
    document.getElementById('menuTx').textContent = t('menu'); document.getElementById('menuTitle').textContent = t('menu');
    document.getElementById('menuClose').setAttribute('aria-label', t('close'));
    document.getElementById('langLbl').textContent = t('language'); document.getElementById('themeLbl').textContent = t('theme');
    document.getElementById('thLight').textContent = t('light'); document.getElementById('thDark').textContent = t('dark');
    document.getElementById('claimLinkTx').textContent = t('navClaim');
    document.getElementById('fineTx').textContent = t('fine') + (state.lang !== 'en' ? ' ' + t('langDraft') : '');
    updateClaimLink();
  }

  /* ---------- routing: one screen at a time ---------- */
  function route() {
    stopBreath(); closeMenu(true);
    var h = location.hash.replace(/^#\/?/, ''), p = h.split('/'), name = p[0] || 'start';
    var R = { start: vStart, what: vWhat, more: vMore, ask: function () { vAsk(p[1]); }, notes: function () { vNotes(p[1]); }, letter: vLetter, stages: vStages, stage: function () { vStage(p[1]); }, claim: vClaim, help: vHelp, breathe: vBreathe, question: vQuestion, words: vWords };
    (R[name] || vStart)();
    document.body.setAttribute('data-screen', name);
    shownAt = Date.now();
    window.scrollTo(0, 0);
    var h1 = view.querySelector('h1'); if (h1 && routed) h1.focus({ preventScroll: true });
    routed = true;
  }
  var routed = false, shownAt = 0;
  window.addEventListener('hashchange', route);
  /* A quick double tap on a choice must not also pick whatever sits in the same spot on the next screen. */
  view.addEventListener('click', function (e) { if (e.detail > 1 && Date.now() - shownAt < 800 && e.target.closest('button, label, a')) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
    if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) { e.preventDefault(); var w = document.getElementById('logwrap'); w.hidden = !w.hidden; }
  });
  document.getElementById('copyLog').addEventListener('click', function () { copyText(events.join('\n'), function () {}); });

  applyLang();
  log('session started', 'lang ' + state.lang);
  fetch('/sources.json').then(function (r) { return r.json(); }).then(function (j) { SOURCES = j || {}; }).catch(function () { SOURCES = {}; }).then(function () { document.body.classList.add('ready'); route(); });
})();
