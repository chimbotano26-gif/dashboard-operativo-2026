import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncidentRecord } from '../types';
import { OPERATIVOS_SEMANALES_PROGRAMADOS } from '../data/operativosProgramados';

export interface PdfExportOptions {
  title?: string;
  subtitle?: string;
  records: IncidentRecord[];
  includeOperativos?: boolean;
  maxRecordsInTable?: number;
}

export async function exportIncidentsToPdf({
  title = 'INFORME OFICIAL DE ATENCIONES E INCIDENCIAS',
  subtitle = 'Subgerencia de Serenazgo • Municipalidad Distrital de Nuevo Chimbote',
  records,
  includeOperativos = true,
  maxRecordsInTable = 200,
}: PdfExportOptions): Promise<void> {
  // Inicializar documento PDF en orientación vertical A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Función para estampar la marca de agua oficial en cada página
  const applyWatermark = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();

      // Marca de agua de baja opacidad en el centro
      doc.setTextColor(140, 160, 185);
      doc.setFontSize(38);
      doc.setFont('helvetica', 'bold');

      // Rotación y centrado de texto marca de agua
      doc.text('SERENAZGO NUEVO CHIMBOTE', pageWidth / 2, pageHeight / 2 - 15, {
        align: 'center',
        angle: 35,
      });
      doc.setFontSize(22);
      doc.text('DOCUMENTO OFICIAL • SEGURIDAD CIUDADANA', pageWidth / 2, pageHeight / 2 + 10, {
        align: 'center',
        angle: 35,
      });

      // Pie de página oficial
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Central de Monitoreo y Serenazgo • Emergencias (24H): 927 420 002 / 927 640 006 / 935 912 001 / 916 140 004 • Pág. ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      doc.restoreGraphicsState();
    }
  };

  // ==========================================
  // ENCABEZADO INSTITUCIONAL
  // ==========================================
  // Barra superior azul marino
  doc.setFillColor(10, 26, 54); // #0a1a36
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Acento dorado
  doc.setFillColor(234, 179, 8); // #eab308
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Textos del encabezado
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SUB - GERENCIA DE SERENAZGO', 15, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text('MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE • DISTRITO ECOLÓGICO', 15, 18);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emisión: ${dateStr} - ${timeStr} | Generado por: Administrador Central`, 15, 24);

  // Título del reporte
  let currentY = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, currentY);

  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 15, currentY);

  currentY += 8;

  // ==========================================
  // RESUMEN EJECUTIVO Y ESTADÍSTICAS
  // ==========================================
  let centro = 0;
  let norte = 0;
  let sur = 0;
  let manana = 0;
  let tarde = 0;
  let noche = 0;
  let ba = 0;
  let vm = 0;
  const incMap: Record<string, number> = {};

  records.forEach((r) => {
    if (r.zona === 'ZONA CENTRO') centro++;
    else if (r.zona === 'ZONA NORTE') norte++;
    else sur++;

    if (r.turno === 'MAÑANA') manana++;
    else if (r.turno === 'TARDE') tarde++;
    else noche++;

    if (r.comisaria === 'CIA VILLA MARIA') vm++;
    else ba++;

    incMap[r.tipoIncidencia] = (incMap[r.tipoIncidencia] || 0) + 1;
  });

  const total = records.length;
  const topIncidencias = Object.entries(incMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Cajas de KPIs
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, pageWidth - 30, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL REGISTROS', 22, currentY + 7);
  doc.text('DISTRIBUCIÓN POR ZONA', 65, currentY + 7);
  doc.text('DISTRIBUCIÓN POR TURNO', 115, currentY + 7);
  doc.text('COMISARÍAS', 165, currentY + 7);

  doc.setFontSize(12);
  doc.setTextColor(10, 26, 54);
  doc.text(`${total.toLocaleString()}`, 22, currentY + 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Centro: ${centro} | Norte: ${norte} | Sur: ${sur}`, 65, currentY + 14);
  doc.text(`Mañ: ${manana} | Tar: ${tarde} | Noc: ${noche}`, 115, currentY + 14);
  doc.text(`Buenos Aires: ${ba} | Villa María: ${vm}`, 165, currentY + 14);

  currentY += 30;

  // ==========================================
  // OPERATIVOS SEMANALES PROGRAMADOS (Referencia Oficial)
  // ==========================================
  if (includeOperativos) {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 26, 54);
    doc.text('OPERATIVOS SEMANALES PROGRAMADOS DE SERENAZGO (DESPLIEGUE DIARIO)', 15, currentY);
    currentY += 4;

    const opData = OPERATIVOS_SEMANALES_PROGRAMADOS.slice(0, 8).map((op) => [
      op.codigo,
      op.nombre,
      op.turno,
      op.horario,
      op.sectoresObjetivo.join(', '),
      op.objetivoPrincipal.slice(0, 70) + '...',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['CÓDIGO', 'OPERATIVO', 'TURNO', 'HORARIO', 'SECTORES', 'OBJETIVO ESTRATÉGICO']],
      body: opData,
      theme: 'grid',
      headStyles: {
        fillColor: [10, 26, 54],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [30, 41, 59],
        cellPadding: 1.5,
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      margin: { left: 15, right: 15 },
    });

    const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
    currentY = (lastTable ? lastTable.finalY : currentY + 40) + 8;
  }

  // Si queda poco espacio, añadir nueva página para la tabla de incidencias
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // ==========================================
  // TABLA DETALLADA DE INCIDENCIAS ATENDIDAS
  // ==========================================
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 26, 54);
  doc.text(`REGISTRO DE ATENCIONES E INTERVENCIONES (${Math.min(records.length, maxRecordsInTable)} de ${records.length})`, 15, currentY);
  currentY += 4;

  const rows = records.slice(0, maxRecordsInTable).map((r, i) => [
    i + 1,
    r.fecha,
    r.hora,
    r.turno,
    r.sector || r.subsector,
    (r.columna1 || r.lugar || r.ubicacion || '').slice(0, 32),
    (r.incidencia || r.tipoIncidencia || '').slice(0, 30),
    r.unidad || r.patrullero || '',
    (r.comisar || r.comisaria || '').replace('CIA ', ''),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'FECHA', 'HORA', 'TURNO', 'SECTOR', 'LUGAR / COLUMNA 1', 'INCIDENCIA ATENDIDA', 'UNIDAD', 'COMISARÍA']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [14, 116, 144], // #0e7490 cyan/teal táctico
      textColor: [255, 255, 255],
      fontSize: 6.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [30, 41, 59],
      cellPadding: 1.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
  });

  // Aplicar marcas de agua oficiales en todas las páginas generadas
  applyWatermark();

  // Guardar archivo PDF
  const filename = `Informe_Serenazgo_NuevoChimbote_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
