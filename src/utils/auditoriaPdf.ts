/**
 * PDF de Auditoria de Historia Clinica.
 * Patron identico a cartillaPdf: header/footer dibujados en loop final,
 * logo cargado desde /logo/logo_h.png, sin emojis en el texto.
 */
import { format } from "date-fns";
import { es }     from "date-fns/locale";

type RGB = [number, number, number];
const C = {
  verdeOscuro: [10,  26,  17]  as RGB,
  verde:       [45, 106,  79]  as RGB,
  dorado:      [196, 140, 52]  as RGB,
  negro:       [26,  18,   8]  as RGB,
  grisT:       [107,  92,  68] as RGB,
  grisL:       [249, 246, 240] as RGB,
  grisBorder:  [228, 220, 207] as RGB,
  blanco:      [255, 255, 255] as RGB,
};

const ROL_LABELS: Record<string, string> = {
  administrador: "Admin",
  veterinario:   "Vet.",
  recepcionista: "Recep.",
};

export interface AuditoriaEntrada {
  id_auditoria: number;
  id_historia: number;
  tipo_cambio: "INSERT" | "UPDATE";
  timestamp_cambio: string;
  diagnostico_anterior?: string | null;
  diagnostico_nuevo?: string | null;
  tratamiento_anterior?: string | null;
  tratamiento_nuevo?: string | null;
  observaciones_anterior?: string | null;
  observaciones_nuevo?: string | null;
  peso_anterior?: number | null;
  peso_nuevo?: number | null;
  razon_cambio?: string | null;
  usuarios?: { nombre: string; apellido: string; rol: string } | null;
  historia_clinica?: {
    fecha_consulta?: string;
    mascotas?: { nombre: string; especie: string } | null;
    veterinarios?: { usuarios?: { nombre: string; apellido: string } } | null;
  } | null;
}

interface FiltrosPdf {
  mascota?: string;
  veterinario?: string;
  desde?: string;
  hasta?: string;
}

// Mismo helper que cartillaPdf para acceder a internals sin errores de tipo
interface DocInternal {
  lastAutoTable: { finalY: number };
  internal: {
    pageSize: { getWidth(): number; getHeight(): number };
    getNumberOfPages(): number;
  };
}

async function logoDataUrl(): Promise<string | null> {
  try {
    const r    = await fetch("/logo/logo_h.png");
    const blob = await r.blob();
    return new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

function fmt(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: es });
  } catch { return iso; }
}

function fmtDate(iso: string): string {
  try {
    return format(new Date(`${iso}T00:00:00`), "dd/MM/yy", { locale: es });
  } catch { return iso; }
}

function buildCambios(e: AuditoriaEntrada): string {
  const partes: string[] = [];
  if (e.diagnostico_anterior !== e.diagnostico_nuevo && (e.diagnostico_anterior || e.diagnostico_nuevo)) {
    const ant = e.diagnostico_anterior ? e.diagnostico_anterior.slice(0, 50) : "—";
    const nvo = (e.diagnostico_nuevo ?? "").slice(0, 50);
    partes.push(`Diagnostico: "${ant}" > "${nvo}"`);
  }
  if (e.tratamiento_anterior !== e.tratamiento_nuevo && (e.tratamiento_anterior || e.tratamiento_nuevo)) {
    const ant = e.tratamiento_anterior ? e.tratamiento_anterior.slice(0, 50) : "—";
    const nvo = (e.tratamiento_nuevo ?? "").slice(0, 50);
    partes.push(`Tratamiento: "${ant}" > "${nvo}"`);
  }
  if (e.observaciones_anterior !== e.observaciones_nuevo && (e.observaciones_anterior || e.observaciones_nuevo)) {
    partes.push("Observaciones modificadas");
  }
  if (e.peso_anterior !== e.peso_nuevo && (e.peso_anterior != null || e.peso_nuevo != null)) {
    partes.push(`Peso: ${e.peso_anterior ?? "—"} kg > ${e.peso_nuevo ?? "—"} kg`);
  }
  return partes.length > 0
    ? partes.join(" / ")
    : (e.tipo_cambio === "INSERT" ? "Registro inicial" : "Sin cambios detectados");
}

