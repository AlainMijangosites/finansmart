const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

router.get('/', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const m = new Date().getMonth()+1, y = new Date().getFullYear();
  try {
    const [[resumen]] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) AS ing,
              COALESCE(SUM(CASE WHEN tipo='egreso'  THEN monto ELSE 0 END),0) AS eg
       FROM movimientos WHERE usuario_id=? AND MONTH(fecha)=? AND YEAR(fecha)=?`,
      [uid,m,y]);

    const [ultimos] = await db.query(
      `SELECT m.*, c.nombre AS cat_nombre, c.icono AS cat_icono
       FROM movimientos m LEFT JOIN categorias c ON m.categoria_id=c.id
       WHERE m.usuario_id=? ORDER BY m.fecha DESC, m.creado_en DESC LIMIT 5`, [uid]);

    const [porCat] = await db.query(
      `SELECT c.id, c.nombre, c.icono, SUM(m.monto) AS total
       FROM movimientos m JOIN categorias c ON m.categoria_id=c.id
       WHERE m.usuario_id=? AND m.tipo='egreso' AND MONTH(m.fecha)=? AND YEAR(m.fecha)=?
       GROUP BY c.id ORDER BY total DESC LIMIT 6`, [uid,m,y]);

    const [alertas] = await db.query(
      `SELECT c.nombre, c.icono, p.limite_monto,
              COALESCE(SUM(mv.monto),0) AS gastado
       FROM presupuestos p
       JOIN categorias c ON p.categoria_id=c.id
       LEFT JOIN movimientos mv ON mv.categoria_id=p.categoria_id
         AND mv.usuario_id=p.usuario_id AND MONTH(mv.fecha)=p.mes AND YEAR(mv.fecha)=p.anio AND mv.tipo='egreso'
       WHERE p.usuario_id=? AND p.mes=? AND p.anio=?
       GROUP BY p.id HAVING (gastado/p.limite_monto)>=0.80`, [uid,m,y]);

    const [metas] = await db.query(
      `SELECT * FROM metas WHERE usuario_id=? AND estado='activa' ORDER BY fecha_limite ASC LIMIT 1`, [uid]);

    // Monthly flow for bar chart (last 7 months)
    const [porMes] = await db.query(
      `SELECT MONTH(fecha) AS mes, YEAR(fecha) AS anio,
              COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) AS ing,
              COALESCE(SUM(CASE WHEN tipo='egreso'  THEN monto ELSE 0 END),0) AS eg
       FROM movimientos WHERE usuario_id=? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 MONTH)
       GROUP BY YEAR(fecha), MONTH(fecha) ORDER BY anio, mes`, [uid]);

    // User meta_ahorro setting
    const [[userData]] = await db.query(
      `SELECT meta_ahorro FROM usuarios WHERE id=?`, [uid]);
    const metaAhorro = userData ? (userData.meta_ahorro || 20) : 20;
    const ing = parseFloat(resumen.ing), eg = parseFloat(resumen.eg);
    const tasaAhorro = ing > 0 ? Math.round(((ing - eg) / ing) * 100) : 0;

    // Recomendaciones automáticas basadas en datos reales
    const recomendaciones = [];
    if (ing === 0 && eg === 0) {
      recomendaciones.push({ icon:'📝', texto:'Empieza registrando tus ingresos y gastos para recibir recomendaciones personalizadas.' });
    } else {
      if (eg > ing) recomendaciones.push({ icon:'🚨', texto:`Tus gastos ($${eg.toLocaleString('es-MX',{minimumFractionDigits:2})}) superan tus ingresos este mes. Intenta reducir gastos no esenciales.` });
      else if (tasaAhorro < metaAhorro) recomendaciones.push({ icon:'⚠️', texto:`Tu tasa de ahorro es ${tasaAhorro}%, por debajo de tu meta de ${metaAhorro}%. Necesitas ahorrar $${Math.round(ing*(metaAhorro/100)-(ing-eg)).toLocaleString('es-MX')} más.` });
      else recomendaciones.push({ icon:'✅', texto:`¡Vas bien! Estás ahorrando el ${tasaAhorro}% de tus ingresos, superando tu meta de ${metaAhorro}%.` });

      if (porCat.length > 0) {
        const top = porCat[0];
        const topPct = eg > 0 ? Math.round((top.total/eg)*100) : 0;
        recomendaciones.push({ icon:'📊', texto:`Tu mayor gasto es "${top.icono} ${top.nombre}" con $${parseFloat(top.total).toLocaleString('es-MX',{minimumFractionDigits:2})} (${topPct}% de tus egresos).` });
      }
      if (alertas.length > 0) recomendaciones.push({ icon:'🔔', texto:`Tienes ${alertas.length} categoría(s) cerca o al límite de presupuesto. Revisa tus alertas.` });
      if (metas[0]) {
        const mp = metas[0];
        const pctMeta = mp.monto_meta > 0 ? Math.round((mp.monto_actual/mp.monto_meta)*100) : 0;
        recomendaciones.push({ icon:'⭐', texto:`Tu meta "${mp.nombre}" lleva ${pctMeta}% completada. Abona regularmente para alcanzarla.` });
      }
    }

    res.render('dashboard', {
      usuario: req.session.usuario,
      ing, eg,
      balance: ing - eg,
      ultimos, porCat, alertas,
      metaPrincipal: metas[0] || null,
      porMes, metaAhorro, tasaAhorro,
      recomendaciones
    });
  } catch(e) { console.error(e); res.status(500).send('Error en dashboard: ' + e.message); }
});

module.exports = router;