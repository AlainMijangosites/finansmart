const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

// Ensure ingreso_mensual column exists
db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ingreso_mensual DECIMAL(12,2) DEFAULT 0`)
  .catch(() => {}); // Silently ignore if already exists

router.get('/', auth, async (req, res) => {
  const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [req.session.usuario.id]);
  res.render('perfil', { usuario:req.session.usuario, datos, ok:null, error:null });
});

router.post('/actualizar', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { nombre, apellidos, ciudad, ocupacion, meta_ahorro, ingreso_mensual } = req.body;
  try {
    await db.query(
      'UPDATE usuarios SET nombre=?,apellidos=?,ciudad=?,ocupacion=?,meta_ahorro=?,ingreso_mensual=? WHERE id=?',
      [nombre, apellidos, ciudad||'', ocupacion||'', parseFloat(meta_ahorro)||20, parseFloat(ingreso_mensual)||0, uid]);
    req.session.usuario.nombre = nombre;
    req.session.usuario.apellidos = apellidos;
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:'✅ Perfil actualizado correctamente', error:null });
  } catch(e) {
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:null, error:'Error al actualizar: '+e.message });
  }
});

router.post('/password', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const { actual, nueva, confirmar } = req.body;
  try {
    const [[u]] = await db.query('SELECT contrasena FROM usuarios WHERE id=?', [uid]);
    if (!(await bcrypt.compare(actual, u.contrasena))) throw new Error('Contraseña actual incorrecta');
    if (nueva !== confirmar) throw new Error('Las contraseñas no coinciden');
    if (nueva.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
    await db.query('UPDATE usuarios SET contrasena=? WHERE id=?', [await bcrypt.hash(nueva,10), uid]);
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:'✅ Contraseña actualizada correctamente', error:null });
  } catch(e) {
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:null, error:e.message });
  }
});

router.post('/eliminar', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    await db.query('DELETE FROM movimientos WHERE usuario_id=?', [uid]);
    await db.query('DELETE FROM presupuestos WHERE usuario_id=?', [uid]);
    await db.query('DELETE FROM metas WHERE usuario_id=?', [uid]);
    await db.query('DELETE FROM categorias WHERE usuario_id=?', [uid]);
    await db.query('DELETE FROM usuarios WHERE id=?', [uid]);
    req.session.destroy(() => res.redirect('/login'));
  } catch(e) {
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:null, error:'Error al eliminar: '+e.message });
  }
});

module.exports = router;