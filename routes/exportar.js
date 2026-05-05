const express = require('express');
const db      = require('../config/db');
const router  = express.Router();
const auth = (req,res,next) => req.session.usuario ? next() : res.redirect('/login');

// ── PDF ──────────────────────────────────────────────
router.get('/pdf', auth, async (req, res) => {
  const uid  = req.session.usuario.id;
  const m    = new Date().getMonth()+1;
  const y    = new Date().getFullYear();
  const PDFDocument = require('pdfkit');

  try {
    const [movimientos] = await db.query(
      `SELECT m.*, c.nombre AS cat_nombre FROM movimientos m
       LEFT JOIN categorias c ON m.categoria_id=c.id
       WHERE m.usuario_id=? ORDER BY m.fecha DESC LIMIT 100`, [uid]);

    const [[totales]] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END),0) AS ing,
              COALESCE(SUM(CASE WHEN tipo='egreso'  THEN monto ELSE 0 END),0) AS eg
       FROM movimientos WHERE usuario_id=? AND MONTH(fecha)=? AND YEAR(fecha)=?`, [uid,m,y]);

    const [porCat] = await db.query(
      `SELECT c.nombre, c.icono, SUM(m.monto) AS total
       FROM movimientos m JOIN categorias c ON m.categoria_id=c.id
       WHERE m.usuario_id=? AND m.tipo='egreso' AND MONTH(m.fecha)=? AND YEAR(m.fecha)=?
       GROUP BY c.id ORDER BY total DESC`, [uid,m,y]);

    const [[user]] = await db.query('SELECT * FROM usuarios WHERE id=?', [uid]);

    const doc  = new PDFDocument({ margin:50, size:'A4' });
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename="finansmart-reporte-${y}-${m}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0,0,612,100).fill('#072146');
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#FFFFFF').text('FINANSMART', 50, 30);
    doc.fontSize(11).font('Helvetica').fillColor('rgba(255,255,255,0.7)').text('Reporte Financiero Personal', 50, 58);
    doc.fontSize(10).fillColor('#00D49E').text(`${meses[m-1]} ${y}  ·  ${user.nombre} ${user.apellidos}`, 50, 76);

    // Resumen del mes
    doc.moveDown(4);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#072146').text('Resumen del Mes', 50, 120);
    doc.moveTo(50,138).lineTo(562,138).stroke('#00D49E');

    const ing = parseFloat(totales.ing), eg = parseFloat(totales.eg);
    const balance = ing - eg;

    const drawStat = (label, value, color, x, y2) => {
      doc.rect(x, y2, 155, 65).fill('#F8FAFD').stroke('#D8E3F0');
      doc.fontSize(9).font('Helvetica').fillColor('#6A7FA8').text(label, x+12, y2+12);
      doc.fontSize(16).font('Helvetica-Bold').fillColor(color).text(`$${value.toLocaleString('es-MX',{minimumFractionDigits:2})}`, x+12, y2+28);
    };
    drawStat('INGRESOS DEL MES',    ing,     '#00875A',  50,  148);
    drawStat('EGRESOS DEL MES',     eg,      '#C0293A',  215, 148);
    drawStat('BALANCE',             balance, balance>=0?'#00875A':'#C0293A', 380, 148);

    // Gastos por categoría
    if (porCat.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#072146').text('Gastos por Categoría', 50, 235);
      doc.moveTo(50,252).lineTo(562,252).stroke('#00D49E');
      const totCat = porCat.reduce((a,c)=>a+parseFloat(c.total),0);
      let cy = 262;
      porCat.slice(0,8).forEach(c => {
        const pct = totCat>0 ? Math.round((c.total/totCat)*100) : 0;
        doc.fontSize(10).font('Helvetica').fillColor('#2A4070').text(`${c.nombre}`, 50, cy);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#072146').text(`$${parseFloat(c.total).toLocaleString('es-MX',{minimumFractionDigits:2})}  (${pct}%)`, 350, cy, {width:200,align:'right'});
        doc.rect(50, cy+14, 512, 5).fill('#E8EFF8');
        doc.rect(50, cy+14, Math.round(512*(pct/100)), 5).fill('#00D49E');
        cy += 30;
      });
    }

    // Movimientos recientes
    const startY = doc.y + 20;
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#072146').text('Últimos Movimientos', 50, startY);
    doc.moveTo(50, startY+17).lineTo(562, startY+17).stroke('#00D49E');

    // Table header
    let ty = startY+27;
    doc.rect(50, ty, 512, 20).fill('#072146');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('FECHA',     55,  ty+6);
    doc.text('CONCEPTO',  130, ty+6);
    doc.text('CATEGORÍA', 310, ty+6);
    doc.text('TIPO',      420, ty+6);
    doc.text('MONTO',     470, ty+6, {width:88,align:'right'});
    ty += 22;

    movimientos.slice(0,25).forEach((mov, i) => {
      if (ty > 730) { doc.addPage(); ty = 50; }
      const bg = i%2===0 ? '#F8FAFD' : '#FFFFFF';
      doc.rect(50, ty, 512, 18).fill(bg);
      const fecha = new Date(mov.fecha).toLocaleDateString('es-MX');
      doc.fontSize(8).font('Helvetica').fillColor('#3A4A6B');
      doc.text(fecha,              55,  ty+5);
      doc.text(mov.concepto.slice(0,28), 130, ty+5);
      doc.text((mov.cat_nombre||'—').slice(0,22), 310, ty+5);
      doc.fillColor(mov.tipo==='ingreso'?'#00875A':'#C0293A').text(mov.tipo, 420, ty+5);
      const signo = mov.tipo==='ingreso' ? '+' : '-';
      doc.text(`${signo}$${parseFloat(mov.monto).toLocaleString('es-MX',{minimumFractionDigits:2})}`, 470, ty+5, {width:88,align:'right'});
      ty += 18;
    });

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#8A9FBF')
       .text(`Generado por FINANSMART · ${new Date().toLocaleDateString('es-MX')}`, 50, 800, {align:'center'});

    doc.end();
  } catch(e) { console.error(e); res.status(500).send('Error al generar PDF: '+e.message); }
});

// ── EXCEL ─────────────────────────────────────────────
router.get('/excel', auth, async (req, res) => {
  const uid = req.session.usuario.id;
  const ExcelJS = require('exceljs');

  try {
    const [movimientos] = await db.query(
      `SELECT m.fecha, m.tipo, m.concepto, c.nombre AS categoria, m.monto, m.notas
       FROM movimientos m LEFT JOIN categorias c ON m.categoria_id=c.id
       WHERE m.usuario_id=? ORDER BY m.fecha DESC`, [uid]);

    const [porMes] = await db.query(
      `SELECT YEAR(fecha) AS anio, MONTH(fecha) AS mes,
              SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) AS ingresos,
              SUM(CASE WHEN tipo='egreso'  THEN monto ELSE 0 END) AS egresos
       FROM movimientos WHERE usuario_id=?
       GROUP BY anio, mes ORDER BY anio DESC, mes DESC`, [uid]);

    const wb  = new ExcelJS.Workbook();
    wb.creator = 'FINANSMART';
    wb.created = new Date();

    const verde  = '00D49E', navy = '072146', rojo = 'FF4D5E', blanco = 'FFFFFF';

    const styleHeader = (cell, bg) => {
      cell.fill   = { type:'pattern', pattern:'solid', fgColor:{argb:'FF'+bg} };
      cell.font   = { bold:true, color:{argb:'FF'+blanco}, size:10 };
      cell.alignment = { vertical:'middle', horizontal:'center' };
      cell.border = { bottom:{style:'thin',color:{argb:'FF'+verde}} };
    };

    // ── Hoja 1: Movimientos ──
    const ws1 = wb.addWorksheet('Movimientos');
    ws1.columns = [
      {header:'Fecha',     key:'fecha',     width:14},
      {header:'Tipo',      key:'tipo',      width:10},
      {header:'Concepto',  key:'concepto',  width:30},
      {header:'Categoría', key:'categoria', width:18},
      {header:'Monto',     key:'monto',     width:16},
      {header:'Notas',     key:'notas',     width:25},
    ];
    ws1.getRow(1).eachCell(cell => styleHeader(cell, navy));
    ws1.getRow(1).height = 22;

    movimientos.forEach(m => {
      const row = ws1.addRow({
        fecha:     new Date(m.fecha).toLocaleDateString('es-MX'),
        tipo:      m.tipo,
        concepto:  m.concepto,
        categoria: m.categoria || '—',
        monto:     parseFloat(m.monto),
        notas:     m.notas || '',
      });
      const montoCell = row.getCell('monto');
      montoCell.numFmt = '"$"#,##0.00';
      montoCell.font   = { color:{argb: m.tipo==='ingreso'?'FF00875A':'FFCC0000'}, bold:true };
      row.getCell('tipo').font = { color:{argb: m.tipo==='ingreso'?'FF00875A':'FFCC0000'} };
    });

    ws1.autoFilter = { from:'A1', to:'F1' };

    // ── Hoja 2: Resumen por mes ──
    const ws2 = wb.addWorksheet('Resumen Mensual');
    const meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    ws2.columns = [
      {header:'Año',      key:'anio',     width:10},
      {header:'Mes',      key:'mes',      width:14},
      {header:'Ingresos', key:'ingresos', width:16},
      {header:'Egresos',  key:'egresos',  width:16},
      {header:'Balance',  key:'balance',  width:16},
    ];
    ws2.getRow(1).eachCell(cell => styleHeader(cell, navy));
    ws2.getRow(1).height = 22;

    porMes.forEach(r => {
      const bal = parseFloat(r.ingresos) - parseFloat(r.egresos);
      const row = ws2.addRow({
        anio:     r.anio,
        mes:      meses[r.mes],
        ingresos: parseFloat(r.ingresos),
        egresos:  parseFloat(r.egresos),
        balance:  bal,
      });
      ['ingresos','egresos','balance'].forEach(k => {
        const c = row.getCell(k);
        c.numFmt = '"$"#,##0.00';
        if (k==='balance') c.font = { bold:true, color:{argb: bal>=0?'FF00875A':'FFCC0000'} };
      });
    });

    const y = new Date().getFullYear(), m2 = new Date().getMonth()+1;
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="finansmart-${y}-${m2}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch(e) { console.error(e); res.status(500).send('Error al generar Excel: '+e.message); }
});

module.exports = router;
