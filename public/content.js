/* Sourced content for Next Step, moved unchanged from the v4 app. Facts here must match public/sources.json
   (the [n] numbers and src lists point into it). The English ask sentence goes into the letter, so it stays English;
   a Spanish reader sees our own Spanish copy of it (ASK_ES). */
(function () {
  function M(a, b, c) { return { en: a, es: b, zh: c }; }
  var ASKS = {
    denied: [
      ['a1', 'Please explain your decision in writing and name the policy sections it relies on.', M('Explain the decision in writing, with the policy sections', 'Explicar la decisión por escrito, con las secciones de la póliza', '书面解释该决定，并指明保单条款')],
      ['a2', 'Please send me the documents in my claim file, including the adjuster’s report, the estimate and the photos.', M('Send me my claim file documents', 'Enviarme los documentos de mi expediente', '把我的理赔档案文件发给我')],
      ['a3', 'Please review your decision again. I am sending documents that support my claim.', M('Review the decision again with my proof', 'Revisar la decisión de nuevo con mis pruebas', '结合我的证明重新审查该决定')]
    ],
    low: [
      ['a1', 'Please explain in writing how you calculated the offer, line by line, and what it does not include.', M('Show how the number was figured, line by line', 'Mostrar cómo se calculó la cifra, partida por partida', '逐项说明金额是怎么算出来的')],
      ['a2', 'Please review the second contractor estimate I am sending with this letter and tell me in writing what differs from your estimate.', M('Review my own contractor’s estimate', 'Revisar el presupuesto de mi propio contratista', '获取第二份承包商报价')],
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
      ['a1', 'Please list in writing the documents, forms and information you need from me to process my claim.', M('List what you need from me to move my claim forward', 'Enumerar lo que necesitan de mí para avanzar mi reclamo', '列出推进我的理赔所需的材料')],
      ['a2', 'Please confirm in writing, once you receive the documents I am sending, whether you need anything else from me.', M('Confirm nothing else is needed', 'Confirmar que no necesitan nada más', '确认不再需要其他材料')]
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
  /* The subject line of each letter, set from the ask so it always says what the letter asks for. */
  var ASK_SUBJECT = {
    denied: { a1: 'Request for a written explanation of the claim decision', a2: 'Request for copies of my claim file', a3: 'Request to review the claim decision again' },
    low: { a1: 'Request for a line-by-line explanation of the settlement offer', a2: 'Request to review my contractor estimate', a3: 'Request to confirm my policy limits' },
    quiet: { a1: 'Request for a written update on my claim', a2: 'Request for a claims supervisor to review my claim', a3: 'Request to confirm the deadlines on my claim' },
    smoke: { a1: 'Request for a written plan for the smoke and ash investigation', a2: 'Request to confirm payment for smoke and ash testing' },
    other: { a1: 'Request for a list of what you need from me', a2: 'Request to confirm nothing else is needed' },
    fu: 'Confirming our conversation',
    nr: 'Following up on my earlier letter'
  };
  var SIT_STAGE = { denied: 'td', low: 'tl', quiet: 'ts', smoke: 'sm', other: 's4' };
  var STAGES = {
    s1: { src: [1, 2, 4], label: M('The fire just happened', 'El incendio acaba de ocurrir', '火灾刚刚发生'),
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
  var WORDS = [
      [M('Deductible', 'Deducible', '免赔额'), M('The part of a covered loss you pay before the insurer pays. Example: a $20,000 deductible on a $100,000 covered loss leaves up to $80,000 for the insurer to pay, within your limits. Some wildfire deductibles are a percentage of the coverage amount.', 'La parte de una pérdida cubierta que usted paga antes de que pague la aseguradora. Ejemplo: un deducible de $20,000 en una pérdida cubierta de $100,000 deja hasta $80,000 a cargo de la aseguradora, dentro de sus límites. Algunos deducibles por incendio son un porcentaje del monto asegurado.', '发生承保损失时，保险公司赔付之前由您自己承担的部分。例如：10 万美元的承保损失，免赔额 2 万美元，保险公司最多赔付 8 万美元（在保额范围内）。部分野火免赔额按保额的百分比计算。')],
      [M('Actual cash value and replacement cost', 'Valor real en efectivo y costo de reposición', '实际现金价值与重置成本'), M('Actual cash value is the cost to replace something minus wear and age (depreciation). Replacement cost is the cost to replace it new. Many policies pay the first amount up front and the rest after you repair or replace. California gives at least 36 months from the first actual cash value payment to collect full replacement cost. [1]', 'El valor real en efectivo es el costo de reponer algo menos el desgaste y la edad (depreciación). El costo de reposición es lo que cuesta reponerlo nuevo. Muchas pólizas pagan primero la primera cifra y el resto después de que repare o reponga. California da al menos 36 meses desde el primer pago de valor real en efectivo para cobrar el costo total de reposición. [1]', '实际现金价值是更换某物的成本减去损耗和年限（折旧）。重置成本是购买全新同类物品的成本。许多保单先赔付前者，待您修复或更换后再赔付其余部分。加州规定，自第一笔实际现金价值赔付起至少有 36 个月来领取全额重置成本。[1]')],
      [M('Additional living expense (ALE)', 'Gastos adicionales de vida (ALE)', '额外生活费用（ALE）'), M('Extra costs when your home is not safe to live in because of a covered event such as wildfire, like a hotel, food and clothing. Keep every receipt. Renters policies often pay only until you can move back or have had reasonable time to find a rental. [11]', 'Costos extra cuando su vivienda no es segura por un evento cubierto como un incendio forestal, por ejemplo hotel, comida y ropa. Guarde todos los recibos. Las pólizas de inquilinos suelen pagar solo hasta que pueda volver o haya tenido un tiempo razonable para encontrar un alquiler. [11]', '因野火等承保事件导致住房不安全时产生的额外费用，例如酒店、餐饮和衣物。请保留所有收据。租客保单通常只赔付到您可以搬回去，或已有合理时间另找租房为止。[11]')],
      [M('Proof of claim', 'Prueba del reclamo', '理赔证明'), M('The documents that show your loss. The insurer’s 40-day window to accept or deny starts after it receives them. [10]', 'Los documentos que muestran su pérdida. El plazo de 40 días de la aseguradora para aceptar o rechazar empieza cuando los recibe. [10]', '证明您损失的文件。保险公司接受或拒绝的 40 天期限，从收到这些文件之后开始计算。[10]')],
      [M('Public adjuster', 'Ajustador público', '公共理赔员'), M('A person you hire, for a fee, to help with your claim. Take your time, and check that the person is licensed and in good standing. [2]', 'Una persona que usted contrata, por una tarifa, para ayudarle con su reclamo. Tómese su tiempo y verifique que tenga licencia y esté en buenos términos. [2]', '您付费聘请来协助处理理赔的人。请不要着急，并核实对方持有执照且信誉良好。[2]')],
      [M('Policy limits', 'Límites de la póliza', '保单额度'), M('The most your policy pays for each type of loss, such as the dwelling, your belongings and living expenses. Ask your insurer in writing to confirm yours.', 'Lo máximo que paga su póliza por cada tipo de pérdida, como la vivienda, sus pertenencias y los gastos de vida. Pida por escrito a su aseguradora que confirme los suyos.', '保单对每类损失的最高赔付额，例如房屋、财物和生活费用。请以书面形式让保险公司确认您的额度。')]
    ];

  /* Call and visit sheets. Every line is fixed text with its source in public/sources.json, or marked general:
     general guidance that no source we hold states (listed for review in docs/DESIGN.md). The assistant only
     writes what to say first and the points taken from the person's own notes. */
  function G(t, src, only) { var o = { t: t, src: src || [] }; if (!src) o.general = true; if (only) o.only = only; return o; }
  var SHEETS = {
    call: {
      title: 'Call sheet',
      meta: 'For a phone call with your insurer. Keep it open while you talk and fill in the log as you go.',
      sections: [
        { h: 'Before you call', items: [
          G('Have your policy and its declarations page in front of you, so you can check any limit they mention.', [19]),
          G('Have your claim number and something to write with.'),
          G('Open a fresh page in your claim diary for this call.', [16]),
          G('If you would rather speak Spanish, ask at the start of the call whether they can give you an interpreter.', null, ['es'])
        ] },
        { h: 'What to say first', say: true },
        { h: 'What to ask for', ask: true, items: [
          G('If they offer to settle on the call, you do not have to agree then. Ask for the offer in writing so you can review it with your policy.', [18], ['low']),
          G('Ask how they will inspect and test for smoke and ash, and who will do it.', [20], ['smoke']),
          G('Ask when you will hear back, and agree on a date.', [19], ['quiet']),
          G('If they say something is excluded, limited or has conditions, ask them to point to the exact part of your policy.', [16]),
          G('Ask for the name, job title and phone number of the person you speak with, and their supervisor’s name.', [19]),
          G('Ask them to put any answer or promise in writing.', [17])
        ] },
        { h: 'While you talk', items: [
          G('Write down the date, the time, who you spoke with and what was said. The log below is for that.', [18, 19]),
          G('Stay calm and polite. Assume anything you say may go into their records.', [17]),
          G('If they ask for a recorded statement, you can wait until you understand your rights. If you agree to one, you can record it yourself too.', [19])
        ] },
        { h: 'After the call', followup: true, items: [
          G('Send a short email that confirms what was said and anything they promised. I can write it from your log.', [17, 18])
        ] }
      ],
      log: [['date', 'Date', 'date'], ['time', 'Time', 'time'], ['who', 'Who you spoke with', 'text', 'Name and job title'], ['phone', 'Their phone number', 'tel'], ['said', 'What they said', 'long'], ['next', 'What they will do, and by when', 'long']]
    },
    visit: {
      title: 'Visit sheet',
      meta: 'For the adjuster’s visit to your home. Keep it with you and fill in the log before they leave.',
      sections: [
        { h: 'What to have ready', items: [
          G('Your policy and its declarations page.', [19]),
          G('Your own contractor’s estimate, if you have one. The insurer’s estimate can have errors or miss local costs.', [16]),
          G('Receipts for living costs since the fire, such as hotel bills.', [18]),
          G('A list of the damage, room by room, so nothing is missed.'),
          G('Bills for any emergency repairs you have already paid for.'),
          G('If you would rather speak Spanish, ask before the visit whether they can send someone who speaks Spanish or an interpreter.', null, ['es'])
        ] },
        { h: 'What to say when they arrive', say: true },
        { h: 'What to show them and ask', items: [
          G('Show them all of the damage, including smoke, soot and ash that is hard to see.', [20], ['standing']),
          G('Ask how they will inspect and test for smoke and ash, and who will do it.', [20], ['standing']),
          G('If anyone in the home has asthma or allergies, tell the adjuster.', [21], ['standing']),
          G('Ask for a written scope of work: the repairs they believe are needed.', [19]),
          G('If they say something is excluded or limited, ask them to show you the part of the policy.', [16]),
          G('If they offer to settle on the spot, you do not have to sign then. Ask for the offer in writing and review your policy first.', [18]),
          G('Ask for their name, company and phone number.', [19]),
          G('If you rent, your own policy covers your belongings and living costs. Your landlord’s insurance does not cover your belongings.', [15], ['rent'])
        ] },
        { h: 'What to photograph', items: [
          G('All the damage you can see, before any cleanup.', [20, 18], ['standing']),
          G('The roof, stucco and siding, windows, plumbing, heating and ducts, and interior walls.', [21], ['standing']),
          G('What is left of the home and your belongings, in photos and video, before any debris removal.', [22, 18], ['lost']),
          G('Old photos of the home help you remember what you had.', [22], ['lost']),
          G('Keep damaged items until they have been photographed.', [7]),
          G('Only go where it is safe.', [7])
        ] },
        { h: 'While they are there', items: [
          G('Take notes during the visit. The log below is for that.', [20]),
          G('For a serious loss, one look by their adjuster is rarely enough. You may need your own contractor or a specialist too.', [21])
        ] },
        { h: 'After the visit', followup: true, items: [
          G('Send a short email that confirms what the adjuster said and what happens next. I can write it from your log.', [18])
        ] }
      ],
      log: [['date', 'Date', 'date'], ['time', 'Time', 'time'], ['who', 'Adjuster', 'text', 'Name and company'], ['phone', 'Their phone number', 'tel'], ['looked', 'What they looked at', 'long'], ['said', 'What they said', 'long'], ['next', 'What happens next, and by when', 'long']]
    }
  };
  /* The one ask of a follow-up email after a call or a visit. Sourced: confirm what was said in writing [17][18]. */
  var FOLLOWUP = ['fu', 'Please confirm in writing that this summary of our conversation is correct, or tell me in writing what is different.', M('Confirm what was said', 'Confirmar lo que se dijo', '确认谈话内容')];

  /* The one ask of a follow-up letter when an earlier letter got no reply. General guidance, flagged for review like the other follow-up. */
  var NOREPLY = ['nr', 'Please respond to the request in my earlier letter.', M('Answer my earlier letter', 'Responder a mi carta anterior', '回复我之前的信')];

  /* Spanish (an unreviewed draft, listed for a native speaker in docs/DESIGN.md).
     Letters to the insurer stay in English. These are the Spanish copy of each fixed English line, written once by
     us so the model never translates the ask or the subject. */
  var ASK_ES = {
    denied: { a1: 'Les pido que expliquen su decisión por escrito e indiquen las secciones de la póliza en las que se basa.', a2: 'Les pido que me envíen los documentos de mi expediente de reclamo, incluidos el informe del ajustador, el presupuesto y las fotos.', a3: 'Les pido que revisen su decisión de nuevo. Les envío documentos que respaldan mi reclamo.' },
    low: { a1: 'Les pido que expliquen por escrito cómo calcularon la oferta, partida por partida, y qué no incluye.', a2: 'Les pido que revisen el segundo presupuesto de contratista que envío con esta carta y me indiquen por escrito en qué se diferencia de su presupuesto.', a3: 'Les pido que confirmen por escrito los límites de la póliza que se aplican a mi vivienda, mis pertenencias y mis gastos de vida.' },
    quiet: { a1: 'Les pido que me envíen por escrito una actualización del estado de mi reclamo y del siguiente paso.', a2: 'Les pido que un supervisor de reclamos revise mi reclamo y se comunique conmigo.', a3: 'Les pido que confirmen por escrito los plazos que se aplican a mi reclamo.' },
    smoke: { a1: 'Les pido que expliquen por escrito cómo investigarán los daños por humo y ceniza en mi vivienda, incluidas las pruebas.', a2: 'Les pido que confirmen por escrito si pagarán las pruebas de mi vivienda hechas por un profesional calificado, y qué necesitan de mí.' },
    other: { a1: 'Les pido que indiquen por escrito los documentos, formularios e información que necesitan de mí para tramitar mi reclamo.', a2: 'Les pido que confirmen por escrito, una vez que reciban los documentos que les envío, si necesitan algo más de mí.' },
    fu: 'Les pido que confirmen por escrito que este resumen de nuestra conversación es correcto, o que me indiquen por escrito qué es diferente.',
    nr: 'Les pido que respondan a la solicitud de mi carta anterior.'
  };
  var ASK_SUBJECT_ES = {
    denied: { a1: 'Solicitud de una explicación por escrito de la decisión sobre el reclamo', a2: 'Solicitud de copias de mi expediente de reclamo', a3: 'Solicitud para revisar de nuevo la decisión sobre el reclamo' },
    low: { a1: 'Solicitud de una explicación partida por partida de la oferta de liquidación', a2: 'Solicitud para revisar el presupuesto de mi contratista', a3: 'Solicitud para confirmar los límites de mi póliza' },
    quiet: { a1: 'Solicitud de una actualización por escrito de mi reclamo', a2: 'Solicitud de que un supervisor de reclamos revise mi reclamo', a3: 'Solicitud para confirmar los plazos de mi reclamo' },
    smoke: { a1: 'Solicitud de un plan por escrito para investigar el humo y la ceniza', a2: 'Solicitud para confirmar el pago de las pruebas de humo y ceniza' },
    other: { a1: 'Solicitud de una lista de lo que necesitan de mí', a2: 'Solicitud para confirmar que no necesitan nada más' },
    fu: 'Confirmación de nuestra conversación',
    nr: 'Seguimiento de mi carta anterior'
  };
  var SIT_SUBJECT_ES = {
    denied: 'Solicitud de una explicación por escrito de la decisión sobre el reclamo',
    low: 'Solicitud de una explicación por escrito de la oferta de liquidación',
    quiet: 'Solicitud de una actualización por escrito de mi reclamo',
    smoke: 'Solicitud de una respuesta por escrito sobre la investigación del humo y la ceniza',
    other: 'Solicitud sobre mi reclamo'
  };
  /* Every fixed line of the call and visit sheets, in Spanish. Keyed by the English, so the sourced English stays the
     one place a line is defined. */
  var SHEET_ES = {
    'Call sheet': 'Hoja para la llamada',
    'Visit sheet': 'Hoja para la visita',
    'For a phone call with your insurer. Keep it open while you talk and fill in the log as you go.': 'Para una llamada con su aseguradora. Téngala abierta mientras habla y llene el registro sobre la marcha.',
    'For the adjuster’s visit to your home. Keep it with you and fill in the log before they leave.': 'Para la visita del ajustador a su vivienda. Llévela consigo y llene el registro antes de que se vaya.',
    'Before you call': 'Antes de llamar',
    'What to say first': 'Qué decir primero',
    'What to ask for': 'Qué pedir',
    'While you talk': 'Mientras habla',
    'After the call': 'Después de la llamada',
    'What to have ready': 'Qué tener listo',
    'What to say when they arrive': 'Qué decir cuando llegue',
    'What to show them and ask': 'Qué mostrar y qué preguntar',
    'What to photograph': 'Qué fotografiar',
    'While they are there': 'Durante la visita',
    'After the visit': 'Después de la visita',
    'Have your policy and its declarations page in front of you, so you can check any limit they mention.': 'Tenga a mano su póliza y su página de declaraciones, para revisar cualquier límite que mencionen.',
    'Have your claim number and something to write with.': 'Tenga su número de reclamo y algo con qué escribir.',
    'Open a fresh page in your claim diary for this call.': 'Abra una página nueva en su diario del reclamo para esta llamada.',
    'If they offer to settle on the call, you do not have to agree then. Ask for the offer in writing so you can review it with your policy.': 'Si le ofrecen un acuerdo durante la llamada, no tiene que aceptarlo en ese momento. Pida la oferta por escrito para revisarla con su póliza.',
    'Ask how they will inspect and test for smoke and ash, and who will do it.': 'Pregunte cómo van a inspeccionar y hacer pruebas de humo y ceniza, y quién lo hará.',
    'Ask when you will hear back, and agree on a date.': 'Pregunte cuándo tendrá noticias y acuerden una fecha.',
    'If they say something is excluded, limited or has conditions, ask them to point to the exact part of your policy.': 'Si le dicen que algo está excluido, limitado o tiene condiciones, pida que le indiquen la parte exacta de su póliza.',
    'Ask for the name, job title and phone number of the person you speak with, and their supervisor’s name.': 'Pida el nombre, el cargo y el teléfono de la persona con quien habla, y el nombre de su supervisor.',
    'Ask them to put any answer or promise in writing.': 'Pida que pongan por escrito cualquier respuesta o promesa.',
    'Write down the date, the time, who you spoke with and what was said. The log below is for that.': 'Anote la fecha, la hora, con quién habló y lo que se dijo. El registro de abajo es para eso.',
    'Stay calm and polite. Assume anything you say may go into their records.': 'Mantenga la calma y la cortesía. Suponga que todo lo que diga puede quedar en sus registros.',
    'If they ask for a recorded statement, you can wait until you understand your rights. If you agree to one, you can record it yourself too.': 'Si le piden una declaración grabada, puede esperar hasta entender sus derechos. Si acepta darla, usted también puede grabarla.',
    'Send a short email that confirms what was said and anything they promised. I can write it from your log.': 'Envíe un correo breve que confirme lo que se dijo y lo que prometieron. Puedo escribirlo a partir de su registro.',
    'Your policy and its declarations page.': 'Su póliza y su página de declaraciones.',
    'Your own contractor’s estimate, if you have one. The insurer’s estimate can have errors or miss local costs.': 'El presupuesto de su propio contratista, si lo tiene. El presupuesto de la aseguradora puede tener errores o no incluir costos locales.',
    'Receipts for living costs since the fire, such as hotel bills.': 'Recibos de gastos de vida desde el incendio, como facturas de hotel.',
    'A list of the damage, room by room, so nothing is missed.': 'Una lista de los daños, habitación por habitación, para que no se pase nada por alto.',
    'Bills for any emergency repairs you have already paid for.': 'Facturas de cualquier reparación de emergencia que ya haya pagado.',
    'Show them all of the damage, including smoke, soot and ash that is hard to see.': 'Muéstrele todos los daños, incluidos el humo, el hollín y la ceniza que cuesta ver.',
    'If anyone in the home has asthma or allergies, tell the adjuster.': 'Si alguien en la casa tiene asma o alergias, dígaselo al ajustador.',
    'Ask for a written scope of work: the repairs they believe are needed.': 'Pida un alcance de trabajo por escrito: las reparaciones que consideran necesarias.',
    'If they say something is excluded or limited, ask them to show you the part of the policy.': 'Si le dicen que algo está excluido o limitado, pida que le muestren la parte de la póliza.',
    'If they offer to settle on the spot, you do not have to sign then. Ask for the offer in writing and review your policy first.': 'Si le ofrecen un acuerdo en el momento, no tiene que firmar ahí. Pida la oferta por escrito y revise primero su póliza.',
    'Ask for their name, company and phone number.': 'Pida su nombre, su empresa y su número de teléfono.',
    'If you rent, your own policy covers your belongings and living costs. Your landlord’s insurance does not cover your belongings.': 'Si alquila, su propia póliza cubre sus pertenencias y sus gastos de vida. El seguro de su arrendador no cubre sus pertenencias.',
    'All the damage you can see, before any cleanup.': 'Todos los daños que se vean, antes de limpiar.',
    'The roof, stucco and siding, windows, plumbing, heating and ducts, and interior walls.': 'El techo, el estuco y el revestimiento, las ventanas, la plomería, la calefacción y los conductos, y las paredes interiores.',
    'What is left of the home and your belongings, in photos and video, before any debris removal.': 'Lo que queda de la vivienda y de sus pertenencias, en fotos y video, antes de retirar los escombros.',
    'Old photos of the home help you remember what you had.': 'Las fotos antiguas de la vivienda le ayudan a recordar lo que tenía.',
    'Keep damaged items until they have been photographed.': 'Conserve los artículos dañados hasta que estén fotografiados.',
    'Only go where it is safe.': 'Vaya solo a donde sea seguro.',
    'Take notes during the visit. The log below is for that.': 'Tome notas durante la visita. El registro de abajo es para eso.',
    'For a serious loss, one look by their adjuster is rarely enough. You may need your own contractor or a specialist too.': 'En una pérdida grave, una sola revisión del ajustador rara vez basta. Quizá necesite también a su propio contratista o a un especialista.',
    'Send a short email that confirms what the adjuster said and what happens next. I can write it from your log.': 'Envíe un correo breve que confirme lo que dijo el ajustador y lo que sigue. Puedo escribirlo a partir de su registro.',
    'If you would rather speak Spanish, ask at the start of the call whether they can give you an interpreter.': 'Si prefiere hablar en español, pregunte al comienzo de la llamada si pueden darle un intérprete.',
    'If you would rather speak Spanish, ask before the visit whether they can send someone who speaks Spanish or an interpreter.': 'Si prefiere hablar en español, pregunte antes de la visita si pueden enviar a alguien que hable español o un intérprete.',
    'Date': 'Fecha', 'Time': 'Hora', 'Who you spoke with': 'Con quién habló', 'Name and job title': 'Nombre y cargo', 'Their phone number': 'Su número de teléfono',
    'What they said': 'Lo que dijeron', 'What they will do, and by when': 'Lo que harán, y para cuándo', 'Adjuster': 'Ajustador', 'Name and company': 'Nombre y empresa',
    'What they looked at': 'Qué revisaron', 'What happens next, and by when': 'Lo que sigue, y para cuándo'
  };
  window.NS_CONTENT = { ASK_ES: ASK_ES, ASK_SUBJECT_ES: ASK_SUBJECT_ES, SIT_SUBJECT_ES: SIT_SUBJECT_ES, SHEET_ES: SHEET_ES, M: M, ASKS: ASKS, SIT_LABEL: SIT_LABEL, SIT_SUBJECT: SIT_SUBJECT, SIT_STAGE: SIT_STAGE, STAGES: STAGES, OWN_ORDER: OWN_ORDER, RENT_ORDER: RENT_ORDER, OWN_LIST: OWN_LIST, RENT_LIST: RENT_LIST, RENT_MAP: RENT_MAP, WORDS: WORDS, SHEETS: SHEETS, FOLLOWUP: FOLLOWUP, NOREPLY: NOREPLY, ASK_SUBJECT: ASK_SUBJECT };
})();
