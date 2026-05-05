import type { ReportFilters, ReportData, VetOption } from "@/types/reportes";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const VERDE  = [45, 106, 79]  as [number, number, number];   // #2d6a4f
const VERDE2 = [10, 26, 17]   as [number, number, number];   // #0a1a11
const DORADO = [212, 160, 23] as [number, number, number];   // #d4a017
const GRIS_L = [249, 246, 240] as [number, number, number];  // #f9f6f0
const GRIS_T = [107, 92, 68]  as [number, number, number];   // #6b5c44
const NEGRO  = [26, 18, 8]    as [number, number, number];   // #1a1208
const BLANCO = [255, 255, 255] as [number, number, number];

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente", confirmada: "Confirmada",
  cancelada: "Cancelada", atendida: "Atendida",
};

function fmt(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function logoDataUrl(): Promise<string | null> {
  try {
    const resp = await fetch("/logo/logo_h.png");
    const blob = await resp.blob();
    return await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generarReportePDF(
  filters: ReportFilters,
  data: ReportData,
  vets: VetOption[],
) {
  /* Dynamic imports — se cargan solo al generar el PDF */
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();   // 297 mm
  const logoUrl = await logoDataUrl();

  /* ─── Utilidades ─────────────────────────────────────────────────────────── */
  const addPageHeader = (pageNum: number, totalPages: number) => {
    // Barra verde superior
    doc.setFillColor(...VERDE2);
    doc.rect(0, 0, W, 18, "F");

    // Logo (si cargó)
    if (logoUrl) {
      doc.addImage(logoUrl, "PNG", 8, 2, 40, 13);
    } else {
      doc.setTextColor(...BLANCO);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Veterinaria PetCare", 10, 11);
    }

    // Título en la barra
    doc.setTextColor(...BLANCO);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Iquitos, Perú · petcare.pe", W / 2, 11, { align: "center" });

    // Número de página
    doc.text(`Pág. ${pageNum} / ${totalPages}`, W - 10, 11, { align: "right" });

    // Título principal bajo la barra
    doc.setTextColor(...NEGRO);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Citas", 10, 27);

    // Fecha de generación
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRIS_T);
    const ahora = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
    doc.text(`Generado: ${ahora}`, W - 10, 27, { align: "right" });
  };

  /* ─── Filtros aplicados ────────────────────────────────────────────────────── */
  const addFiltros = (yStart: number): number => {
    const vetObj = filters.id_veterinario
      ? vets.find(v => String(v.id_veterinario) === filters.id_veterinario)
      : null;

    const chips: string[] = [
      `Período: ${fmt(filters.desde)} — ${fmt(filters.hasta)}`,
      `Estado: ${filters.estado ? estadoLabels[filters.estado] ?? filters.estado : "Todos"}`,
      `Veterinario: ${vetObj ? `${vetObj.usuarios.nombre} ${vetObj.usuarios.apellido}` : "Todos"}`,
    ];

    doc.setFillColor(...GRIS_L);
    doc.roundedRect(10, yStart, W - 20, 10, 2, 2, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRIS_T);

    let x = 15;
    chips.forEach((chip, i) => {
      doc.text(chip, x, yStart + 6.5);
      if (i < chips.length - 1) {
        x += doc.getTextWidth(chip) + 14;
        doc.setTextColor(200, 200, 200);
        doc.text("|", x - 8, yStart + 6.5);
        doc.setTextColor(...GRIS_T);
      }
    });

    return yStart + 14;
  };

  /* ─── Tabla de resumen (4 métricas) ──────────────────────────────────────── */
  const addResumen = (y: number): number => {
    const { resumen } = data;
    const rows = [
      ["Total de citas", String(resumen.total)],
      ["Atendidas", String(resumen.por_estado.atendida ?? 0)],
      ["Pendientes", String(resumen.por_estado.pendiente ?? 0)],
      ["Canceladas", String(resumen.por_estado.cancelada ?? 0)],
      ["Clientes registrados", String(resumen.total_clientes)],
      ["Mascotas registradas", String(resumen.total_mascotas)],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Métrica", "Valor"]],
      body: rows,
      tableWidth: (W - 20) / 2,
      margin: { left: 10 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: VERDE, textColor: BLANCO, fontStyle: "bold" },
      alternateRowStyles: { fillColor: GRIS_L },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    });

    /* Citas por estado — tabla lateral derecha */
    const estados = Object.entries(resumen.por_estado).map(([estado, cant]) => {
      const pct = resumen.total > 0 ? Math.round((cant / resumen.total) * 100) : 0;
      return [estadoLabels[estado] ?? estado, String(cant), `${pct}%`];
    });

    autoTable(doc, {
      startY: y,
      head: [["Estado", "Citas", "%"]],
      body: estados,
      tableWidth: (W - 20) / 2 - 4,
      margin: { left: W / 2 + 2 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: DORADO, textColor: BLANCO, fontStyle: "bold" },
      alternateRowStyles: { fillColor: GRIS_L },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });

    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  /* ─── Tabla por veterinario ──────────────────────────────────────────────── */
  const addVeterinarios = (y: number): number => {
    if (data.por_veterinario.length === 0) return y;

    autoTable(doc, {
      startY: y,
      head: [["Veterinario", "Total", "Atendidas", "Canceladas", "Tasa de atención"]],
      body: data.por_veterinario.map(v => {
        const tasa = v.total > 0 ? `${Math.round((v.atendidas / v.total) * 100)}%` : "0%";
        return [v.nombre, String(v.total), String(v.atendidas), String(v.canceladas), tasa];
      }),
      margin: { left: 10, right: 10 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: VERDE, textColor: BLANCO, fontStyle: "bold" },
      alternateRowStyles: { fillColor: GRIS_L },
      columnStyles: {
        1: { halign: "right" }, 2: { halign: "right", textColor: [22, 163, 74] as [number,number,number] },
        3: { halign: "right", textColor: [220, 38, 38] as [number,number,number] }, 4: { halign: "right" },
      },
    });

    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  /* ─── Tablas de día y especie (en paralelo) ──────────────────────────────── */
  const addDiaEspecie = (y: number): number => {
    const halfW = (W - 24) / 2;

    autoTable(doc, {
      startY: y,
      head: [["Día de semana", "Citas"]],
      body: data.por_dia.filter(d => d.dia !== "Domingo").map(d => [d.dia, String(d.cantidad)]),
      tableWidth: halfW,
      margin: { left: 10 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [196, 140, 52] as [number,number,number], textColor: BLANCO, fontStyle: "bold" },
      alternateRowStyles: { fillColor: GRIS_L },
      columnStyles: { 1: { halign: "right" } },
    });

    autoTable(doc, {
      startY: y,
      head: [["Especie", "Citas"]],
      body: data.por_especie.map(e => [e.especie, String(e.cantidad)]),
      tableWidth: halfW,
      margin: { left: 10 + halfW + 4 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [138, 90, 154] as [number,number,number], textColor: BLANCO, fontStyle: "bold" },
      alternateRowStyles: { fillColor: GRIS_L },
      columnStyles: { 1: { halign: "right" } },
    });

    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  /* ─── Tabla detalle de citas ─────────────────────────────────────────────── */
  const addCitas = (y: number) => {
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
      margin: { left: 10, right: 10 },
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: NEGRO, textColor: BLANCO, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: GRIS_L },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 14 },
        2: { cellWidth: 28 }, 3: { cellWidth: 38 },
        4: { cellWidth: 38 }, 5: { cellWidth: "auto" }, 6: { cellWidth: 24 },
      },
      didParseCell: (hookData) => {
        if (hookData.column.index === 6 && hookData.section === "body") {
          const est = (hookData.row.raw as string[])[6];
          const colorMap: Record<string, [number,number,number]> = {
            Pendiente: [245, 158, 11], Confirmada: [34, 197, 94],
            Cancelada: [244, 63, 94], Atendida: [59, 130, 246],
          };
          if (colorMap[est]) hookData.cell.styles.textColor = colorMap[est];
        }
      },
    });
  };

  /* ─── Construir el PDF ───────────────────────────────────────────────────── */
  // Página 1: resumen + vets + día/especie
  addPageHeader(1, 1); // número provisional
  let y = addFiltros(31);
  y = addResumen(y);

  // Si hay espacio suficiente para vets, agregarlos en pág 1; si no, nueva pág
  const remSpace = doc.internal.pageSize.getHeight() - y - 10;
  if (remSpace < 40) { doc.addPage(); y = 22; }

  addVeterinarios(y); // modifica lastAutoTable.finalY
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  if (doc.internal.pageSize.getHeight() - y < 50) { doc.addPage(); y = 22; }
  addDiaEspecie(y);

  // Página de detalle de citas
  doc.addPage();
  addCitas(10);

  // Actualizar encabezados con total real de páginas
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageHeader(i, totalPages);
  }

  // Nombre del archivo con el período
  const fileName = `Reporte_PetCare_${filters.desde}_${filters.hasta}.pdf`;
  doc.save(fileName);
}
