// =========================================================================
// UTILIDAD DE GENERACIÓN Y EXPORTACIÓN DE REPORTES OFICIALES
// SEGURIDAD CIUDADANA - MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
// =========================================================================

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncidentRecord, MesType } from '../types';
import { MESES_LIST } from '../data/mockData';

export interface MonthlyReportRow {
  incidencia: string;
  total: number;
  porcentaje: number;
}

export interface MonthlyReportData {
  mes: MesType;
  rangoFechas: string;
  rows: MonthlyReportRow[];
  totalMes: number;
  porcentajeAnual: string;
}

export interface AnnualConsolidatedRow {
  incidencia: string;
  meses: Record<string, number>;
  total: number;
  porcentaje: number;
}

export interface AnnualConsolidatedData {
  anio: number;
  rows: AnnualConsolidatedRow[];
  totalesPorMes: Record<string, number>;
  totalGeneral: number;
  porcentajesPorMes: Record<string, number>;
}

const MESES_DIAS_2026: Record<string, number> = {
  ENERO: 31,
  FEBRERO: 28,
  MARZO: 31,
  ABRIL: 30,
  MAYO: 31,
  JUNIO: 30,
  JULIO: 31,
  AGOSTO: 31,
  SETIEMBRE: 30,
  OCTUBRE: 31,
  NOVIEMBRE: 30,
  DICIEMBRE: 31,
};

