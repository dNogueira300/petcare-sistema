/**
 * PDF de cartilla de vacunación por mascota.
 */
import { format } from "date-fns";
import { es } from "date-fns/locale";

type RGB = [number, number, number];
const C = {
  verdeOscuro: [10, 26, 17]    as RGB,
  verde:       [45, 106, 79]   as RGB,
  dorado:      [196, 140, 52]  as RGB,
  negro:       [26, 18, 8]     as RGB,
  grisT:       [107, 92, 68]   as RGB,
  grisL:       [249, 246, 240] as RGB,
  grisBorder:  [228, 220, 207] as RGB,
  blanco:      [255, 255, 255] as RGB,
};

interface MascotaPdf {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo?: string | null;
  color?: string | null;
  fecha_nacimiento?: string | null;
  clientes?: { usuarios: { nombre: string; apellido: string } };
}

interface VacunaPdf {
  tipo_vacuna: string;
  fecha_aplicacion: string;
  fecha_proxima_dosis: string | null;
  lote: string | null;
  observaciones: string | null;
  frecuencia?: string | null;
  veterinarios?: { usuarios?: { nombre: string; apellido: string } };
}

function fmt(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function logoDataUrl(): Promise<string | null> {
  try {
    const r = await fetch("/logo/logo_h.png");
    const blob = await r.blob();
    return new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

interface DocInternal {
  lastAutoTable: { finalY: number };
  internal: {
    pageSize: { getWidth(): number; getHeight(): number };
    getNumberOfPages(): number;
  };
}

export async function exportCartillaPdf({
  mascota, vacunas,
}: { mascota: MascotaPdf; vacunas: VacunaPdf[] }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const d = doc as unknown as DocInternal;
  const W = d.internal.pageSize.getWidth();
  const H = d.internal.pageSize.getHeight();
  const MARGIN = 12;
  const CW = W - MARGIN * 2;
  const logo = await logoDataUrl();

  const drawHeader = (p: number, total: number) => {
    doc.setFillColor(...C.verdeOscuro);
    doc.rect(0, 0, W, 22, "F");
    doc.setFillColor(...C.dorado);
    doc.rect(0, 22 - 2, W, 2, "F");
    if (logo) doc.addImage(logo, "PNG", MARGIN, 4, 36, 11);
    doc.setTextColor(...C.blanco);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Cartilla de vacunación", W / 2, 10, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(212, 160, 23);
    doc.text("Veterinaria PetCare · Iquitos, Perú", W / 2, 15, { align: "center" });
    doc.setTextColor(...C.blanco);
    doc.setFontSize(7.5);
    doc.text(`Página ${p} de ${total}`, W - MARGIN, 10, { align: "right" });
    doc.setTextColor(180, 170, 150);
    doc.text(format(new Date(), "dd/MM/yyyy  HH:mm", { locale: es }), W - MARGIN, 15, { align: "right" });
  };

  const drawFooter = () => {
    doc.setFillColor(...C.grisL);
    doc.rect(0, H - 8, W, 8, "F");
    doc.setDrawColor(...C.grisBorder);
    doc.line(0, H - 8, W, H - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.grisT);
    doc.text("Documento generado automáticamente por el sistema PetCare.", MARGIN, H - 3);
  };

  let y = 30;
  doc.setFillColor(...C.grisL);
  doc.setDrawColor(...C.grisBorder);
  doc.roundedRect(MARGIN, y, CW, 26, 2, 2, "FD");
  doc.setTextColor(...C.negro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(mascota.nombre, MARGIN + 5, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.grisT);
  doc.text([mascota.especie, mascota.raza].filter(Boolean).join(" · "), MARGIN + 5, y + 14);
  const linea2: string[] = [];
  if (mascota.sexo) linea2.push(`Sexo: ${mascota.sexo}`);
  if (mascota.color) linea2.push(`Color: ${mascota.color}`);
  if (mascota.fecha_nacimiento) linea2.push(`Nacimiento: ${fmt(mascota.fecha_nacimiento)}`);
  if (linea2.length) doc.text(linea2.join("  ·  "), MARGIN + 5, y + 19);
  if (mascota.clientes) {
    doc.text(`Propietario: ${mascota.clientes.usuarios.nombre} ${mascota.clientes.usuarios.apellido}`,
      MARGIN + 5, y + 24);
  }

  y += 32;

  if (vacunas.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...C.grisT);
    doc.text("Esta mascota aún no tiene vacunas registradas.", MARGIN, y + 8);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Vacuna", "Aplicación", "Próx. dosis", "Frecuencia", "Lote", "Veterinario", "Observaciones"]],
      body: vacunas.map(v => [
        v.tipo_vacuna,
        fmt(v.fecha_aplicacion),
        v.fecha_proxima_dosis ? fmt(v.fecha_proxima_dosis) : "—",
        v.frecuencia ?? "—",
        v.lote ?? "—",
        v.veterinarios?.usuarios ? `${v.veterinarios.usuarios.nombre} ${v.veterinarios.usuarios.apellido}` : "—",
        v.observaciones ?? "—",
      ]),
      margin: { left: MARGIN, right: MARGIN, top: 26 },
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: C.verde, textColor: C.blanco, fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: C.grisL },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 30 },
        6: { cellWidth: "auto" },
      },
      showHead: "everyPage",
    });
  }

  const total = d.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawHeader(i, total);
    drawFooter();
  }

  doc.save(`cartilla_vacunas_${mascota.nombre}.pdf`);
}
