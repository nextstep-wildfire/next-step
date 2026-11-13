
(function () {
  var thread = document.getElementById('thread');
  var chips = document.getElementById('chips');
  var form = document.getElementById('form');
  var input = document.getElementById('input');
  var start = Date.now();
  var events = [];
  var KEY = 'next-step-v3'; var _nop = {};
  var state = { lang: 'en', who: 'me', whoName: '', chatId: null, role: null, chat: [], stage: null, stressAsked: false, stress: 'not asked', typed: [], steps: [], misses: 0, done: {}, seen: {}, contacts: [], letters: [], plan: null, touched: false, reporting: false, lastChips: null, loops: 0 };

  /* ---------- language ---------- */
  var LOCALES = { en: 'en-US', es: 'es-US', zh: 'zh-CN' };
  var LNAMES = { en: 'English', es: 'Español', zh: '中文' };
  function M(a, b, c) { return { en: a, es: b, zh: c }; }
  function L(o) { return typeof o === 'string' ? o : (o[state.lang] || o.en); }
  function T(a, b, c) { return state.lang === 'es' ? b : (state.lang === 'zh' ? c : a); }
  function fmtS(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }

  /* ---------- chats: each topic or person gets its own chat, saved on this device only ---------- */
  var STORE = 'next-step-v4';
  var store = { chats: [], cur: null };
  var CHAT_FIELDS = ['who', 'whoName', 'role', 'done', 'seen', 'contacts', 'letters', 'plan'];
  var MAX_CHATS = 12;
  function newId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function curChat() { for (var i = 0; i < store.chats.length; i++) if (store.chats[i].id === store.cur) return store.chats[i]; return null; }
  function resetChatState() {
    state.who = 'me'; state.whoName = ''; state.role = null; state.done = {}; state.seen = {}; state.contacts = []; state.letters = []; state.plan = null;
    state.chat = []; state.stage = null; state.typed = []; state.steps = []; state.misses = 0; state.stress = 'not asked'; state.stressAsked = false;
    state.touched = false; state.lastChips = null; state.loops = 0; state.reporting = false;
  }
  function applyChat(c) {
    resetChatState();
    state.who = c.who === 'other' || c.who === 'explore' ? c.who : 'me'; state.whoName = c.whoName || '';
    state.role = c.role === 'own' || c.role === 'rent' ? c.role : null;
    state.done = c.done || {}; state.seen = c.seen || {}; state.contacts = c.contacts || []; state.letters = c.letters || []; state.plan = c.plan || null;
    state.chat = (c.ai || []).slice(-12); state.chatId = c.id; state.touched = !!(c.tx && c.tx.length);
  }
  function snap() {
    var out = [];
    Array.prototype.forEach.call(thread.children, function (m) {
      if (!m.classList.contains('msg') || m.classList.contains('typing') || m.classList.contains('note') || m.classList.contains('home') || m.classList.contains('who')) return;
      if (m.querySelector('textarea, input')) return;
      var tx = (m.innerText || m.textContent || '').trim().replace(/\n{3,}/g, '\n\n').slice(0, 900);
      if (tx) out.push({ r: m.classList.contains('user') ? 'u' : 'b', t: tx });
    });
    return out.slice(-60);
  }
  function save() {
    try {
      var c = curChat();
      if (c) { CHAT_FIELDS.forEach(function (k) { c[k] = state[k]; }); c.ai = state.chat.slice(-12); c.tx = snap(); c.ts = Date.now(); }
      localStorage.setItem(STORE, JSON.stringify({ lang: state.lang, cur: store.cur, chats: store.chats }));
    } catch (e) {}
  }
  (function loadSaved() {
    var s = null, old = null;
    try { s = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    if (!s) { try { old = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} }
    if (s) {
      if (s.lang && LOCALES[s.lang]) state.lang = s.lang;
      if (Array.isArray(s.chats)) store.chats = s.chats; store.cur = s.cur || null;
    } else if (old) {
      if (old.lang && LOCALES[old.lang]) state.lang = old.lang;
      var has = (old.done && Object.keys(old.done).length) || (old.letters && old.letters.length) || (old.contacts && old.contacts.length) || old.plan;
      if (has) { var m = { id: newId(), who: 'me', whoName: '', role: old.role, done: old.done || {}, seen: old.seen || {}, contacts: old.contacts || [], letters: old.letters || [], plan: old.plan || null, ai: [], tx: [], ts: Date.now() }; store.chats.push(m); store.cur = m.id; }
    } else { var nl = (navigator.language || 'en').toLowerCase(); if (nl.indexOf('es') === 0) state.lang = 'es'; else if (nl.indexOf('zh') === 0) state.lang = 'zh'; }
    var q = /[?&]lang=(en|es|zh)\b/.exec(location.search); if (q) state.lang = q[1];
    var c = curChat(); if (c) applyChat(c); else store.cur = null;
  })();

  /* Sources: a small set of public pages, summarized in our own words. Answers may only use these notes. */
  var SOURCES = {"1": {"label": "CDI bulletin 2025-2", "url": "https://www.insurance.ca.gov/0250-insurers/0300-insurers/0200-bulletins/bulletin-notices-commiss-opinion/upload/Bulletin-2025-2-Wildfire-Consumer-Protections-and-Advanced-Payments.pdf", "title": "California Department of Insurance, Bulletin 2025-2, wildfire consumer protections", "notes": "For a covered total loss in a state of emergency: if you ask, your insurer must advance at least four months of additional living expenses (ALE), with more paid on proof afterward. The FAIR Plan uses the term Fair Rental Value with the same four-month advance. For a furnished primary home that is a total loss, insurers must offer a contents payment of at least 30% of the dwelling limit, up to $250,000, without an itemized inventory; you can claim more later up to your contents limit. ALE lasts at least 24 months after a state of emergency, plus 12 months if rebuilding is delayed by circumstances beyond your control, plus six-month extensions for good cause, though dollar limits in the policy may run out first. If you rebuild or buy elsewhere you are owed the benefits you would have received rebuilding at the original site, capped at the cost to rebuild there, and the insurer cannot deduct land value. You have at least 36 months from the first actual cash value payment to collect full replacement cost, with six-month extensions for good cause. If the dwelling limit is not enough to rebuild, you may combine dwelling and other-structure limits up to the aggregate limit. After a total loss the insurer must offer to renew for at least the next two renewal periods."}, "2": {"label": "CDI wildfire page", "url": "https://www.insurance.ca.gov/01-consumers/140-catastrophes/WildfireResources.cfm", "title": "California Department of Insurance, wildfire resources", "notes": "Start by contacting your insurance company or agent and work with your adjuster toward a settlement you believe is fair and matches your coverage. If you are considering a public adjuster, take your time and check that the person is licensed and in good standing. The department has a tool to search for a residential policy after a declared disaster. A one-year moratorium on non-renewals applies to wildfire-affected policyholders. For questions about your insurance or a dispute with your insurer, call the department hotline at 1-800-927-4357 or use its hotline chat. Local Assistance Centers offer in-person help."}, "3": {"label": "CDI smoke damage order", "url": "https://www.insurance.ca.gov/0400-news/0100-press-releases/2025/release023-2025.cfm", "title": "California Department of Insurance press release on smoke damage claims, March 7, 2025", "notes": "The Insurance Commissioner directed insurers to fully investigate all smoke damage claims and ensure fair payments, and not to deny them outright. People whose homes are uninhabitable, even without wildfire damage, could have coverage under ALE. For help call the department at 1-800-927-4357. To check a contractor’s license, the Contractors State License Board is at 1-800-321-2752 or cslb.ca.gov."}, "4": {"label": "FEMA", "url": "https://www.fema.gov/fact-sheet/fema-assistance-survivors-insurance-coverage", "title": "FEMA fact sheet, assistance for survivors with insurance coverage", "notes": "If you have insurance and want FEMA disaster assistance, file a claim with your insurance company first. By law FEMA cannot duplicate benefits for losses insurance covers, so FEMA can only help with needs insurance does not cover. When you apply you must tell FEMA about all your insurance coverage. You can apply at DisasterAssistance.gov, with the FEMA app, or by calling 1-800-621-3362, and you can upload documents to your account."}, "5": {"label": "Cal OES", "url": "https://www.news.caloes.ca.gov/what-to-do-if-your-property-is-damaged-or-destroyed-in-a-wildfire", "title": "Cal OES, what to do if your property is damaged or destroyed in a wildfire", "notes": "Contact your insurance company first, since insurance delivers the majority of financial help after disasters. For losses insurance does not cover, you can register for disaster assistance online at disasterassistance.gov, with the FEMA app, or by calling 800-621-3362."}, "6": {"label": "CDI complaints", "url": "https://www.insurance.ca.gov/0400-news/0102-alerts/2025/Commissioner-Lara-Launches-Investigation.cfm", "title": "California Department of Insurance alert urging wildfire survivors to file formal complaints", "notes": "The Insurance Commissioner urged wildfire survivors facing delayed payments, claim disputes, multiple adjusters, smoke damage problems or other issues to file a formal complaint with the department. The department said a formal complaint is needed for it to take action and advocate for consumers."}, "7": {"label": "Consumer Federation of America", "url": "https://americasaves.org/media/5mylvrzw/ca-wildfires-one-pager-insurance.pdf", "title": "Consumer Federation of America, California wildfire insurance one-pager", "notes": "Document the damage thoroughly with photos and videos, but only if it is safe. Do not enter unsafe areas. Keep damaged items until they have been documented."}, "8": {"label": "United Policyholders", "url": "https://uphelp.org/what-california-homeowners-should-know-about-filing-an-insurance-claim-for-fire-damage/", "title": "United Policyholders, filing an insurance claim for fire damage in California", "notes": "Fires that damage but do not completely destroy a home create their own claim issues. Watch for hidden damage from water, smoke, ash and mold."}, "9": {"label": "CDI SB 495 release", "url": "https://www.insurance.ca.gov/0400-news/0100-press-releases/2025/release067-2025.cfm", "title": "California Department of Insurance press release on SB 495, contents payments without a list", "notes": "Beginning January 2026, when a policyholder has a total loss in a declared emergency, insurance companies are required to pay 60 percent of personal property (contents) coverage limits, up to $350,000, without requiring a detailed inventory. Consumers can call 1-800-927-4357 with questions or use the department website or online chat."}, "10": {"label": "CDI claim rights", "url": "https://www.insurance.ca.gov/flipbook/AutoAccident/15", "title": "California Department of Insurance, your rights under the Fair Claims Settlement Practices Regulations", "notes": "Under California’s Fair Claims Settlement Practices Regulations, an insurer must acknowledge a claim within 15 calendar days and begin investigating, and must accept or deny the claim no later than 40 days after receiving proof of claim. The department’s booklet is written for auto claims, but it describes the duties these regulations place on insurers generally."}, "11": {"label": "CDI living expenses", "url": "https://www.insurance.ca.gov/0400-news/0102-alerts/2025/Insurance-coverage-for-additional-living.cfm", "title": "California Department of Insurance, insurance coverage for additional living expenses if the home is not habitable due to a wildfire", "notes": "Additional living expense (ALE), also called loss of use or fair rental value, covers extra costs when a home is not safe to live in because of a covered peril such as wildfire. Keep bills and receipts for relocation costs such as hotel, clothing and food. Most renters insurance policies cover ALE only until you can move back or have had a reasonable time to find a rental elsewhere, whichever is less, so renters may not get the full length of time that homeowners get. Even a home with no damage may qualify if hazards make it unsafe and the policy provides ALE. For smoke and ash toxins from neighboring properties, the policyholder may need to show the home is uninhabitable, and the insurer should investigate and test."}, "12": {"label": "United Policyholders wildfire page", "url": "https://uphelp.org/disaster-recovery-help/2025cawildfires/", "title": "United Policyholders, 2025 California wildfires insurance claim and recovery help", "notes": "United Policyholders’ page for the 2025 California wildfires collects orientation videos, a guide to reading your policy, videos on living-expense coverage for total losses and for standing homes, sample letters to request information about living-expense benefits and to request extensions, renters insurance claim tips for California, an insurance accounting spreadsheet, and a guide to speaking up when communicating with your insurer. It advises asking for the advance payments in writing; email counts."}, "13": {"label": "LA County tenant guide", "url": "https://dcba.lacounty.gov/after-the-disaster-information-for-landlords-and-tenants/", "title": "Los Angeles County Department of Consumer and Business Affairs, after the disaster, information for landlords and tenants", "notes": "If a rental unit is completely destroyed in a disaster, the lease no longer applies, rent is no longer owed and the landlord need not provide housing; the landlord must return prepaid rent and refund the security deposit under California law. If a unit is only partly destroyed and cannot be lived in, the tenant may choose to end or continue the lease depending on the circumstances, and should get legal advice from an attorney before stopping rent payments. Every situation is different."}, "14": {"label": "FEMA rental assistance", "url": "https://www.fema.gov/fact-sheet/apply-fema-rental-assistance", "title": "FEMA, apply for rental assistance after the Los Angeles County wildfires", "notes": "FEMA may help with temporary housing if a homeowner or renter is displaced from their primary residence by the Los Angeles County wildfires. Transitional Sheltering Assistance gives short-term hotel stays. Rental Assistance continues help afterward and can cover monthly rent, which may include a security deposit. You must show an ongoing need and keep rent receipts for three years. Apply at DisasterAssistance.gov, with the FEMA app, by phone at 800-621-3362, or at a Disaster Recovery Center. The original application deadline for the January 2025 fires has passed, so ask FEMA whether you can still apply or appeal."}, "15": {"label": "CDI renters guide", "url": "https://www.insurance.ca.gov/01-consumers/105-type/95-guides/03-res/res-ins-guide.cfm", "title": "California Department of Insurance, residential insurance guide for homeowners and renters", "notes": "A renters policy covers your own belongings (personal property) and loss of use, plus liability and medical payments to others. Your landlord’s insurance does not cover your belongings. Loss of use on a renters policy is commonly about 20% of the personal property limit. When setting a belongings limit, include everyday items such as small appliances, kitchen items, linens, window coverings, clothing and shoes."}};
  /* ---------- v3 interface text (English, Spanish, Chinese) ---------- */
  var I = {
    homeTitle: ['Where are you with your claim?', '¿En qué punto está de su reclamo?', '您的理赔目前进行到哪一步？'],
    homeSub: ['Two quick taps and I will show you where to start. Free guide for California wildfire homeowners and renters. General information, not legal advice.', 'Dos toques rápidos y le muestro por dónde empezar. Guía gratuita para propietarios e inquilinos afectados por incendios en California. Información general, no asesoría legal.', '点两下，我就告诉您从哪里开始。为受加州野火影响的房主和租客提供的免费指南。仅为一般信息，不构成法律建议。'],
    roleLabel: ['I am a', 'Soy', '我是'],
    role_own: ['Homeowner', 'Propietario(a)', '房主'],
    role_rent: ['Renter', 'Inquilino(a)', '租客'],
    role_unsure: ['Not sure', 'No estoy seguro(a)', '不确定'],
    homePrompt: ['What do you need help with?', '¿Con qué necesita ayuda?', '您需要什么帮助？'],
    c_start: ['I am just starting', 'Apenas empiezo', '我刚开始'],
    c_start_s: ['Not filed yet, or just filed', 'Aún no presento el reclamo, o acabo de hacerlo', '还没提交，或刚提交'],
    c_stay: ['I need a place to stay', 'Necesito dónde quedarme', '我需要住处'],
    c_stay_s: ['Hotel, rent and living costs', 'Hotel, renta y gastos de vida', '酒店、租金和生活费'],
    c_smoke: ['Smoke or ash damage', 'Daño por humo o ceniza', '烟灰损害'],
    c_smoke_s: ['My home is still standing', 'Mi vivienda sigue en pie', '房子还在'],
    c_words: ['Explain insurance words', 'Explicar términos de seguros', '解释保险术语'],
    c_words_s: ['Deductible, ALE, depreciation', 'Deducible, ALE, depreciación', '免赔额、ALE、折旧'],
    helpOther: ['Helping someone else, or just learning?', '¿Ayuda a otra persona, o solo se informa?', '在帮别人，或只是想了解？'],
    c_denied: ['They said no', 'Dijeron que no', '他们拒赔了'],
    c_denied_s: ['My claim was denied', 'Mi reclamo fue rechazado', '我的理赔被拒绝'],
    c_low: ['They offered less', 'Ofrecieron menos', '他们赔得太少'],
    c_low_s: ['The offer seems too low', 'La oferta parece demasiado baja', '赔付金额似乎太低'],
    c_quiet: ['They went quiet', 'Dejaron de responder', '他们不回复了'],
    c_quiet_s: ['No answer from my adjuster', 'Mi ajustador no responde', '理赔员没有回复'],
    homeMore: ['Or just tell me what happened in the box below. You can type anything, in any order.', 'O cuénteme qué pasó en el cuadro de abajo. Puede escribir lo que quiera, en el orden que quiera.', '也可以在下方的输入框里告诉我发生了什么。想写什么都可以，顺序不限。'],
    homeTime: ['Claims can take months. You do not have to do everything today.', 'Los reclamos pueden tardar meses. No tiene que hacerlo todo hoy.', '理赔可能要花几个月。您不必今天就做完所有事情。'],
    sample: ['Try a sample situation', 'Probar una situación de ejemplo', '试用一个示例情况'],
    sampleNotes: ['My adjuster has not answered my calls or emails for 7 weeks. I reported the claim in January and sent photos of the damage.', 'Mi ajustador no ha respondido a mis llamadas ni correos desde hace 7 semanas. Reporté el reclamo en enero y envié fotos de los daños.', '我的理赔员已经 7 周没有回复我的电话和邮件。我在一月报了案，也发送了损坏的照片。'],
    cSmoke: ['Smoke or ash, home still standing', 'Humo o ceniza, la vivienda sigue en pie', '房子还在，但有烟灰'],
    cStart: ['I am just starting my claim', 'Apenas empiezo mi reclamo', '我刚开始理赔'],
    cStay: ['I need a place to stay', 'Necesito dónde quedarme', '我需要住处'],
    cGov: ['Government help', 'Ayuda del gobierno', '政府援助'],
    cWords: ['Explain insurance words', 'Explicar términos de seguros', '解释保险术语'],
    cWalk: ['Walk me through my whole claim', 'Guíeme por todo mi reclamo', '带我走完整个理赔流程'],
    cUnsure: ['I am not sure', 'No estoy seguro(a)', '我不确定'],
    cPerson: ['Talk to a person', 'Hablar con una persona', '联系真人'],
    cWriteLetter: ['Write a letter to my insurer', 'Escribir una carta a mi aseguradora', '给保险公司写一封信'],
    whatNext: ['What would you like to do next?', '¿Qué le gustaría hacer ahora?', '接下来您想做什么？'],
    askIntro: ['Let us write one message with one clear ask. Rough notes are fine.', 'Escribamos un mensaje con una sola petición clara. Las notas aproximadas sirven.', '我们来写一条只有一个明确要求的信息。粗略的笔记就可以。'],
    askTitle_denied: ['Your insurer said no. What do you want to ask for?', 'Su aseguradora dijo que no. ¿Qué quiere pedir?', '保险公司拒赔了。您想提出什么要求？'],
    askTitle_low: ['The offer seems too low. What do you want to ask for?', 'La oferta parece demasiado baja. ¿Qué quiere pedir?', '赔付金额似乎太低。您想提出什么要求？'],
    askTitle_quiet: ['No answer. What do you want to ask for?', 'Sin respuesta. ¿Qué quiere pedir?', '没有回复。您想提出什么要求？'],
    askTitle_smoke: ['Smoke or ash in a standing home. What do you want to ask for?', 'Humo o ceniza en una vivienda en pie. ¿Qué quiere pedir?', '房子还在但有烟灰。您想提出什么要求？'],
    askTitle_other: ['What do you want to ask your insurer for?', '¿Qué quiere pedirle a su aseguradora?', '您想向保险公司提出什么要求？'],
    lblNotes: ['What happened, in your own words', 'Qué pasó, con sus propias palabras', '发生了什么（用您自己的话）'],
    phNotes_denied: ['Example: They denied my claim on Oct 3 and said the damage was not from the fire.', 'Ejemplo: Rechazaron mi reclamo el 3 de octubre y dijeron que el daño no fue por el incendio.', '例如：他们在 10 月 3 日拒赔，并说损坏不是火灾造成的。'],
    phNotes_low: ['Example: They offered $X, but my contractor quoted $Y for the same repairs.', 'Ejemplo: Ofrecieron $X, pero mi contratista cotizó $Y por las mismas reparaciones.', '例如：他们只赔 $X，但我的承包商对同样的维修报价 $Y。'],
    phNotes_quiet: ['Example: I sent photos in January and my adjuster has not answered my calls or emails for 7 weeks.', 'Ejemplo: Envié fotos en enero y mi ajustador no responde mis llamadas ni correos desde hace 7 semanas.', '例如：我 1 月提交了照片，理赔员 7 周来没有回复我的电话和邮件。'],
    phNotes_smoke: ['Example: My home is standing, but there is a smoke smell and ash inside, and no one has tested it.', 'Ejemplo: Mi vivienda sigue en pie, pero hay olor a humo y ceniza adentro, y nadie lo ha evaluado.', '例如：房子还在，但里面有烟味和灰，也没有人来检测。'],
    phNotes_other: ['Example: I need to ask my insurer a question about my claim.', 'Ejemplo: Necesito hacerle una pregunta a mi aseguradora sobre mi reclamo.', '例如：我需要就我的理赔向保险公司提一个问题。'],
    phNotes: ['Example: They denied my claim on Oct 3 and said the damage was not from the fire.', 'Ejemplo: Rechazaron mi reclamo el 3 de octubre y dijeron que el daño no fue por el incendio.', '例如：他们在 10 月 3 日拒赔，并说损坏不是火灾造成的。'],
    lblAsk: ['Pick the one thing to ask for', 'Elija lo único que quiere pedir', '选择您要提出的一个要求'],
    askOtherLabel: ['Something else (write it below)', 'Otra cosa (escríbala abajo)', '其他（请在下方填写）'],
    askOtherPh: ['What do you want them to do?', '¿Qué quiere que hagan?', '您希望他们做什么？'],
    lblPaste: ['Add the insurer’s message (optional)', 'Agregar el mensaje de la aseguradora (opcional)', '添加保险公司的来信（可选）'],
    phPaste: ['Paste the key lines from their letter or email', 'Pegue las líneas clave de su carta o correo', '粘贴来信或邮件中的关键内容'],
    lblDetails: ['Add your details (optional)', 'Agregar sus datos (opcional)', '添加您的信息（可选）'],
    phName: ['Your name', 'Su nombre', '您的姓名'],
    phClaim: ['Claim number', 'Número de reclamo', '理赔编号'],
    phInsurer: ['Insurance company', 'Aseguradora', '保险公司'],
    privNote: ['Please leave out Social Security and bank account numbers.', 'Por favor no incluya números de Seguro Social ni de cuentas bancarias.', '请不要填写社会安全号码或银行账号。'],
    writeLetter: ['Write my letter', 'Escribir mi carta', '生成我的信'],
    back: ['Back', 'Volver', '返回'],
    needOther: ['Please write what you want them to do.', 'Por favor escriba qué quiere que hagan.', '请写下您希望他们做什么。'],
    writing: ['Writing your letter', 'Escribiendo su carta', '正在写您的信'],
    letterTitle: ['Your letter', 'Su carta', '您的信'],
    letterNote: ['Draft only, in English so it is easy to send. General information, not legal advice. Check every detail and add your documents before you send it.', 'Solo es un borrador, en inglés para que sea fácil de enviar. Información general, no asesoría legal. Revise cada detalle y agregue sus documentos antes de enviarla.', '这只是草稿，用英文书写，方便发送。仅为一般信息，不构成法律建议。发送前请检查每个细节并附上您的文件。'],
    letterEditHint: ['You can edit the letter right here.', 'Puede editar la carta aquí mismo.', '您可以直接在这里修改这封信。'],
    fallbackNote: ['Live rewording is not available right now, so this is a standard template that uses your notes as written. Edit it before you send it.', 'La redacción en vivo no está disponible ahora, así que esta es una plantilla estándar que usa sus notas tal como están. Edítela antes de enviarla.', '实时润色功能暂时不可用，因此这是一个标准模板，直接使用了您的原话。发送前请修改。'],
    copyLetter: ['Copy letter', 'Copiar carta', '复制信件'],
    shorter: ['Make it shorter', 'Hacerla más corta', '改得更短'],
    changeAsk: ['Change my ask', 'Cambiar mi petición', '更改我的要求'],
    explainMsg: ['Explain their message in plain words', 'Explicar su mensaje en palabras sencillas', '用通俗的话解释他们的来信'],
    explainFail: ['The plain-words explanation is not available right now. You can still use your letter.', 'La explicación en palabras sencillas no está disponible ahora. Aun así puede usar su carta.', '通俗解释功能暂时不可用。您仍然可以使用这封信。'],
    copiedMsg: ['Copied. Paste it into an email so there is a record, and attach your documents.', 'Copiada. Péguela en un correo para que quede constancia y adjunte sus documentos.', '已复制。请粘贴到电子邮件中以留下记录，并附上您的文件。'],
    copyFail: ['Your browser blocked copying. Select the letter and copy it by hand.', 'Su navegador bloqueó la copia. Seleccione la carta y cópiela manualmente.', '浏览器阻止了复制。请选中信件后手动复制。'],
    logIt: ['Log that I sent it', 'Anotar que la envié', '记录我已发送'],
    whatsNext: ['What happens next?', '¿Qué sigue?', '接下来会怎样？'],
    writeAnother: ['Write another letter', 'Escribir otra carta', '再写一封信'],
    quotaNote: ['Live answers are paused for now (the free daily limit was reached). The guided steps and letter templates still work.', 'Las respuestas en vivo están en pausa por ahora (se alcanzó el límite diario gratuito). Los pasos guiados y las plantillas de carta siguen funcionando.', '实时回答暂时暂停（已达到每日免费额度）。引导步骤和信件模板仍可使用。'],
    liveDown: ['Live answers are not available right now. The guided steps and letter templates still work.', 'Las respuestas en vivo no están disponibles ahora. Los pasos guiados y las plantillas de carta siguen funcionando.', '实时回答暂时不可用。引导步骤和信件模板仍可使用。'],
    official: ['Official help', 'Ayuda oficial', '官方帮助'],
    newChat: ['New chat', 'Nuevo chat', '新对话'],
    newChatNote: ['Started a new chat. Your checklist, letters and log are still saved on this device.', 'Se inició un chat nuevo. Su lista, cartas y registro siguen guardados en este dispositivo.', '已开始新对话。您的清单、信件和记录仍保存在此设备上。'],
    myClaim: ['My claim', 'Mi reclamo', '我的理赔'],
    dSub: ['Saved on this device only. Nothing is sent anywhere.', 'Se guarda solo en este dispositivo. No se envía nada.', '仅保存在此设备上，不会发送到任何地方。'],
    secChecklist: ['Checklist and notes', 'Lista y notas', '清单和笔记'],
    secLog: ['Contact log', 'Registro de contactos', '联系记录'],
    secLetters: ['My letters', 'Mis cartas', '我的信件'],
    secDates: ['Key dates', 'Fechas clave', '关键日期'],
    none: ['Nothing yet.', 'Todavía nada.', '暂无。'],
    notesPh: ['Notes for this stage (saved on this device)', 'Notas para esta etapa (se guardan en este dispositivo)', '此阶段的笔记（保存在此设备上）'],
    copySummary: ['Copy my claim summary', 'Copiar el resumen de mi reclamo', '复制我的理赔摘要'],
    copied: ['Copied', 'Copiado', '已复制'],
    copyAgain: ['Copy', 'Copiar', '复制'],
    del: ['Delete', 'Eliminar', '删除'],
    openInChat: ['Open in chat', 'Abrir en el chat', '在聊天中打开'],
    close: ['Close', 'Cerrar', '关闭'],
    yes: ['Yes', 'Sí', '是'],
    notNow: ['Not now', 'Ahora no', '暂时不用'],
    hoQ: ['Do you want to talk to a real person?', '¿Quiere hablar con una persona real?', '您想联系真人吗？'],
    hoKind: ['What do you need help with most?', '¿Con qué necesita más ayuda?', '您最需要哪方面的帮助？'],
    k_ins: ['My insurance claim', 'Mi reclamo de seguro', '我的保险理赔'],
    k_house: ['Housing or government aid', 'Vivienda o ayuda del gobierno', '住房或政府援助'],
    k_over: ['I feel overwhelmed', 'Me siento abrumado(a)', '我感到不堪重负'],
    hoDemo: ['In a full version, a helper would follow up with you. That part is not built yet, and nothing was sent. Here is who you can contact today.', 'En una versión completa, una persona le daría seguimiento. Esa parte aún no está construida y no se envió nada. Estas son las personas con quienes puede comunicarse hoy.', '在正式版本中，会有协助人员跟进。这部分尚未开发，也没有发送任何内容。以下是您今天就可以联系的渠道。'],
    hoSummary: ['A short summary you can read to them', 'Un resumen corto que puede leerles', '可以念给对方听的简短摘要'],
    copySummaryShort: ['Copy summary', 'Copiar resumen', '复制摘要'],
    hoEmerg: ['If you are in danger, call 911. For emotional support, call or text 988.', 'Si está en peligro, llame al 911. Para apoyo emocional, llame o envíe un mensaje de texto al 988.', '如果您身处危险，请拨打 911。需要情绪支持，请致电或发短信至 988。'],
    breatheOffer: ['A one-minute breathing reset', 'Una pausa de respiración de un minuto', '一分钟呼吸放松'],
    govTitle: ['Official and government help', 'Ayuda oficial y del gobierno', '官方和政府援助'],
    stayTitle: ['If you need a place to stay', 'Si necesita dónde quedarse', '如果您需要住处'],
    wordsTitle: ['Insurance words in plain language', 'Términos de seguros en lenguaje sencillo', '用通俗语言解释保险术语'],
    wordsNote: ['General definitions with example numbers only. Your policy controls. Ask your insurer in writing.', 'Definiciones generales con cifras de ejemplo. Su póliza es la que rige. Pregunte por escrito a su aseguradora.', '一般性定义，数字仅为示例。以您的保单为准。请以书面形式询问保险公司。'],
    insurerNote: ['I do not have verified, insurer-specific forms or questionnaires yet. The most reliable way is to ask that insurer in writing for its list of required documents and forms. I can write that letter for you.', 'Aún no tengo formularios ni cuestionarios verificados de cada aseguradora. Lo más confiable es pedir por escrito a esa aseguradora su lista de documentos y formularios requeridos. Puedo escribir esa carta por usted.', '我目前还没有经过核实的各保险公司专属表格或问卷。最可靠的办法是以书面形式向该保险公司索取所需文件和表格的清单。我可以帮您写这封信。'],
    askNeeds: ['Please list in writing the documents, forms and information you need from me to process my claim.', 'Por favor enumere por escrito los documentos, formularios e información que necesita de mí para procesar mi reclamo.', ''],
    soundsLike: ['That sounds like “{s}”. I can write you a letter with one clear ask, or show the steps.', 'Eso suena a “{s}”. Puedo escribirle una carta con una sola petición clara, o mostrarle los pasos.', '这听起来像“{s}”。我可以为您写一封只有一个明确要求的信，也可以显示相关步骤。'],
    showSteps: ['Show the steps', 'Mostrar los pasos', '显示步骤'],
    writeMyLetter: ['Write my letter', 'Escribir mi carta', '写我的信'],
    troubleQ: ['I am sorry you are dealing with this. What did your insurer do?', 'Lamento que esté pasando por esto. ¿Qué hizo su aseguradora?', '很抱歉您正在经历这些。保险公司做了什么？'],
    something: ['Something else', 'Otra cosa', '其他情况'],
    nextTimeline: ['Your insurer should acknowledge a claim within 15 days of notice, and accept or deny it within 40 days after proof of claim [10]. Put every request in writing and keep your own copies.', 'Su aseguradora debe acusar recibo del reclamo dentro de los 15 días siguientes al aviso, y aceptarlo o rechazarlo dentro de los 40 días posteriores a la prueba del reclamo [10]. Ponga cada solicitud por escrito y guarde sus propias copias.', '保险公司应在收到通知后 15 天内确认理赔，并在收到理赔证明后 40 天内接受或拒绝 [10]。请把每个请求都写成书面形式，并保留自己的副本。'],
    footer: ['Student Project from Fung Fellowship. Not legal or insurance advice.', 'Proyecto Estudiantil de Fung Fellowship. No es asesoría legal ni de seguros.', 'Fung Fellowship 学生项目。不构成法律或保险建议。'],
    reportBtn: ['Report a problem', 'Informar de un problema', '报告问题'],
    msgPh: ['Tell me what happened…', 'Cuénteme qué pasó…', '告诉我发生了什么……'],
    send: ['Send', 'Enviar', '发送'],
    langChanged: ['Language changed to English. Earlier messages stay as they were.', 'Idioma cambiado a español. Los mensajes anteriores se quedan como estaban.', '语言已切换为中文。之前的消息保持原样。'],
    theme: ['Switch light or dark theme', 'Cambiar entre tema claro y oscuro', '切换浅色或深色主题'],
    languageWord: ['Language', 'Idioma', '语言'],
    stageNoteLbl: ['Survivor and professional accounts, not checked against official sources. Confirm with your insurer.', 'Relatos de sobrevivientes y profesionales, no verificados con fuentes oficiales. Confírmelo con su aseguradora.', '来自幸存者和专业人士的说法，尚未与官方来源核对。请向保险公司确认。'],
    summaryTitle: ['My claim summary', 'Resumen de mi reclamo', '我的理赔摘要'],
    sumNone: ['(none)', '(ninguno)', '（无）']
  };
  function t(k, v) {
    var a = I[k]; if (!a) return k;
    var s = state.lang === 'es' ? a[1] : (state.lang === 'zh' ? a[2] : a[0]);
    if (!s) s = a[0];
    return fmtS(s, v);
  }
  /* The one ask for each situation. The English sentence goes in the letter, so it stays in English. */
  var ASKS = {
    denied: [
      ['a1', 'Please explain your decision in writing and name the policy sections it relies on.', M('Explain the decision in writing, with the policy sections', 'Explicar la decisión por escrito, con las secciones de la póliza', '书面解释该决定，并指明保单条款')],
      ['a2', 'Please send me the documents in my claim file, including the adjuster’s report, the estimate and the photos.', M('Send me my claim file documents', 'Enviarme los documentos de mi expediente', '把我的理赔档案文件发给我')],
      ['a3', 'Please review your decision again. I am sending documents that support my claim.', M('Review the decision again with my proof', 'Revisar la decisión de nuevo con mis pruebas', '结合我的证明重新审查该决定')]
    ],
    low: [
      ['a1', 'Please explain in writing how you calculated the offer, line by line, and what it does not include.', M('Show how the number was figured, line by line', 'Mostrar cómo se calculó la cifra, partida por partida', '逐项说明金额是怎么算出来的')],
      ['a2', 'Please review the contractor estimate(s) I am sending with this letter and tell me in writing what differs from your estimate.', M('Review my contractor estimate', 'Revisar el presupuesto de mi contratista', '审查我的承包商报价')],
      ['a3', 'Please confirm in writing the policy limits that apply to my dwelling, belongings and living expenses.', M('Confirm my policy limits', 'Confirmar los límites de mi póliza', '确认我的保单额度')]
    ],
    quiet: [
      ['a1', 'Please send me a written update on my claim status and the next step.', M('Send me a written status update', 'Enviarme una actualización escrita del estado', '给我一份书面的理赔进度说明')],
      ['a2', 'Please have a claims supervisor review my claim and contact me.', M('Ask for a claims supervisor', 'Pedir un supervisor de reclamos', '要求理赔主管介入')],
      ['a3', 'Please confirm in writing the deadlines that apply to my claim.', M('Confirm the deadlines', 'Confirmar los plazos', '确认适用的时限')]
    ],
    smoke: [
      ['a1', 'Please explain in writing how you will investigate the smoke and ash damage to my home, including any testing.', M('Explain in writing how you will investigate', 'Explicar por escrito cómo investigarán', '书面说明将如何调查')],
      ['a2', 'Please confirm in writing whether you will pay for testing of my home by a qualified professional, and what you need from me.', M('Will you pay for testing?', '¿Pagarán las pruebas?', '是否赔付检测费用？')]
    ],
    other: [
      ['a1', 'Please list in writing the documents, forms and information you need from me to process my claim.', M('List what you need from me to move my claim forward', 'Enumerar lo que necesitan de mí para avanzar mi reclamo', '列出推进我的理赔所需的材料')]
    ]
  };
  var SIT_LABEL = {
    denied: M('The insurer said no', 'La aseguradora dijo que no', '保险公司拒赔'),
    low: M('The offer seems too low', 'La oferta parece baja', '赔付金额太低'),
    quiet: M('The insurer went quiet', 'La aseguradora dejó de responder', '保险公司不回复'),
    smoke: M('Smoke or ash in a standing home', 'Humo o ceniza en una vivienda en pie', '房子还在但有烟灰'),
    other: M('Something else', 'Otra cosa', '其他情况')
  };
  var SIT_SUBJECT = {
    denied: 'Request for a written explanation of the claim decision',
    low: 'Request for a written explanation of the settlement offer',
    quiet: 'Request for a written update on my claim',
    smoke: 'Request for a written response on the smoke and ash investigation',
    other: 'Request regarding my claim'
  };
  var SIT_STAGE = { denied: 'td', low: 'tl', quiet: 'ts', smoke: 'sm', other: 's4' };

  /* ---------- stages (owner, renter, and the three "trouble" branches) ---------- */
  var STAGES = {
    s1: { src: [2, 4], label: M('The fire just happened', 'El incendio acaba de ocurrir', '火灾刚刚发生'),
      title: M('Report the loss to your insurer and get a claim number.', 'Reporte la pérdida a su aseguradora y obtenga un número de reclamo.', '向保险公司报告损失，并获取理赔编号。'),
      steps: [
        M('Call or use the app on your insurer’s claim line and write down the claim number, the date, and who you spoke to.', 'Llame a la línea de reclamos de su aseguradora o use su aplicación. Anote el número de reclamo, la fecha y con quién habló.', '致电保险公司的理赔专线或使用其应用程序。记下理赔编号、日期和通话对象。'),
        M('If your home is a total loss, ask for an advance on living expenses. California requires at least four months up front if you ask.', 'Si su vivienda es pérdida total, pida un adelanto de gastos de vida adicionales. California exige al menos cuatro meses por adelantado si usted lo solicita.', '如果房屋全损，请要求预付额外生活费用。只要您提出要求，加州规定保险公司必须预付至少四个月。'),
        M('If you also need FEMA help, file the insurance claim first.', 'Si también necesita ayuda de FEMA, presente primero el reclamo al seguro.', '如果您还需要联邦紧急事务管理署（FEMA）的帮助，请先向保险公司提出理赔。')],
      plain: M('Tell your insurance company about the fire and ask for a claim number. Write down everything they say.', 'Informe a su aseguradora sobre el incendio y pida un número de reclamo. Anote todo lo que le digan.', '告诉保险公司发生了火灾，并索取理赔编号。把他们说的每一句话都记下来。') },
    s2: { src: [1, 2, 10], tool: 'dates', label: M('I opened a claim', 'Ya abrí un reclamo', '我已提出理赔'),
      title: M('Get your claim number and full policy in writing.', 'Obtenga por escrito su número de reclamo y su póliza completa.', '以书面形式获取理赔编号和完整保单。'),
      steps: [
        M('Ask the insurer to email both, and keep one email folder just for the claim.', 'Pida a la aseguradora que le envíe ambos por correo electrónico y guarde una carpeta de correo solo para el reclamo.', '请保险公司把两者都用电子邮件发给您，并专门建一个文件夹存放理赔邮件。'),
        M('If you cannot find your policy, the state has a search tool for residential policies after a declared disaster.', 'Si no encuentra su póliza, el estado ofrece una herramienta de búsqueda de pólizas residenciales después de un desastre declarado.', '如果找不到保单，加州提供灾难宣布后的住宅保单查询工具。'),
        M('Find your deductible on the declarations page. Some policies use a percentage for wildfire, for example 2% of $1,000,000 is $20,000. Ask your agent if you are unsure.', 'Busque su deducible en la página de declaraciones. Algunas pólizas usan un porcentaje para incendios forestales; por ejemplo, el 2 % de $1,000,000 son $20,000. Si no está seguro, pregunte a su agente.', '在保单声明页上查找您的免赔额。有些保单对野火采用百分比免赔额，例如 $1,000,000 的 2% 即 $20,000。如不确定，请询问您的保险代理人。'),
        M('Mark your calendar: the insurer must acknowledge your claim within 15 days of notice, and accept or deny it within 40 days after you send proof of claim.', 'Anote en su calendario: la aseguradora debe acusar recibo de su reclamo dentro de los 15 días siguientes al aviso, y aceptarlo o rechazarlo dentro de los 40 días posteriores a que usted envíe la prueba del reclamo.', '在日历上标注：保险公司必须在收到通知后 15 天内确认您的理赔，并在您提交理赔证明后 40 天内接受或拒绝。')],
      plain: M('Ask for a full copy of your policy and put every claim email in one folder.', 'Pida una copia completa de su póliza y guarde todos los correos del reclamo en una sola carpeta.', '请索取完整保单副本，并把所有理赔邮件放在同一个文件夹里。') },
    ad: { src: [], general: true, tool: 'log', label: M('An adjuster is coming to see my home', 'Un ajustador va a visitar mi vivienda', '理赔员要来查看我的房子'),
      title: M('Get ready for the adjuster’s visit, and keep your own record of it.', 'Prepárese para la visita del ajustador y lleve su propio registro.', '为理赔员上门做好准备，并自己留下记录。'),
      steps: [
        M('Ask your insurer in writing who is coming, when, and what they will look at, so nothing surprises you.', 'Pregunte por escrito a su aseguradora quién vendrá, cuándo y qué revisará, para que nada le sorprenda.', '请以书面形式询问保险公司谁会来、什么时候来、会查看什么，避免被打个措手不及。'),
        M('If you can, be there or send someone you trust. Show every room and every area of damage, including places they may not think to check.', 'Si puede, esté presente o envíe a alguien de confianza. Muestre cada habitación y cada zona dañada, incluso lugares que quizá no se les ocurra revisar.', '如果可以，请亲自到场，或请您信任的人到场。带他们看每个房间和每处损坏，包括他们可能想不到要检查的地方。'),
        M('Take your own photos and video, and write down who came, the date, the company, and what they said. The log tool below keeps it for you.', 'Tome sus propias fotos y videos, y anote quién vino, la fecha, la empresa y lo que dijo. La herramienta de registro de abajo lo guarda por usted.', '请自己拍照和录像，并记下谁来了、日期、所属公司以及对方说了什么。下方的记录工具会替您保存。'),
        M('Afterwards, ask in writing for a copy of the adjuster’s report and estimate.', 'Después, pida por escrito una copia del informe y del presupuesto del ajustador.', '之后，请以书面形式索取理赔员报告和估价单的副本。'),
        M('If their number looks different from your contractor’s, ask them to explain it line by line.', 'Si su cifra es distinta de la de su contratista, pídales que la expliquen partida por partida.', '如果他们的金额与您的承包商报价不同，请要求逐项解释。')],
      plain: M('Ask who is coming and when, show them everything, and write down what they said.', 'Pregunte quién viene y cuándo, muéstreles todo y anote lo que dijeron.', '问清楚谁来、什么时候来，带他们看所有损坏，并记下他们说的话。') },
    s3: { src: [1, 9, 7], tool: 'inventory', label: M('Listing what I lost', 'Hago la lista de lo que perdí', '列出我损失的物品'),
      title: M('Start a room-by-room list of belongings, even if it is rough.', 'Empiece una lista de sus pertenencias, habitación por habitación, aunque sea aproximada.', '按房间逐一列出您的物品清单，哪怕只是粗略的。'),
      steps: [
        M('On a total loss you can get a first contents payment without a full list. For disasters from 2026 it is at least 60% of your contents limit, up to $350,000. For earlier fires, such as January 2025, it is at least 30% of your dwelling limit, up to $250,000. You can itemize the rest later.', 'En una pérdida total puede recibir un primer pago por contenido sin una lista completa. Para desastres desde 2026 es al menos el 60 % de su límite de contenido, hasta $350,000. Para incendios anteriores, como el de enero de 2025, es al menos el 30 % del límite de la vivienda, hasta $250,000. Puede detallar el resto después.', '房屋全损时，您无需完整清单即可先拿到一笔家庭财产赔付。2026 年起发生的灾害，至少为财产保额的 60%，最高 $350,000。2025 年 1 月等较早的火灾，至少为房屋主体保额的 30%，最高 $250,000。其余部分可以以后再逐项列出。'),
        M('Photograph and video damage if it is safe, and keep damaged items until documented.', 'Tome fotos y videos de los daños si es seguro, y conserve los artículos dañados hasta documentarlos.', '如果安全，请拍照和录像记录损失，并在记录完成前保留受损物品。'),
        M('Keep receipts for anything you buy to replace basics.', 'Guarde los recibos de todo lo que compre para reemplazar lo básico.', '为替换基本生活用品而购买的东西，请保留收据。')],
      plain: M('You may not need a full list to get a first contents payment. Write down what was in each room as you can.', 'Quizá no necesite una lista completa para recibir un primer pago por contenido. Anote lo que había en cada habitación, como pueda.', '您可能不需要完整清单就能拿到第一笔财产赔付。请尽量记下每个房间里有什么。') },
    s4: { src: [2, 6], tool: 'log', label: M('The adjuster and advisers disagree', 'El ajustador y los asesores no coinciden', '理赔员和顾问的说法不一致'),
      title: M('Write down each answer you were given, then ask the insurer for its position in writing.', 'Anote cada respuesta que le dieron y luego pida a la aseguradora su postura por escrito.', '记下您得到的每个答复，然后请保险公司以书面形式说明其立场。'),
      steps: [
        M('For each answer, note the date, the person, and what they said.', 'Para cada respuesta, anote la fecha, la persona y lo que dijo.', '对每个答复，记下日期、对方是谁以及说了什么。'),
        M('Ask the adjuster to email their position and name the policy section it comes from.', 'Pida al ajustador que envíe su postura por correo electrónico e indique de qué sección de la póliza proviene.', '请理赔员通过电子邮件发送其立场，并指明依据的保单条款。'),
        M('If it still does not add up, call the California Department of Insurance at 1-800-927-4357 or file a formal complaint, or bring in a person.', 'Si aún no tiene sentido, llame al Departamento de Seguros de California al 1-800-927-4357, presente una queja formal o consulte con una persona.', '如果仍然说不通，请致电加州保险局 1-800-927-4357、提交正式投诉，或联系真人协助。')],
      plain: M('Keep a dated list of who told you what, and ask the insurer to explain in writing.', 'Lleve una lista con fechas de quién le dijo qué, y pida a la aseguradora que lo explique por escrito.', '按日期记录谁对您说了什么，并请保险公司书面解释。') },
    s5: { src: [1, 2], label: M('Deciding on a settlement', 'Decido sobre un acuerdo', '正在决定是否接受和解'),
      title: M('Before accepting an offer, find out what is still outstanding.', 'Antes de aceptar una oferta, averigüe qué queda pendiente.', '在接受赔付方案之前，先弄清还有哪些未结事项。'),
      steps: [
        M('Ask what the offer includes and what it leaves out, and get more than one contractor estimate.', 'Pregunte qué incluye la oferta y qué deja fuera, y obtenga más de un presupuesto de contratistas.', '问清方案包含什么、不包含什么，并取得不止一份承包商报价。'),
        M('California gives you at least 36 months from your first actual cash value payment to collect full replacement cost, with extensions for good cause.', 'California le da al menos 36 meses desde su primer pago de valor real en efectivo para cobrar el costo total de reposición, con prórrogas por causa justificada.', '自您收到第一笔实际现金价值赔付起，加州至少给您 36 个月来领取全额重置成本，有正当理由可延期。'),
        M('If you rebuild elsewhere, you are owed the same benefits as rebuilding on site, up to what it would cost to rebuild there, and land value cannot be deducted.', 'Si reconstruye en otro lugar, le corresponden los mismos beneficios que si reconstruyera en el sitio, hasta el costo de reconstruir allí, y no se puede descontar el valor del terreno.', '如果您选择在别处重建，可获得与原址重建相同的赔付，上限为在原址重建的费用，且不得扣除土地价值。')],
      plain: M('Do not rush an offer. Ask what it covers and what it does not, and get more than one repair estimate.', 'No se apresure con una oferta. Pregunte qué cubre y qué no, y obtenga más de un presupuesto de reparación.', '不要仓促接受方案。问清它涵盖什么、不涵盖什么，并取得不止一份维修报价。') },
    s6: { src: [1], label: M('Rebuilding and living costs', 'Reconstrucción y gastos de vida', '重建与生活费用'),
      title: M('Track your living-expense limit and end date, and keep every receipt.', 'Lleve el control de su límite y fecha final de gastos de vida, y guarde todos los recibos.', '留意您的生活费用额度和截止日期，并保留每一张收据。'),
      steps: [
        M('California gives at least 24 months of living-expense coverage after a state of emergency, plus 12 if rebuilding is delayed beyond your control, and extensions for good cause.', 'California otorga al menos 24 meses de cobertura de gastos de vida después de un estado de emergencia, más 12 si la reconstrucción se retrasa por causas ajenas a usted, y prórrogas por causa justificada.', '紧急状态宣布后，加州至少提供 24 个月的生活费用保障；如重建因您无法控制的原因延误，再加 12 个月，正当理由可再延期。'),
        M('Your policy’s dollar limit can run out before the time does, so ask in writing where you stand.', 'El límite en dólares de su póliza puede agotarse antes que el plazo, así que pregunte por escrito cuál es su situación.', '保单的金额上限可能比时间先用完，所以请以书面形式询问您目前的使用情况。'),
        M('After a total loss your insurer must offer to renew for at least the next two renewal periods. Ask your agent to confirm this for your policy.', 'Después de una pérdida total, su aseguradora debe ofrecerle renovar al menos los dos períodos de renovación siguientes. Pida a su agente que lo confirme para su póliza.', '全损之后，保险公司必须至少为接下来的两个续保期提供续保。请让您的代理人就您的保单予以确认。')],
      plain: M('Know when your living-expense coverage ends and ask early about extensions.', 'Sepa cuándo termina su cobertura de gastos de vida y pregunte pronto por las prórrogas.', '了解您的生活费用保障何时结束，并尽早询问延期事宜。') },
    sm: { src: [3, 11, 8, 7], label: M('My home is standing, but smoke or ash got in', 'Mi vivienda sigue en pie, pero entró humo o ceniza', '我的房子还在，但进了烟或灰'),
      title: M('Report smoke and ash damage, and ask in writing how your insurer will investigate it.', 'Reporte los daños por humo y ceniza, y pregunte por escrito cómo los investigará su aseguradora.', '报告烟熏和灰烬造成的损坏，并以书面形式询问保险公司将如何调查。'),
      steps: [
        M('The Insurance Commissioner has directed insurers to fully investigate smoke damage claims, not deny them outright.', 'El Comisionado de Seguros ha ordenado a las aseguradoras investigar a fondo los reclamos por daños de humo y no rechazarlos de plano.', '保险局局长已要求保险公司全面调查烟熏损失的理赔，而不是一口回绝。'),
        M('Photograph the damage and keep affected items for now. Watch for hidden damage from smoke, ash, water and mold.', 'Fotografíe los daños y conserve por ahora los artículos afectados. Esté atento a daños ocultos por humo, ceniza, agua y moho.', '请先拍照记录损坏，并暂时保留受影响的物品。留意烟、灰、水和霉菌造成的隐蔽损坏。'),
        M('If your home is not livable, living-expense coverage may apply even without fire damage.', 'Si su vivienda no es habitable, la cobertura de gastos de vida puede aplicar aunque no haya daño por fuego.', '如果房子无法居住，即使没有火烧损坏，生活费用保障也可能适用。')],
      plain: M('Do not clean yet. Photograph the damage and ask your insurer in writing how they will investigate.', 'No limpie todavía. Fotografíe los daños y pregunte por escrito a su aseguradora cómo los investigará.', '先不要清理。请拍照记录损坏，并以书面形式询问保险公司将如何调查。') },
    r1: { src: [2, 11, 15, 4, 14], renter: true, label: M('I rent and the fire just happened', 'Soy inquilino(a) y el incendio acaba de ocurrir', '我是租客，火灾刚刚发生'),
      title: M('Report the loss to your renters insurer, or find help if you have none.', 'Reporte la pérdida a su aseguradora de inquilinos, o busque ayuda si no tiene seguro.', '向您的租客保险公司报告损失；如果没有保险，请寻求其他帮助。'),
      steps: [
        M('If you have renters insurance, call your insurer’s claim line and write down the claim number, the date, and who you spoke to.', 'Si tiene seguro de inquilinos, llame a la línea de reclamos de su aseguradora y anote el número de reclamo, la fecha y con quién habló.', '如果您有租客保险，请致电保险公司的理赔专线，记下理赔编号、日期和通话对象。'),
        M('Ask about “loss of use” (living expense) coverage right away. Renters policies often pay only until you can move back or have had a reasonable time to find another rental, whichever is less, so ask how long and how much.', 'Pregunte de inmediato por la cobertura de “pérdida de uso” (gastos de vida). Las pólizas de inquilinos suelen pagar solo hasta que usted pueda volver o haya tenido un tiempo razonable para encontrar otro alquiler, lo que ocurra primero; pregunte por cuánto tiempo y cuánto dinero.', '请立即询问“居住损失”（loss of use，即额外生活费用）保障。租客保险通常只赔付到您能搬回去，或已有合理时间另找住处为止，以较短者为准，所以请问清楚能赔多久、赔多少。'),
        M('Your landlord’s insurance does not cover your belongings. Only your own renters policy does.', 'El seguro de su arrendador no cubre sus pertenencias. Solo las cubre su propia póliza de inquilinos.', '房东的保险不赔您的个人物品，只有您自己的租客保险才会赔。'),
        M('No renters insurance? You may still get help. Apply to FEMA at DisasterAssistance.gov or 1-800-621-3362 and ask whether you can still apply, since the original deadline has passed.', '¿No tiene seguro de inquilinos? Aun así puede recibir ayuda. Solicite a FEMA en DisasterAssistance.gov o al 1-800-621-3362 y pregunte si todavía puede solicitar, pues el plazo original ya pasó.', '没有租客保险？您仍可能获得帮助。请到 DisasterAssistance.gov 或致电 1-800-621-3362 向 FEMA 申请，并询问是否仍可申请，因为最初的截止日期已过。')],
      plain: M('Tell your renters insurer about the fire and ask for a claim number. If you have no insurance, ask FEMA what help is still open.', 'Informe a su aseguradora de inquilinos sobre el incendio y pida un número de reclamo. Si no tiene seguro, pregunte a FEMA qué ayuda sigue disponible.', '告诉您的租客保险公司发生了火灾，并索取理赔编号。如果没有保险，请询问 FEMA 还有哪些援助可以申请。') },
    r2: { src: [15, 10, 2], tool: 'dates', renter: true, label: M('I rent and opened a claim', 'Soy inquilino(a) y ya abrí un reclamo', '我是租客，已提出理赔'),
      title: M('Get your policy and claim number in writing, and check your limits.', 'Obtenga por escrito su póliza y número de reclamo, y revise sus límites.', '以书面形式获取保单和理赔编号，并核对您的保额。'),
      steps: [
        M('Ask the insurer to email your claim number and a full copy of your policy. Keep one email folder for the claim.', 'Pida a la aseguradora que le envíe por correo su número de reclamo y una copia completa de su póliza. Guarde una carpeta de correo para el reclamo.', '请保险公司把理赔编号和完整保单用电子邮件发给您，并专门建一个文件夹存放理赔邮件。'),
        M('Find three numbers on your declarations page: your belongings (personal property) limit, your loss of use limit, and your deductible. Loss of use is often about 20% of the belongings limit.', 'Busque tres números en su página de declaraciones: el límite de sus pertenencias (bienes personales), el límite de pérdida de uso y su deducible. La pérdida de uso suele ser cerca del 20 % del límite de pertenencias.', '在保单声明页上找出三个数字：个人财物保额、居住损失（loss of use）保额和免赔额。居住损失保额通常约为个人财物保额的 20%。'),
        M('Mark your calendar: the insurer must acknowledge your claim within 15 days of notice, and accept or deny it within 40 days after you send proof of claim.', 'Anote en su calendario: la aseguradora debe acusar recibo de su reclamo dentro de los 15 días siguientes al aviso, y aceptarlo o rechazarlo dentro de los 40 días posteriores a que usted envíe la prueba del reclamo.', '在日历上标注：保险公司必须在收到通知后 15 天内确认您的理赔，并在您提交理赔证明后 40 天内接受或拒绝。')],
      plain: M('Ask for a full copy of your policy and find your belongings limit and living-expense limit.', 'Pida una copia completa de su póliza y busque su límite de pertenencias y su límite de gastos de vida.', '请索取完整保单副本，并找出您的个人财物保额和生活费用保额。') },
    r3: { src: [15, 7], tool: 'inventory', renter: true, label: M('I rent and I am listing my belongings', 'Soy inquilino(a) y hago la lista de mis pertenencias', '我是租客，正在列物品清单'),
      title: M('List what you lost, room by room. For renters, belongings are most of the claim.', 'Haga una lista de lo que perdió, habitación por habitación. Para los inquilinos, las pertenencias son la mayor parte del reclamo.', '按房间逐一列出您的损失。对租客来说，个人财物是理赔的主要部分。'),
      steps: [
        M('Start with a rough list. Include everyday items people forget: small appliances, kitchen items, linens, window coverings, clothing and shoes.', 'Empiece con una lista aproximada. Incluya los artículos cotidianos que se olvidan: electrodomésticos pequeños, utensilios de cocina, ropa de cama, cortinas, ropa y calzado.', '先列一份粗略清单，并加上人们常忘记的日常用品：小家电、厨房用品、床品、窗帘、衣物和鞋子。'),
        M('Ask your insurer in writing whether you can get a first payment for belongings without a full list, and what proof it will accept.', 'Pregunte por escrito a su aseguradora si puede recibir un primer pago por pertenencias sin una lista completa, y qué pruebas aceptará.', '请以书面形式询问保险公司：能否在没有完整清单的情况下先拿到一笔财物赔付，以及它接受哪些证明。'),
        M('Photograph and video what is left if it is safe, keep damaged items until documented, and keep receipts for basics you replace.', 'Fotografíe y grabe lo que quede si es seguro, conserve los artículos dañados hasta documentarlos y guarde los recibos de lo básico que reemplace.', '如果安全，请对剩余物品拍照录像；在记录完成前保留受损物品；为替换基本用品所花的钱保留收据。')],
      plain: M('Write down what was in each room. Small everyday things add up.', 'Anote lo que había en cada habitación. Las cosas pequeñas de todos los días suman.', '请记下每个房间里有什么。日常小物件加起来金额不小。') },
    r4: { src: [11, 14, 4], tool: 'log', renter: true, label: M('I rent and need a place to stay', 'Soy inquilino(a) y necesito dónde quedarme', '我是租客，需要住处'),
      title: M('Keep every receipt for extra living costs, and ask when your coverage ends.', 'Guarde todos los recibos de gastos de vida adicionales y pregunte cuándo termina su cobertura.', '保留所有额外生活费用的收据，并询问保障何时结束。'),
      steps: [
        M('Keep receipts for hotel, meals, clothing and other extra costs caused by being displaced.', 'Guarde los recibos del hotel, comidas, ropa y otros gastos adicionales causados por el desplazamiento.', '保留酒店、餐饮、衣物以及因流离失所而产生的其他额外费用的收据。'),
        M('Ask in writing for your loss of use limit and the date it ends. Renters coverage often ends when you can move back or have had a reasonable time to find a rental.', 'Pregunte por escrito por su límite de pérdida de uso y la fecha en que termina. La cobertura de inquilinos suele terminar cuando usted puede volver o ha tenido un tiempo razonable para encontrar un alquiler.', '请以书面形式询问居住损失保额及其截止日期。租客保障通常在您能搬回去，或已有合理时间另找住处时结束。'),
        M('If you are displaced, FEMA may help with temporary lodging and rent, which can include a security deposit. File the insurance claim first and tell FEMA about all your coverage. Ask FEMA at 1-800-621-3362 whether you can still apply.', 'Si está desplazado(a), FEMA puede ayudar con alojamiento temporal y alquiler, lo cual puede incluir un depósito de garantía. Presente primero el reclamo al seguro e informe a FEMA de toda su cobertura. Pregunte a FEMA al 1-800-621-3362 si todavía puede solicitar.', '如果您流离失所，FEMA 可能提供临时住宿和房租补助，其中可包括押金。请先向保险公司提出理赔，并向 FEMA 说明您的全部保险。请致电 1-800-621-3362 询问是否仍可申请。')],
      plain: M('Save every receipt and ask your insurer, in writing, when living-expense coverage ends.', 'Guarde cada recibo y pregunte por escrito a su aseguradora cuándo termina la cobertura de gastos de vida.', '保存每一张收据，并以书面形式询问保险公司生活费用保障何时结束。') },
    r5: { src: [13], tool: 'log', renter: true, label: M('My landlord and my lease', 'Mi arrendador y mi contrato de alquiler', '我的房东和租约'),
      title: M('Get your landlord’s plans in writing before you stop paying rent or sign anything.', 'Obtenga por escrito los planes de su arrendador antes de dejar de pagar el alquiler o firmar algo.', '在停止付房租或签署任何文件之前，先让房东以书面形式说明其安排。'),
      steps: [
        M('Los Angeles County’s tenant guide says that if your rental was completely destroyed, the lease no longer applies and you no longer owe rent. Your landlord must return prepaid rent and your security deposit under California law.', 'La guía para inquilinos del Condado de Los Ángeles indica que, si su vivienda alquilada fue destruida por completo, el contrato ya no aplica y usted ya no debe alquiler. Su arrendador debe devolver el alquiler pagado por adelantado y su depósito de garantía conforme a la ley de California.', '洛杉矶县的租客指南指出：如果您租的房子被完全毁坏，租约不再适用，您也不再需要付房租。房东必须依照加州法律退还预付房租和押金。'),
        M('If your rental was only partly destroyed or cannot be lived in, you may be able to end or continue the lease depending on the situation. Talk to a tenant attorney before you stop paying rent.', 'Si su vivienda solo fue destruida en parte o no se puede habitar, quizá pueda terminar o continuar el contrato según la situación. Hable con un abogado de inquilinos antes de dejar de pagar el alquiler.', '如果您租的房子只是部分损毁或无法居住，您可能可以终止或继续租约，具体取决于情况。在停止付房租之前，请先咨询租客律师。'),
        M('Keep every message with your landlord in writing, and keep photos of the unit.', 'Mantenga por escrito todos los mensajes con su arrendador y conserve fotos de la unidad.', '与房东的所有沟通都尽量用书面形式，并保留房屋的照片。')],
      plain: M('Do not stop paying rent or sign anything until you know what applies to your rental. A tenant attorney can tell you.', 'No deje de pagar el alquiler ni firme nada hasta saber qué aplica a su vivienda. Un abogado de inquilinos puede decírselo.', '在弄清适用于您租房的规定之前，不要停付房租，也不要签署任何文件。租客律师可以为您解答。') },
    td: { src: [10, 6, 2, 12], tool: 'reply', hidden: true, label: M('My claim was denied', 'Mi reclamo fue rechazado', '我的理赔被拒'),
      title: M('If your claim was denied, ask for the reason in writing, then answer in writing.', 'Si su reclamo fue rechazado, pida el motivo por escrito y luego responda por escrito.', '如果理赔被拒，请要求对方书面说明原因，然后书面回复。'),
      steps: [
        M('Ask the insurer to put the denial, and the exact policy section it relies on, in writing.', 'Pida a la aseguradora que ponga por escrito el rechazo y la sección exacta de la póliza en que se basa.', '请保险公司以书面形式说明拒赔决定，以及所依据的具体保单条款。'),
        M('Ask for the documents in your claim file, such as the adjuster’s report, the estimate and the photos.', 'Pida los documentos de su expediente de reclamo, como el informe del ajustador, el presupuesto y las fotos.', '请索取您理赔档案中的文件，例如理赔员报告、估价单和照片。'),
        M('Reply in writing with proof that supports your claim, such as photos, receipts and estimates. Keep copies. The reply helper below can draft it.', 'Responda por escrito con pruebas que respalden su reclamo, como fotos, recibos y presupuestos. Conserve copias. El asistente de respuestas de abajo puede redactar un borrador.', '请书面回复，并附上支持您理赔的证明，如照片、收据和报价单，同时保留副本。下方的回信助手可以帮您起草。'),
        M('If the answer is still no, file a formal complaint with the California Department of Insurance, 1-800-927-4357. The department says it needs a formal complaint to act.', 'Si la respuesta sigue siendo no, presente una queja formal ante el Departamento de Seguros de California, 1-800-927-4357. El departamento indica que necesita una queja formal para actuar.', '如果答复仍是拒绝，请向加州保险局提交正式投诉，电话 1-800-927-4357。保险局表示需要有正式投诉才能采取行动。'),
        M('United Policyholders has sample letters, guides and webinars for wildfire survivors.', 'United Policyholders ofrece cartas modelo, guías y seminarios web para sobrevivientes de incendios forestales.', 'United Policyholders 为野火幸存者提供信函范本、指南和线上研讨会。')],
      plain: M('Ask the insurer to explain the denial in writing, then reply in writing.', 'Pida a la aseguradora que explique el rechazo por escrito y luego responda por escrito.', '请保险公司书面解释拒赔原因，然后书面回复。') },
    tl: { src: [1, 6, 12], tool: 'reply', hidden: true, label: M('The offer is too low', 'La oferta es demasiado baja', '赔付金额太低'),
      title: M('If the offer seems too low, ask how it was figured and what it leaves out.', 'Si la oferta parece demasiado baja, pregunte cómo se calculó y qué deja fuera.', '如果赔付金额似乎太低，请问清楚是怎么算出来的、遗漏了什么。'),
      steps: [
        M('Ask the insurer to explain in writing how the number was calculated, line by line, and what is not included.', 'Pida a la aseguradora que explique por escrito cómo se calculó la cifra, partida por partida, y qué no está incluido.', '请保险公司书面逐项说明金额是如何计算的，以及哪些项目没有包括在内。'),
        M('Get more than one contractor estimate and send them to the insurer.', 'Obtenga más de un presupuesto de contratistas y envíelos a la aseguradora.', '取得不止一份承包商报价，并发给保险公司。'),
        M('Check your policy limits for the dwelling, belongings and living costs. You may be able to claim more, up to those limits, when you give proof.', 'Revise los límites de su póliza para la vivienda, las pertenencias y los gastos de vida. Es posible que pueda reclamar más, hasta esos límites, cuando presente pruebas.', '核对保单中房屋主体、个人财物和生活费用的保额。提供证明后，您可能可以在这些保额内索赔更多。'),
        M('Take your time. You have at least 36 months from your first actual cash value payment to collect full replacement cost.', 'Tómese su tiempo. Tiene al menos 36 meses desde su primer pago de valor real en efectivo para cobrar el costo total de reposición.', '不必着急。自第一笔实际现金价值赔付起，您至少有 36 个月来领取全额重置成本。'),
        M('Reply in writing with the helper below. If you are still stuck, file a formal complaint with the California Department of Insurance, 1-800-927-4357.', 'Responda por escrito con el asistente de abajo. Si sigue sin avances, presente una queja formal ante el Departamento de Seguros de California, 1-800-927-4357.', '请用下方的回信助手书面回复。如果仍然没有进展，请向加州保险局提交正式投诉，电话 1-800-927-4357。')],
      plain: M('Ask the insurer to show how it got the number, and get your own repair estimates.', 'Pida a la aseguradora que muestre cómo obtuvo la cifra, y consiga sus propios presupuestos de reparación.', '请保险公司说明金额是怎么算出来的，并自己取得维修报价。') },
    ts: { src: [10, 6, 2], tool: 'log', hidden: true, label: M('My adjuster is not responding', 'Mi ajustador no responde', '我的理赔员没有回复'),
      title: M('If your adjuster is not responding, put every request in writing and ask for a supervisor.', 'Si su ajustador no responde, ponga cada solicitud por escrito y pida hablar con un supervisor.', '如果理赔员不回复，请把每个请求都写成书面形式，并要求联系主管。'),
      steps: [
        M('Log every contact: the date, the person, and what was said. The log tool below keeps it for you.', 'Registre cada contacto: la fecha, la persona y lo que se dijo. La herramienta de registro de abajo lo guarda por usted.', '记录每一次联系：日期、对方是谁、说了什么。下方的记录工具可以帮您保存。'),
        M('Send your question by email so there is a record. Say what you need and by when.', 'Envíe su pregunta por correo electrónico para que quede constancia. Indique qué necesita y para cuándo.', '请通过电子邮件发出您的问题，以留下记录，并说明您需要什么以及希望何时得到答复。'),
        M('Know the timelines: the insurer must acknowledge your claim within 15 days of notice, and accept or deny it within 40 days after proof of claim.', 'Conozca los plazos: la aseguradora debe acusar recibo de su reclamo dentro de los 15 días siguientes al aviso, y aceptarlo o rechazarlo dentro de los 40 días posteriores a la prueba del reclamo.', '了解时限：保险公司必须在收到通知后 15 天内确认理赔，并在收到理赔证明后 40 天内接受或拒绝。'),
        M('If the adjuster stays silent, ask to speak with a claims supervisor.', 'Si el ajustador sigue sin responder, pida hablar con un supervisor de reclamos.', '如果理赔员一直不回复，请要求联系理赔主管。'),
        M('Still stuck? File a formal complaint with the California Department of Insurance, 1-800-927-4357.', '¿Sigue sin avances? Presente una queja formal ante el Departamento de Seguros de California, 1-800-927-4357.', '仍然没有进展？请向加州保险局提交正式投诉，电话 1-800-927-4357。')],
      plain: M('Keep a log of every contact and send your questions by email.', 'Lleve un registro de cada contacto y envíe sus preguntas por correo electrónico.', '记录每一次联系，并通过电子邮件发出您的问题。') }
  };
  var OWN_LIST = ['s1', 's2', 'ad', 's3', 's4', 's5', 's6', 'sm'];
  var RENT_LIST = ['r1', 'r2', 'r3', 'r4', 'r5', 'sm'];
  var OWN_ORDER = ['s1', 's2', 'ad', 's3', 's4', 's5', 's6'];
  var RENT_ORDER = ['r1', 'r2', 'r3', 'r4', 'r5'];
  var RENT_MAP = { s1: 'r1', s2: 'r2', s3: 'r3', s6: 'r4' };
  function byId(id) { return STAGES[id]; }
  function isRent() { return state.role === 'rent'; }
  function listIds() { return isRent() ? RENT_LIST : OWN_LIST; }
  function orderIds() { return isRent() ? RENT_ORDER : OWN_ORDER; }

  /* ---------- helpers ---------- */
  function stamp() { var t = Math.round((Date.now() - start) / 1000); return ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2); }
  function log(type, detail) { events.push(stamp() + '  ' + type + (detail ? ': ' + detail : '')); document.getElementById('logOut').textContent = events.join('\n'); }
  function scroll() { thread.scrollTop = thread.scrollHeight; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function srcLink(n, withNum) { var s = SOURCES[n]; return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" title="' + esc(s.title) + '">' + (withNum ? n + ' ' : '') + esc(s.label) + '</a>'; }
  function srcRow(ids) { return '<div class="srcs"><span>' + esc(T('Sources', 'Fuentes', '来源')) + '</span>' + ids.map(function (n) { return srcLink(n, true); }).join('') + '</div>'; }
  function fdate(d) { return d.toLocaleDateString(LOCALES[state.lang], { month: 'long', day: 'numeric', year: 'numeric' }); }
  function stageLabel(id) { return L(byId(id).label); }

  function bot(html, then) {
    chips.innerHTML = '';
    var t = el('div', 'msg bot typing', '•••');
    thread.appendChild(t); scroll();
    setTimeout(function () { t.className = 'msg bot'; t.innerHTML = html; scroll(); if (then) then(); }, 500);
  }
  function user(text) { state.touched = true; thread.appendChild(el('div', 'msg user', esc(text))); scroll(); }
  /* setChips takes a function that returns the list, so the buttons can be redrawn when the language changes. */
  function setChips(listOrFn) {
    var fn = typeof listOrFn === 'function' ? listOrFn : function () { return listOrFn; };
    state.lastChips = fn;
    chips.innerHTML = '';
    fn().forEach(function (c) {
      var b = el('button', 'chip' + (c[2] ? ' ' + c[2] : ''), esc(c[0])); b.type = 'button';
      b.addEventListener('click', function () { log('tap', c[0]); user(c[0]); c[1](); });
      chips.appendChild(b);
    });
    scroll(); setTimeout(scroll, 60);
  }

  /* ---------- static text that follows the language ---------- */
  function applyLang() {
    document.documentElement.setAttribute('lang', state.lang === 'zh' ? 'zh-CN' : state.lang);
    document.getElementById('humanBtn').innerHTML = '<span class="full">' + esc(T('Talk to a person', 'Hablar con una persona', '联系真人')) + '</span><span class="short" hidden>' + '</span>';
    document.getElementById('humanBtn').setAttribute('aria-label', T('Talk to a person', 'Hablar con una persona', '联系真人'));
    document.getElementById('checkBtn').setAttribute('aria-label', T('My checklist', 'Mi lista de pasos', '我的清单'));
    document.getElementById('checkBtn').setAttribute('title', T('My checklist', 'Mi lista de pasos', '我的清单'));
    document.getElementById('helpBtn').setAttribute('aria-label', T('How this works', 'Cómo funciona', '使用说明'));
    document.getElementById('helpBtn').setAttribute('title', T('How this works', 'Cómo funciona', '使用说明'));
    document.getElementById('themeBtn').setAttribute('aria-label', T('Switch light or dark theme', 'Cambiar entre tema claro y oscuro', '切换浅色或深色主题'));
    document.getElementById('langSeg').setAttribute('aria-label', T('Language', 'Idioma', '语言'));
    document.querySelectorAll('#langSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === state.lang ? 'true' : 'false'); });
    (function () { var nb = document.getElementById('newChatBtn'), nt = T('New chat', 'Nuevo chat', '新聊天'); nb.innerHTML = '<span class="plus" aria-hidden="true">+</span><span class="nct">' + esc(nt) + '</span>'; nb.setAttribute('aria-label', nt); })();
    document.getElementById('miCheck').textContent = T('My checklist', 'Mi lista de pasos', '我的清单');
    document.getElementById('miHelp').textContent = T('How this works', 'Cómo funciona', '使用说明');
    document.getElementById('miLang').textContent = T('Language', 'Idioma', '语言');
    document.getElementById('menuBtn').setAttribute('aria-label', T('Menu', 'Menú', '菜单'));
    document.getElementById('cTitle').textContent = T('Chats', 'Chats', '聊天');
    document.getElementById('sideBtn').setAttribute('aria-label', T('Open chats', 'Abrir chats', '打开聊天列表'));
    document.getElementById('newFromList').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>' + esc(T('New chat', 'Nuevo chat', '新聊天')) + '</span>';
    document.getElementById('miOther').textContent = T('Helping someone else', 'Ayudar a otra persona', '帮助他人');
    document.getElementById('closeC').setAttribute('aria-label', T('Close chats', 'Cerrar chats', '关闭聊天列表'));
    if (typeof setChatbar === 'function') setChatbar();
    renderChats();
    input.setAttribute('placeholder', T('Message', 'Mensaje', '输入消息'));
    input.setAttribute('aria-label', T('Message', 'Mensaje', '输入消息'));
    document.getElementById('sendBtn').setAttribute('aria-label', T('Send', 'Enviar', '发送'));
    document.getElementById('fineTxt').textContent = t('footer'); void T('Prototype. California focus. Not legal or insurance advice. Translations are drafts. Source notes updated Nov 7, 2026.', 'Prototipo. Enfocado en California. No es asesoría legal ni de seguros. Las traducciones son borradores. Notas de fuentes actualizadas el 7 de nov. de 2026.', '原型。聚焦加州。不构成法律或保险建议。翻译为初稿。来源说明更新于 2026 年 11 月 7 日。');
    
    document.getElementById('dTitle').textContent = t('myClaim');
    document.getElementById('dSub').textContent = t('dSub');
    document.getElementById('copySummary').textContent = t('copySummary');
    document.getElementById('copyList').textContent = T('Copy my checklist', 'Copiar mi lista', '复制我的清单');
    document.getElementById('closeD').setAttribute('aria-label', T('Close', 'Cerrar', '关闭'));
    _nop.textContent = T('Back', 'Volver', '返回');
    _nop.textContent = T('Talk to a person', 'Hablar con una persona', '联系真人');
    _nop.textContent = T('Choose what the helper can see.', 'Elija qué puede ver la persona que le ayude.', '请选择协助人员可以看到哪些信息。');
    _nop.textContent = T('Jordan, example helper. Nothing is sent in this test.', 'Jordan, persona de ejemplo. En esta prueba no se envía nada.', 'Jordan，示例协助人员。本次测试不会发送任何内容。');
    _nop.textContent = T('Request a call', 'Solicitar una llamada', '请求回电');
    document.getElementById('copyLog').textContent = 'Copy log';
    updateChecks();
  }
  function setLang(l) {
    if (l === state.lang) return;
    state.lang = l; save(); applyLang(); log('language', l);
    if (!state.touched) { thread.innerHTML = ''; chips.innerHTML = ''; renderStart(); setChatbar(); return; }
    thread.appendChild(el('div', 'msg note', esc(t('langChanged'))));
    scroll();
    if (state.lastChips) setChips(state.lastChips);
    if (document.getElementById('drawerOv').classList.contains('open')) renderDrawer();
  }

  /* ---------- checklist state ---------- */
  function stats(id) { var s = byId(id), n = s.steps.length, d = 0, i; for (i = 0; i < n; i++) if (state.done[id + '.' + i]) d++; return { n: n, d: d }; }
  function progText(id) { var s = stats(id); return fmtS(T('{d} of {n} done', '{d} de {n} completados', '已完成 {d}/{n}'), s); }
  function setDone(k, v) { if (v) state.done[k] = true; else delete state.done[k]; save(); updateChecks(true); }
  function updateChecks(skipDrawer) {
    document.querySelectorAll('input.stepcb').forEach(function (cb) { cb.checked = !!state.done[cb.getAttribute('data-k')]; });
    document.querySelectorAll('[data-prog]').forEach(function (p) {
      var id = p.getAttribute('data-prog'); if (!byId(id)) return;
      p.textContent = progText(id);
      var c = p.closest('.card'), bar = c && c.querySelector('.bar i'), s = stats(id);
      if (bar) bar.style.width = (100 * s.d / s.n) + '%';
    });
    var total = 0, k; for (k in state.done) if (state.done[k]) total++;
    var b = document.getElementById('badge'); b.textContent = total; b.hidden = total === 0;
  }
  function stepsHtml(id) {
    var s = byId(id);
    return '<ol class="steps">' + s.steps.map(function (st, i) {
      var k = id + '.' + i;
      return '<li><label class="stp"><span class="n">' + (i + 1) + '</span><input type="checkbox" class="stepcb" data-k="' + k + '"' + (state.done[k] ? ' checked' : '') + '><span class="tx">' + esc(L(st)) + '</span></label></li>';
    }).join('') + '</ol>';
  }
  thread.addEventListener('change', function (e) { var t = e.target; if (t.classList && t.classList.contains('stepcb')) { setDone(t.getAttribute('data-k'), t.checked); log('step', t.getAttribute('data-k') + (t.checked ? ' done' : ' undone')); } });

  /* ---------- drawer ---------- */
  var drawerOv = document.getElementById('drawerOv');
  function renderDrawer() {
    var ids = listIds().concat(['td', 'tl', 'ts'].filter(function (i) { return state.seen[i]; }));
    if (!state.role) ids = OWN_LIST.concat(RENT_LIST.filter(function (i) { return OWN_LIST.indexOf(i) === -1; }));
    document.getElementById('drawerBody').innerHTML = ids.map(function (id) {
      return '<details' + (state.seen[id] ? ' open' : '') + '><summary><span>' + esc(stageLabel(id)) + '</span><span class="sp" data-prog="' + id + '"></span></summary>' + stepsHtml(id) + '<button type="button" class="chip" data-open="' + id + '">' + esc(T('Open in chat', 'Abrir en el chat', '在聊天中打开')) + '</button></details>';
    }).join('') + extraDrawer();
    updateChecks(true);
  }
  function openDrawer() { renderDrawer(); drawerOv.classList.add('open'); document.getElementById('closeD').focus(); log('checklist opened'); }
  document.getElementById('checkBtn').addEventListener('click', openDrawer);
  document.getElementById('closeD').addEventListener('click', function () { drawerOv.classList.remove('open'); });
  drawerOv.addEventListener('click', function (e) { if (e.target === drawerOv) drawerOv.classList.remove('open'); });
  document.getElementById('drawerBody').addEventListener('change', function (e) { var t = e.target; if (t.classList.contains('stepcb')) { setDone(t.getAttribute('data-k'), t.checked); log('step', t.getAttribute('data-k') + (t.checked ? ' done' : ' undone')); } });
  document.getElementById('drawerBody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (!b) return;
    var id = b.getAttribute('data-open'); drawerOv.classList.remove('open'); state.touched = true; chooseStage(id);
  });
  document.getElementById('copyList').addEventListener('click', function () {
    var ids = listIds().concat(['td', 'tl', 'ts'].filter(function (i) { return state.seen[i]; }));
    var txt = ids.map(function (id) { var s = byId(id); return stageLabel(id) + '\n' + s.steps.map(function (st, i) { return (state.done[id + '.' + i] ? '[x] ' : '[ ] ') + (i + 1) + '. ' + L(st); }).join('\n'); }).join('\n\n');
    try { navigator.clipboard.writeText(txt).then(function () { document.getElementById('copyList').textContent = T('Copied', 'Copiado', '已复制'); }, function () {}); } catch (e) {}
  });

  /* ---------- opening: how it works, who it is for, own or rent ---------- */
  /* ---------- home: chat first, three plain choices, free typing ---------- */
  function welcomeCard() {
    var c = el('div', 'msg bot card welcome');
    c.innerHTML = '<h2>' + esc(T('How Next Step works', 'Cómo funciona Next Step', 'Next Step 的使用方式')) + '</h2>' +
      '<ol><li>' + esc(T('Tell me what happened, by typing or tapping a choice.', 'Cuénteme qué pasó, escribiendo o tocando una opción.', '告诉我发生了什么，可以直接输入，也可以点选项。')) + '</li>' +
      '<li>' + esc(T('I can write a short letter to your insurer with one clear ask, or show the steps for where you are.', 'Puedo escribir una carta corta a su aseguradora con una petición clara, o mostrarle los pasos según su situación.', '我可以为您给保险公司写一封只有一个明确要求的短信，或显示适合您当前情况的步骤。')) + '</li>' +
      '<li>' + esc(T('Facts come from official sources, shown beside each answer. Your checklist and letters are saved on this device only (top right).', 'Los datos provienen de fuentes oficiales, que se muestran junto a cada respuesta. Su lista y sus cartas se guardan solo en este dispositivo (arriba a la derecha).', '事实来自官方来源，并显示在每个回答旁边。您的清单和信件只保存在此设备上（右上角）。')) + '</li></ol>' +
      '<p class="small">' + esc(T('I am an AI guide, not a lawyer, an insurer or an adjuster, and I cannot file or change a claim. Home type matters: renters have their own path, and mobile homes and condos are not checked yet. You can talk to a person at any time. Translations are drafts. Source notes were last updated Nov 7, 2026 and have not been reviewed by an insurance professional.', 'Soy un asistente de IA, no un abogado, una aseguradora ni un ajustador, y no puedo presentar ni modificar un reclamo. El tipo de vivienda importa: los inquilinos tienen su propio camino, y las casas móviles y los condominios aún no se han revisado. Puede hablar con una persona en cualquier momento. Las traducciones son borradores. Las notas de fuentes se actualizaron el 7 de nov. de 2026 y no las ha revisado un profesional de seguros.', '我是 AI 向导，不是律师、保险公司或理赔员，无法提交或修改理赔。住房类型很重要：租客有专属路径，移动房屋和公寓（condo）尚未核查。您可以随时联系真人。翻译为初稿。来源说明更新于 2026 年 11 月 7 日，尚未经保险专业人士审阅。')) + '</p>';
    thread.appendChild(c); scroll();
  }
  function paintRoles() {
    document.querySelectorAll('.rolebtn').forEach(function (b) {
      var r = b.getAttribute('data-role');
      b.setAttribute('aria-pressed', (r === 'unsure' ? !state.role : state.role === r) ? 'true' : 'false');
    });
  }
  function homeT() {
    var n = state.whoName, w = state.who;
    if (w === 'other') {
      return {
        title: T('What is happening with ' + (n ? n + '’s' : 'their') + ' claim?', '¿Qué está pasando con el reclamo de ' + (n || 'esa persona') + '?', (n || '对方') + '的理赔现在是什么情况？'),
        sub: T('You are helping, so answers talk about them, not you. Letters will say you are writing on their behalf.', 'Usted está ayudando, así que las respuestas hablan de esa persona, no de usted. Las cartas dirán que escribe en su nombre.', '您在帮助对方，所以回答会以对方为主。信件会注明您是代对方来写的。'),
        roleLabel: T('Do they own or rent?', '¿Es propietario(a) o inquilino(a)?', '对方是房主还是租客？'),
        own: T('They own', 'Propietario(a)', '房主'), rent: T('They rent', 'Inquilino(a)', '租客'), unsure: t('role_unsure'),
        keys: ['denied', 'low', 'quiet'],
        prompt: T('What did their insurer do?', '¿Qué hizo su aseguradora?', '对方的保险公司做了什么？'),
        c: { denied: [t('c_denied'), T('Their claim was denied', 'Su reclamo fue rechazado', '对方的理赔被拒绝')], low: [t('c_low'), t('c_low_s')], quiet: [t('c_quiet'), T('No answer from the adjuster', 'El ajustador no responde', '理赔员没有回复')] }
      };
    }
    return {
      title: w === 'explore' ? T('What would you like to understand?', '¿Qué le gustaría entender?', '您想了解什么？') : t('homeTitle'),
      sub: w === 'explore' ? T('No claim needed. Pick a topic below, or ask anything in the box.', 'No necesita un reclamo. Elija un tema abajo o pregunte lo que quiera en el cuadro.', '不需要已有理赔。选择下面的主题，或在输入框里随便问。') : t('homeSub'),
      roleLabel: t('roleLabel'), own: t('role_own'), rent: t('role_rent'), unsure: t('role_unsure'),
      prompt: t('homePrompt'),
      keys: w === 'explore' ? ['denied', 'low', 'quiet'] : ['start', 'stay', 'denied', 'low', 'quiet', 'words'],
      c: { words: [t('c_words'), t('c_words_s')], start: [t('c_start'), t('c_start_s')], stay: [t('c_stay'), t('c_stay_s')], smoke: [t('c_smoke'), t('c_smoke_s')], denied: [t('c_denied'), t('c_denied_s')], low: [t('c_low'), t('c_low_s')], quiet: [t('c_quiet'), t('c_quiet_s')] }
    };
  }
  function homeCard() {
    var H = homeT();
    var c = el('div', 'msg bot card home');
    c.innerHTML = '<h2>' + esc(H.title) + '</h2><p class="small">' + esc(H.sub) + '</p>' +
      '<div class="rolerow" role="group" aria-label="' + esc(H.roleLabel) + '"><span>' + esc(H.roleLabel) + '</span>' +
      ['own', 'rent', 'unsure'].map(function (r) { return '<button type="button" class="rolebtn" data-role="' + r + '" aria-pressed="false">' + esc(H[r]) + '</button>'; }).join('') + '</div>' +
      '<p class="ask">' + esc(H.prompt) + '</p>' +
      '<div class="choices">' + H.keys.map(function (s) {
        return '<button type="button" class="choice" data-sit="' + s + '"><b>' + esc(H.c[s][0]) + '</b><small>' + esc(H.c[s][1]) + '</small></button>';
      }).join('') + '</div>' +
      '';
    thread.appendChild(c); paintRoles();
    if (thread.children.length === 1) thread.scrollTop = 0; else scroll();
  }
  thread.addEventListener('click', function (e) {
    var rb = e.target.closest('.rolebtn');
    if (rb) {
      var r = rb.getAttribute('data-role'); state.role = r === 'unsure' ? null : r; save(); paintRoles(); log('role', r); return;
    }
    var wc = e.target.closest('.wchoice');
    if (wc) {
      var wk = wc.getAttribute('data-who');
      if (wk === 'other') { var wn = thread.querySelector('.whoname'); wn.hidden = false; thread.querySelectorAll('.wchoice').forEach(function (x) { x.setAttribute('aria-pressed', x === wc ? 'true' : 'false'); }); var wi = document.getElementById('wname'); if (wi) wi.focus(); }
      else startChat(wk, '');
      return;
    }
    if (e.target.id === 'wgo') { var wv = document.getElementById('wname'); startChat('other', wv ? wv.value : ''); return; }
    var ch = e.target.closest('.choice');
    if (ch) {
      var s = ch.getAttribute('data-sit'); log('home choice', s);
      if (s === 'start') { user(t('cStart')); chooseStage(isRent() ? 'r1' : 's1'); }
      else if (s === 'stay') { user(t('cStay')); helpFlow('stay'); }
      else if (s === 'smoke') { user(t('cSmoke')); chooseStage('sm'); }
      else if (s === 'words') { user(t('cWords')); wordsFlow(); }
      else { user(t('c_' + s)); askFlow(s); }
      return;
    }
    if (e.target.id === 'whoBtn') { log('who picker'); thread.innerHTML = ''; whoCard(); return; }
    if (e.target.id === 'sampleBtn') { log('sample'); user(t('sampleNotes')); askFlow('quiet', { notes: t('sampleNotes') }); }
  });
  thread.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'wname') { e.preventDefault(); startChat('other', e.target.value); } });
  function homeChips() {
    return [
      [t('cStart'), function () { chooseStage(isRent() ? 'r1' : 's1'); }, 'primary'],
      [t('cWriteLetter'), function () { askFlow('other'); }],
      [t('cWords'), function () { wordsFlow(); }],
      [T('More', 'Más', '更多'), function () { setChips(moreChips); }]
    ];
  }
  function moreChips() {
    return [
      [t('cSmoke'), function () { chooseStage('sm'); }],
      [t('cStay'), function () { helpFlow('stay'); }],
      [t('cGov'), function () { helpFlow('gov'); }],
      [t('cWalk'), function () { bot('<p>' + esc(t('whatNext')) + '</p>', function () { setChips(stageChips); }); }],
      [t('back'), function () { setChips(homeChips); }]
    ];
  }
  function intro() {
    state.stage = null;
    homeCard();
    chips.innerHTML = ''; state.lastChips = null;
  }

  /* ---------- who is this for, new chat, switching ---------- */
  var shell = document.getElementById('shell'), sideBtn = document.getElementById('sideBtn');
  function isNarrow() { return window.matchMedia && window.matchMedia('(max-width: 899px)').matches; }
  function setSide(open, remember) {
    shell.classList.toggle('side-open', open); sideBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.getElementById('side').setAttribute('aria-hidden', open ? 'false' : 'true');
    if (remember && !isNarrow()) { try { localStorage.setItem('ns-side', open ? '1' : '0'); } catch (e) {} }
  }
  function chatTitle(c) {
    var n = c.whoName;
    if (c.who === 'other') return n ? T(n + '’s claim', 'Reclamo de ' + n, n + '的理赔') : T('Someone close to me', 'Alguien cercano', '我身边的人');
    if (c.who === 'explore') return T('Just learning', 'Solo informándome', '只是了解一下');
    return T('My claim', 'Mi reclamo', '我的理赔');
  }
  function setChatbar() {
    var c = curChat(), bar = document.getElementById('chatbar'), tg = document.getElementById('tagWho');
    if (!c) { bar.hidden = true; return; }
    bar.hidden = false;
    var b = document.getElementById('chatTitle'); b.textContent = chatTitle(c); b.setAttribute('aria-label', T('Your chats. Current: ', 'Sus chats. Actual: ', '您的聊天。当前：') + chatTitle(c));
    tg.hidden = c.who === 'me';
    tg.textContent = c.who === 'other' ? T('For someone else', 'Para otra persona', '为他人') : T('Exploring', 'Explorando', '了解中');
  }
  function whoCard() {
    chips.innerHTML = ''; state.lastChips = null;
    var opts = [
      ['me', T('Me', 'Yo', '我自己'), T('My own home and claim', 'Mi propia vivienda y reclamo', '我自己的住房和理赔')],
      ['other', T('Someone close to me', 'Alguien cercano', '我身边的人'), T('Family, a friend, a neighbor', 'Familia, un amigo, un vecino', '家人、朋友或邻居')],
      ['explore', T('Just learning', 'Solo informándome', '只是了解一下'), T('No claim yet, or just curious', 'Aún sin reclamo, o solo curiosidad', '还没有理赔，或只是好奇')]
    ];
    var c = el('div', 'msg bot card who');
    c.innerHTML = '<h2>' + esc(T('Who is this for?', '¿Para quién es esto?', '这是为谁准备的？')) + '</h2>' +
      '<p class="small">' + esc(T('Pick one. You can start a new chat any time for a different situation.', 'Elija una. Puede empezar un chat nuevo cuando quiera para otra situación.', '请选一个。遇到不同的情况时，随时可以新开一个聊天。')) + '</p>' +
      '<div class="choices">' + opts.map(function (o) { return '<button type="button" class="choice wchoice" data-who="' + o[0] + '"><b>' + esc(o[1]) + '</b><small>' + esc(o[2]) + '</small></button>'; }).join('') + '</div>' +
      '<div class="whoname" hidden><label class="lbl" for="wname">' + esc(T('What should I call them? (optional)', '¿Cómo los llamo? (opcional)', '我该怎么称呼对方？（可选）')) + '</label>' +
      '<input id="wname" class="wname" type="text" maxlength="40" autocomplete="off" placeholder="' + esc(T('my mom', 'mi mamá', '我妈妈')) + '">' +
      '<div class="btnrow"><button type="button" class="bigbtn" id="wgo">' + esc(T('Continue', 'Continuar', '继续')) + '</button></div></div>';
    thread.appendChild(c); scroll();
  }
  function startChat(who, name) {
    var c = { id: newId(), who: who, whoName: (name || '').trim().slice(0, 40), role: null, done: {}, seen: {}, contacts: [], letters: [], plan: null, ai: [], tx: [], ts: Date.now() };
    var prev = curChat();
    if (prev && !hasContent(prev)) store.chats = store.chats.filter(function (x) { return x.id !== prev.id; });
    store.chats.push(c);
    while (store.chats.length > MAX_CHATS) { var di = store.chats.findIndex(function (x) { return x.id !== c.id; }); if (di < 0) break; store.chats.splice(di, 1); }
    store.cur = c.id; applyChat(c);
    thread.innerHTML = ''; chips.innerHTML = '';
    setChatbar(); log('chat started', who); save(); renderChats(); updateChecks(); intro();
  }
  function hasContent(c) { return (c.tx && c.tx.length) || Object.keys(c.done || {}).length || (c.letters && c.letters.length) || (c.contacts && c.contacts.length) || c.plan; }
  function newChat() {
    save();
    var c = curChat();
    if (c && !hasContent(c)) store.chats = store.chats.filter(function (x) { return x.id !== c.id; });
    store.cur = null; resetChatState(); state.chatId = null;
    thread.innerHTML = ''; chips.innerHTML = '';
    save(); renderChats(); setChatbar(); updateChecks(); closeChats(); closeMenu(); startChat('me', ''); log('new chat');
  }
  function restoreTx(c) {
    (c.tx || []).forEach(function (m) { var d = el('div', 'msg restored ' + (m.r === 'u' ? 'user' : 'bot')); d.style.whiteSpace = 'pre-wrap'; d.textContent = m.t; thread.appendChild(d); });
  }
  function resumeChat(c) {
    thread.innerHTML = ''; chips.innerHTML = '';
    restoreTx(c);
    if (c.tx && c.tx.length) { thread.appendChild(el('div', 'msg note', esc(T('Earlier messages are shown as text. Pick up where you left off.', 'Los mensajes anteriores se muestran como texto. Continúe donde lo dejó.', '之前的消息以文字显示。请从上次停下的地方继续。')))); homeCard(); chips.innerHTML = ''; state.lastChips = null; }
    else intro();
  }
  function switchChat(id) {
    if (id === store.cur) { closeChats(); return; }
    save();
    var cur = curChat();
    if (cur && !hasContent(cur)) store.chats = store.chats.filter(function (x) { return x.id !== cur.id; });
    var c = null; store.chats.forEach(function (x) { if (x.id === id) c = x; });
    if (!c) return;
    store.cur = id; applyChat(c); renderChats(); setChatbar(); updateChecks(); closeChats(); resumeChat(c); log('chat opened', c.who);
    if (drawerOv.classList.contains('open')) renderDrawer();
  }
  function deleteChat(id) {
    store.chats = store.chats.filter(function (x) { return x.id !== id; });
    if (store.cur === id) { store.cur = null; resetChatState(); state.chatId = null; thread.innerHTML = ''; chips.innerHTML = ''; setChatbar(); updateChecks(); startChat('me', ''); }
    save(); renderChats(); log('chat deleted');
  }
  function renderChats() {
    var ul = document.getElementById('clist'); ul.innerHTML = '';
    store.chats.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).forEach(function (c) {
      var li = el('li', c.id === store.cur ? 'cur' : '');
      var who = c.who === 'other' ? T('For someone else', 'Para otra persona', '为他人') : (c.who === 'explore' ? T('Exploring', 'Explorando', '了解中') : T('For me', 'Para mí', '为我自己'));
      var when = c.ts ? new Date(c.ts).toLocaleDateString(LOCALES[state.lang], { month: 'short', day: 'numeric' }) : '';
      li.innerHTML = '<button type="button" class="citem" data-id="' + esc(c.id) + '"><span class="ct">' + esc(chatTitle(c)) + '</span><span class="cs">' + esc(who + (when ? ' · ' + when : '')) + '</span></button>' +
        '<button type="button" class="cdel" data-del="' + esc(c.id) + '" aria-label="' + esc(T('Delete chat', 'Eliminar chat', '删除聊天')) + '">✕</button>';
      ul.appendChild(li);
    });
    if (!store.chats.length) ul.appendChild(el('li', 'cs', esc(T('No chats yet.', 'Aún no hay chats.', '还没有聊天。'))));
  }
  function openChats() { save(); renderChats(); closeMenu(); setSide(true, true); }
  function closeChats() { if (isNarrow()) setSide(false, false); }
  var menuEl = document.getElementById('menu'), menuBtn = document.getElementById('menuBtn');
  function closeMenu() { menuEl.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  function renderStart() { if (curChat()) intro(); else startChat('me', ''); }

  function roleChips() {
    setChips(function () {
      return [
        [T('I own my home', 'Soy propietario(a)', '我是房主'), function () { setRole('own'); }],
        [T('I rent my home', 'Soy inquilino(a)', '我是租客'), function () { setRole('rent'); }],
        [T('Not sure', 'No estoy seguro(a)', '不确定'), function () { setRole('own'); }]
      ];
    });
  }
  function setRole(r) {
    state.role = r; save(); log('role', r);
    var msg = r === 'rent'
      ? T('Got it. Renters often get less help, so these steps are written for you.', 'Entendido. Los inquilinos suelen recibir menos ayuda, así que estos pasos están escritos para usted.', '明白了。租客得到的帮助往往较少，所以这些步骤是专门为您写的。')
      : T('Got it. I will show homeowner steps. If you own a condo, they are a good start, but some details may differ.', 'Entendido. Le mostraré los pasos para propietarios. Si tiene un condominio, son un buen comienzo, pero algunos detalles pueden variar.', '明白了。我会显示房主步骤。如果您拥有公寓（condo），这些步骤是个好的起点，但部分细节可能不同。');
    bot('<p>' + esc(msg) + '</p><p>' + esc(T('Where are you in your claim right now?', '¿En qué punto está su reclamo ahora?', '您的理赔目前进行到哪一步？')) + '</p>', function () { setChips(stageChips); });
  }
  function stageChips() {
    var l = [[T('I’m having trouble with my claim', 'Tengo problemas con mi reclamo', '我的理赔遇到了问题'), function () { trouble(); }, 'primary']];
    listIds().forEach(function (id) { l.push([stageLabel(id), function () { chooseStage(id); }]); });
    l.push([t('cWriteLetter'), function () { askFlow('other'); }]);
    l.push([t('cWords'), function () { wordsFlow(); }]);
    l.push([T('Find trusted help', 'Encontrar ayuda confiable', '寻找可信赖的帮助'), function () { helpFlow(); }]);
    l.push([T('I am not sure', 'No estoy seguro(a)', '我不确定'), function () { notSure(); }]);
    l.push([isRent() ? T('I own my home instead', 'En realidad soy propietario(a)', '我其实是房主') : T('I rent my home instead', 'En realidad soy inquilino(a)', '我其实是租客'), function () { setRole(isRent() ? 'own' : 'rent'); }]);
    return l;
  }
  document.getElementById('helpBtn').addEventListener('click', function () { state.touched = true; log('guide reopened'); welcomeCard(); });

  /* ---------- stages ---------- */
  function stepCard(id) {
    var s = byId(id);
    var c = el('div', 'msg bot card');
    c.innerHTML = '<div class="cardtop"><span class="tag">' + esc(L(s.label)) + '</span><span class="prog" data-prog="' + id + '"></span></div><h2>' + esc(L(s.title)) + '</h2>' + stepsHtml(id) + '<div class="bar"><i></i></div>' + (s.src && s.src.length ? srcRow(s.src) : '') + (s.general ? '<p class="small faint">' + esc(t('stageNoteLbl')) + '</p>' : '');
    thread.appendChild(c); updateChecks(true); scroll();
  }
  function helpCard(title, how, src) {
    var c = el('div', 'msg bot card');
    c.innerHTML = '<h2>' + esc(title) + '</h2><ol class="steps">' + how.map(function (h, i) { return '<li><span class="stp" style="grid-template-columns:22px 1fr;cursor:default"><span class="n">' + (i + 1) + '</span><span class="tx">' + esc(h) + '</span></span></li>'; }).join('') + '</ol>' + srcRow(src);
    thread.appendChild(c); scroll();
  }
  function chooseStage(id) {
    var s = byId(id); if (!s) return;
    if (isRent() !== !!s.renter && !s.hidden && id !== 'sm' && id !== 'ad') { /* keep the person's role in step with what they picked */ state.role = s.renter ? 'rent' : 'own'; save(); }
    state.misses = 0; state.stage = id; state.seen[id] = true; save();
    state.steps.push(L(s.title)); log('stage', id + ' ' + L(s.label));
    chips.innerHTML = '';
    stepCard(id);
    setTimeout(afterStep, 500);
  }
  function notSure() {
    bot('<p>' + esc(T('Which of these is closest to what is happening with your claim right now?', '¿Cuál de estas opciones se parece más a lo que pasa ahora con su reclamo?', '下面哪一项最接近您目前的理赔情况？')) + '</p>', function () {
      setChips(function () {
        return [
          [T('I need to report the fire', 'Necesito reportar el incendio', '我需要报告火灾'), function () { chooseStage(isRent() ? 'r1' : 's1'); }],
          [T('Someone told me something different', 'Alguien me dijo algo diferente', '有人告诉我的说法不一样'), function () { chooseStage('s4'); }],
          [T('I am waiting on an offer', 'Estoy esperando una oferta', '我在等待赔付方案'), function () { isRent() ? chooseStage('r4') : chooseStage('s5'); }],
          [T('Something is wrong with my claim', 'Algo anda mal con mi reclamo', '我的理赔出了问题'), function () { trouble(); }],
          [T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('chip'); }]
        ];
      });
    });
  }
  function toolChips() {
    var id = state.stage, s = id && byId(id), l = [];
    if (!s || !s.tool) return l;
    if (s.tool === 'dates') l.push([T('Build my dates', 'Armar mis fechas', '生成我的日期'), function () { dateFlow(); }]);
    if (s.tool === 'inventory') l.push([T('Start my list', 'Empezar mi lista', '开始我的清单'), function () { inventoryFlow(); }]);
    if (s.tool === 'log') l.push([T('Log a contact', 'Registrar un contacto', '记录一次联系'), function () { contactFlow(); }]);
    if (s.tool === 'reply') { l.push([T('Help me write a reply', 'Ayúdeme a escribir una respuesta', '帮我写回信'), function () { replyFlow(); }]); l.push([T('Log a contact', 'Registrar un contacto', '记录一次联系'), function () { contactFlow(); }]); }
    return l;
  }
  function afterStep() {
    bot('<p>' + esc(T('Have you finished this stage, or would you like help doing it?', '¿Terminó esta etapa o le gustaría ayuda para hacerla?', '您完成这个阶段了吗？还是需要帮助？')) + '</p>', function () {
      setChips(function () {
        var l = [
          [T('I finished this stage', 'Terminé esta etapa', '我完成了这个阶段'), function () { finishStage(); }],
          [T('Part of it does not match', 'Una parte no coincide con mi caso', '有一部分与我的情况不符'), function () { notQuite(); }],
          [T('I am stuck', 'Estoy atascado(a)', '我卡住了'), function () { stuck(); }],
          [T('Different stage', 'Otra etapa', '换一个阶段'), function () { bot('<p>' + esc(T('Which stage are you at instead?', '¿En qué etapa está en su lugar?', '您目前处于哪个阶段？')) + '</p>', function () { setChips(stageChips); }); }]
        ];
        var t = toolChips(); if (t.length) l = t.concat(l);
        return l;
      });
    });
  }
  function finishStage() {
    var s = byId(state.stage); if (s) { s.steps.forEach(function (_, i) { state.done[state.stage + '.' + i] = true; }); save(); updateChecks(); }
    nextStage();
  }
  function nextStage() {
    if (!state.stressAsked) { askStress(function () { nextStage(); }); return; }
    var order = orderIds(), i = order.indexOf(state.stage);
    if (i === -1 || i === order.length - 1) {
      bot('<p>' + esc(T('That is the last stage I cover. Would you like to talk to a person about what comes after, or go back to an earlier stage?', 'Esa es la última etapa que cubro. ¿Quiere hablar con una persona sobre lo que sigue, o volver a una etapa anterior?', '这是我涵盖的最后一个阶段。您想和真人聊聊接下来的事，还是回到前面的阶段？')) + '</p>', function () {
        setChips(function () { return [[T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('end'); }], [T('Different stage', 'Otra etapa', '换一个阶段'), function () { bot('<p>' + esc(T('Which stage are you at instead?', '¿En qué etapa está en su lugar?', '您目前处于哪个阶段？')) + '</p>', function () { setChips(stageChips); }); }]]; });
      });
      return;
    }
    chooseStage(order[i + 1]);
  }
  function notQuite() {
    bot('<p>' + esc(T('What about this step does not match your situation?', '¿Qué de este paso no coincide con su situación?', '这一步有哪里与您的情况不符？')) + '</p>', function () {
      setChips(function () {
        return [
          [T('I already did this', 'Ya hice esto', '这个我已经做过了'), function () { nextStage(); }],
          [T('My insurer said something else', 'Mi aseguradora dijo otra cosa', '保险公司说的不一样'), function () { chooseStage('s4'); }],
          [T('I do not understand', 'No lo entiendo', '我看不懂'), function () {
            var s = byId(state.stage);
            bot('<p>' + esc(L(s.plain)) + '</p>', function () {
              setChips(function () { return [[T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('plain'); }], [T('Got it, next', 'Entendido, siguiente', '明白了，下一步'), function () { nextStage(); }]]; });
            });
          }]
        ];
      });
    });
  }
  function stuck() {
    bot('<p>' + esc(T('I can connect you with a person and pass along what we covered, or we can keep working on this step. It is your choice.', 'Puedo conectarle con una persona y pasarle lo que hemos visto, o podemos seguir con este paso. Usted decide.', '我可以帮您联系真人并转达我们谈过的内容，也可以继续一起处理这一步。由您决定。')) + '</p>', function () {
      setChips(function () { return [[T('Connect me', 'Conectarme', '帮我联系'), function () { openHandoff('stuck'); }], [T('Keep going', 'Seguir', '继续'), function () { afterStep(); }]]; });
    });
  }
  /* Offer a person when the user seems frustrated, without ending the chat. */
  function frustrated() {
    log('frustration offer');
    bot('<p>' + esc(T('That sounds frustrating, and I am sorry. I am happy to keep going with you, or I can connect you with a person. You choose.', 'Eso suena frustrante, y lo siento. Con gusto sigo con usted, o puedo conectarle con una persona. Usted elige.', '这听起来很让人沮丧，我很抱歉。我很乐意继续陪您，也可以帮您联系真人。由您选择。')) + '</p>', function () {
      setChips(function () { return [[T('Keep going with you', 'Seguir con usted', '继续和您聊'), function () { state.misses = 0; (state.stage ? afterStep : function () { setChips(stageChips); })(); }], [T('Connect me to a person', 'Conectarme con una persona', '帮我联系真人'), function () { openHandoff('frustration'); }]]; });
    });
  }

  /* ---------- trouble with my claim ---------- */
  function trouble() {
    state.stage = 'tr'; log('trouble flow');
    bot('<p>' + esc(T('I am sorry you are dealing with this. What is happening with your claim?', 'Lamento que esté pasando por esto. ¿Qué ocurre con su reclamo?', '很抱歉您正在经历这些。您的理赔出了什么问题？')) + '</p>', function () {
      setChips(function () {
        return [
          [T('The insurer denied my claim', 'La aseguradora rechazó mi reclamo', '保险公司拒赔了'), function () { chooseStage('td'); }],
          [T('The offer seems too low', 'La oferta parece demasiado baja', '赔付金额似乎太低'), function () { chooseStage('tl'); }],
          [T('My adjuster is not responding', 'Mi ajustador no responde', '理赔员不回复'), function () { chooseStage('ts'); }],
          [T('I keep hearing different answers', 'Sigo recibiendo respuestas distintas', '我得到的答复总是不一样'), function () { chooseStage('s4'); }],
          [T('Smoke or ash damage is being ignored', 'Están ignorando los daños por humo o ceniza', '烟灰损坏被忽视'), function () { chooseStage('sm'); }],
          [T('Something else', 'Otra cosa', '其他问题'), function () { bot('<p>' + esc(T('Tell me in your own words what happened. Please leave out Social Security and bank numbers.', 'Cuénteme con sus propias palabras qué pasó. Por favor no incluya números de Seguro Social ni de cuentas bancarias.', '请用您自己的话告诉我发生了什么。请不要写社会安全号码或银行账号。')) + '</p>', function () { input.focus(); }); }]
        ];
      });
    });
  }

  /* ---------- stress check with box breathing ---------- */
  function askStress(then) {
    state.stressAsked = true; state.afterStress = then || afterStep;
    bot('<p>' + esc(T('Nice work finishing that stage. How are you holding up?', 'Buen trabajo al terminar esa etapa. ¿Cómo se siente?', '完成这一阶段，做得很好。您现在感觉怎么样？')) + '</p>', function () {
      setChips(function () {
        return [
          [T('Okay', 'Bien', '还好'), function () { state.stress = 'okay'; log('stress', 'okay'); state.afterStress(); }],
          [T('Stressed', 'Estresado(a)', '有压力'), function () { state.stress = 'stressed'; log('stress', 'stressed'); offerBreath(false); }],
          [T('Overwhelmed', 'Abrumado(a)', '不堪重负'), function () { state.stress = 'overwhelmed'; log('stress', 'overwhelmed'); offerBreath(true); }],
          [T('Skip', 'Omitir', '跳过'), function () { state.stress = 'skipped'; log('stress', 'skipped'); state.afterStress(); }]
        ];
      });
    });
  }
  function offerBreath(offerPerson) {
    bot('<p>' + esc(T('Would a short breathing reset help? It takes under a minute. Follow the dot around the box: in for 4, hold for 4, out for 4, hold for 4.', '¿Le ayudaría una pausa de respiración? Dura menos de un minuto. Siga el punto alrededor del cuadro: inhale 4, sostenga 4, exhale 4, sostenga 4.', '做一个简短的呼吸放松会有帮助吗？不到一分钟。跟着圆点绕方框移动：吸气 4 秒，屏气 4 秒，呼气 4 秒，屏气 4 秒。')) + '</p>', function () {
      setChips(function () {
        var l = [[T('Yes', 'Sí', '好'), function () { breathe(); }], [T('Keep going', 'Seguir', '继续')+'', function () { (state.afterStress || afterStep)(); }]];
        if (offerPerson) l.push([T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('stress'); }]);
        return l;
      });
    });
  }
  function breathe() {
    log('breathing', 'started');
    var w = el('div', 'msg bot breath', '<div class="bbox"><div class="bdot"></div></div><div class="bt"></div><div class="bc"></div>');
    thread.appendChild(w); scroll();
    var dot = w.querySelector('.bdot'), bt = w.querySelector('.bt'), bc = w.querySelector('.bc');
    var phases = [[T('Breathe in', 'Inhale', '吸气'), 1], [T('Hold', 'Sostenga', '屏气'), 0], [T('Breathe out', 'Exhale', '呼气'), -1], [T('Hold', 'Sostenga', '屏气'), 0]];
    var spots = ['translate(0,0)', 'translate(120px,0)', 'translate(120px,120px)', 'translate(0,120px)'];
    var cycles = 3, ci = 0, pi = 0, sec = 0, timer = null, stopped = false;
    function finish(skipped) { stopped = true; clearInterval(timer); bt.textContent = T('Done', 'Listo', '完成'); bc.textContent = ''; dot.style.transform = spots[3]; log('breathing', skipped ? 'skipped' : 'finished'); setTimeout(function () { (state.afterStress || afterStep)(); }, 400); }
    function phase() {
      var p = phases[pi]; sec = 4; bt.textContent = p[0]; bc.textContent = sec;
      dot.style.transform = spots[pi];
    }
    setChips(function () { return [[T('Skip', 'Omitir', '跳过'), function () { if (!stopped) finish(true); }]]; });
    dot.style.transform = spots[3]; void dot.offsetWidth;
    phase();
    timer = setInterval(function () {
      sec--;
      if (sec <= 0) { pi++; if (pi >= phases.length) { pi = 0; ci++; if (ci >= cycles) { finish(false); return; } } phase(); }
      else bc.textContent = sec;
    }, 1000);
  }

  /* ---------- talk to a person: a plain yes/no, then real contacts ---------- */
  var overlay = { classList: { contains: function () { return false; }, remove: function () {}, add: function () {} } };
  function claimSummary(short) {
    var st = state.stage && byId(state.stage) ? stageLabel(state.stage) : T('No stage chosen yet', 'Aún sin etapa', '尚未选择阶段');
    var home = state.role === 'rent' ? T('Renter', 'Inquilino(a)', '租客') : (state.role === 'own' ? T('Homeowner', 'Propietario(a)', '房主') : T('Not said', 'No indicado', '未说明'));
    var lines = [t('summaryTitle'), (state.who === 'other' ? T('For: ', 'Para: ', '对象：') + (state.whoName || T('someone close to me', 'alguien cercano', '我身边的人')) : ''), T('Home: ', 'Vivienda: ', '住房：') + home, T('Where I am: ', 'Dónde estoy: ', '目前阶段：') + st];
    if (state.typed.length) lines.push(T('What I said: ', 'Lo que dije: ', '我说过：') + state.typed.slice(-2).join(' / ').slice(0, 300));
    if (!short) {
      listIds().concat(['ad']).forEach(function (id) { if (state.seen[id] && byId(id)) { var s = stats(id); lines.push('- ' + stageLabel(id) + ': ' + s.d + '/' + s.n); } });
      if (state.contacts.length) { lines.push(T('Contact log:', 'Registro de contactos:', '联系记录：')); state.contacts.forEach(function (c) { lines.push('  ' + c.d + ' | ' + c.w + ' | ' + c.s); }); }
      if (state.letters.length) { lines.push(T('Letters written:', 'Cartas escritas:', '已写的信件：')); state.letters.forEach(function (l) { lines.push('  ' + l.d + ' | ' + l.sub); }); }
      if (state.plan) lines.push('', state.plan);
    }
    return lines.filter(function (x) { return x !== ''; }).join('\n');
  }
  function openHandoff(src) {
    state.misses = 0; log('handoff opened', src || 'header'); state.touched = true;
    bot('<p>' + esc(t('hoQ')) + '</p>', function () {
      setChips(function () { return [[t('yes'), function () { handoffKind(); }, 'primary'], [t('notNow'), function () { setChips(state.stage && byId(state.stage) ? function () { return [[T('Back to my step', 'Volver a mi paso', '回到我的步骤'), function () { afterStep(); }], [T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }]]; } : homeChips); }]]; });
    });
  }
  function handoffKind() {
    bot('<p>' + esc(t('hoKind')) + '</p>', function () {
      setChips(function () { return [[t('k_ins'), function () { handoffContacts('ins'); }], [t('k_house'), function () { handoffContacts('house'); }], [t('k_over'), function () { handoffContacts('over'); }]]; });
    });
  }
  function handoffContacts(kind) {
    log('handoff contacts', kind);
    var tel = function (n, label) { return '<a href="tel:' + n.replace(/[^0-9]/g, '') + '">' + esc(label || n) + '</a>'; };
    var rows = [];
    if (kind === 'ins') {
      rows.push([T('California Department of Insurance hotline', 'Línea del Departamento de Seguros de California', '加州保险局热线'), tel('1-800-927-4357') + ' ' + T('for questions about your insurance or a dispute with your insurer', 'para preguntas sobre su seguro o una disputa con su aseguradora', '用于咨询保险问题或与保险公司的纠纷') + ' [2]']);
      rows.push([T('Formal complaint', 'Queja formal', '正式投诉'), T('The department urges survivors with delays, disputes or smoke damage problems to file one.', 'El departamento insta a los sobrevivientes con retrasos, disputas o problemas por daños de humo a presentar una.', '保险局鼓励遇到拖延、纠纷或烟熏损失问题的幸存者提交投诉。') + ' [6]']);
      rows.push([T('In person', 'En persona', '当面咨询'), T('Local Assistance Centers offer in-person help.', 'Los Centros de Asistencia Local ofrecen ayuda en persona.', '本地援助中心提供当面帮助。') + ' [2]']);
      rows.push([T('Free guides and sample letters', 'Guías y cartas modelo gratuitas', '免费指南和信函范本'), '<a href="' + SOURCES[12].url + '" target="_blank" rel="noopener noreferrer">United Policyholders</a> [12]']);
    } else if (kind === 'house') {
      rows.push([T('FEMA', 'FEMA', 'FEMA'), tel('1-800-621-3362') + ' · DisasterAssistance.gov · ' + T('file your insurance claim first', 'presente primero su reclamo al seguro', '请先提出保险理赔') + ' [4]']);
      rows.push([T('Temporary housing', 'Vivienda temporal', '临时住房'), T('FEMA may help with short-term hotel stays and rent if you are displaced. Ask whether you can still apply for the January 2025 fires.', 'FEMA puede ayudar con estadías cortas en hotel y con el alquiler si usted está desplazado(a). Pregunte si aún puede solicitar por los incendios de enero de 2025.', '如果您流离失所，FEMA 可能提供短期酒店住宿和租金援助。请询问 2025 年 1 月的火灾是否仍可申请。') + ' [14]']);
      rows.push([T('Cal OES', 'Cal OES', '加州紧急服务办公室（Cal OES）'), T('Register for disaster assistance online or by phone.', 'Regístrese para recibir asistencia por desastre en línea o por teléfono.', '可在线或电话登记灾害援助。') + ' [5]']);
    } else {
      rows.push([T('In danger', 'En peligro', '处于危险中'), tel('911')]);
      rows.push([T('Emotional support, call or text', 'Apoyo emocional, llamada o mensaje', '情绪支持，电话或短信'), tel('988')]);
      rows.push([T('Your claim can wait a day', 'Su reclamo puede esperar un día', '您的理赔可以晚一天再处理'), T('Claims take months. Taking a break does not cost you your claim.', 'Los reclamos toman meses. Tomarse un descanso no le hace perder su reclamo.', '理赔需要数月。休息一下不会让您失去理赔。')]);
    }
    var c = el('div', 'msg bot card');
    var cites = []; var body = rows.map(function (r) {
      var h = r[1].replace(/\[(\d{1,2})\]/g, function (m, d) { if (!SOURCES[+d]) return ''; if (cites.indexOf(+d) === -1) cites.push(+d); return '<sup class="cite"><a href="' + SOURCES[+d].url + '" target="_blank" rel="noopener noreferrer" title="' + esc(SOURCES[+d].title) + '">' + d + '</a></sup>'; });
      return '<li><b>' + esc(r[0]) + '</b><span>' + h + '</span></li>';
    }).join('');
    c.innerHTML = '<h2>' + esc(kind === 'over' ? t('cPerson') : t('official')) + '</h2><ul class="contacts">' + body + '</ul>' + (cites.length ? srcRow(cites.sort(function (a, b) { return a - b; })) : '') +
      '<p class="small">' + esc(t('hoDemo')) + '</p><p class="small"><b>' + esc(t('hoEmerg')) + '</b></p>';
    thread.appendChild(c); scroll();
    setChips(function () {
      var l = [[t('copySummaryShort'), function () { copyText(claimSummary(false), t('copied')); }]];
      if (kind === 'over') l.unshift([t('breatheOffer'), function () { breathe(); }]);
      l.push([T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }]);
      return l;
    });
  }
  document.getElementById('humanBtn').addEventListener('click', function () { openHandoff('header'); });

  /* ---------- tools ---------- */
  function copyText(t, ok) {
    var done = function () { bot('<p>' + esc(ok) + '</p>', function () { setChips(function () { return [[T('Back to my step', 'Volver a mi paso', '回到我的步骤'), function () { if (state.stage && byId(state.stage)) afterStep(); else setChips(stageChips); }]]; }); }); };
    var fail = function () { bot('<p>' + esc(T('Your browser blocked copying. Select the text above and copy it.', 'Su navegador bloqueó la copia. Seleccione el texto de arriba y cópielo.', '浏览器阻止了复制。请选中上方的文字后手动复制。')) + '</p>'); };
    try { navigator.clipboard.writeText(t).then(done, fail); } catch (e) { fail(); }
  }
  function dateFlow() {
    bot('<p>' + esc(T('When did you first report the claim to your insurer?', '¿Cuándo reportó por primera vez el reclamo a su aseguradora?', '您是什么时候第一次向保险公司报告理赔的？')) + '</p>', function () {
      var w = el('div', 'msg bot'); w.innerHTML = '<div class="inl"><input type="date" aria-label="' + esc(T('Date you reported the claim', 'Fecha en que reportó el reclamo', '报告理赔的日期')) + '"><button type="button" class="chip">' + esc(T('Build my dates', 'Armar mis fechas', '生成我的日期')) + '</button></div>';
      thread.appendChild(w); scroll();
      w.querySelector('button').addEventListener('click', function () {
        var v = w.querySelector('input').value; if (!v) return;
        var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]), ack = new Date(d.getTime()); ack.setDate(ack.getDate() + 15);
        log('dates built', v);
        var lines = [
          fmtS(T('Reported: {d}.', 'Reportado: {d}.', '报告日期：{d}。'), { d: fdate(d) }),
          fmtS(T('Your insurer should acknowledge the claim and begin investigating by {d} (15 days after notice).', 'Su aseguradora debe acusar recibo del reclamo y comenzar a investigar a más tardar el {d} (15 días después del aviso).', '保险公司应在 {d} 前（通知后 15 天内）确认理赔并开始调查。'), { d: fdate(ack) }),
          T('Once you send proof of claim, it should accept or deny within 40 days. Write down the day you send it and add 40 days.', 'Una vez que envíe la prueba del reclamo, debe aceptarlo o rechazarlo en un plazo de 40 días. Anote el día en que la envíe y sume 40 días.', '您提交理赔证明后，保险公司应在 40 天内接受或拒绝。请记下提交的日期，再加 40 天。')];
        if (isRent()) lines.push(T('Living expenses: renters policies often pay only until you can move back or have had a reasonable time to find a rental. Ask your insurer in writing for your end date.', 'Gastos de vida: las pólizas de inquilinos suelen pagar solo hasta que usted pueda volver o haya tenido un tiempo razonable para encontrar un alquiler. Pida por escrito a su aseguradora su fecha final.', '生活费用：租客保险通常只赔到您能搬回去，或已有合理时间另找住处为止。请以书面形式向保险公司询问您的截止日期。'));
        else { lines.push(T('Replacement cost: at least 36 months from your first actual cash value payment.', 'Costo de reposición: al menos 36 meses desde su primer pago de valor real en efectivo.', '重置成本：自第一笔实际现金价值赔付起至少 36 个月。')); lines.push(T('Living expenses: at least 24 months after a state of emergency, plus extensions. Check your policy limits.', 'Gastos de vida: al menos 24 meses después de un estado de emergencia, más prórrogas. Revise los límites de su póliza.', '生活费用：紧急状态宣布后至少 24 个月，另有延期。请核对保单额度。')); }
        var note = T('Dates are estimates. Check your policy and ask your insurer in writing.', 'Las fechas son estimaciones. Revise su póliza y pregunte por escrito a su aseguradora.', '日期仅为估算。请核对您的保单，并以书面形式询问保险公司。');
        state.plan = T('My claim dates', 'Fechas de mi reclamo', '我的理赔日期') + '\n' + lines.join('\n') + '\n' + note;
        var c = el('div', 'msg bot card'); c.innerHTML = '<h2>' + esc(T('Your key dates', 'Sus fechas clave', '您的关键日期')) + '</h2><ol class="steps">' + lines.map(function (l, i) { return '<li><span class="stp" style="grid-template-columns:22px 1fr;cursor:default"><span class="n">' + (i + 1) + '</span><span class="tx">' + esc(l) + '</span></span></li>'; }).join('') + '</ol><p class="small">' + esc(note) + '</p>' + srcRow(isRent() ? [10, 11] : [1, 10]);
        thread.appendChild(c); scroll();
        setChips(function () { return [[T('Copy my plan', 'Copiar mi plan', '复制我的计划'), function () { copyText(state.plan, T('Copied. Paste it into your claims email folder.', 'Copiado. Péguelo en su carpeta de correos del reclamo.', '已复制。请粘贴到您的理赔邮件文件夹中。')); }], [T('Back to my step', 'Volver a mi paso', '回到我的步骤'), function () { afterStep(); }]]; });
      });
    });
  }
  function inventoryFlow() {
    var items = []; log('inventory started');
    bot('<p>' + esc(T('Add items room by room. Rough values are fine, and you can add more later.', 'Agregue artículos habitación por habitación. Los valores aproximados sirven, y puede agregar más después.', '请按房间逐项添加物品。大致金额即可，以后还可以继续补充。')) + '</p>', function () {
      var w = el('div', 'msg bot card'); w.innerHTML = '<div class="inl"><input type="text" class="iR" placeholder="' + esc(T('Room', 'Habitación', '房间')) + '" aria-label="' + esc(T('Room', 'Habitación', '房间')) + '"><input type="text" class="iI" placeholder="' + esc(T('Item', 'Artículo', '物品')) + '" aria-label="' + esc(T('Item', 'Artículo', '物品')) + '"><input type="number" class="iV" placeholder="' + esc(T('Value $', 'Valor $', '金额 $')) + '" min="0" aria-label="' + esc(T('Estimated value in dollars', 'Valor estimado en dólares', '估计金额（美元）')) + '"><button type="button" class="chip">' + esc(T('Add', 'Agregar', '添加')) + '</button></div><ul class="invList"></ul><div class="invTot"></div>';
      thread.appendChild(w); scroll();
      function render() {
        var tot = items.reduce(function (a, b) { return a + b.v; }, 0);
        w.querySelector('.invList').innerHTML = items.slice(-6).map(function (i) { return '<li><span>' + esc(i.r) + ': ' + esc(i.i) + '</span><span>$' + i.v.toLocaleString() + '</span></li>'; }).join('');
        w.querySelector('.invTot').textContent = fmtS(T('{n} items, about ${t}', '{n} artículos, aproximadamente ${t}', '共 {n} 件，约 ${t}'), { n: items.length, t: tot.toLocaleString() });
      }
      w.querySelector('button').addEventListener('click', function () {
        var r = w.querySelector('.iR').value.trim(), i = w.querySelector('.iI').value.trim(), v = parseFloat(w.querySelector('.iV').value) || 0;
        if (!i) return; items.push({ r: r || T('Room', 'Habitación', '房间'), i: i, v: v }); log('inventory item added', items.length + ' total');
        w.querySelector('.iI').value = ''; w.querySelector('.iV').value = ''; w.querySelector('.iI').focus(); render(); scroll();
      });
      setChips(function () { return [[T('Copy as CSV', 'Copiar como CSV', '复制为 CSV'), function () {
        var csv = 'Room,Item,Estimated value\n' + items.map(function (i) { return '"' + i.r.replace(/"/g, '""') + '","' + i.i.replace(/"/g, '""') + '",' + i.v; }).join('\n');
        copyText(csv, T('Copied as CSV. Paste it into a spreadsheet.', 'Copiado como CSV. Péguelo en una hoja de cálculo.', '已复制为 CSV。请粘贴到电子表格中。'));
      }], [T('Done', 'Listo', '完成'), function () { afterStep(); }]]; });
    });
  }
  /* Log of who you talked to: date, person, what was said. */
  function contactFlow() {
    log('contact log opened');
    bot('<p>' + esc(T('Write down each call or message with your insurer, adjuster or landlord. It is saved on this device.', 'Anote cada llamada o mensaje con su aseguradora, ajustador o arrendador. Se guarda en este dispositivo.', '请记录每一次与保险公司、理赔员或房东的通话或消息。内容保存在此设备上。')) + '</p>', function () {
      var w = el('div', 'msg bot card'); var today = new Date(); var iso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
      w.innerHTML = '<div class="fld"><div class="two"><input type="date" class="cD" value="' + iso + '" aria-label="' + esc(T('Date', 'Fecha', '日期')) + '"><input type="text" class="cW" placeholder="' + esc(T('Who (name and company)', 'Con quién (nombre y empresa)', '联系对象（姓名和公司）')) + '" aria-label="' + esc(T('Who', 'Con quién', '联系对象')) + '"></div><input type="text" class="cS" placeholder="' + esc(T('What was said or promised', 'Qué se dijo o prometió', '说了什么或承诺了什么')) + '" aria-label="' + esc(T('What was said', 'Qué se dijo', '说了什么')) + '"><div><button type="button" class="chip cA">' + esc(T('Add to log', 'Agregar al registro', '添加到记录')) + '</button></div></div><ul class="invList cL"></ul>';
      thread.appendChild(w); scroll();
      function render() { w.querySelector('.cL').innerHTML = state.contacts.slice(-6).map(function (c) { return '<li><span>' + esc(c.d) + ' · ' + esc(c.w) + '</span><span style="text-align:right">' + esc(c.s) + '</span></li>'; }).join(''); }
      render();
      w.querySelector('.cA').addEventListener('click', function () {
        var d = w.querySelector('.cD').value, who = w.querySelector('.cW').value.trim(), s = w.querySelector('.cS').value.trim();
        if (!who && !s) return; state.contacts.push({ d: d, w: who || '-', s: s || '-' }); save(); log('contact logged', state.contacts.length + ' total');
        w.querySelector('.cW').value = ''; w.querySelector('.cS').value = ''; render(); scroll();
      });
      setChips(function () { return [[T('Copy my log', 'Copiar mi registro', '复制我的记录'), function () { copyText(state.contacts.map(function (c) { return c.d + ' | ' + c.w + ' | ' + c.s; }).join('\n') || '-', T('Copied. Paste it into your claims email folder.', 'Copiado. Péguelo en su carpeta de correos del reclamo.', '已复制。请粘贴到您的理赔邮件文件夹中。')); }], [T('Back to my step', 'Volver a mi paso', '回到我的步骤'), function () { afterStep(); }]]; });
    });
  }
  /* ---------- letter helper: one situation, one ask, an editable letter ---------- */
  var uidN = 0;
  function letterTemplate(o) {
    var out = [];
    out.push('Subject: ' + SIT_SUBJECT[o.sit] + (o.claim ? ' - Claim ' + o.claim : ''));
    out.push(''); out.push('Dear Claims Team,'); out.push('');
    var oth = o.who === 'other'; var pn = o.whoName || '[policyholder name]';
    if (oth) out.push('I am writing on behalf of ' + pn + ' about their claim for their ' + (isRent() ? 'rental home' : 'home') + ', which was affected by the California wildfire.');
    else out.push('I am writing about my claim for my ' + (isRent() ? 'rental home' : 'home') + ', which was affected by the California wildfire.');
    var ctx = (oth ? { denied: 'They received your decision on the claim.', low: 'They received your settlement offer on the claim.', quiet: 'They have not received a response to their recent requests.', smoke: 'Their home is still standing, but smoke and ash got in.', other: '' } : { denied: 'I received your decision on my claim.', low: 'I received your settlement offer on my claim.', quiet: 'I have not received a response to my recent requests.', smoke: 'My home is still standing, but smoke and ash got in.', other: '' })[o.sit];
    if (ctx) out.push(ctx);
    if (o.notes) { out.push(''); out.push('In my own words: ' + o.notes.trim().slice(0, 900)); }
    if (o.paste) { out.push(''); out.push('Your message included: "' + o.paste.trim().slice(0, 500) + '"'); }
    out.push(''); out.push(o.ask);
    out.push('');
    out.push('Please reply in writing within 15 calendar days of receiving this letter. I am keeping a record of all communication on this claim.'); out.push('');
    out.push('Thank you,'); out.push(o.name || '[your name]');
    return out.join('\n');
  }
  function askFlow(sit, pre) {
    pre = pre || {};
    if (!ASKS[sit]) sit = 'other';
    log('ask flow', sit);
    var uid = ++uidN;
    bot('<p>' + esc(t('askTitle_' + sit)) + '</p>', function () {
      var w = el('div', 'msg bot card');
      var asks = ASKS[sit];
      var radios = asks.map(function (a, i) {
        return '<label class="ck"><input type="radio" name="ask' + uid + '" class="ak" value="' + a[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(L(a[2])) + '</span></label>';
      }).join('') + '<label class="ck"><input type="radio" name="ask' + uid + '" class="ak" value="x"><span>' + esc(t('askOtherLabel')) + '</span></label>' +
        '<input type="text" class="aX" maxlength="200" placeholder="' + esc(t('askOtherPh')) + '" aria-label="' + esc(t('askOtherPh')) + '" hidden>';
      w.innerHTML = '<div class="fld"><p class="small">' + esc(t('askIntro')) + '</p>' +
        '<label class="lbl">' + esc(t('lblNotes')) + '</label><textarea class="aN" maxlength="1200" placeholder="' + esc(t(I['phNotes_' + sit] ? 'phNotes_' + sit : 'phNotes')) + '"></textarea>' +
        '<label class="lbl">' + esc(t('lblAsk')) + '</label>' + radios +
        '<details><summary>' + esc(t('lblPaste')) + '</summary><textarea class="aP" maxlength="1500" placeholder="' + esc(t('phPaste')) + '" aria-label="' + esc(t('lblPaste')) + '"></textarea></details>' +
        '<details><summary>' + esc(t('lblDetails')) + '</summary><div class="two"><input type="text" class="aNm" maxlength="60" placeholder="' + esc(t('phName')) + '" aria-label="' + esc(t('phName')) + '"><input type="text" class="aC" maxlength="40" placeholder="' + esc(t('phClaim')) + '" aria-label="' + esc(t('phClaim')) + '"></div><input type="text" class="aI" maxlength="60" placeholder="' + esc(t('phInsurer')) + '" aria-label="' + esc(t('phInsurer')) + '"></details>' +
        '<p class="small faint">' + esc(t('privNote')) + '</p>' +
        '<div class="inl"><button type="button" class="chip primary aGo">' + esc(t('writeLetter')) + '</button></div><p class="small err aErr" role="alert" hidden></p></div><div class="aOut"></div>';
      thread.appendChild(w);
      if (pre.notes) w.querySelector('.aN').value = pre.notes;
      var ox = w.querySelector('.aX');
      w.addEventListener('change', function (e) { if (e.target.classList.contains('ak')) { ox.hidden = e.target.value !== 'x'; if (!ox.hidden) ox.focus(); } });
      scroll();
      w.querySelector('.aGo').addEventListener('click', function () {
        var sel = w.querySelector('.ak:checked'); var key = sel ? sel.value : asks[0][0];
        var askText = '';
        if (key === 'x') { askText = ox.value.trim(); if (!askText) { var er = w.querySelector('.aErr'); er.textContent = t('needOther'); er.hidden = false; ox.focus(); return; } if (!/[.?!]$/.test(askText)) askText += '.'; if (!/^please/i.test(askText)) askText = 'Please ' + askText.charAt(0).toLowerCase() + askText.slice(1); }
        else { askText = (asks.filter(function (a) { return a[0] === key; })[0] || asks[0])[1]; if (state.who === 'other') askText = askText.replace(/\bfrom me\b/g, 'from them').replace(/\bmy\b/g, 'their'); }
        w.querySelector('.aErr').hidden = true;
        var o = { sit: sit, who: state.who === 'other' ? 'other' : 'me', whoName: state.whoName, sitLabel: L(SIT_LABEL[sit]), role: state.role, ask: askText, notes: w.querySelector('.aN').value.trim(), paste: w.querySelector('.aP').value.trim(), name: w.querySelector('.aNm').value.trim(), claim: w.querySelector('.aC').value.trim(), insurer: w.querySelector('.aI').value.trim() };
        state.touched = true; log('letter requested', sit + '/' + key);
        showLetter(w.querySelector('.aOut'), o, false);
      });
      setChips(function () { return [[t('back'), function () { setChips(stageChips); }], [t('cPerson'), function () { openHandoff('ask'); }]]; });
    });
  }
  function showLetter(out, o, short) {
    out.innerHTML = '<p class="small">' + esc(t('writing')) + ' •••</p>'; scroll();
    var done = function (text, fallback) {
      var box = out;
      box.innerHTML = '<h3 class="lh">' + esc(t('letterTitle')) + '</h3><p class="small">' + esc(fallback ? t('fallbackNote') : t('letterNote')) + '</p>' +
        '<div class="lwrap"><textarea class="letterEdit" rows="14" aria-label="' + esc(t('letterTitle')) + '"></textarea><button type="button" class="lcopy" aria-label="' + esc(t('copyLetter')) + '" title="' + esc(t('copyLetter')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg></button></div><p class="small faint">' + esc(t('letterEditHint')) + '</p><div class="lOut"></div>';
      var ta = box.querySelector('.letterEdit'); box.querySelector('.lcopy').addEventListener('click', function () { copyLetter(ta, box.querySelector('.lOut')); }); ta.value = text; ta.style.height = Math.min(420, Math.max(220, text.split('\n').length * 22)) + 'px';
      var saved = false;
      function store() {
        var m = ta.value.match(/^Subject:\s*(.*)$/m); var rec = { d: new Date().toLocaleDateString(LOCALES[state.lang], { month: 'short', day: 'numeric' }), sub: m ? m[1].slice(0, 80) : SIT_SUBJECT[o.sit], text: ta.value };
        if (!saved) { state.letters.unshift(rec); state.letters = state.letters.slice(0, 12); saved = rec; } else { saved.text = ta.value; saved.sub = rec.sub; }
        save();
      }
      store(); ta.addEventListener('input', function () { store(); });
      scroll();
      setChips(function () {
        var l = [];
        if (!fallback) l.push([t('shorter'), function () { showLetter(out, o, true); }, 'primary']);
        if (o.paste) l.push([t('explainMsg'), function () { explainMsg(o, box.querySelector('.lOut')); }]);
        l.push([t('changeAsk'), function () { askFlow(o.sit, { notes: o.notes }); }]);
        l.push([t('logIt'), function () {
          state.contacts.push({ d: new Date().toISOString().slice(0, 10), w: o.insurer || (T('Insurer', 'Aseguradora', '保险公司')), s: T('Sent a letter: ', 'Envié una carta: ', '已发送信件：') + (saved ? saved.sub : '') }); save(); log('letter logged');
          bot('<p>' + esc(T('Logged in My claim.', 'Anotado en Mi reclamo.', '已记录在“我的理赔”中。')) + '</p>', function () { setChips(function () { return [[t('whatsNext'), function () { bot('<p>' + esc(t('nextTimeline')) + '</p>' + srcRow([10]), function () { setChips(stageChips); }); }]]; }); });
        }]);
        l.push([t('cPerson'), function () { openHandoff('letter'); }]);
        return l;
      });
    };
    if (Date.now() < aiUntil) { done(letterTemplate(o), true); return; }
    api({ mode: 'letter', lang: state.lang, who: o.who, whoName: o.whoName, sit: o.sit, sitLabel: o.sitLabel, role: o.role, ask: o.ask, notes: o.notes, paste: o.paste, name: o.name, claim: o.claim, insurer: o.insurer, short: short })
      .then(function (r) { done(r.text, false); log('letter live', r.text.length + ' chars'); })
      .catch(function (err) { noteAiDown(err && err.code); done(letterTemplate(o), true); });
  }
  var toastTimer = null;
  function toast(msg) {
    var d = document.getElementById('toast');
    if (!d) { d = document.createElement('div'); d.id = 'toast'; d.setAttribute('role', 'status'); document.body.appendChild(d); }
    d.textContent = msg; d.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { d.classList.remove('show'); }, 1600);
  }
  function copyLetter(ta, msgBox) {
    var v = ta.value;
    var ok = function () { toast(T('Copied!', '¡Copiado!', '已复制！')); log('letter copied'); };
    var fail = function () { try { ta.focus(); ta.select(); document.execCommand('copy'); ok(); } catch (e) { msgBox.innerHTML = '<p class="small">' + esc(t('copyFail')) + '</p>'; } };
    try { navigator.clipboard.writeText(v).then(ok, fail); } catch (e) { fail(); }
  }
  function explainMsg(o, msgBox) {
    msgBox.innerHTML = '<p class="small">•••</p>';
    if (Date.now() < aiUntil) { msgBox.innerHTML = '<p class="small">' + esc(t('explainFail')) + '</p>'; return; }
    api({ mode: 'explain', lang: state.lang, paste: o.paste }).then(function (r) {
      msgBox.innerHTML = '<div class="msg bot ai" style="max-width:100%;white-space:pre-wrap">' + esc(r.text) + '</div>'; scroll();
    }).catch(function (err) { noteAiDown(err && err.code); msgBox.innerHTML = '<p class="small">' + esc(t('explainFail')) + '</p>'; });
  }
  function lastTyped() { var x = state.typed.length ? state.typed[state.typed.length - 1] : ''; return x && x.length <= 1200 ? { notes: x } : {}; }
  function replyFlow() { askFlow(SIT_STAGE_REV[state.stage] || 'other'); }
  var SIT_STAGE_REV = { td: 'denied', tl: 'low', ts: 'quiet', sm: 'smoke' };

  /* ---------- trusted help ---------- */
  function helpFlow(topic) {
    if (topic === 'stay') return stayCard();
    log('help flow', topic || '');
    (topic ? function (a, f) { f(); } : bot)('<p>' + esc(T('What kind of help are you looking for?', '¿Qué tipo de ayuda busca?', '您在寻找哪方面的帮助？')) + '</p>', function () {
      var pick = function () {
        var l = [
          [T('Free guides and sample letters', 'Guías y cartas modelo', '指南和信函范本'), function () { helpCard(T('United Policyholders has wildfire claim guides and sample letters.', 'United Policyholders tiene guías y cartas modelo para reclamos por incendios forestales.', 'United Policyholders 提供野火理赔指南和信函范本。'), [T('Its wildfire page has orientation videos, a guide to reading your policy, and videos about living-expense coverage for total losses and standing homes.', 'Su página sobre incendios forestales tiene videos de orientación, una guía para leer su póliza y videos sobre la cobertura de gastos de vida para pérdidas totales y viviendas en pie.', '其野火专页提供入门视频、保单阅读指南，以及关于全损和房屋仍在情况下生活费用保障的视频。'), T('It also has sample letters to ask about living-expense benefits and to request extensions, and a guide to speaking up with your insurer.', 'También tiene cartas modelo para preguntar por los beneficios de gastos de vida y para pedir prórrogas, y una guía para hacerse oír ante su aseguradora.', '还有询问生活费用赔付和申请延期的信函范本，以及与保险公司沟通的指南。'), T('Renters: it lists claim tips for California renters.', 'Inquilinos: incluye consejos de reclamo para inquilinos de California.', '租客：其中列有适用于加州租客的理赔提示。')], [12]); afterHelp(); }],
          [T('A public adjuster', 'Un ajustador público', '公共理赔员（public adjuster）'), function () { helpCard(T('Check a public adjuster before you hire one.', 'Verifique a un ajustador público antes de contratarlo.', '雇用公共理赔员之前，请先核实其资质。'), [T('Take your time. The state says to check that the person is licensed and in good standing.', 'Tómese su tiempo. El estado indica que verifique que la persona tenga licencia y esté en buenos términos.', '不必着急。加州建议您核实此人持有执照且信誉良好。'), T('Ask for the license number and check it with the California Department of Insurance, 1-800-927-4357.', 'Pida el número de licencia y verifíquelo con el Departamento de Seguros de California, 1-800-927-4357.', '请对方提供执照号码，并向加州保险局核实，电话 1-800-927-4357。'), T('Be careful with anyone who contacts you first.', 'Tenga cuidado con quien lo contacte primero.', '对主动联系您的人要多加小心。')], [2]); afterHelp(); }],
          [T('A contractor', 'Un contratista', '承包商'), function () { helpCard(T('Check a contractor’s license before you sign.', 'Verifique la licencia de un contratista antes de firmar.', '签约之前，请先核实承包商的执照。'), [T('Check the license with the Contractors State License Board at 1-800-321-2752 or cslb.ca.gov.', 'Verifique la licencia con la Junta de Licencias de Contratistas del Estado, 1-800-321-2752 o cslb.ca.gov.', '请向加州承包商执照委员会核实执照，电话 1-800-321-2752，网站 cslb.ca.gov。'), T('Get more than one estimate if you can.', 'Obtenga más de un presupuesto si puede.', '如有可能，请取得不止一份报价。'), T('Ask your insurer in writing what it will cover before work starts.', 'Pregunte por escrito a su aseguradora qué cubrirá antes de que empiece el trabajo.', '在施工开始前，请以书面形式询问保险公司将赔付哪些项目。')], [3]); afterHelp(); }],
          [T('Government help (FEMA)', 'Ayuda del gobierno (FEMA)', '政府援助（FEMA）'), function () { helpCard(T('File your insurance claim first, then apply to FEMA.', 'Presente primero su reclamo al seguro y luego solicite a FEMA.', '请先向保险公司提出理赔，再向 FEMA 申请。'), [T('FEMA cannot pay for losses insurance covers, so it only helps with what insurance does not.', 'FEMA no puede pagar pérdidas que cubre el seguro, así que solo ayuda con lo que el seguro no cubre.', 'FEMA 不能赔付保险已覆盖的损失，因此只帮助解决保险不涵盖的部分。'), T('Apply at DisasterAssistance.gov, with the FEMA app, or at 1-800-621-3362. Ask whether you can still apply, since the original deadline for the January 2025 fires has passed.', 'Solicite en DisasterAssistance.gov, con la aplicación de FEMA o al 1-800-621-3362. Pregunte si todavía puede solicitar, pues el plazo original para los incendios de enero de 2025 ya pasó.', '请到 DisasterAssistance.gov、通过 FEMA 应用程序，或致电 1-800-621-3362 申请。请询问是否仍可申请，因为 2025 年 1 月火灾的最初截止日期已过。'), T('Tell FEMA about all of your insurance coverage when you apply.', 'Informe a FEMA de toda su cobertura de seguro al solicitar.', '申请时请向 FEMA 说明您的全部保险。')], [4, 5, 14]); afterHelp(); }]
        ];
        if (isRent()) l.splice(1, 0, [T('Tenant legal help', 'Ayuda legal para inquilinos', '租客法律援助'), function () { helpCard(T('Talk to a tenant attorney or legal aid before you stop paying rent.', 'Hable con un abogado de inquilinos o con asistencia legal antes de dejar de pagar el alquiler.', '在停止付房租之前，请先咨询租客律师或法律援助机构。'), [T('Los Angeles County’s consumer and business affairs office publishes a guide for landlords and tenants after a disaster (dcba.lacounty.gov).', 'La oficina de asuntos del consumidor y de negocios del Condado de Los Ángeles publica una guía para arrendadores e inquilinos después de un desastre (dcba.lacounty.gov).', '洛杉矶县消费者与商业事务局发布了灾后房东与租客指南（dcba.lacounty.gov）。'), T('Keep your lease, your messages with your landlord, and photos of the unit.', 'Conserve su contrato, sus mensajes con su arrendador y fotos de la unidad.', '请保留租约、与房东的往来消息以及房屋照片。')], [13]); afterHelp(); }]);
        return l;
      };
      var PICK = { guides: 0, adjusters: 1, contractor: 2, gov: 3 };
      if (topic && PICK[topic] != null) { var ix = PICK[topic] + (isRent() ? 1 : 0); pick()[ix][1](); } else setChips(pick);
    });
  }
  function afterHelp() {
    setTimeout(function () { setChips(function () { return [[T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('help'); }], [T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }], [T('Another kind of help', 'Otro tipo de ayuda', '其他类型的帮助'), function () { helpFlow(); }]]; }); }, 300);
  }

  /* ---------- typed messages ---------- */
  var HUMAN_RE = /(talk to|speak to|real person|a person|human|agent|call me|hablar con|persona real|una persona|humano|llámenme|llamenme|联系真人|真人|人工|找人)/;
  var STRESS_RE = /(stress|anxious|overwhelm|can.?t cope|too much|estres|estrés|ansios|abrum|demasiado|压力|焦虑|崩溃|受不了)/;
  var FRUST_RE = /(frustrat|not helping|useless|same thing|again and again|give up|giving up|fed up|tired of|angry|no me ayuda|inútil|inutil|lo mismo|me rindo|harto|enojad|没用|没有帮助|放弃|烦死|生气|一样的)/;
  function suggest(id) {
    var rid = isRent() && RENT_MAP[id] ? RENT_MAP[id] : id;
    if (isRent() && !RENT_MAP[id] && id !== 'sm' && id !== 's4') return trouble();
    bot('<p>' + esc(fmtS(T('That sounds like “{s}”. Want me to show those steps?', 'Eso suena a “{s}”. ¿Quiere que le muestre esos pasos?', '这听起来像“{s}”。需要我显示这些步骤吗？'), { s: stageLabel(rid) })) + '</p>', function () {
      setChips(function () { return [[T('Yes, show me', 'Sí, muéstreme', '好，显示出来'), function () { chooseStage(rid); }], [T('No, something else', 'No, otra cosa', '不是，换一个'), function () { setChips(stageChips); }]]; });
    });
  }
  function scripted(t) {
    var x = t.toLowerCase();
    if (/^\s*(hi|hello|hey|hola|buenas|你好|您好)/.test(x)) return bot('<p>' + esc(T('Hello. Where are you in your claim right now?', 'Hola. ¿En qué punto está su reclamo ahora?', '您好。您的理赔目前进行到哪一步？')) + '</p>', function () { setChips(stageChips); });
    if (/(thank|gracias|谢谢|多谢)/.test(x)) return bot('<p>' + esc(T('You are welcome. Tell me if you want to keep going or switch to something else.', 'De nada. Dígame si quiere seguir o cambiar a otra cosa.', '不客气。您想继续还是换个话题，告诉我就好。')) + '</p>', function () { setChips(state.stage && byId(state.stage) ? function () { return [[T('Back to my step', 'Volver a mi paso', '回到我的步骤'), function () { afterStep(); }], [T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }]]; } : stageChips); });
    if (/(smoke|ash|soot|contaminat|humo|ceniza|hollín|hollin|烟|灰)/.test(x)) return suggest('sm');
    if (/(denied|deny|denegad|rechaz|low offer|underpa|lowball|not responding|no respond|ghost|trouble|dispute|appeal|negaron|oferta baja|被拒|拒赔|拒绝|赔得太少|赔付过低|没有回复|不回复)/.test(x)) return trouble();
    if (/(landlord|lease|renter|tenant|deposit|arrendador|inquilin|alquil|房东|租约|租客|押金)/.test(x)) { if (!isRent()) return bot('<p>' + esc(T('It sounds like you may rent. Want me to switch to the renter steps?', 'Parece que usted alquila. ¿Quiere que cambie a los pasos para inquilinos?', '听起来您可能是租客。需要我切换到租客步骤吗？')) + '</p>', function () { setChips(function () { return [[T('Yes, I rent', 'Sí, alquilo', '是的，我是租客'), function () { setRole('rent'); }], [T('No, I own', 'No, soy propietario(a)', '不是，我是房主'), function () { setChips(stageChips); }]]; }); }); return suggest('r5'); }
    if (/(adjuster|disagree|conflict|reversed|different answer|told me|ajustador|no coinciden|distinto|diferente|理赔员|说法不一致|不一致)/.test(x)) return suggest('s4');
    if (/(inventory|belongings|items|list|pertenencias|inventario|artículos|articulos|物品|清单|财物)/.test(x)) return suggest('s3');
    if (/(settle|offer|release|acuerdo|oferta|和解|赔付方案|报价)/.test(x)) return suggest('s5');
    if (/(contractor|rebuild|estimate|living expense|\bale\b|reconstru|contratista|gastos de vida|重建|承包商|生活费)/.test(x)) return suggest('s6');
    if (/(policy|claim number|confirm|póliza|poliza|número de reclamo|保单|理赔编号)/.test(x)) return suggest('s2');
    if (/(just happened|evacuat|first|report|start|acaba de|evacu|primero|reportar|刚刚|撤离|报案)/.test(x)) return suggest('s1');
    if (/(deadline|how long|time limit|plazo|cuánto tiempo|截止|多久|时限)/.test(x)) return bot('<p>' + esc(T('Deadlines depend on your policy and state. Ask your insurer to point to the exact section in writing, or call the California Department of Insurance at 1-800-927-4357.', 'Los plazos dependen de su póliza y de su estado. Pida a su aseguradora que indique por escrito la sección exacta, o llame al Departamento de Seguros de California al 1-800-927-4357.', '时限取决于您的保单和所在州。请让保险公司以书面形式指出具体条款，或致电加州保险局 1-800-927-4357。')) + '</p>' + srcRow([2]), function () { setChips(function () { return [[T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('deadline'); }], [T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }]]; }); });
    if (/(scam|fake|legit|trust|spam|estafa|fraude|诈骗|骗)/.test(x)) return bot('<p>' + esc(T('Good instinct. Only use phone numbers and links from your insurer’s own letters or official government sites. I cannot check individual providers.', 'Buen instinto. Use solo números de teléfono y enlaces de las cartas de su propia aseguradora o de sitios oficiales del gobierno. No puedo verificar a proveedores individuales.', '您的警觉很对。请只使用保险公司自己来信中的电话和链接，或政府官方网站。我无法核实个别服务提供者。')) + '</p>', function () { setChips(function () { return [[T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('trust'); }], [T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }]]; }); });
    if (/(help|impact|affected|lost|burn|palisades|altadena|eaton|wildfire|fire|house|home|ayuda|incendio|casa|perd|帮助|火灾|房子|家)/.test(x)) return bot('<p>' + esc(T('I am sorry you are dealing with this. Where are you in your claim right now?', 'Lamento que esté pasando por esto. ¿En qué punto está su reclamo ahora?', '很抱歉您正在经历这些。您的理赔目前进行到哪一步？')) + '</p>', function () { setChips(stageChips); });
    state.misses++; log('fallback', 'miss ' + state.misses);
    if (state.misses >= 2) {
      return bot('<p>' + esc(T('I am not getting this right. I can keep trying with you, or I can bring in a person so you do not have to keep explaining. You choose.', 'No estoy entendiendo bien. Puedo seguir intentándolo con usted, o puedo llamar a una persona para que no tenga que seguir explicando. Usted elige.', '我没能理解好。我可以继续和您一起尝试，也可以请真人加入，这样您就不必反复解释。由您选择。')) + '</p>', function () {
        setChips(function () { return [[T('Keep trying', 'Seguir intentando', '继续尝试'), function () { state.misses = 0; setChips(stageChips); }], [T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('fallback'); }]]; });
      });
    }
    bot('<p>' + esc(T('Thanks for telling me. I want to get this right. Could you say it another way, or pick the closest option?', 'Gracias por contármelo. Quiero entenderlo bien. ¿Podría decirlo de otra manera o elegir la opción más cercana?', '谢谢您告诉我。我想确保理解正确。您能换种方式说说吗？或者选择最接近的选项？')) + '</p>', function () { setChips(stageChips); });
  }

  /* Live answers come from our own /api/chat (grounded in the source notes on the server). If it is unavailable, the scripted replies above take over. */
  var aiUntil = 0, aiNoted = false;
  function api(body) {
    return fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || ('http_' + r.status)); e.code = j.error || ('http_' + r.status); throw e; }
        return j;
      });
    });
  }
  function noteAiDown(code) {
    aiUntil = Date.now() + (code === 'quota' ? 30 * 60 * 1000 : 3 * 60 * 1000);
    log('live unavailable', code || 'error');
    if (!aiNoted) { aiNoted = true; thread.appendChild(el('div', 'msg note', esc(t(code === 'quota' ? 'quotaNote' : 'liveDown')))); scroll(); }
  }
  function renderAI(text) {
    var cited = [];
    var html = esc(text).replace(/\n/g, '<br>').replace(/\[(\d{1,2})\]/g, function (m, d) {
      var n = +d; if (!SOURCES[n]) return '';
      if (cited.indexOf(n) === -1) cited.push(n);
      return '<sup class="cite"><a href="' + SOURCES[n].url + '" target="_blank" rel="noopener noreferrer" title="' + esc(SOURCES[n].title) + '">' + n + '</a></sup>';
    });
    cited.sort(function (a, b) { return a - b; });
    return { html: html + (cited.length ? srcRow(cited) : ''), cited: cited };
  }
  function afterAI(extra) {
    setChips(function () {
      var l = (extra || []).slice();
      if (state.stage && byId(state.stage)) l.push([T('Back to my step', 'Volver a mi paso', '回到我的步骤'), function () { afterStep(); }]); else l.push([T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }]);
      l.push([T('Talk to a person', 'Hablar con una persona', '联系真人'), function () { openHandoff('after-ai'); }]);
      return l;
    });
  }
  /* The model may end with one action tag. We turn it into one extra button, never an automatic jump. */
  function actionChip(a) {
    if (!a) return [];
    var x = a.arg, rid;
    if (a.type === 'letter') { var pre = lastTyped(); return [[t('cWriteLetter'), function () { askFlow(x, pre); }, 'primary']]; }
    if (a.type === 'stage') {
      rid = isRent() && RENT_MAP[x] ? RENT_MAP[x] : x; if (!byId(rid)) return [];
      return [[t('showSteps') + ': ' + stageLabel(rid), function () { chooseStage(rid); }, 'primary']];
    }
    if (a.type === 'help') return [[x === 'stay' ? t('cStay') : (x === 'gov' ? t('cGov') : t('official')), function () { helpFlow(x); }, 'primary']];
    if (a.type === 'handoff') return [[t('cPerson'), function () { openHandoff('ai'); }, 'primary']];
    if (a.type === 'dates') return [[T('Build my dates', 'Armar mis fechas', '生成我的日期'), function () { dateFlow(); }, 'primary']];
    if (a.type === 'inventory') return [[T('Start my list', 'Empezar mi lista', '开始我的清单'), function () { inventoryFlow(); }, 'primary']];
    if (a.type === 'log') return [[T('Log a contact', 'Registrar un contacto', '记录一次联系'), function () { contactFlow(); }, 'primary']];
    if (a.type === 'words') return [[t('cWords'), function () { wordsFlow(); }, 'primary']];
    if (a.type === 'breathe') return [[t('breatheOffer'), function () { breathe(); }, 'primary']];
    return [];
  }
  function askAI(txt) {
    chips.innerHTML = '';
    var m = el('div', 'msg bot ai typing', '•••'); thread.appendChild(m); scroll();
    var stage = state.stage && byId(state.stage) ? L(byId(state.stage).label) : '';
    var msgs = state.chat.slice(-6).concat([{ role: 'user', content: txt }]);
    api({ mode: 'chat', lang: state.lang, role: state.role, who: state.who, whoName: state.whoName, stageLabel: stage, stress: state.stress, messages: msgs })
      .then(function (r) {
        var out = renderAI(r.text);
        m.className = 'msg bot ai'; m.innerHTML = out.html; scroll();
        state.chat.push({ role: 'user', content: txt }, { role: 'assistant', content: r.text });
        log('answered live', r.text.length + ' chars, sources ' + (out.cited.join(',') || 'none') + (r.action ? ', action ' + r.action.type + (r.action.arg ? ':' + r.action.arg : '') : ''));
        afterAI(actionChip(r.action));
      })
      .catch(function (err) { m.remove(); noteAiDown(err && err.code); scripted(txt); });
  }
  var INSURER_RE = /(state farm|allstate|progressive|farmers|mercury|geico|liberty mutual|usaa|chubb|travelers|nationwide|american family|safeco|hartford)/i;
  function freeText(txt) {
    var x = txt.toLowerCase();
    state.typed.push(txt); log('typed', txt.length + ' chars');
    if (HUMAN_RE.test(x)) return openHandoff('typed');
    if (STRESS_RE.test(x)) { state.stressAsked = true; return offerBreath(true); }
    if (FRUST_RE.test(x)) return frustrated();
    if (INSURER_RE.test(x) && /(form|questionnaire|document|paperwork|require|need|step|portal|checklist|formulario|documento|requisito|表格|文件|材料)/.test(x)) {
      var preI = lastTyped(); return bot('<p>' + esc(t('insurerNote')) + '</p>', function () { setChips(function () { return [[t('cWriteLetter'), function () { askFlow('other', preI); }, 'primary'], [t('cPerson'), function () { openHandoff('insurer'); }]]; }); });
    }
    if (Date.now() >= aiUntil) return askAI(txt);
    return scripted(txt);
  }

    form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value.trim(); if (!t) return;
    input.value = ''; user(t); freeText(t);
  });
  /* ---------- plain-language insurance words ---------- */
  function wordsFlow() {
    log('words');
    var terms = [
      [M('Deductible', 'Deducible', '免赔额'), M('The part of a covered loss you pay before the insurer pays. Example: a $20,000 deductible on a $100,000 covered loss leaves up to $80,000 for the insurer to pay, within your limits. Some wildfire deductibles are a percentage of the coverage amount.', 'La parte de una pérdida cubierta que usted paga antes de que pague la aseguradora. Ejemplo: un deducible de $20,000 en una pérdida cubierta de $100,000 deja hasta $80,000 a cargo de la aseguradora, dentro de sus límites. Algunos deducibles por incendio son un porcentaje del monto asegurado.', '发生承保损失时，保险公司赔付之前由您自己承担的部分。例如：10 万美元的承保损失，免赔额 2 万美元，保险公司最多赔付 8 万美元（在保额范围内）。部分野火免赔额按保额的百分比计算。')],
      [M('Actual cash value and replacement cost', 'Valor real en efectivo y costo de reposición', '实际现金价值与重置成本'), M('Actual cash value is the cost to replace something minus wear and age (depreciation). Replacement cost is the cost to replace it new. Many policies pay the first amount up front and the rest after you repair or replace. California gives at least 36 months from the first actual cash value payment to collect full replacement cost. [1]', 'El valor real en efectivo es el costo de reponer algo menos el desgaste y la edad (depreciación). El costo de reposición es lo que cuesta reponerlo nuevo. Muchas pólizas pagan primero la primera cifra y el resto después de que repare o reponga. California da al menos 36 meses desde el primer pago de valor real en efectivo para cobrar el costo total de reposición. [1]', '实际现金价值是更换某物的成本减去损耗和年限（折旧）。重置成本是购买全新同类物品的成本。许多保单先赔付前者，待您修复或更换后再赔付其余部分。加州规定，自第一笔实际现金价值赔付起至少有 36 个月来领取全额重置成本。[1]')],
      [M('Additional living expense (ALE)', 'Gastos adicionales de vida (ALE)', '额外生活费用（ALE）'), M('Extra costs when your home is not safe to live in because of a covered event such as wildfire, like a hotel, food and clothing. Keep every receipt. Renters policies often pay only until you can move back or have had reasonable time to find a rental. [11]', 'Costos extra cuando su vivienda no es segura por un evento cubierto como un incendio forestal, por ejemplo hotel, comida y ropa. Guarde todos los recibos. Las pólizas de inquilinos suelen pagar solo hasta que pueda volver o haya tenido un tiempo razonable para encontrar un alquiler. [11]', '因野火等承保事件导致住房不安全时产生的额外费用，例如酒店、餐饮和衣物。请保留所有收据。租客保单通常只赔付到您可以搬回去，或已有合理时间另找租房为止。[11]')],
      [M('Proof of claim', 'Prueba del reclamo', '理赔证明'), M('The documents that show your loss. The insurer’s 40-day window to accept or deny starts after it receives them. [10]', 'Los documentos que muestran su pérdida. El plazo de 40 días de la aseguradora para aceptar o rechazar empieza cuando los recibe. [10]', '证明您损失的文件。保险公司接受或拒绝的 40 天期限，从收到这些文件之后开始计算。[10]')],
      [M('Public adjuster', 'Ajustador público', '公共理赔员'), M('A person you hire, for a fee, to help with your claim. Take your time, and check that the person is licensed and in good standing. [2]', 'Una persona que usted contrata, por una tarifa, para ayudarle con su reclamo. Tómese su tiempo y verifique que tenga licencia y esté en buenos términos. [2]', '您付费聘请来协助处理理赔的人。请不要着急，并核实对方持有执照且信誉良好。[2]')],
      [M('Policy limits', 'Límites de la póliza', '保单额度'), M('The most your policy pays for each type of loss, such as the dwelling, your belongings and living expenses. Ask your insurer in writing to confirm yours.', 'Lo máximo que paga su póliza por cada tipo de pérdida, como la vivienda, sus pertenencias y los gastos de vida. Pida por escrito a su aseguradora que confirme los suyos.', '保单对每类损失的最高赔付额，例如房屋、财物和生活费用。请以书面形式让保险公司确认您的额度。')]
    ];
    var cites = [];
    var html = '<h2>' + esc(t('wordsTitle')) + '</h2><dl class="words">' + terms.map(function (x) {
      var d = esc(L(x[1])).replace(/\[(\d{1,2})\]/g, function (m, n) { if (cites.indexOf(+n) === -1) cites.push(+n); return '<sup class="cite"><a href="' + SOURCES[+n].url + '" target="_blank" rel="noopener noreferrer" title="' + esc(SOURCES[+n].title) + '">' + n + '</a></sup>'; });
      return '<dt>' + esc(L(x[0])) + '</dt><dd>' + d + '</dd>';
    }).join('') + '</dl><p class="small">' + esc(t('wordsNote')) + '</p>' + srcRow(cites.sort(function (a, b) { return a - b; }));
    var c = el('div', 'msg bot card'); c.innerHTML = html; thread.appendChild(c); scroll();
    setChips(function () { return [[t('cWriteLetter'), function () { askFlow('other'); }], [T('Pick a stage', 'Elegir una etapa', '选择阶段'), function () { setChips(stageChips); }], [t('cPerson'), function () { openHandoff('words'); }]]; });
  }
  function stayCard() {
    log('stay card');
    helpCard(t('stayTitle'), [
      T('If your home is not safe to live in, your policy may pay additional living expenses such as a hotel, food and clothing. Keep every receipt. [11]', 'Si su vivienda no es segura para vivir, su póliza puede pagar gastos adicionales de vida, como hotel, comida y ropa. Guarde todos los recibos. [11]', '如果您的房子不安全，无法居住，保单可能赔付额外生活费用，例如酒店、餐饮和衣物。请保留所有收据。[11]'),
      T('For a covered total loss in a state of emergency, you can ask your insurer to advance at least four months of living expenses. Ask in writing. [1]', 'En una pérdida total cubierta durante un estado de emergencia, puede pedir a su aseguradora que adelante al menos cuatro meses de gastos de vida. Hágalo por escrito. [1]', '在紧急状态下发生承保的全损时，您可以要求保险公司预付至少四个月的生活费用。请以书面形式提出。[1]'),
      T('FEMA may help with temporary housing if you are displaced: short-term hotel stays first, then rental help. File your insurance claim first. [14][4]', 'FEMA puede ayudar con vivienda temporal si usted está desplazado(a): primero estadías cortas en hotel y luego ayuda con el alquiler. Presente primero su reclamo al seguro. [14][4]', '如果您流离失所，FEMA 可能提供临时住房援助：先是短期酒店住宿，之后是租金援助。请先提出保险理赔。[14][4]'),
      T('Apply at DisasterAssistance.gov, with the FEMA app, or at 1-800-621-3362. The original deadline for the January 2025 fires has passed, so ask FEMA whether you can still apply or appeal. [14]', 'Solicite en DisasterAssistance.gov, con la aplicación de FEMA o al 1-800-621-3362. El plazo original para los incendios de enero de 2025 ya pasó, así que pregunte a FEMA si aún puede solicitar o apelar. [14]', '请在 DisasterAssistance.gov、通过 FEMA 应用或致电 1-800-621-3362 申请。2025 年 1 月火灾的原申请期限已过，请询问 FEMA 是否仍可申请或申诉。[14]')
    ].map(function (s) { return s.replace(/\s*\[\d+\]/g, ''); }), [11, 1, 14, 4]);
    afterHelp();
  }
  function extraDrawer() {
    var h = '<h3 class="dh">' + esc(t('secLetters')) + '</h3>';
    if (!state.letters.length) h += '<p class="small faint">' + esc(t('none')) + '</p>';
    else h += state.letters.map(function (l, i) { return '<details><summary><span>' + esc(l.d + ' · ' + l.sub) + '</span></summary><div class="letter">' + esc(l.text) + '</div><div class="inl"><button type="button" class="chip" data-act="cl" data-i="' + i + '">' + esc(t('copyAgain')) + '</button><button type="button" class="chip" data-act="dl" data-i="' + i + '">' + esc(t('del')) + '</button></div></details>'; }).join('');
    h += '<h3 class="dh">' + esc(t('secLog')) + '</h3>';
    if (!state.contacts.length) h += '<p class="small faint">' + esc(t('none')) + '</p>';
    else h += '<ul class="invList">' + state.contacts.map(function (c) { return '<li><span>' + esc(c.d + ' · ' + c.w) + '</span><span>' + esc(c.s) + '</span></li>'; }).join('') + '</ul>';
    if (state.plan) h += '<h3 class="dh">' + esc(t('secDates')) + '</h3><div class="letter">' + esc(state.plan) + '</div>';
    return h;
  }
  document.getElementById('drawerBody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var i = +b.getAttribute('data-i'), a = b.getAttribute('data-act');
    if (a === 'cl' && state.letters[i]) { try { navigator.clipboard.writeText(state.letters[i].text).then(function () { b.textContent = t('copied'); }, function () {}); } catch (err) {} }
    if (a === 'dl') { state.letters.splice(i, 1); save(); renderDrawer(); }
  });
  document.getElementById('copySummary').addEventListener('click', function () {
    var b = this; try { navigator.clipboard.writeText(claimSummary(false)).then(function () { b.textContent = t('copied'); setTimeout(function () { b.textContent = t('copySummary'); }, 1800); }, function () {}); } catch (e) {}
  });

  /* Language buttons */
  document.querySelectorAll('#langSeg button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); }); });

  /* Theme: follows the device by default, with a toggle. */
  var root = document.documentElement;
  var saved = null; try { saved = localStorage.getItem('cr-theme'); } catch (e) {}
  root.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
  document.getElementById('themeBtn').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); log('theme', next);
    try { localStorage.setItem('cr-theme', next); } catch (e) {}
  });

  /* Researcher log: press Ctrl+Shift+L to show or hide. */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) { e.preventDefault(); document.getElementById('logwrap').classList.toggle('open'); }
    if (e.key === 'Escape') { overlay.classList.remove('open'); drawerOv.classList.remove('open'); closeChats(); closeMenu(); }
  });
  document.getElementById('copyLog').addEventListener('click', function () {
    try { navigator.clipboard.writeText(events.join('\n')).then(function () {}, function () {}); } catch (err) {}
  });

  /* Menu, chats and saving */
  menuBtn.addEventListener('click', function (e) { e.stopPropagation(); var open = !menuEl.classList.contains('open'); menuEl.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  menuEl.addEventListener('click', function (e) { if (e.target.closest('.mi')) closeMenu(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.menuwrap')) closeMenu(); });
  document.getElementById('newChatBtn').addEventListener('click', newChat);
  document.getElementById('otherBtn').addEventListener('click', function () { newChat(); thread.innerHTML = ''; whoCard(); log('who picker'); });
  document.getElementById('newFromList').addEventListener('click', newChat);
  sideBtn.addEventListener('click', function () { setSide(true, true); });
  document.getElementById('sideBack').addEventListener('click', function () { setSide(false, false); });
  document.getElementById('chatTitle').addEventListener('click', openChats);
  document.getElementById('closeC').addEventListener('click', function () { setSide(false, true); });
  document.getElementById('clist').addEventListener('click', function (e) {
    var d = e.target.closest('.cdel');
    if (d) {
      if (d.getAttribute('data-arm')) deleteChat(d.getAttribute('data-del'));
      else { d.setAttribute('data-arm', '1'); d.textContent = T('Delete?', '¿Eliminar?', '删除？'); }
      return;
    }
    var it = e.target.closest('.citem'); if (it) switchChat(it.getAttribute('data-id'));
  });
  var saveTimer = null;
  new MutationObserver(function () { clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(); renderChats(); }, 700); }).observe(thread, { childList: true });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });

  applyLang();
  log('session started', 'lang ' + state.lang);
  var bootChat = curChat();
  setChatbar();
  var sideSaved = null; try { sideSaved = localStorage.getItem('ns-side'); } catch (e) {}
  setSide(!isNarrow() && sideSaved !== '0', false); renderChats();
  if (bootChat) resumeChat(bootChat); else startChat('me', '');
})();