// =========================================================================
// CÁLCULO DE DATOS: FICHA MENSUAL OFICIAL (TOTALIDAD DE INCIDENCIAS)
// =========================================================================
export function getMonthlyReportData(
  records: IncidentRecord[] = [],
  allRecords: IncidentRecord[] = [],
  mes: MesType = 'SETIEMBRE'
): MonthlyReportData {
  const safeAll = Array.isArray(allRecords) ? allRecords : [];
  const safeRecs = Array.isArray(records) ? records : [];
  const base = safeAll.length > 0 ? safeAll : safeRecs;
  const safeMes = (mes || 'SETIEMBRE').toString().trim().toUpperCase() as MesType;

  // Filtrar registros del mes seleccionado (normalizar a mayúsculas)
  const monthRecords = base.filter(
    (r) => (r?.mes || '').toString().trim().toUpperCase() === safeMes
  );

  const totalMes = monthRecords.length;

  // Agrupar por tipo de conflicto / incidencia
  const counts: Record<string, number> = {};
  monthRecords.forEach((r) => {
    if (!r) return;
    const inc = (r.incidencia || r.tipoIncidencia || 'OTROS').toString().trim().toUpperCase();
    counts[inc] = (counts[inc] || 0) + 1;
  });

  // Generar lista completa ordenada descendente
  const rows: MonthlyReportRow[] = Object.entries(counts)
    .map(([incidencia, total]) => ({
      incidencia,
      total,
      porcentaje: totalMes > 0 ? (total / totalMes) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const mesCapitalizado =
    safeMes.length > 0 ? (safeMes.charAt(0) + safeMes.slice(1).toLowerCase()) : 'Setiembre';
  const finDeMes = MESES_DIAS_2026[safeMes] || 30;
  const rangoFechas = `Desde el 01 de ${mesCapitalizado} del 2026 Hasta el ${finDeMes} de ${mesCapitalizado} 2026`;

  const totalAnualDistrital = base.length || 1;
  const porcentajeAnual = ((totalMes / totalAnualDistrital) * 100).toFixed(2);

  return {
    mes: safeMes,
    rangoFechas,
    rows,
    totalMes,
    porcentajeAnual,
  };
}

// =========================================================================
// CÁLCULO DE DATOS: CONSOLIDADO GENERAL ANUAL (Matriz Completa)
// =========================================================================
export function getAnnualConsolidatedData(
  records: IncidentRecord[]
): AnnualConsolidatedData {
  const countsByIncAndMonth: Record<string, Record<string, number>> = {};
  const totalesPorMes: Record<string, number> = {};

  MESES_LIST.forEach((m) => {
    totalesPorMes[m] = 0;
  });

  records.forEach((r) => {
    const inc = (r.incidencia || 'OTROS').trim().toUpperCase();
    const mes = (r.mes || '').trim().toUpperCase();

    if (!countsByIncAndMonth[inc]) {
      countsByIncAndMonth[inc] = {};
      MESES_LIST.forEach((m) => {
        countsByIncAndMonth[inc][m] = 0;
      });
    }

    if (totalesPorMes[mes] !== undefined) {
      totalesPorMes[mes] += 1;
    }
    if (countsByIncAndMonth[inc][mes] !== undefined) {
      countsByIncAndMonth[inc][mes] += 1;
    }
  });

  const totalGeneral = records.length;

  const rows: AnnualConsolidatedRow[] = Object.entries(countsByIncAndMonth)
    .map(([incidencia, meses]) => {
      const total = Object.values(meses).reduce((sum, v) => sum + v, 0);
      const porcentaje = totalGeneral > 0 ? (total / totalGeneral) * 100 : 0;
      return {
        incidencia,
        meses,
        total,
        porcentaje,
      };
    })
    .sort((a, b) => b.total - a.total);

  const porcentajesPorMes: Record<string, number> = {};
  MESES_LIST.forEach((m) => {
    porcentajesPorMes[m] =
      totalGeneral > 0 ? ((totalesPorMes[m] || 0) / totalGeneral) * 100 : 0;
  });

  return {
    rows,
    totalesPorMes,
    anio: 2026,
    totalGeneral,
    porcentajesPorMes,
  };
}

// =========================================================================
// EXPORTACIÓN EXCEL (.XLSX) - FICHA MENSUAL OFICIAL (TOTALIDAD DE FILAS)
// =========================================================================
export function exportMonthlyReportExcel(data: MonthlyReportData) {
  const wb = XLSX.utils.book_new();

  const titleRows = [
    ['MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE'],
    ['SUBGERENCIA DE SEGURIDAD CIUDADANA'],
    ['EN LOS PRINCIPALES CONFLICTOS MAS COMUNES DE LA JURISDICCION'],
    [data.rangoFechas],
    [],
    ['CONFLICTOS MAS COMUNES', 'TOTALE', '%'],
  ];

  const bodyRows = data.rows.map((r) => [
    r.incidencia,
    r.total,
    `${r.porcentaje.toFixed(2)}%`,
  ]);

  const totalRow = [
    'TOTAL DE INCIDENCIAS',
    data.totalMes,
    '100.00%',
  ];

  const wsData = [...titleRows, ...bodyRows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 48 }, // CONFLICTOS MAS COMUNES
    { wch: 14 }, // TOTALE
    { wch: 12 }, // %
    { wch: 4 },  // Separador
    { wch: 45 }, // Resumen del gráfico
    { wch: 15 },
  ];

  const chartStartRow = 5;
  ws[XLSX.utils.encode_cell({ r: chartStartRow, c: 4 })] = {
    v: 'RESUMEN GRAFICO DE BARRAS HORIZONTALES',
    t: 's',
  };
  ws[XLSX.utils.encode_cell({ r: chartStartRow, c: 5 })] = {
    v: 'VALOR',
    t: 's',
  };

  data.rows.forEach((r, idx) => {
    const rowIdx = chartStartRow + 1 + idx;
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 4 })] = {
      v: r.incidencia,
      t: 's',
    };
    ws[XLSX.utils.encode_cell({ r: rowIdx, c: 5 })] = {
      v: r.total,
      t: 'n',
    };
  });

  XLSX.utils.book_append_sheet(wb, ws, `Ficha ${data.mes.slice(0, 3)} 2026`);
  XLSX.writeFile(wb, `Ficha_Oficial_${data.mes}_2026_Seguridad_Ciudadana.xlsx`);
}

