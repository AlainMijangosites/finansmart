const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

router.get('/', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    const [metas] = await db.query(
      `SELECT * FROM metas WHERE usuario_id=? ORDER BY
       CASE estado WHEN 'activa' THEN 1 WHEN 'pausada' THEN 2 WHEN 'completada' THEN 3 ELSE 4 END,
       fecha_limite ASC`, [uid]);

    const totalAhorro = metas
      .filter(m=>m.estado==='activa'||m.estado==='completada')
      .reduce((a,m)=>a+parseFloat(m.monto_actual||0),0);
    const activas = metas.filter(m=>m.estado==='activa').length;
    const completadas = metas.filter(m=>m.estado==='completada').length;

    res.render('metas', {
      usuario: req.session.usuario,
      metas, totalAhorro, activas, completadas,
      ok: req.query.ok || null,
      error: req.query.error || null
    });
  } catch(e) { console.error(e); res.status(500).send('Error: '+e.message); }
});

router.post('/agregar', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { nombre, icono, monto_objetivo, fecha_limite } = req.body;
  try {
    await db.query(
      `INSERT INTO metas (usuario_id, nombre, icono, monto_meta, monto_actual, estado, fecha_limite)
       VALUES (?,?,?,?,0,'activa',?)`,
      [uid, nombre, icono||'⭐', monto_objetivo, fecha_limite||null]);
    res.redirect('/metas?ok=Meta creada exitosamente');
  } catch(e) { console.error(e); res.redirect('/metas?error=Error al crear la meta'); }
});

router.post('/abonar/:id', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { monto } = req.body;
  try {
    const [rows] = await db.query(`SELECT * FROM metas WHERE id=? AND usuario_id=?`, [req.params.id, uid]);
    if (!rows.length) return res.redirect('/metas?error=Meta no encontrada');
    const meta = rows[0];
    const nuevo = parseFloat(meta.monto_actual||0) + parseFloat(monto);
    const estado = nuevo >= parseFloat(meta.monto_meta) ? 'completada' : 'activa';
    await db.query(`UPDATE metas SET monto_actual=?, estado=? WHERE id=?`, [nuevo, estado, meta.id]);
    res.redirect('/metas?ok=Abono registrado correctamente');
  } catch(e) { console.error(e); res.redirect('/metas?error=Error al abonar'); }
});

router.post('/pausar/:id', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    const [rows] = await db.query(`SELECT estado FROM metas WHERE id=? AND usuario_id=?`, [req.params.id, uid]);
    if (!rows.length) return res.redirect('/metas');
    const nuevoEstado = rows[0].estado==='activa' ? 'pausada' : 'activa';
    await db.query(`UPDATE metas SET estado=? WHERE id=? AND usuario_id=?`, [nuevoEstado, req.params.id, uid]);
    res.redirect('/metas?ok=Estado de meta actualizado');
  } catch(e) { res.redirect('/metas'); }
});

router.post('/eliminar/:id', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    await db.query(`DELETE FROM metas WHERE id=? AND usuario_id=?`, [req.params.id, uid]);
    res.redirect('/metas?ok=Meta eliminada');
  } catch(e) { res.redirect('/metas?error=Error al eliminar'); }
});

module.exports = router;