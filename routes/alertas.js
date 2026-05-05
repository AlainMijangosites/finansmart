const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

router.get('/', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const m = new Date().getMonth()+1, y = new Date().getFullYear();
  try {
    const [alertas] = await db.query(
      `SELECT c.nombre, c.icono, p.id, p.limite_monto,
              COALESCE(SUM(mv.monto),0) AS gastado
       FROM presupuestos p
       JOIN categorias c ON p.categoria_id=c.id
       LEFT JOIN movimientos mv ON mv.categoria_id=p.categoria_id
         AND mv.usuario_id=p.usuario_id AND MONTH(mv.fecha)=p.mes AND YEAR(mv.fecha)=p.anio AND mv.tipo='egreso'
       WHERE p.usuario_id=? AND p.mes=? AND p.anio=?
       GROUP BY p.id ORDER BY (COALESCE(SUM(mv.monto),0)/p.limite_monto) DESC`, [uid,m,y]);

    res.render('alertas', { usuario: req.session.usuario, alertas, mes: m, anio: y });
  } catch(e) { console.error(e); res.status(500).send('Error: '+e.message); }
});

module.exports = router;