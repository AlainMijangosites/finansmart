const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const router  = express.Router();

// Agregar columnas faltantes si no existen
db.query(`ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) DEFAULT 'usuario'`).catch(()=>{});
db.query(`ALTER TABLE usuarios ADD COLUMN meta_ahorro DECIMAL(5,2) DEFAULT 20`).catch(()=>{});
db.query(`ALTER TABLE usuarios ADD COLUMN ingreso_mensual DECIMAL(12,2) DEFAULT 0`).catch(()=>{});
db.query(`ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(100) DEFAULT NULL`).catch(()=>{});

router.get('/login',    (req, res) => { if(req.session.usuario) return res.redirect('/dashboard'); res.render('login', {error:null}); });
router.get('/registro', (req, res) => { if(req.session.usuario) return res.redirect('/dashboard'); res.render('registro', {error:null}); });
router.get('/logout',   (req, res) => { req.session.destroy(() => res.redirect('/login')); });

router.get('/recuperar', (req, res) => res.render('recuperar', {ok:null, error:null}));

router.post('/recuperar', async (req, res) => {
  const { correo } = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM usuarios WHERE correo=? AND activo=1', [correo]);
    if (!rows.length) return res.render('recuperar', {ok:null, error:'No existe una cuenta con ese correo.'});
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100) DEFAULT NULL`).catch(()=>{});
    await db.query('UPDATE usuarios SET reset_token=? WHERE correo=?', [token, correo]);
    console.log(`\n🔑 RESET LINK: http://localhost:3000/reset/${token}\n`);
    res.render('recuperar', {ok:'✅ Enlace generado. Revisa la consola del servidor (en producción se enviará por correo).', error:null});
  } catch(e) { res.render('recuperar', {ok:null, error:'Error: '+e.message}); }
});

router.get('/reset/:token', async (req, res) => {
  const [rows] = await db.query('SELECT id FROM usuarios WHERE reset_token=?', [req.params.token]);
  if (!rows.length) return res.send('<p>Enlace inválido o expirado. <a href="/login">Volver</a></p>');
  res.render('reset', {token:req.params.token, error:null});
});

router.post('/reset/:token', async (req, res) => {
  const { nueva, confirmar } = req.body;
  if (nueva !== confirmar) return res.render('reset', {token:req.params.token, error:'Las contraseñas no coinciden'});
  if (nueva.length < 6)    return res.render('reset', {token:req.params.token, error:'Mínimo 6 caracteres'});
  const [rows] = await db.query('SELECT id FROM usuarios WHERE reset_token=?', [req.params.token]);
  if (!rows.length) return res.send('<p>Enlace inválido. <a href="/login">Volver</a></p>');
  const hash = await bcrypt.hash(nueva, 10);
  await db.query('UPDATE usuarios SET contrasena=?, reset_token=NULL WHERE id=?', [hash, rows[0].id]);
  res.redirect('/login');
});

router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo=? AND activo=1', [correo]);
    if (!rows.length || !(await bcrypt.compare(contrasena, rows[0].contrasena)))
      return res.render('login', { error: 'Correo o contraseña incorrectos' });
    req.session.usuario = { id:rows[0].id, nombre:rows[0].nombre, apellidos:rows[0].apellidos, correo:rows[0].correo, plan:rows[0].plan, rol:rows[0].rol||'usuario', foto_perfil:rows[0].foto_perfil||null };
    res.redirect('/dashboard');
  } catch(e) { res.render('login', { error: 'Error del servidor' }); }
});

router.post('/registro', async (req, res) => {
  const { nombre, apellidos, correo, contrasena, confirmar } = req.body;
  if (contrasena !== confirmar) return res.render('registro', { error: 'Las contraseñas no coinciden' });
  try {
    const [ex] = await db.query('SELECT id FROM usuarios WHERE correo=?', [correo]);
    if (ex.length) return res.render('registro', { error: 'Ese correo ya está registrado' });
    const hash = await bcrypt.hash(contrasena, 10);
    const [r] = await db.query('INSERT INTO usuarios (nombre,apellidos,correo,contrasena) VALUES (?,?,?,?)', [nombre,apellidos,correo,hash]);
    const uid = r.insertId;
    const cats = [['Alimentación','🍔','egreso'],['Transporte','🚗','egreso'],['Entretenimiento','🎬','egreso'],['Salud','💊','egreso'],['Educación','📚','egreso'],['Ropa','👕','egreso'],['Servicios','💡','egreso'],['Sueldo','💰','ingreso'],['Freelance','💻','ingreso'],['Otros','📦','ambos']];
    for (const [n,i,t] of cats) await db.query('INSERT INTO categorias (usuario_id,nombre,icono,tipo) VALUES (?,?,?,?)', [uid,n,i,t]);
    req.session.usuario = { id:uid, nombre, apellidos, correo, plan:'gratuito' };
    res.redirect('/dashboard');
  } catch(e) { console.error(e); res.render('registro', { error: 'Error del servidor' }); }
});
module.exports = router;
