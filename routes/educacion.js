const express = require('express');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

// ── ARTÍCULOS ────────────────────────────────────────────────────────────────
const ARTICULOS = {
  'habitos-economia': {
    titulo:'5 hábitos para mejorar tu economía personal en 2025', categoria:'Finanzas personales',
    tiempo:'5 min', icono:'💡', resumen:'Pequeños cambios diarios que transforman tus finanzas.',
    contenido:[
      {tipo:'intro',texto:'Mejorar tus finanzas personales no requiere ganar más dinero — requiere administrar mejor lo que ya tienes. Estos 5 hábitos, practicados de forma constante, pueden transformar tu situación financiera en menos de 6 meses.'},
      {tipo:'h3',texto:'1. Lleva un registro diario de tus gastos'},
      {tipo:'p',texto:'Anota cada peso que gastas, sin importar qué tan pequeño sea. Un café de $40, el transporte de $25, la botana de $30 — todo suma. Al final del mes te sorprenderá cuánto gastaste en cosas que ni recuerdas.'},
      {tipo:'tip',texto:'💡 Truco: Revisa tus movimientos cada noche durante 3 minutos. Ese hábito genera consciencia financiera en semanas.'},
      {tipo:'h3',texto:'2. Aplica la regla del 24 horas para compras impulsivas'},
      {tipo:'p',texto:'Antes de comprar algo que no planeabas, espera 24 horas. Si al día siguiente todavía lo quieres y está en tu presupuesto, cómpralo. Esta simple regla puede ahorrarte entre $500 y $2,000 al mes.'},
      {tipo:'h3',texto:'3. Automatiza tu ahorro'},
      {tipo:'p',texto:'No esperes a que sobre dinero al fin del mes para ahorrar — nunca sobra. En cuanto recibas tu ingreso, transfiere inmediatamente el porcentaje que definiste como meta de ahorro a una cuenta separada.'},
      {tipo:'h3',texto:'4. Revisa y cancela suscripciones que no usas'},
      {tipo:'p',texto:'Haz una lista de todas tus suscripciones mensuales. ¿Cuántas usaste en el último mes? Cancela todo lo que usas menos de 2 veces al mes. Muchos mexicanos gastan entre $500 y $1,500 mensuales en suscripciones que apenas usan.'},
      {tipo:'h3',texto:'5. Edúcate financieramente 15 minutos al día'},
      {tipo:'p',texto:'Lee un artículo, escucha un podcast, toma un módulo de curso. La educación financiera es la inversión con mejor rendimiento que existe.'},
      {tipo:'tip',texto:'🎯 Meta de esta semana: Identifica 3 suscripciones que puedas cancelar y calcula cuánto ahorrarías al año.'},
    ]
  },
  'cetes-inversion': {
    titulo:'¿Qué son los CETES y cómo invertir desde $100?', categoria:'Inversión',
    tiempo:'8 min', icono:'🏦', resumen:'Los CETES son la inversión más segura de México.',
    contenido:[
      {tipo:'intro',texto:'Los Certificados de la Tesorería (CETES) son instrumentos de inversión emitidos por el Gobierno Federal de México. Son considerados la inversión más segura del país porque están respaldados por el Estado.'},
      {tipo:'h3',texto:'¿Cómo funcionan los CETES?'},
      {tipo:'p',texto:'Al comprar un CETE, le "prestas" dinero al gobierno por un plazo determinado (28, 91, 182 o 364 días). A cambio, el gobierno te devuelve tu dinero más los intereses al vencimiento. La tasa de rendimiento actual ronda entre el 9% y 11% anual.'},
      {tipo:'h3',texto:'¿Dónde comprar CETES?'},
      {tipo:'p',texto:'La plataforma oficial es cetesdirecto.com.mx, administrada por el Banco de México y la SHCP. Es 100% gratuita, sin comisiones. Solo necesitas tu CURP, RFC y una cuenta bancaria mexicana.'},
      {tipo:'tip',texto:'💰 Ejemplo real: $10,000 en CETES a 28 días al 10% anual = aproximadamente $77 de ganancia en ese período.'},
      {tipo:'h3',texto:'Plazos disponibles'},
      {tipo:'p',texto:'28 días (ideal para dinero de emergencia), 91 días, 182 días (6 meses), y 364 días (un año). A mayor plazo, generalmente mayor tasa.'},
      {tipo:'tip',texto:'🚀 Paso 1: Entra a cetesdirecto.com.mx y crea tu cuenta. El proceso toma 10 minutos.'},
    ]
  },
  'regla-50-30-20': {
    titulo:'Regla del 50/30/20: la fórmula del presupuesto ideal', categoria:'Ahorro',
    tiempo:'6 min', icono:'📐', resumen:'Distribuye tus ingresos en necesidades, deseos y ahorro.',
    contenido:[
      {tipo:'intro',texto:'La regla del 50/30/20 es la forma más sencilla y efectiva de organizar tu presupuesto personal. Fue popularizada por Elizabeth Warren y es usada por millones de personas en todo el mundo.'},
      {tipo:'h3',texto:'¿Cómo se divide?'},
      {tipo:'p',texto:'El 50% de tu ingreso neto va a necesidades básicas. El 30% va a deseos. El 20% va directo al ahorro e inversión.'},
      {tipo:'tip',texto:'📊 Ejemplo: Si ganas $15,000/mes netos → $7,500 necesidades · $4,500 deseos · $3,000 ahorro.'},
      {tipo:'h3',texto:'El 20% — Ahorro e inversión'},
      {tipo:'p',texto:'Este es el rubro más importante. El secreto es transferirlo PRIMERO, antes de gastar lo demás.'},
      {tipo:'tip',texto:'🎯 Configura tu meta de ahorro en FINANSMART al 20% y activa las alertas para que te avise cuando estés gastando de más.'},
    ]
  },
  'salir-deudas': {
    titulo:'Cómo salir de las deudas usando el método bola de nieve', categoria:'Deudas',
    tiempo:'7 min', icono:'💳', resumen:'Una estrategia probada para liquidar deudas.',
    contenido:[
      {tipo:'intro',texto:'El método "bola de nieve" fue popularizado por Dave Ramsey y es psicológicamente el más efectivo para salir de deudas.'},
      {tipo:'h3',texto:'Cómo funciona'},
      {tipo:'p',texto:'Lista todas tus deudas de menor a mayor saldo. Paga el mínimo en todas, excepto en la más pequeña — a ésa destínale todo el dinero extra que puedas.'},
      {tipo:'tip',texto:'❄ La "bola de nieve": Deuda 1 → Deuda 2 (+ lo que pagabas en D1) → Deuda 3. El pago crece como una bola de nieve.'},
      {tipo:'tip',texto:'🚨 Importante: Mientras pagas deudas, NO generes nuevas. Corta o bloquea tarjetas de crédito temporalmente si es necesario.'},
    ]
  },
  'fondos-inversion': {
    titulo:'Fondos de inversión para principiantes en México', categoria:'Inversión',
    tiempo:'10 min', icono:'📊', resumen:'Cómo hacer crecer tu dinero con fondos indexados.',
    contenido:[
      {tipo:'intro',texto:'Invertir ya no es exclusivo de personas ricas. Los fondos de inversión permiten a cualquier persona con $500 o menos empezar a hacer crecer su dinero de forma diversificada.'},
      {tipo:'h3',texto:'¿Qué es un fondo de inversión?'},
      {tipo:'p',texto:'Un fondo agrupa el dinero de muchos inversionistas para comprar una canasta de activos (acciones, bonos, etc.).'},
      {tipo:'h3',texto:'La magia del interés compuesto'},
      {tipo:'p',texto:'Si inviertes $1,000 mensuales durante 30 años al 10% anual, acumulas ~$2,000,000. Por eso la mejor decisión es empezar HOY, aunque sea con poco.'},
      {tipo:'tip',texto:'🌱 Regla de oro: Empieza con CETES para tu fondo de emergencia y fondos indexados para metas de más de 5 años.'},
    ]
  },
};

