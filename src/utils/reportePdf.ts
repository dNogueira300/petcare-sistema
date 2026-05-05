/**
 * Generación de PDF para el módulo de Reportes.
 * Usa jsPDF + jspdf-autotable (carga dinámica al hacer clic).
 * Layout A4 horizontal — todo secuencial, sin solapamientos.
 */
import type { ReportFilters, ReportData, VetOption } from "@/types/reportes";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/* ─── Paleta PetCare ─────────────────────────────────────────────────────────── */
type RGB = [number, number, number];
const C = {
  verdeOscuro: [10, 26, 17]    as RGB,  // #0a1a11
  verde:       [45, 106, 79]   as RGB,  // #2d6a4f
  verdeClaro:  [61, 132, 91]   as RGB,  // #3d845b
  dorado:      [196, 140, 52]  as RGB,  // #c48c34
  morado:      [138, 90, 154]  as RGB,  // #8a5a9a
  azul:        [46, 111, 168]  as RGB,  // #2e6fa8
  negro:       [26, 18, 8]     as RGB,  // #1a1208
  grisT:       [107, 92, 68]   as RGB,  // #6b5c44
  grisL:       [249, 246, 240] as RGB,  // #f9f6f0
  grisBorder:  [228, 220, 207] as RGB,  // #e4dccd
  blanco:      [255, 255, 255] as RGB,
  rojo:        [220, 38, 38]   as RGB,
  verdeOk:     [22, 163, 74]   as RGB,
  amarillo:    [245, 158, 11]  as RGB,
  azulInfo:    [59, 130, 246]  as RGB,
};

/* ─── Constantes de layout ─────────────────────────────────────────────────── */
const MARGIN   = 10;   // mm de margen izquierdo/derecho
const H_HEADER = 20;   // altura del header por página
const Y_BODY   = 24;   // Y donde empieza el contenido tras el header
const H_FOOTER = 8;    // altura del footer
const SECTION_H = 7;   // altura de los títulos de sección

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente", confirmada: "Confirmada",
  cancelada: "Cancelada",  atendida: "Atendida",
};
const estadoColor: Record<string, RGB> = {
  Pendiente: C.amarillo, Confirmada: C.verdeOk,
  Cancelada: C.rojo,     Atendida: C.azulInfo,
};

