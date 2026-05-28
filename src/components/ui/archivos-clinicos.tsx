"use client";

import { useEffect, useRef, useState } from "react";
import {
  Upload,
  X,
  FileText,
  Image,
  Microscope,
  FileSearch,
  ClipboardList,
  File,
  Trash2,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import type { ArchivoHistoriaClinica, TipoArchivo } from "@/types";
import { formatLima } from "@/utils/datetime";

interface Props {
  id_historia: number;
  id_mascota: number;
  readOnly?: boolean;
}

const TIPO_META: Record<
  TipoArchivo,
  { label: string; icon: React.ElementType; color: string }
> = {
  radiografia: { label: "Radiografía", icon: Microscope, color: "#7c3aed" },
  ecografia: { label: "Ecografía", icon: FileSearch, color: "#0369a1" },
  fotografia: { label: "Fotografía", icon: Image, color: "#15803d" },
  laboratorio: { label: "Laboratorio", icon: ClipboardList, color: "#b45309" },
  receta: { label: "Receta", icon: FileText, color: "#2563eb" },
  otro: { label: "Otro", icon: File, color: "#6b7280" },
};

const MAX_MB = 50;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime: string) {
  return mime.startsWith("image/");
}

export function ArchivosClinicosPanel({
  id_historia,
  id_mascota,
  readOnly = false,
}: Props) {
  const [archivos, setArchivos] = useState<
    (ArchivoHistoriaClinica & { url_firmada?: string })[]
  >([]);
  const [refetchKey, setRefetchKey] = useState(0);
  const [fetched, setFetched] = useState(false);
  const [open, setOpen] = useState(false);
  // loading es derivado — no necesita setState síncrono en el efecto
  const loading = open && !fetched;
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoArchivo>("fotografia");
  const [preview, setPreview] = useState<{
    url: string;
    nombre: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Disparar recarga desde handlers de evento (no desde el efecto)
  const triggerRefetch = () => {
    setFetched(false);
    setRefetchKey(k => k + 1);
  };

  // El efecto no llama a setState síncronamente — solo en callbacks async
  useEffect(() => {
    if (!open) return;
    fetch(`/api/historia-clinica/${id_historia}/archivos`)
      .then((r) => r.json())
      .then((j) => { setArchivos(j.data ?? []); setFetched(true); })
      .catch(() => setFetched(true));
  }, [open, id_historia, refetchKey]);

  const uploadFile = async (file: File) => {
    if (!ALLOWED.includes(file.type) && !file.type.startsWith("image/")) {
      alert("Tipo de archivo no permitido. Solo imágenes y PDF.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`El archivo supera ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("id_historia", String(id_historia));
    fd.append("id_mascota", String(id_mascota));
    fd.append("tipo_archivo", tipoSeleccionado);

    const res = await fetch("/api/archivos/upload", {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (res.ok) {
      triggerRefetch();
    } else {
      const j = await res.json();
      alert(j.error ?? "Error al subir archivo");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    const res = await fetch(`/api/archivos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArchivos((prev) => prev.filter((a) => a.id_archivo !== id));
    } else {
      const j = await res.json();
      alert(j.error ?? "Error al eliminar");
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 14px",
          borderRadius: 8,
          border: "1.5px solid #bbf7d0",
          background: "rgba(240,253,244,0.7)",
          color: "#15803d",
          fontSize: "0.78rem",
          fontWeight: 600,
          fontFamily: "var(--font-dm-sans)",
          cursor: "pointer",
          transition: "all 0.12s",
          width: "100%",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#3d845b";
          (e.currentTarget as HTMLElement).style.background = "rgba(240,253,244,1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#bbf7d0";
          (e.currentTarget as HTMLElement).style.background = "rgba(240,253,244,0.7)";
        }}
      >
        <Upload size={13} />
        Archivos
        {archivos.length > 0 && (
          <span
            style={{
              background: "rgba(61,132,91,0.1)",
              color: "#3d845b",
              borderRadius: "99px",
              padding: "1px 7px",
              fontSize: "0.65rem",
              fontWeight: 700,
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {archivos.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid #f3f4f6",
              background: "#f9fafb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#374151",
                fontFamily: "var(--font-dm-sans)",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Upload size={13} style={{ color: "#3d845b" }} />
              Archivos de esta historia clínica
            </span>
            {!readOnly && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={tipoSeleccionado}
                  onChange={(e) =>
                    setTipoSeleccionado(e.target.value as TipoArchivo)
                  }
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-dm-sans)",
                    outline: "none",
                  }}
                >
                  {(Object.keys(TIPO_META) as TipoArchivo[]).map((t) => (
                    <option key={t} value={t}>
                      {TIPO_META[t].label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "linear-gradient(135deg,#3d845b,#2d6446)",
                    color: "#fff",
                    border: "none",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-dm-sans)",
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? (
                    <Loader2
                      size={11}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Upload size={11} />
                  )}
                  Subir archivo
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileInput}
                />
              </div>
            )}
          </div>

          {/* Zona drag-and-drop */}
          {!readOnly && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                margin: "12px 14px",
                borderRadius: 8,
                border: `2px dashed ${dragOver ? "#3d845b" : "#d1fae5"}`,
                background: dragOver
                  ? "rgba(61,132,91,0.05)"
                  : "rgba(240,253,244,0.4)",
                padding: "16px",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              <Upload
                size={18}
                style={{
                  color: dragOver ? "#3d845b" : "#9ca3af",
                  margin: "0 auto 6px",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: dragOver ? "#15803d" : "#9ca3af",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {uploading
                  ? "Subiendo…"
                  : "Arrastra un archivo aquí, o usa el botón de arriba"}
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "0.68rem",
                  color: "#d1d5db",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                JPG, PNG, GIF, PDF · Máx. {MAX_MB} MB
              </p>
            </div>
          )}

          {/* Galería */}
          <div style={{ padding: "4px 14px 14px" }}>
            {loading ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#9ca3af",
                  fontFamily: "var(--font-dm-sans)",
                  padding: "8px 0",
                }}
              >
                Cargando archivos…
              </p>
            ) : archivos.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#9ca3af",
                  fontFamily: "var(--font-dm-sans)",
                  padding: "8px 0",
                }}
              >
                Sin archivos adjuntos
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                {archivos.map((a) => {
                  const tipo =
                    TIPO_META[a.tipo_archivo as TipoArchivo] ?? TIPO_META.otro;
                  const Icon = tipo.icon;
                  const url = a.url_firmada ?? a.url_publica ?? "#";
                  const esImagen = isImage(a.mime_type);
                  return (
                    <div
                      key={a.id_archivo}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#fafafa",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                      }}
                    >
                      {/* Thumbnail */}
                      {esImagen ? (
                        <div
                          style={{
                            height: 80,
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setPreview({ url, nombre: a.nombre_original })
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={a.nombre_original}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 80,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `${tipo.color}0d`,
                          }}
                        >
                          <Icon
                            size={32}
                            style={{ color: tipo.color, opacity: 0.7 }}
                          />
                        </div>
                      )}
                      {/* Info */}
                      <div style={{ padding: "6px 8px", flex: 1 }}>
                        <p
                          style={{
                            margin: "0 0 1px",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color: tipo.color,
                            fontFamily: "var(--font-dm-sans)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {tipo.label}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.65rem",
                            color: "#6b7280",
                            fontFamily: "var(--font-dm-sans)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={a.nombre_original}
                        >
                          {a.nombre_original}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "0.62rem",
                            color: "#9ca3af",
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          {humanSize(a.tamano_bytes)}
                        </p>
                      </div>
                      {/* Acciones */}
                      <div
                        style={{
                          display: "flex",
                          borderTop: "1px solid #f3f4f6",
                        }}
                      >
                        {esImagen && (
                          <button
                            onClick={() =>
                              setPreview({ url, nombre: a.nombre_original })
                            }
                            title="Ver"
                            style={{
                              flex: 1,
                              border: "none",
                              background: "transparent",
                              padding: "6px",
                              cursor: "pointer",
                              color: "#9ca3af",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Eye size={12} />
                          </button>
                        )}
                        <a
                          href={url}
                          download={a.nombre_original}
                          target="_blank"
                          rel="noreferrer"
                          title="Descargar"
                          style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#9ca3af",
                            display: "flex",
                            justifyContent: "center",
                            textDecoration: "none",
                          }}
                        >
                          <Download size={12} />
                        </a>
                        {!readOnly && (
                          <button
                            onClick={() => handleDelete(a.id_archivo)}
                            title="Eliminar"
                            style={{
                              flex: 1,
                              border: "none",
                              background: "transparent",
                              padding: "6px",
                              cursor: "pointer",
                              color: "#fca5a5",
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {/* Fecha */}
                      <div
                        style={{
                          padding: "0 8px 6px",
                          fontSize: "0.6rem",
                          color: "#d1d5db",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {formatLima(a.fecha_carga, "dd/MM/yy")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.nombre}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <p
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-dm-sans)",
              textAlign: "center",
            }}
          >
            {preview.nombre}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