// =========================================================================
// EXPORTACIÓN PDF HORIZONTAL (LANDSCAPE A4) - FICHA MENSUAL EN 1 SOLA HOJA
// =========================================================================
export function exportMonthlyReportLandscapePDF(
  data: MonthlyReportData,
  sheetCanvasDataUrl?: string,
  canvasWidth?: number,
  canvasHeight?: number
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297; // A4 Landscape width (297 mm)
  const pageHeight = 210; // A4 Landscape height (210 mm)

  if (sheetCanvasDataUrl) {
    try {
      // Ajuste exacto para 1 sola hoja horizontal A4 sin desbordamiento
      const marginX = 5;
      const marginY = 5;
      const maxW = pageWidth - marginX * 2; // 287 mm
      const maxH = pageHeight - marginY * 2; // 200 mm

      let finalW = maxW;
      let finalH = maxH;

      if (canvasWidth && canvasHeight && canvasHeight > 0) {
        const aspect = canvasWidth / canvasHeight;
        if (maxW / maxH > aspect) {
          finalH = maxH;
          finalW = maxH * aspect;
        } else {
          finalW = maxW;
          finalH = maxW / aspect;
        }
      }

      // Centrado en la página A4 apaisada
      const posX = (pageWidth - finalW) / 2;
      const posY = (pageHeight - finalH) / 2;

      doc.addImage(sheetCanvasDataUrl, 'PNG', posX, posY, finalW, finalH, undefined, 'FAST');
      doc.save(`Ficha_Oficial_${data.mes}_2026_Seguridad_Ciudadana.pdf`);
      return;
    } catch (err) {
      console.warn('Fallback a renderizado nativo vector en PDF:', err);
    }
  }

  // =========================================================================
  // FALLBACK NATIVO APAISADO (LANDSCAPE A4) - BARRAS HORIZONTALES EN 1 HOJA
  // =========================================================================
  // Encabezado superior institucional
  doc.setFillColor(11, 36, 71); // #0B2447
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setFillColor(6, 182, 212); // #06B6D4
  doc.rect(0, 16, pageWidth, 1, 'F');

  // Logo institucional "/LOGO final.png" en la cabecera izquierda
  try {
    const logoImg = new Image();
    logoImg.src = '/LOGO final.png';
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(6, 2, 38, 12, 1, 1, 'F');
      doc.addImage(logoImg, 'PNG', 7, 2.5, 36, 11);
    }
  } catch (err) {
    // Si la imagen no está en memoria, continúa
  }

  // Insignia circular Serenazgo en la cabecera derecha
  try {
    const serenazgoImg = new Image();
    serenazgoImg.src = '/Logo - Serenazgo 2025.png';
    if (serenazgoImg.complete && serenazgoImg.naturalWidth > 0) {
      doc.addImage(serenazgoImg, 'PNG', pageWidth - 18, 2, 12, 12);
    }
  } catch (err) {
    // silent
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE - SUBGERENCIA DE SEGURIDAD CIUDADANA', pageWidth / 2, 7, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`FICHA OFICIAL DE INCIDENCIAS • ${data.mes} 2026 • TODAS LAS ATENCIONES (${data.totalMes.toLocaleString()})`, pageWidth / 2, 13, { align: 'center' });

  // -------------------------------------------------------------------------
  // COLUMNA IZQUIERDA (36% -> 96 mm): TABLA COMPACTA EN 1 SOLA HOJA
  // -------------------------------------------------------------------------
  const leftX = 7;
  const leftW = 96;

  const totalRowsCount = data.rows.length;
  // Ajuste milimétrico para que 35 filas encajen perfectamente en 210mm
  const tableFontSize = totalRowsCount > 25 ? 5.2 : 6.0;
  const tablePadding = totalRowsCount > 25 ? 0.7 : 1.0;

  const tableRows = data.rows.map((r) => [
    r.incidencia,
    r.total.toLocaleString(),
    `${r.porcentaje.toFixed(2)}%`,
  ]);
  tableRows.push([
    'TOTAL DE INCIDENCIAS',
    data.totalMes.toLocaleString(),
    '100%',
  ]);

  autoTable(doc, {
    startY: 20,
    margin: { left: leftX },
    tableWidth: leftW,
    head: [['CONFLICTOS MAS COMUNES', 'TOTALE', '%']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: tableFontSize,
      cellPadding: tablePadding,
      font: 'helvetica',
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [11, 36, 71],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 58, halign: 'left', fillColor: [27, 58, 107], textColor: [255, 255, 255], fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] },
      2: { cellWidth: 18, halign: 'center', fillColor: [255, 255, 255] },
    },
    didParseCell: (hookData) => {
      if (hookData.row.index === tableRows.length - 1) {
        hookData.cell.styles.fillColor = [11, 36, 71];
        hookData.cell.styles.textColor = [255, 255, 255];
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // -------------------------------------------------------------------------
  // COLUMNA DERECHA (64% -> 180 mm): GRÁFICO DE BARRAS HORIZONTALES NATIVO
  // -------------------------------------------------------------------------
  const rightX = 108;
  const rightW = 182;

  doc.setTextColor(11, 36, 71);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('EN LOS PRINCIPALES CONFLICTOS MAS COMUNES DE LA JURISDICCION', rightX + rightW / 2, 22, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(data.rangoFechas, rightX + rightW / 2, 26.5, { align: 'center' });

  // Marco del gráfico
  const chartBoxY = 29;
  const chartBoxH = 173;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightX, chartBoxY, rightW, chartBoxH, 2, 2, 'FD');

  // Ejes y geometría de barras horizontales
  const plotLeft = rightX + 60; // Margen izquierdo para nombres rectos
  const plotRight = rightX + rightW - 14;
  const plotW = plotRight - plotLeft;
  const plotTop = chartBoxY + 8;
  const plotBottom = chartBoxY + chartBoxH - 12;
  const plotH = plotBottom - plotTop;

  const maxVal = data.rows[0]?.total || 10;
  const xAxisMax = Math.ceil((maxVal * 1.15) / 50) * 50 || 100;
  const xSteps = 5;

  // Líneas de cuadrícula verticales
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  for (let s = 0; s <= xSteps; s++) {
    const v = (xAxisMax / xSteps) * s;
    const xPos = plotLeft + (v / xAxisMax) * plotW;

    doc.setDrawColor(241, 245, 249);
    doc.setLineDashPattern(s === 0 ? [] : [1, 1], 0);
    doc.line(xPos, plotTop, xPos, plotBottom);

    doc.text(v.toLocaleString(), xPos, plotBottom + 4, { align: 'center' });
  }

  // Eje vertical continuo
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([], 0);
  doc.line(plotLeft, plotTop, plotLeft, plotBottom);

  // Eje horizontal continuo
  doc.line(plotLeft, plotBottom, plotRight, plotBottom);

  // Dibujar barras horizontales con nombres alineados a la izquierda y número al final
  const rowH = plotH / totalRowsCount;
  const barH = Math.max(1.8, Math.min(3.6, rowH * 0.72));

  data.rows.forEach((r, idx) => {
    const yCenter = plotTop + idx * rowH + rowH / 2;
    const barY = yCenter - barH / 2;
    const barWidth = Math.max(0.8, (r.total / xAxisMax) * plotW);

    // Texto del conflicto: recto, alineado a la derecha de plotLeft
    doc.setFontSize(4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const label = r.incidencia.length > 30 ? r.incidencia.slice(0, 29) + '…' : r.incidencia;
    doc.text(label, plotLeft - 2, yCenter + 1.2, { align: 'right' });

    // Barra horizontal azul
    doc.setFillColor(30, 64, 175);
    doc.rect(plotLeft, barY, barWidth, barH, 'F');

    // Valor numérico al final de la barra
    doc.setFontSize(4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 36, 71);
    doc.text(r.total.toString(), plotLeft + barWidth + 1.5, yCenter + 1.2, { align: 'left' });
  });

  // Pie institucional del documento con créditos oficiales y firma
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Elaborado por: Arturo David Rivero Onofre (ADRO) | Sistema Integrado de Seguridad Ciudadana - MDNCH`,
    leftX,
    pageHeight - 4
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.text(
    `Subgerencia de Seguridad Ciudadana • Nuevo Chimbote 2026`,
    pageWidth - 8,
    pageHeight - 4,
    { align: 'right' }
  );

  doc.save(`Ficha_Oficial_${data.mes}_2026_Seguridad_Ciudadana.pdf`);
}

// =========================================================================
// EXPORTACIÓN PDF RETRATO (PORTRAIT) - COMPATIBILIDAD
// =========================================================================
export function exportMonthlyReportPDF(data: MonthlyReportData, chartImgDataUrl?: string) {
  exportMonthlyReportLandscapePDF(data, chartImgDataUrl);
}

// =========================================================================
// EXPORTACIÓN EXCEL (.XLSX) - CONSOLIDADO GENERAL ANUAL (Matriz Completa)
// =========================================================================
export function exportAnnualConsolidatedExcel(data: AnnualConsolidatedData) {
  const wb = XLSX.utils.book_new();

  const titleRows = [
    ['MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE'],
    ['SUBGERENCIA DE SEGURIDAD CIUDADANA'],
    ['CONSOLIDADO GENERAL ANUAL DE INCIDENCIAS - PERIODO 2026'],
    [],
  ];

  const headers = [
    'CONFLICTOS MAS COMUNES',
    ...MESES_LIST,
    'TOTAL',
    '%',
  ];

  const bodyRows = data.rows.map((r) => [
    r.incidencia,
    ...MESES_LIST.map((m) => r.meses[m] || 0),
    r.total,
    `${r.porcentaje.toFixed(2)}%`,
  ]);

  const totalIncidenciasRow = [
    'TOTAL DE INCIDENCIAS POR MES DEL PERIODO 2026',
    ...MESES_LIST.map((m) => data.totalesPorMes[m] || 0),
    data.totalGeneral,
    '100.00%',
  ];

  const porcentajesRow = [
    'PORCENTAJES (%)',
    ...MESES_LIST.map((m) => `${(data.porcentajesPorMes[m] || 0).toFixed(2)}%`),
    '100.00%',
    '',
  ];

  const wsData = [
    ...titleRows,
    headers,
    ...bodyRows,
    totalIncidenciasRow,
    porcentajesRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 45 },
    ...MESES_LIST.map(() => ({ wch: 11 })),
    { wch: 14 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Consolidado Anual 2026');
  XLSX.writeFile(wb, 'Consolidado_General_Anual_2026_Seguridad_Ciudadana.xlsx');
}

// =========================================================================
// EXPORTACIÓN PDF HORIZONTAL - CONSOLIDADO GENERAL ANUAL (Matriz Completa)
// =========================================================================
export function exportAnnualConsolidatedPDF(data: AnnualConsolidatedData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  doc.setFillColor(11, 36, 71);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 20, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE - SUBGERENCIA DE SEGURIDAD CIUDADANA', pageWidth / 2, 8, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CONSOLIDADO GENERAL ANUAL DE INCIDENCIAS - PERIODO 2026 (ENERO A DICIEMBRE)', pageWidth / 2, 14, { align: 'center' });

  const headers = [
    'CONFLICTOS MAS COMUNES',
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SET',
    'OCT',
    'NOV',
    'DIC',
    'TOTAL',
    '%',
  ];

  const bodyRows = data.rows.map((r) => [
    r.incidencia,
    ...MESES_LIST.map((m) => (r.meses[m] ? r.meses[m].toLocaleString() : '-')),
    r.total.toLocaleString(),
    `${r.porcentaje.toFixed(2)}%`,
  ]);

  const footRows = [
    [
      'TOTAL DE INCIDENCIAS POR MES DEL PERIODO 2026',
      ...MESES_LIST.map((m) => (data.totalesPorMes[m] ? data.totalesPorMes[m].toLocaleString() : '-')),
      data.totalGeneral.toLocaleString(),
      '100%',
    ],
    [
      'PORCENTAJES (%)',
      ...MESES_LIST.map((m) => `${(data.porcentajesPorMes[m] || 0).toFixed(1)}%`),
      '100%',
      '',
    ],
  ];

  autoTable(doc, {
    startY: 25,
    margin: { left: 6, right: 6 },
    head: [headers],
    body: bodyRows,
    foot: footRows,
    theme: 'grid',
    styles: {
      fontSize: 5.2,
      cellPadding: 0.8,
      font: 'helvetica',
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [11, 36, 71],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 54, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 14, halign: 'center' },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 14, halign: 'center' },
      12: { cellWidth: 14, halign: 'center' },
      13: { cellWidth: 18, halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] },
      14: { cellWidth: 15, halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
  });

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Sistema Integrado de Seguridad Ciudadana • Municipalidad Distrital de Nuevo Chimbote • Generado el ${new Date().toLocaleDateString('es-PE')}`,
    pageWidth / 2,
    pageHeight - 3,
    { align: 'center' }
  );

  doc.save('Consolidado_General_Anual_2026_Seguridad_Ciudadana.pdf');
}
