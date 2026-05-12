const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

router.get('/', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const m = new Date().getMonth()+1, y = new Date().getFullYear();
  const tipoFiltro  = req.query.tipo        || 'todos';
  const catFiltro   = req.query.categoria   || '';
  const fechaDesde  = req.query.fecha_desde || '';
  const fechaHasta  = req.query.fecha_hasta || '';
  const page        = Math.max(1, parseInt(req.query.page) || 1);
  const perPage     = 20;
  const esPremium = req.session.usuario.plan === 'premium';
  try {
    let where = 'WHERE m.usuario_id=?';
    const params = [uid];
    if (tipoFiltro === 'ingreso' || tipoFiltro === 'egreso') { where += ' AND m.tipo=?'; params.push(tipoFiltro); }
    if (catFiltro)  { where += ' AND m.categoria_id=?'; params.push(catFiltro); }
    if (!esPremium) {
      // Free users: only current month
      where += ' AND MONTH(m.fecha)=? AND YEAR(m.fecha)=?';
      params.push(m, y);
    } else {
      if (fechaDesde) { where += ' AND m.fecha>=?'; params.push(fechaDesde); }
      if (fechaHasta) { where += ' AND m.fecha<=?'; params.push(fechaHasta); }
    }

    const [[{total:totalRows}]] = await db.query(
      `SELECT COUNT(*) AS total FROM movimientos m ${where}`, params);
    const totalPages = Math.ceil(totalRows / perPage);

    const [movimientos] = await db.query(
      `SELECT m.*, c.nombre AS cat_nombre, c.icono AS cat_icono
       FROM movimientos m LEFT JOIN categorias c ON m.categoria_id=c.id
       ${where} ORDER BY m.fecha DESC, m.creado_en DESC LIMIT ? OFFSET ?`,
      [...params, perPage, (page-1)*perPage]);

    const [categorias] = await db.query('SELECT * FROM categorias WHERE usuario_id=? ORDER BY nombre', [uid]);
    const [[totales]]  = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) AS ing,
              COALESCE(SUM(CASE WHEN tipo='egreso'  THEN monto ELSE 0 END),0) AS eg
       FROM movimientos WHERE usuario_id=? AND MONTH(fecha)=? AND YEAR(fecha)=?`, [uid,m,y]);

    const titulo = tipoFiltro==='ingreso' ? 'Ingresos' : tipoFiltro==='egreso' ? 'Egresos' : 'Movimientos';
    res.render('movimientos', {
      usuario:req.session.usuario, movimientos, categorias, totales,
      tipoFiltro, catFiltro, fechaDesde, fechaHasta,
      page, totalPages, totalRows, titulo, esPremium
    });
  } catch(e) { console.error(e); res.status(500).send('Error: '+e.message); }
});

router.post('/agregar', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { tipo, concepto, monto, fecha, categoria_id, notas } = req.body;
  try {
    await db.query(
      'INSERT INTO movimientos (usuario_id,tipo,concepto,monto,fecha,categoria_id,notas) VALUES (?,?,?,?,?,?,?)',
      [uid, tipo, concepto, parseFloat(monto), fecha, categoria_id||null, notas||null]);
    res.redirect('/movimientos');
  } catch(e) { console.error(e); res.status(500).send('Error: '+e.message); }
});

router.post('/editar/:id', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { tipo, concepto, monto, fecha, categoria_id, notas } = req.body;
  await db.query(
    'UPDATE movimientos SET tipo=?,concepto=?,monto=?,fecha=?,categoria_id=?,notas=? WHERE id=? AND usuario_id=?',
    [tipo, concepto, parseFloat(monto), fecha, categoria_id||null, notas||null, req.params.id, uid]);
  res.redirect('/movimientos');
});

router.post('/eliminar/:id', auth, async (req, res) => {
  await db.query('DELETE FROM movimientos WHERE id=? AND usuario_id=?', [req.params.id, req.session.usuario.id]);
  res.redirect('/movimientos');
});

module.exports = router;