function fmt(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function logoDataUrl(): Promise<string | null> {
  try {
    const resp = await fetch("/logo/logo_h.png");
    const blob = await resp.blob();
    return new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ─── Tipo auxiliar para acceder a propiedades internas de jsPDF ────────────── */
interface DocInternal {
  lastAutoTable: { finalY: number };
  internal: {
    pageSize: { getWidth(): number; getHeight(): number };
    getNumberOfPages(): number;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FUNCIÓN PRINCIPAL
═══════════════════════════════════════════════════════════════════════════════ */
export async function generarReportePDF(
  filters: ReportFilters,
  data: ReportData,
  vets: VetOption[],
) {
  const { jsPDF }             = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const d    = doc as unknown as DocInternal;
  const W    = d.internal.pageSize.getWidth();   // 297 mm
  const H    = d.internal.pageSize.getHeight();  // 210 mm
  const CW   = W - MARGIN * 2;                   // 277 mm — ancho de contenido

  const logoUrl = await logoDataUrl();

  /* ── helpers ──────────────────────────────────────────────────────────────── */

  const getY = () => d.lastAutoTable?.finalY ?? Y_BODY;

  /** Dibuja el header fijo en la página actual (se llama al final para todas) */
  const drawHeader = (pageNum: number, total: number) => {
    // Fondo verde oscuro
    doc.setFillColor(...C.verdeOscuro);
    doc.rect(0, 0, W, H_HEADER, "F");

    // Banda dorada inferior del header
    doc.setFillColor(...C.dorado);
    doc.rect(0, H_HEADER - 2, W, 2, "F");

    // Logo
    if (logoUrl) {
      doc.addImage(logoUrl, "PNG", MARGIN, 3.5, 38, 12);
    } else {
      doc.setTextColor(...C.blanco);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Veterinaria PetCare", MARGIN, 12);
    }

    // Título central
    doc.setTextColor(...C.blanco);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Reporte de Citas", W / 2, 9, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(212, 160, 23); // dorado claro
    doc.text("Veterinaria PetCare · Iquitos, Perú", W / 2, 15, { align: "center" });

    // Página (derecha)
    doc.setTextColor(...C.blanco);
    doc.setFontSize(7.5);
    doc.text(`Página ${pageNum} de ${total}`, W - MARGIN, 9, { align: "right" });
    const ahora = format(new Date(), "dd/MM/yyyy  HH:mm", { locale: es });
    doc.setTextColor(180, 170, 150);
    doc.text(ahora, W - MARGIN, 15, { align: "right" });
  };

  /** Pie de página (se llama al final para todas las páginas) */
  const drawFooter = () => {
    doc.setFillColor(...C.grisL);
    doc.rect(0, H - H_FOOTER, W, H_FOOTER, "F");
    doc.setDrawColor(...C.grisBorder);
    doc.line(0, H - H_FOOTER, W, H - H_FOOTER);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.grisT);
    doc.text("Documento generado automáticamente por el sistema PetCare. Solo para uso interno.", MARGIN, H - 3);
  };

  /** Título de sección (banda de color con texto) */
  const sectionTitle = (y: number, texto: string, color: RGB = C.verdeClaro): number => {
    doc.setFillColor(...color);
    doc.roundedRect(MARGIN, y, CW, SECTION_H, 1.5, 1.5, "F");
    doc.setTextColor(...C.blanco);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(texto, MARGIN + 4, y + 4.7);
    return y + SECTION_H + 2;
  };

  /** Verifica espacio restante; si no hay suficiente, agrega página y retorna Y_BODY */
  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > H - H_FOOTER - 4) {
      doc.addPage();
      return Y_BODY;
    }
    return y;
  };

  /* ── Filtros aplicados ─────────────────────────────────────────────────────── */
  const drawFiltros = (y: number): number => {
    const vetObj = filters.id_veterinario
      ? vets.find(v => String(v.id_veterinario) === filters.id_veterinario)
      : null;

    const items = [
      { label: "Período",     value: `${fmt(filters.desde)} — ${fmt(filters.hasta)}` },
      { label: "Estado",      value: filters.estado ? estadoLabels[filters.estado] ?? filters.estado : "Todos" },
      { label: "Veterinario", value: vetObj ? `${vetObj.usuarios.nombre} ${vetObj.usuarios.apellido}` : "Todos" },
    ];

    const boxH = 9;
    doc.setFillColor(...C.grisL);
    doc.setDrawColor(...C.grisBorder);
    doc.roundedRect(MARGIN, y, CW, boxH, 2, 2, "FD");

    const itemW = CW / items.length;
    items.forEach((item, i) => {
      const x = MARGIN + i * itemW + 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...C.grisT);
      doc.text(item.label.toUpperCase() + ":", x, y + 3.8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.negro);
      doc.setFontSize(8);
      doc.text(item.value, x, y + 7.2);
      // Separador vertical
      if (i < items.length - 1) {
        doc.setDrawColor(...C.grisBorder);
        doc.line(MARGIN + (i + 1) * itemW, y + 1.5, MARGIN + (i + 1) * itemW, y + boxH - 1.5);
      }
    });

    return y + boxH + 6;
  };

  /* ── Tabla: Resumen de métricas ──────────────────────────────────────────── */
  const drawResumen = (y: number): number => {
    const { resumen } = data;
    y = sectionTitle(y, "1.  Resumen General");

    // Una sola fila con todas las métricas como columnas
    const headers = ["Total citas", "Atendidas", "Confirmadas", "Pendientes", "Canceladas", "Clientes", "Mascotas"];
    const values  = [
      String(resumen.total),
      String(resumen.por_estado.atendida   ?? 0),
      String(resumen.por_estado.confirmada ?? 0),
      String(resumen.por_estado.pendiente  ?? 0),
      String(resumen.por_estado.cancelada  ?? 0),
      String(resumen.total_clientes),
      String(resumen.total_mascotas),
    ];
    const colW = CW / headers.length;

    autoTable(doc, {
      startY: y,
      head:   [headers],
      body:   [values],
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 4, halign: "center" },
      headStyles: {
        fillColor: C.verde, textColor: C.blanco,
        fontStyle: "bold", fontSize: 8, halign: "center",
      },
      bodyStyles: { fontStyle: "bold", fontSize: 12, textColor: C.negro },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: Object.fromEntries(headers.map((_, i) => [i, { cellWidth: colW }])),
    });

    return getY() + 6;
  };

  /* ── Tabla: Distribución por estado ─────────────────────────────────────── */
  const drawEstado = (y: number): number => {
    const { resumen } = data;
    y = sectionTitle(y, "2.  Distribución por Estado", C.dorado);

    const rows = Object.entries(resumen.por_estado).map(([estado, cant]) => {
      const pct = resumen.total > 0 ? Math.round((cant / resumen.total) * 100) : 0;
      return [estadoLabels[estado] ?? estado, String(cant), `${pct} %`];
    });

    autoTable(doc, {
      startY: y,
      head: [["Estado", "Cantidad", "Porcentaje"]],
      body: rows,
      tableWidth: CW * 0.45,
      margin: { left: MARGIN },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: C.dorado, textColor: C.blanco, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold" } },
      didParseCell: (h) => {
        if (h.section === "body") {
          const label = String(h.row.raw && (h.row.raw as string[])[0]);
          const col = estadoColor[label];
          if (col && h.column.index === 0) h.cell.styles.textColor = col;
        }
      },
    });

    return getY() + 6;
  };

  /* ── Tabla: Por veterinario ──────────────────────────────────────────────── */
  const drawVeterinarios = (y: number): number => {
    if (data.por_veterinario.length === 0) return y;
    y = sectionTitle(y, "3.  Resumen por Veterinario");

    autoTable(doc, {
      startY: y,
      head: [["Veterinario", "Total", "Atendidas", "Canceladas", "Tasa de atención"]],
      body: data.por_veterinario.map(v => {
        const tasa = v.total > 0 ? `${Math.round((v.atendidas / v.total) * 100)} %` : "0 %";
        return [v.nombre, String(v.total), String(v.atendidas), String(v.canceladas), tasa];
      }),
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: C.verde, textColor: C.blanco, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", fontStyle: "bold" },
        2: { halign: "right", textColor: C.verdeOk },
        3: { halign: "right", textColor: C.rojo },
        4: { halign: "right", fontStyle: "bold" },
      },
    });

    return getY() + 6;
  };

  /* ── Tablas: Por día + Por especie (lado a lado, con tracking correcto de Y) */
  const drawDiaEspecie = (y: number): number => {
    const halfW = (CW - 6) / 2;

    const startY = y;

    // Título izquierdo
    doc.setFillColor(196, 140, 52);
    doc.roundedRect(MARGIN, startY, halfW, SECTION_H, 1.5, 1.5, "F");
    doc.setTextColor(...C.blanco);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("4.  Citas por Día de Semana", MARGIN + 4, startY + 4.7);

    // Título derecho
    doc.setFillColor(...C.morado);
    doc.roundedRect(MARGIN + halfW + 6, startY, halfW, SECTION_H, 1.5, 1.5, "F");
    doc.text("5.  Citas por Especie", MARGIN + halfW + 10, startY + 4.7);

    const tableY = startY + SECTION_H + 2;

    autoTable(doc, {
      startY: tableY,
      head: [["Día de semana", "Citas"]],
      body: data.por_dia.filter(d => d.dia !== "Domingo").map(d => [d.dia, String(d.cantidad)]),
      tableWidth: halfW,
      margin: { left: MARGIN },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: C.dorado, textColor: C.blanco, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { halign: "right", fontStyle: "bold" } },
    });
    const finalYLeft = getY();

    autoTable(doc, {
      startY: tableY,
      head: [["Especie", "Citas"]],
      body: data.por_especie.map(e => [e.especie, String(e.cantidad)]),
      tableWidth: halfW,
      margin: { left: MARGIN + halfW + 6 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: C.morado, textColor: C.blanco, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { halign: "right", fontStyle: "bold" } },
    });
    const finalYRight = getY();

    return Math.max(finalYLeft, finalYRight) + 6;
  };

  /* ── Tabla: Origen de las citas ─────────────────────────────────────────── */
  const drawOrigen = (y: number): number => {
    if (!data.por_origen || data.por_origen.length === 0) return y;
    y = sectionTitle(y, "6.  Origen de las Citas", C.azul);

    const rows = data.por_origen.map(o => {
      const pct = data.resumen.total > 0 ? Math.round((o.cantidad / data.resumen.total) * 100) : 0;
      return [o.origen, String(o.cantidad), `${pct} %`];
    });

    autoTable(doc, {
      startY: y,
      head: [["Origen", "Cantidad", "% del total"]],
      body: rows,
      tableWidth: CW * 0.45,
      margin: { left: MARGIN },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: C.azul, textColor: C.blanco, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold" } },
    });

    return getY() + 6;
  };

  /* ── Tabla: Detalle de citas (todas, sin paginación) ────────────────────── */
  const drawDetalleCitas = (y: number) => {
    y = sectionTitle(y, `7.  Detalle de Citas  (${data.citas.length} registros)`, C.negro);

    const rows = data.citas.map(c => [
      fmt(c.fecha),
      c.hora.slice(0, 5),
      c.mascotas?.nombre ?? "—",
      c.mascotas?.clientes
        ? `${c.mascotas.clientes.usuarios?.nombre ?? ""} ${c.mascotas.clientes.usuarios?.apellido ?? ""}`.trim()
        : "—",
      c.veterinarios
        ? `${c.veterinarios.usuarios.nombre} ${c.veterinarios.usuarios.apellido}`
        : "—",
      c.motivo,
      estadoLabels[c.estado] ?? c.estado,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Hora", "Mascota", "Propietario", "Veterinario", "Motivo", "Estado"]],
      body: rows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: "helvetica", fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: C.negro, textColor: C.blanco, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 12 },
        2: { cellWidth: 28 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: "auto" },
        6: { cellWidth: 24, halign: "center" },
      },
      didParseCell: (h) => {
        if (h.section === "body" && h.column.index === 6) {
          const label = String((h.row.raw as string[])[6]);
          if (estadoColor[label]) h.cell.styles.textColor = estadoColor[label];
        }
      },
      // Repite el header en cada nueva página automáticamente (default en autoTable)
      showHead: "everyPage",
    });
  };

  /* ═══ CONSTRUIR EL PDF ═══════════════════════════════════════════════════════
     Estrategia:
     - Página 1: Header → Filtros → Resumen → Estado → Vets (si caben)
     - Si no caben vets en pág 1, nueva página para vets
     - Página siguiente: Día/Especie → Origen
     - Última(s) página(s): Detalle de citas (autoTable maneja el overflow)
  ═══════════════════════════════════════════════════════════════════════════ */

  // Página 1
  let y = drawFiltros(Y_BODY);
  y = drawResumen(y);
  y = ensureSpace(y, 40);
  y = drawEstado(y);
  y = ensureSpace(y, 50);
  y = drawVeterinarios(y);

  // Página 2 (análisis temporal/tipo/origen)
  doc.addPage();
  y = drawDiaEspecie(Y_BODY);
  y = ensureSpace(y, 40);
  y = drawOrigen(y);

  // Página(s) de detalle
  doc.addPage();
  drawDetalleCitas(Y_BODY);

  /* ─── Agregar header y footer a TODAS las páginas ────────────────────────── */
  const totalPages = d.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeader(i, totalPages);
    drawFooter();
  }

  const fileName = `Reporte_PetCare_${filters.desde}_${filters.hasta}.pdf`;
  doc.save(fileName);
}
