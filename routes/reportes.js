const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

router.get('/', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const anio = req.query.anio || new Date().getFullYear();
  try {
    const [porMes]     = await db.query(`SELECT MONTH(fecha) AS mes, COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) AS ing, COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END),0) AS eg FROM movimientos WHERE usuario_id=? AND YEAR(fecha)=? GROUP BY MONTH(fecha) ORDER BY mes`, [uid,anio]);
    const [porCat]     = await db.query(`SELECT c.nombre, c.icono, SUM(m.monto) AS total FROM movimientos m JOIN categorias c ON m.categoria_id=c.id WHERE m.usuario_id=? AND m.tipo='egreso' AND YEAR(m.fecha)=? GROUP BY c.id ORDER BY total DESC`, [uid,anio]);
    const [[totales]]  = await db.query(`SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) AS ing, COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END),0) AS eg FROM movimientos WHERE usuario_id=? AND YEAR(fecha)=?`, [uid,anio]);
    res.render('reportes', { usuario:req.session.usuario, porMes, porCat, totales, anio:parseInt(anio), esPremium: req.session.usuario.plan === 'premium' });
  } catch(e) { console.error(e); res.status(500).send('Error'); }
});
module.exports = router;