// ── CURSOS ───────────────────────────────────────────────────────────────────
const CURSOS = {
  'finanzas-principiantes': {
    titulo:'Finanzas personales para principiantes', icono:'🚀',
    categoria:'Finanzas personales', nivel:'Básico', duracion:'2h 30min',
    modulos:[
      { titulo:'¿Qué son las finanzas personales?', contenido:[
        {tipo:'p',texto:'Las finanzas personales son la administración del dinero que entra y sale de tu bolsillo. Incluyen tus ingresos, gastos, ahorros, inversiones y deudas. Entenderlas te da el control sobre tu futuro económico.'},
        {tipo:'p',texto:'Muchas personas evitan hablar de dinero porque lo asocian con estrés. Pero ignorar tus finanzas es peor: los problemas se acumulan silenciosamente hasta convertirse en crisis.'},
        {tipo:'tip',texto:'💡 Dato: El 68% de los mexicanos no lleva ningún registro de sus gastos. Tú ya estás en ventaja por estar aprendiendo.'},
      ]},
      { titulo:'Ingresos vs Egresos', contenido:[
        {tipo:'p',texto:'Tu ingreso es todo el dinero que entra: sueldo, freelance, rentas, etc. Tu egreso es todo lo que sale: renta, comida, transporte, entretenimiento.'},
        {tipo:'p',texto:'La fórmula básica es: Balance = Ingresos - Egresos. Si el resultado es positivo, vas bien. Si es negativo, estás gastando más de lo que ganas.'},
        {tipo:'lista',items:['Ingreso activo: trabajas para ganarlo (sueldo, honorarios)','Ingreso pasivo: trabaja por ti (rentas, dividendos, intereses)','Egreso fijo: igual cada mes (renta, suscripciones)','Egreso variable: cambia mes a mes (comida, transporte)']},
        {tipo:'tip',texto:'📊 Registra tus ingresos y egresos durante 30 días antes de hacer cualquier plan. Los números reales siempre sorprenden.'},
      ]},
      { titulo:'El presupuesto: tu herramienta más poderosa', contenido:[
        {tipo:'p',texto:'Un presupuesto no es una restricción — es un plan para que tu dinero haga lo que tú quieres. Sin presupuesto, el dinero simplemente desaparece.'},
        {tipo:'p',texto:'El método más sencillo: escribe cuánto ganas, luego lista todos tus gastos fijos del mes. Lo que sobre, divídelo entre ahorros y gastos variables.'},
        {tipo:'tip',texto:'🎯 Empieza simple: un presupuesto imperfecto que usas es mejor que uno perfecto que nunca haces.'},
      ]},
      { titulo:'Fondo de emergencia: tu red de seguridad', contenido:[
        {tipo:'p',texto:'Un fondo de emergencia es dinero guardado para imprevistos: reparación del coche, visita al médico, pérdida temporal del trabajo. Sin él, cualquier emergencia se convierte en deuda.'},
        {tipo:'p',texto:'La meta es ahorrar entre 3 y 6 meses de tus gastos básicos. No lo inviertas en bolsa ni en cosas difíciles de retirar — ponlo en CETES a 28 días o en una cuenta de ahorro separada.'},
        {tipo:'lista',items:['Meta mínima: 1 mes de gastos (empieza aquí)','Meta ideal: 3-6 meses de gastos','Dónde guardarlo: CETES 28 días o cuenta de ahorro','Cuándo usarlo: SOLO para emergencias reales']},
      ]},
      { titulo:'Empezando a ahorrar desde cero', contenido:[
        {tipo:'p',texto:'Si crees que no puedes ahorrar porque "no te alcanza", el problema casi siempre no es el ingreso — es el orden en que gastas. La mayoría gasta primero y ahorra lo que "sobra". El problema: nunca sobra.'},
        {tipo:'p',texto:'El secreto: págate a ti primero. En cuanto recibas tu ingreso, transfiere tu porcentaje de ahorro a una cuenta separada ANTES de pagar cualquier otra cosa.'},
        {tipo:'tip',texto:'✅ Desafío: Esta semana abre una cuenta de ahorro separada y transfiere aunque sea $100. El hábito importa más que la cantidad.'},
      ]},
      { titulo:'Deudas: cómo manejarlas inteligentemente', contenido:[
        {tipo:'p',texto:'No todas las deudas son iguales. Una deuda para estudiar o comprar una casa puede ser una inversión. Una deuda de tarjeta de crédito al 60% anual para comprar ropa es una trampa.'},
        {tipo:'p',texto:'Regla básica: evita deudas para cosas que se deprecian (ropa, gadgets, viajes). Considera deudas solo para cosas que generan valor (educación, vivienda, herramientas de trabajo).'},
        {tipo:'tip',texto:'🚨 Alerta roja: Si el pago mínimo de tus tarjetas supera el 15% de tu ingreso mensual, estás en zona de peligro financiero.'},
      ]},
    ],
    examen:{ preguntas:[
      {pregunta:'¿Cuál es la fórmula básica de las finanzas personales?',opciones:['Gastos - Ingresos = Balance','Ingresos - Egresos = Balance','Ahorros + Deudas = Balance','Ingresos + Egresos = Balance'],correcta:1},
      {pregunta:'¿Cuántos meses de gastos básicos debe tener tu fondo de emergencia?',opciones:['1 mes exacto','6 a 12 meses','3 a 6 meses','Solo 2 semanas'],correcta:2},
      {pregunta:'¿Cuál es el secreto para ahorrar consistentemente?',opciones:['Ganar más dinero','Ahorrar lo que sobra al final del mes','Págate a ti primero antes de gastar','Invertir en bolsa desde el primer día'],correcta:2},
      {pregunta:'¿Dónde es recomendable guardar el fondo de emergencia?',opciones:['Invertido en acciones de bolsa','En CETES a 28 días o cuenta de ahorro separada','En tu cuenta de nómina habitual','En efectivo en casa'],correcta:1},
      {pregunta:'¿Cuándo es recomendable endeudarse?',opciones:['Para comprar ropa de marca','Para viajes de vacaciones','Para educación o herramientas que generan valor','Para gadgets o electrónicos'],correcta:2},
    ]}
  },

  'ahorro-inversion-basica': {
    titulo:'Ahorro e Inversión Básica', icono:'💰',
    categoria:'Ahorro', nivel:'Básico', duracion:'1h 45min',
    modulos:[
      { titulo:'La diferencia entre ahorrar e invertir', contenido:[
        {tipo:'p',texto:'Ahorrar es guardar dinero para usarlo después. Invertir es poner ese dinero a trabajar para generar más dinero. Ambos son necesarios, pero tienen propósitos distintos.'},
        {tipo:'lista',items:['Ahorro: seguridad, liquidez, emergencias','Inversión: crecimiento a largo plazo, generación de riqueza','Ahorro ideal: cuenta separada, CETES corto plazo','Inversión ideal: fondos indexados, CETES largo plazo, acciones']},
        {tipo:'tip',texto:'💡 Primero ahorra tu fondo de emergencia (3-6 meses de gastos), luego empieza a invertir el excedente.'},
      ]},
      { titulo:'Tipos de ahorro que debes tener', contenido:[
        {tipo:'p',texto:'No es suficiente tener "una cuenta de ahorro". Para un control financiero real necesitas separar tu dinero por propósito.'},
        {tipo:'lista',items:['Fondo de emergencia: 3-6 meses de gastos, no tocar salvo crisis','Ahorro de corto plazo: metas en menos de 1 año (vacaciones, gadgets)','Ahorro de mediano plazo: 1-3 años (coche, enganche de casa)','Ahorro de largo plazo: +3 años, aquí ya puedes invertir']},
        {tipo:'tip',texto:'🏦 Tip: Usa cuentas o subcuentas diferentes para cada tipo. Mezclar el dinero es la forma más segura de gastarlo todo.'},
      ]},
      { titulo:'Introducción a las inversiones', contenido:[
        {tipo:'p',texto:'Invertir asusta a muchos porque parece complejo o riesgoso. Pero la realidad es que no invertir también tiene un costo: la inflación erosiona el poder adquisitivo de tu dinero guardado.'},
        {tipo:'p',texto:'Si guardas $10,000 en efectivo durante un año con inflación del 5%, al final ese dinero solo te compra lo equivalente a $9,500 actuales. Invertir es necesario para no perder poder adquisitivo.'},
        {tipo:'tip',texto:'📈 Regla del 72: Divide 72 entre la tasa de rendimiento y obtendrás en cuántos años se duplica tu dinero. Al 9%: 72/9 = 8 años.'},
      ]},
      { titulo:'Cómo empezar a invertir en México', contenido:[
        {tipo:'p',texto:'Las opciones más accesibles para principiantes en México son: CETES Directo (desde $100, sin comisiones), GBM+ (fondos indexados, desde $100), y Nu (cuenta de inversión automática).'},
        {tipo:'lista',items:['CETES Directo: cetesdirecto.com.mx — el más seguro, respaldado por el gobierno','GBM+: app móvil, fondos indexados de bajo costo','Nu: inversión automática en fondos de deuda','BBVA Invest: disponible si ya tienes cuenta BBVA']},
        {tipo:'tip',texto:'✅ Paso a paso: Abre CETES Directo esta semana. Proceso 100% online, 10 minutos, desde $100.'},
      ]},
    ],
    examen:{ preguntas:[
      {pregunta:'¿Cuál es la principal diferencia entre ahorrar e invertir?',opciones:['Son exactamente lo mismo','Ahorrar guarda dinero; invertir lo pone a trabajar para generar más','Invertir es más seguro que ahorrar','Ahorrar genera más rendimiento que invertir'],correcta:1},
      {pregunta:'¿Qué debes tener ANTES de empezar a invertir?',opciones:['Una cuenta en la bolsa de valores','Tu fondo de emergencia completo (3-6 meses de gastos)','Al menos $50,000 de capital','Una asesoría financiera privada'],correcta:1},
      {pregunta:'¿Por qué guardar dinero en efectivo sin invertirlo tiene un costo?',opciones:['No tiene ningún costo, es lo más seguro','La inflación reduce el poder adquisitivo con el tiempo','Los billetes se deterioran físicamente','El banco te cobra por no usarlo'],correcta:1},
      {pregunta:'Según la Regla del 72, ¿en cuántos años se duplica el dinero al 9% anual?',opciones:['12 años','6 años','8 años','18 años'],correcta:2},
      {pregunta:'¿Cuál es la plataforma de inversión más segura para principiantes en México?',opciones:['Cualquier criptomoneda','CETES Directo (cetesdirecto.com.mx)','Acciones individuales en la BMV','Forex (divisas)'],correcta:1},
    ]}
  },

  'control-gastos': {
    titulo:'Control de Gastos Diarios', icono:'📊',
    categoria:'Finanzas personales', nivel:'Básico', duracion:'2h 10min',
    modulos:[
      { titulo:'Por qué se nos va el dinero sin darnos cuenta', contenido:[
        {tipo:'p',texto:'Los "gastos hormiga" son pequeños gastos frecuentes que parecen insignificantes pero suman cantidades considerables. Un café diario de $60 = $1,800 al mes = $21,600 al año.'},
        {tipo:'lista',items:['Café o snacks diarios: $30-100/día','Transporte app (Uber/DiDi) en lugar de metro/bus: $100-300/día','Comida fuera siendo que "solo fue rápido": $80-200/comida','Suscripciones olvidadas: $50-500/mes cada una']},
        {tipo:'tip',texto:'📱 Ejercicio: Revisa los últimos 30 movimientos de tu tarjeta. ¿Cuántos son gastos que no recordabas?'},
      ]},
      { titulo:'Sistema de categorías para tus gastos', contenido:[
        {tipo:'p',texto:'Categorizar tus gastos te permite ver exactamente a dónde va tu dinero. Sin categorías, solo ves una lista de números sin sentido.'},
        {tipo:'lista',items:['Necesidades básicas: alimentación, transporte, servicios, salud','Vivienda: renta, mantenimiento, seguro','Entretenimiento: salidas, streaming, hobbies','Educación: cursos, libros, materiales','Deudas: pagos de tarjeta, créditos']},
        {tipo:'tip',texto:'🎯 En FINANSMART ya tienes categorías predefinidas. Úsalas consistentemente para ver patrones en 2-3 meses.'},
      ]},
      { titulo:'El método del sobre digital', contenido:[
        {tipo:'p',texto:'El método del sobre consiste en asignar una cantidad específica a cada categoría de gasto al inicio del mes. Cuando el "sobre" de esa categoría se vacía, ya no gastas más en ella.'},
        {tipo:'p',texto:'En la versión digital: crea un presupuesto por categoría en tu app y activa alertas. Cuando llegues al 80% del límite, ya sabes que debes frenar.'},
        {tipo:'tip',texto:'💡 Prueba este mes: Pon límites en tus top 3 categorías de gasto y activa notificaciones al 80%.'},
      ]},
      { titulo:'Cómo reducir gastos sin sacrificar calidad de vida', contenido:[
        {tipo:'p',texto:'Reducir gastos no significa vivir mal. Se trata de identificar qué te da valor real y qué es gasto automático sin disfrute consciente.'},
        {tipo:'lista',items:['Cancela suscripciones que no usas más de 2 veces al mes','Cocina en casa al menos 4 días a la semana','Usa transporte público cuando el tiempo lo permita','Compara precios antes de comprar cualquier cosa +$500','Espera 48 horas antes de comprar algo no planificado']},
        {tipo:'tip',texto:'🧮 Calcula el "costo en horas de trabajo" de cada compra. Si ganas $100/hora, algo de $500 = 5 horas de tu vida.'},
      ]},
      { titulo:'Revisión semanal de finanzas', contenido:[
        {tipo:'p',texto:'Dedica 10-15 minutos cada domingo para revisar tus gastos de la semana. Esta práctica simple es la diferencia entre los que alcanzan sus metas y los que no.'},
        {tipo:'lista',items:['¿Cuánto gasté esta semana vs lo planeado?','¿Qué categoría se pasó del límite?','¿Hubo gastos hormiga que puedo eliminar?','¿Estoy en camino para cerrar el mes bien?']},
        {tipo:'tip',texto:'📅 Pon una alarma recurrente cada domingo: "Revisión de finanzas - 10 min". Conviértelo en hábito.'},
      ]},
    ],
    examen:{ preguntas:[
      {pregunta:'Un café diario de $60, ¿cuánto cuesta al año?',opciones:['$720','$21,600','$7,200','$3,600'],correcta:1},
      {pregunta:'¿Qué son los "gastos hormiga"?',opciones:['Gastos de alimentos','Pequeños gastos frecuentes que suman mucho con el tiempo','Gastos que hacen las empresas pequeñas','Deudas de bajo monto'],correcta:1},
      {pregunta:'En el método del sobre, ¿qué haces cuando el "sobre" de una categoría se vacía?',opciones:['Transfieres dinero de otro sobre','Ya no gastas más en esa categoría ese mes','Pides dinero prestado','Usas la tarjeta de crédito'],correcta:1},
      {pregunta:'¿Cuándo deberías revisar tus gastos?',opciones:['Solo al final del año','Solo cuando hay problemas económicos','Cada semana, dedicando 10-15 minutos','Una vez al mes es suficiente'],correcta:2},
      {pregunta:'¿Cuántas horas de trabajo equivale una compra de $500 si ganas $100/hora?',opciones:['5 horas','50 horas','0.5 horas','500 horas'],correcta:0},
    ]}
  },

  'salir-deudas-curso': {
    titulo:'Cómo Salir de las Deudas', icono:'🚫',
    categoria:'Deudas', nivel:'Básico', duracion:'1h 30min',
    modulos:[
      { titulo:'Entendiendo tus deudas', contenido:[
        {tipo:'p',texto:'Antes de atacar tus deudas, necesitas conocerlas exactamente. Muchas personas evitan ver sus estados de cuenta por ansiedad, pero esa evasión solo empeora la situación.'},
        {tipo:'lista',items:['Lista cada deuda con: saldo total, pago mínimo y tasa de interés anual','Clasifica: tarjetas (suelen ser 36-60% anual), préstamos personales (20-40%), crédito INFONAVIT/FOVISSSTE (menor tasa)','Calcula el total: suma todos los saldos']},
        {tipo:'tip',texto:'📋 Ejercicio ahora: Abre tus estados de cuenta y llena esta lista. El primer paso para resolver un problema es medirlo.'},
      ]},
      { titulo:'Método bola de nieve vs avalancha', contenido:[
        {tipo:'p',texto:'Existen dos estrategias probadas para pagar deudas. La bola de nieve ordena por saldo (de menor a mayor). La avalancha ordena por tasa de interés (de mayor a menor).'},
        {tipo:'p',texto:'Matemáticamente, la avalancha ahorra más dinero. Psicológicamente, la bola de nieve es más motivante porque ves resultados rápido. Elige la que más te funcione.'},
        {tipo:'lista',items:['Bola de nieve: más victorias rápidas, mejor para motivación','Avalancha: ahorra más dinero en intereses, mejor matemáticamente','Híbrido: paga primero la más pequeña (victoria rápida), luego ataca la de mayor interés']},
      ]},
      { titulo:'Cómo conseguir más dinero para pagar deudas', contenido:[
        {tipo:'p',texto:'Para pagar deudas más rápido necesitas dinero extra. Hay dos formas: reducir gastos o aumentar ingresos. Idealmente, ambas.'},
        {tipo:'lista',items:['Vende cosas que no usas (Marketplace, Mercado Libre)','Ofrece servicios extra en tu trabajo o de forma independiente','Elimina todos los gastos no esenciales temporalmente','Usa cualquier ingreso extra (aguinaldo, bonos) directamente a deudas']},
        {tipo:'tip',texto:'🚀 Cada peso extra que pones a una deuda es un peso que no pagas con intereses del 40-60% anual.'},
      ]},
      { titulo:'Negociación con acreedores', contenido:[
        {tipo:'p',texto:'Si estás muy atrasado, los bancos y financieras prefieren cobrar algo a no cobrar nada. Puedes negociar quitas (reducción de saldo), reestructuras (nuevas condiciones) o quitas por pago único.'},
        {tipo:'lista',items:['Llama directamente al banco y explica tu situación','Pregunta por "programas de reestructura" o "quita de intereses"','Ten una oferta específica: "Puedo pagar X si me condonan los intereses"','Pide todo por escrito antes de pagar cualquier cosa']},
        {tipo:'tip',texto:'⚖️ No uses despachos de cobranza negativos. Negocia directo con el banco y exige documentación de cualquier acuerdo.'},
      ]},
    ],
    examen:{ preguntas:[
      {pregunta:'¿Cuál es el primer paso para atacar tus deudas?',opciones:['Llamar al banco','Listar cada deuda con saldo, pago mínimo y tasa de interés','Dejar de pagar mientras ahorras','Tomar un préstamo para consolidar'],correcta:1},
      {pregunta:'¿Qué diferencia al método bola de nieve del método avalancha?',opciones:['Son exactamente iguales','Bola de nieve ordena por saldo (menor a mayor); avalancha por tasa de interés (mayor a menor)','Avalancha paga primero la deuda más pequeña','Bola de nieve solo aplica para tarjetas de crédito'],correcta:1},
      {pregunta:'¿Cuál método es matemáticamente más eficiente para ahorrar en intereses?',opciones:['Bola de nieve','Avalancha','Ambos son iguales en términos matemáticos','Depende del banco'],correcta:1},
      {pregunta:'Si recibes un aguinaldo mientras tienes deudas al 50% anual, ¿qué deberías hacer?',opciones:['Gastarlo en algo que te des gusto','Guardarlo en una cuenta de ahorro','Aplicarlo directamente a tus deudas de mayor interés','Invertirlo en la bolsa de valores'],correcta:2},
      {pregunta:'Al negociar con acreedores, ¿qué es fundamental hacer?',opciones:['Pagar de inmediato sin condiciones','Ignorar sus llamadas','Pedir todo por escrito antes de pagar cualquier cosa','Usar un despacho intermediario'],correcta:2},
    ]}
  },

  'metodo-50-30-20': {
    titulo:'Método 50/30/20', icono:'🎯',
    categoria:'Ahorro', nivel:'Básico', duracion:'45min',
    modulos:[
      { titulo:'El origen del método', contenido:[
        {tipo:'p',texto:'La regla 50/30/20 fue popularizada por Elizabeth Warren, profesora de Harvard y senadora de EE.UU., en su libro "All Your Worth". Es simple, flexible y funciona para la mayoría de los ingresos.'},
        {tipo:'p',texto:'La idea es dividir tu ingreso neto mensual en tres categorías: 50% necesidades, 30% deseos, 20% ahorro. Sin hojas de cálculo complicadas, sin seguimiento de cada peso.'},
      ]},
      { titulo:'El 50% — Necesidades', contenido:[
        {tipo:'p',texto:'Las necesidades son gastos que NO puedes eliminar sin afectar tu funcionamiento básico: renta o hipoteca, comida básica, transporte al trabajo, servicios (agua, luz, gas, internet), seguro médico.'},
        {tipo:'p',texto:'Si tu 50% supera ese límite, es señal de que algo debe cambiar: buscar vivienda más económica, cambiar de transporte, o renegociar servicios.'},
        {tipo:'tip',texto:'⚠️ Si la renta sola consume más del 30% de tu ingreso, estás en zona de riesgo financiero.'},
      ]},
      { titulo:'El 30% — Deseos', contenido:[
        {tipo:'p',texto:'Los deseos son todo lo que quieres pero no necesitas estrictamente: restaurants, ropa, suscripciones de streaming, viajes, hobbies, gadgets. Son parte importante de la calidad de vida.'},
        {tipo:'p',texto:'El 30% no es dinero que "puedes gastar con culpa" — es dinero que puedes gastar CON LIBERTAD Y SIN CULPA, siempre que hayas cubierto necesidades y ahorro primero.'},
        {tipo:'tip',texto:'🎮 El secreto: satisface tus deseos prioritarios, no todos. Decide qué te da más felicidad por peso gastado.'},
      ]},
      { titulo:'El 20% — Ahorro e inversión', contenido:[
        {tipo:'p',texto:'Este 20% es el más importante. Incluye: fondo de emergencia, ahorro para metas específicas, pago de deudas extra (si las tienes), e inversión para el futuro.'},
        {tipo:'p',texto:'La regla de oro: transfiere este 20% el mismo día que recibes tu pago. No esperes a "ver qué sobra" — nunca sobra nada.'},
        {tipo:'lista',items:['Si tienes deudas: dedica el 20% a pagarlas aceleradamente','Si no tienes deudas: 10% fondo emergencia + 10% inversión','Una vez con fondo de emergencia completo: 20% a inversión']},
        {tipo:'tip',texto:'🧮 Calcula tu 20%: Si ganas $12,000 netos, deberías ahorrar/invertir $2,400 al mes mínimo.'},
      ]},
    ],
    examen:{ preguntas:[
      {pregunta:'¿Cómo se divide el ingreso en el método 50/30/20?',opciones:['50% ahorro, 30% necesidades, 20% deseos','50% necesidades, 30% deseos, 20% ahorro','50% deseos, 30% ahorro, 20% necesidades','50% necesidades, 30% ahorro, 20% deseos'],correcta:1},
      {pregunta:'¿Cuáles son ejemplos de "necesidades" en el 50%?',opciones:['Netflix, ropa de marca, restaurants','Renta, comida básica, transporte al trabajo, servicios','Viajes, gadgets, hobbies','Inversiones y ahorro'],correcta:1},
      {pregunta:'Si ganas $15,000 netos al mes, ¿cuánto deberías ahorrar según el método?',opciones:['$1,500','$7,500','$3,000','$4,500'],correcta:2},
      {pregunta:'¿Cuándo deberías transferir tu 20% de ahorro?',opciones:['Al final del mes, con lo que sobre','Cuando tengas tiempo de hacerlo','El mismo día que recibes tu pago','Solo si tuviste un buen mes de gastos'],correcta:2},
      {pregunta:'Si tu renta consume el 35% de tu ingreso, ¿qué indica eso?',opciones:['Es perfectamente normal','Estás en zona de riesgo financiero','Es lo recomendado para ciudades grandes','No tiene ninguna implicación'],correcta:1},
    ]}
  },
};

// ── RUTAS ────────────────────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  res.render('educacion', { usuario: req.session.usuario, articulos: ARTICULOS, cursos: CURSOS });
});

router.get('/articulo/:slug', auth, (req, res) => {
  const art = ARTICULOS[req.params.slug];
  if (!art) return res.redirect('/educacion');
  res.render('educacion_articulo', { usuario: req.session.usuario, art, slug: req.params.slug, articulos: ARTICULOS });
});

router.get('/curso/:slug', auth, (req, res) => {
  const curso = CURSOS[req.params.slug];
  if (!curso) return res.redirect('/educacion');
  res.render('educacion_curso', { usuario: req.session.usuario, curso, slug: req.params.slug });
});

module.exports = router;