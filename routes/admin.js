const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

const adminAuth = (req, res, next) => {
  if (!req.session.usuario) return res.redirect('/login');
  if (req.session.usuario.rol !== 'admin') return res.status(403).send('<h2 style="font-family:sans-serif;padding:2rem">403 — Acceso denegado</h2><a href="/dashboard">← Volver</a>');
  next();
};

router.get('/', adminAuth, async (req, res) => {
  try {
    const [usuarios]   = await db.query('SELECT id,nombre,apellidos,correo,plan,activo,creado_en FROM usuarios ORDER BY creado_en DESC');
    const [[stats]]    = await db.query(`SELECT COUNT(*) AS total, SUM(activo=1) AS activos, SUM(plan='premium') AS premium FROM usuarios`);
    const [[movStats]] = await db.query('SELECT COUNT(*) AS total, COALESCE(SUM(monto),0) AS volumen FROM movimientos');
    const [[metaStats]]= await db.query("SELECT COUNT(*) AS total FROM metas WHERE estado='completada'");
    res.render('admin', { usuario:req.session.usuario, usuarios, stats, movStats, metaStats });
  } catch(e) { res.status(500).send('Error: '+e.message); }
});

router.post('/toggle/:id', adminAuth, async (req, res) => {
  const [[u]] = await db.query('SELECT activo FROM usuarios WHERE id=?', [req.params.id]);
  await db.query('UPDATE usuarios SET activo=? WHERE id=?', [u.activo?0:1, req.params.id]);
  res.redirect('/admin');
});

router.post('/plan/:id', adminAuth, async (req, res) => {
  const { plan } = req.body;
  await db.query("UPDATE usuarios SET plan=? WHERE id=?", [plan, req.params.id]);
  res.redirect('/admin');
});

router.post('/eliminar/:id', adminAuth, async (req, res) => {
  const id = req.params.id;
  if (id == req.session.usuario.id) return res.redirect('/admin');
  await db.query('DELETE FROM movimientos WHERE usuario_id=?', [id]);
  await db.query('DELETE FROM presupuestos WHERE usuario_id=?', [id]);
  await db.query('DELETE FROM metas WHERE usuario_id=?', [id]);
  await db.query('DELETE FROM categorias WHERE usuario_id=?', [id]);
  await db.query('DELETE FROM usuarios WHERE id=?', [id]);
  res.redirect('/admin');
});

module.exports = router;
