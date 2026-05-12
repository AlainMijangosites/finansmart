const express = require('express');
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

// Migraciones compatibles con MySQL (ADD COLUMN sin IF NOT EXISTS, catch silencia duplicados)
(async () => {
  try { await db.query(`ALTER TABLE usuarios ADD COLUMN ingreso_mensual DECIMAL(12,2) DEFAULT 0`); } catch(e) {}
  try { await db.query(`ALTER TABLE usuarios ADD COLUMN foto_perfil MEDIUMTEXT DEFAULT NULL`); } catch(e) {}
  try { await db.query(`ALTER TABLE usuarios MODIFY COLUMN foto_perfil MEDIUMTEXT DEFAULT NULL`); } catch(e) {}
  try { await db.query(`ALTER TABLE usuarios ADD COLUMN ciudad VARCHAR(100) DEFAULT NULL`); } catch(e) {}
  try { await db.query(`ALTER TABLE usuarios ADD COLUMN ocupacion VARCHAR(100) DEFAULT NULL`); } catch(e) {}
})();

// Multer — guarda en memoria para convertir a base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.get('/', auth, async (req, res) => {
  const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [req.session.usuario.id]);
  req.session.usuario.foto_perfil = datos.foto_perfil || null;
  res.render('perfil', { usuario:req.session.usuario, datos, ok:req.query.ok||null, error:req.query.error||null, upgrade: req.query.upgrade||null });
});

router.post('/foto', auth, upload.single('foto'), async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo inválido o no seleccionado.' });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    await db.query('UPDATE usuarios SET foto_perfil=? WHERE id=?', [base64, uid]);
    req.session.usuario.foto_perfil = base64;
    res.json({ ok: true });
  } catch(e) {
    console.error('Error guardando foto:', e.message);
    res.status(500).json({ error: e.message });
  }
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

router.post('/premium', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    await db.query(`ALTER TABLE usuarios ADD COLUMN plan VARCHAR(20) DEFAULT 'gratuito'`).catch(()=>{});
    await db.query('UPDATE usuarios SET plan=? WHERE id=?', ['premium', uid]);
    req.session.usuario.plan = 'premium';
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:'⭐ ¡Bienvenido a Premium! Ya tienes acceso a todos los cursos.', error:null });
  } catch(e) {
    const [[datos]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);
    res.render('perfil', { usuario:req.session.usuario, datos, ok:null, error:'Error al activar premium: '+e.message });
  }
});

router.post('/cancelar-premium', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  try {
    await db.query('UPDATE usuarios SET plan=? WHERE id=?', ['gratuito', uid]);
    req.session.usuario.plan = 'gratuito';
    res.redirect('/perfil?ok=Tu suscripción Premium ha sido cancelada. Ahora tienes el plan gratuito.');
  } catch(e) {
    res.redirect('/perfil?error=Error al cancelar: '+e.message);
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