const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

router.get('/', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const m = new Date().getMonth()+1, y = new Date().getFullYear();
  try {
    const [presupuestos] = await db.query(
      `SELECT p.id, p.usuario_id, p.categoria_id, p.limite_monto, p.mes, p.anio,
              c.nombre, c.icono,
              COALESCE(SUM(mv.monto), 0) AS gastado
       FROM presupuestos p
       JOIN categorias c ON p.categoria_id = c.id
       LEFT JOIN movimientos mv
         ON mv.categoria_id = p.categoria_id
        AND mv.usuario_id   = p.usuario_id
        AND MONTH(mv.fecha) = p.mes
        AND YEAR(mv.fecha)  = p.anio
        AND mv.tipo = 'egreso'
       WHERE p.usuario_id = ? AND p.mes = ? AND p.anio = ?
       GROUP BY p.id, p.usuario_id, p.categoria_id, p.limite_monto, p.mes, p.anio, c.nombre, c.icono`,
      [uid, m, y]);

    presupuestos.sort((a, b) => {
      const pA = parseFloat(a.limite_monto) > 0 ? parseFloat(a.gastado) / parseFloat(a.limite_monto) : 0;
      const pB = parseFloat(b.limite_monto) > 0 ? parseFloat(b.gastado) / parseFloat(b.limite_monto) : 0;
      return pB - pA;
    });

    const [categorias] = await db.query(
      `SELECT * FROM categorias WHERE usuario_id = ? ORDER BY nombre`, [uid]);

    // Estadísticas adicionales
    const [[gastoMax]] = await db.query(
      `SELECT COALESCE(MAX(monto), 0) AS maximo FROM movimientos
       WHERE usuario_id=? AND tipo='egreso' AND MONTH(fecha)=? AND YEAR(fecha)=?`,
      [uid, m, y]);

    const totalLimite  = presupuestos.reduce((a,p) => a + parseFloat(p.limite_monto || 0), 0);
    const totalGastado = presupuestos.reduce((a,p) => a + parseFloat(p.gastado || 0), 0);
    const pctGlobal    = totalLimite > 0 ? Math.round((totalGastado / totalLimite) * 100) : 0;
    const diaActual    = new Date().getDate();
    const promedioDiario = diaActual > 0 ? Math.round(totalGastado / diaActual) : 0;
    const categoriasVerde = presupuestos.filter(p =>
      parseFloat(p.limite_monto) > 0 && (parseFloat(p.gastado) / parseFloat(p.limite_monto)) < 0.8
    ).length;

    res.render('presupuesto', {
      usuario: req.session.usuario,
      presupuestos, categorias,
      totalLimite, totalGastado, pctGlobal,
      mes: m, anio: y,
      gastoMasAlto: parseFloat(gastoMax.maximo),
      promedioDiario,
      diaActual,
      categoriasVerde,
      ok:    req.query.ok    || null,
      error: req.query.error || null
    });
  } catch(e) {
    console.error('[presupuesto GET]', e.message);
    res.render('presupuesto', {
      usuario: req.session.usuario,
      presupuestos: [], categorias: [],
      totalLimite: 0, totalGastado: 0, pctGlobal: 0,
      mes: m, anio: y,
      gastoMasAlto: 0, promedioDiario: 0, diaActual: 1, categoriasVerde: 0,
      ok: null, error: 'Error al cargar presupuesto: ' + e.message
    });
  }
});

router.post('/agregar', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { categoria_id, limite_monto, mes, anio } = req.body;
  const lim = parseFloat(limite_monto);
  if (!categoria_id || isNaN(lim) || lim <= 0)
    return res.redirect('/presupuesto?error=Selecciona una categoría e ingresa un monto válido');
  const m = parseInt(mes) || new Date().getMonth()+1;
  const y = parseInt(anio) || new Date().getFullYear();
  try {
    const [ex] = await db.query(
      `SELECT id FROM presupuestos WHERE usuario_id=? AND categoria_id=? AND mes=? AND anio=?`,
      [uid, categoria_id, m, y]);
    if (ex.length)
      await db.query(`UPDATE presupuestos SET limite_monto=? WHERE id=?`, [lim, ex[0].id]);
    else
      await db.query(
        `INSERT INTO presupuestos (usuario_id, categoria_id, limite_monto, mes, anio) VALUES (?,?,?,?,?)`,
        [uid, categoria_id, lim, m, y]);
    res.redirect('/presupuesto?ok=Límite guardado correctamente');
  } catch(e) {
    res.redirect('/presupuesto?error=' + encodeURIComponent('Error: ' + e.message));
  }
});

router.post('/editar/:id', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const lim = parseFloat(req.body.limite_monto);
  if (isNaN(lim) || lim <= 0)
    return res.redirect('/presupuesto?error=Ingresa un monto válido');
  try {
    await db.query(
      `UPDATE presupuestos SET limite_monto=? WHERE id=? AND usuario_id=?`,
      [lim, req.params.id, uid]);
    res.redirect('/presupuesto?ok=Límite actualizado correctamente');
  } catch(e) {
    res.redirect('/presupuesto?error=Error al actualizar');
  }
});

router.post('/eliminar/:id', auth, async (req, res) => {
  try {
    await db.query(`DELETE FROM presupuestos WHERE id=? AND usuario_id=?`,
      [req.params.id, req.session.usuario.id]);
    res.redirect('/presupuesto?ok=Límite eliminado');
  } catch(e) {
    res.redirect('/presupuesto?error=Error al eliminar');
  }
});

module.exports = router;