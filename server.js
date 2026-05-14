require('dotenv').config();
const express        = require('express');
const session        = require('express-session');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt         = require('bcryptjs');
const path           = require('path');
const db             = require('./config/db');
const app            = express();
const PORT           = process.env.PORT || 3000;

// ── Google OAuth (siempre configurado, falla gracefully si no hay vars) ──────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID     || 'PLACEHOLDER',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER',
  callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const correo    = profile.emails[0].value;
    const [rows]    = await db.query('SELECT * FROM usuarios WHERE correo=?', [correo]);
    if (rows.length) return done(null, rows[0]);

    const nombre    = profile.name.givenName  || profile.displayName;
    const apellidos = profile.name.familyName || '';
    const hash      = bcrypt.hashSync(Math.random().toString(36) + Date.now(), 10);
    const [r]       = await db.query(
      'INSERT INTO usuarios (nombre,apellidos,correo,contrasena) VALUES (?,?,?,?)',
      [nombre, apellidos, correo, hash]
    );
    const cats = [
      ['Alimentación','🍔','egreso'],['Transporte','🚗','egreso'],
      ['Entretenimiento','🎬','egreso'],['Salud','💊','egreso'],
      ['Educación','📚','egreso'],['Servicios','💡','egreso'],
      ['Sueldo','💰','ingreso'],['Otros','📦','ambos']
    ];
    for (const [n,i,t] of cats)
      await db.query('INSERT INTO categorias (usuario_id,nombre,icono,tipo) VALUES (?,?,?,?)', [r.insertId,n,i,t]);

    const [[nu]] = await db.query('SELECT * FROM usuarios WHERE id=?', [r.insertId]);
    done(null, nu);
  } catch(e) { done(e, null); }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const [[u]] = await db.query('SELECT * FROM usuarios WHERE id=?', [id]);
    done(null, u || null);
  } catch(e) { done(e, null); }
});

// ── Express setup ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'finansmart2025',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Rutas de la app ───────────────────────────────────────────────────────────
app.use('/',            require('./routes/auth'));
app.use('/dashboard',   require('./routes/dashboard'));
app.use('/movimientos', require('./routes/movimientos'));
app.use('/reportes',    require('./routes/reportes'));
app.use('/perfil',      require('./routes/perfil'));
app.use('/presupuesto', require('./routes/presupuesto'));
app.use('/metas',       require('./routes/metas'));
app.use('/educacion',   require('./routes/educacion'));
app.use('/alertas',     require('./routes/alertas'));
app.use('/exportar',    require('./routes/exportar'));
app.use('/admin',       require('./routes/admin'));

// ── Google OAuth rutas (siempre registradas) ──────────────────────────────────
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'PLACEHOLDER')
    return res.redirect('/login?error=Google+OAuth+no+configurado');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    req.session.usuario = {
      id:         req.user.id,
      nombre:     req.user.nombre,
      apellidos:  req.user.apellidos,
      correo:     req.user.correo,
      plan:       req.user.plan    || 'gratuito',
      rol:        req.user.rol     || 'usuario',
      foto_perfil: req.user.foto_perfil || null
    };
    res.redirect('/dashboard');
  }
);

// ── Raíz y 404 ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect(req.session.usuario ? '/dashboard' : '/login'));
app.use((req, res) => res.status(404).send('<h2 style="font-family:sans-serif;padding:2rem">404 — Página no encontrada</h2><a href="/dashboard">← Volver al inicio</a>'));

app.listen(PORT, '0.0.0.0', () => console.log(`\n🚀 FINANSMART corriendo en http://localhost:${PORT}\n`));