export async function exportAuditoriaPdf(
  entradas: AuditoriaEntrada[],
  filtros: FiltrosPdf = {},
  titulo = "Auditoria de Historia Clinica",
): Promise<void> {
  const { jsPDF }              = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const d    = doc as unknown as DocInternal;
  const W    = d.internal.pageSize.getWidth();   // 297
  const H    = d.internal.pageSize.getHeight();  // 210
  const MARGIN = 12;
  const hoy    = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
  const logo   = await logoDataUrl();

  // ── Funciones de header y footer (patron identico a cartillaPdf) ────────────
  const drawHeader = (p: number, total: number) => {
    // Banda verde oscuro
    doc.setFillColor(...C.verdeOscuro);
    doc.rect(0, 0, W, 22, "F");
    // Franja dorada
    doc.setFillColor(...C.dorado);
    doc.rect(0, 20, W, 4, "F");

    // Logo
    if (logo) doc.addImage(logo, "PNG", MARGIN, 4, 36, 11);

    // Titulo del documento (centrado, sobre la franja dorada)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.verdeOscuro);
    doc.text(titulo.toUpperCase(), W / 2, 23, { align: "center" });

    // Nombre clinica (arriba a la derecha)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.blanco);
    doc.text("Veterinaria PetCare", W - MARGIN, 9, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(212, 160, 23);
    doc.text("Iquitos, Peru", W - MARGIN, 14, { align: "right" });

    // Pagina
    doc.setTextColor(...C.blanco);
    doc.setFontSize(7.5);
    doc.text(`Pagina ${p} de ${total}`, W - MARGIN, 19, { align: "right" });
  };

  const drawFooter = () => {
    doc.setFillColor(...C.grisL);
    doc.rect(0, H - 8, W, 8, "F");
    doc.setDrawColor(...C.grisBorder);
    doc.line(0, H - 8, W, H - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.grisT);
    doc.text("Documento generado automaticamente por el sistema PetCare. Confidencial.", MARGIN, H - 3);
    doc.text(`Generado: ${hoy}`, W - MARGIN, H - 3, { align: "right" });
  };

  // ── Meta / filtros ──────────────────────────────────────────────────────────
  const metaParts: string[] = [`Total: ${entradas.length} registro${entradas.length !== 1 ? "s" : ""}`];
  if (filtros.mascota)     metaParts.push(`Mascota: ${filtros.mascota}`);
  if (filtros.veterinario) metaParts.push(`Veterinario: ${filtros.veterinario}`);
  if (filtros.desde || filtros.hasta)
    metaParts.push(`Periodo: ${filtros.desde ?? "—"} a ${filtros.hasta ?? "—"}`);

  // ── Tabla (startY deja espacio al header + linea meta) ──────────────────────
  // margin.top: 30 garantiza que las paginas 2+ no solapan el header (24mm) + meta (6mm)
  const startY = 30;

  autoTable(doc, {
    startY,
    head: [["Fecha/Hora", "Mascota", "HC del", "Veterinario", "Modificado por", "Tipo", "Cambios", "Razon"]],
    body: entradas.map(e => {
      const mascota = e.historia_clinica?.mascotas?.nombre ?? `HC #${e.id_historia}`;
      const especie = e.historia_clinica?.mascotas?.especie ?? "";
      const fechaHC = e.historia_clinica?.fecha_consulta ? fmtDate(e.historia_clinica.fecha_consulta) : "—";
      const vet     = e.historia_clinica?.veterinarios?.usuarios
        ? `${e.historia_clinica.veterinarios.usuarios.nombre} ${e.historia_clinica.veterinarios.usuarios.apellido}`
        : "—";
      const usuario = e.usuarios
        ? `${e.usuarios.nombre} ${e.usuarios.apellido} (${ROL_LABELS[e.usuarios.rol] ?? e.usuarios.rol})`
        : "Sistema";
      const tipo = e.tipo_cambio === "INSERT" ? "Creacion" : "Modificacion";
      return [
        fmt(e.timestamp_cambio),
        especie ? `${mascota}\n(${especie})` : mascota,
        fechaHC,
        vet,
        usuario,
        tipo,
        buildCambios(e),
        e.razon_cambio ?? "—",
      ];
    }),
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 2,
      lineColor: C.grisBorder,
      lineWidth: 0.2,
      textColor: C.negro,
      overflow: "linebreak",
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: C.verde,
      textColor: C.blanco,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
    },
    alternateRowStyles: { fillColor: C.grisL },
    columnStyles: {
      0: { cellWidth: 27 },
      1: { cellWidth: 26 },
      2: { cellWidth: 16 },
      3: { cellWidth: 30 },
      4: { cellWidth: 32 },
      5: { cellWidth: 20 },
      6: { cellWidth: "auto" as unknown as number },
      7: { cellWidth: 26 },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === "body") {
        const val = data.cell.raw as string;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = val === "Creacion" ? C.verde : [37, 99, 235] as RGB;
      }
    },
    showHead: "everyPage",
    margin: { left: MARGIN, right: MARGIN, top: 30, bottom: 12 },
  });

  // ── Loop final: header + footer en todas las paginas ────────────────────────
  // (identico al patron de cartillaPdf)
  const total = d.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    // Meta solo en pagina 1 (debajo del header, antes de la tabla)
    if (i === 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.grisT);
      doc.text(metaParts.join("  |  "), MARGIN, 28);
    }

    drawHeader(i, total);
    drawFooter();
  }

  const nombre = `auditoria-clinica-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(nombre);
}
