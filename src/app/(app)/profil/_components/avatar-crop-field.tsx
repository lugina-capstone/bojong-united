"use client";

import {
  CameraIcon,
  RotateCcwIcon,
  Trash2Icon,
  ZoomInIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initialsOf } from "@/components/ui/org-logo";
import { formatFileSize } from "@/lib/format";
import {
  INVALID_FILE_MESSAGE,
  uploadFileWithReason,
} from "@/lib/upload-client";
import {
  avatarContentTypes,
  MAX_AVATAR_SIZE,
  MIN_AVATAR_DIMENSION,
} from "@/lib/validations/profile";

const VIEWPORT_SIZE = 280;
const EXPORT_SIZE = 512;

type CropSource = {
  url: string;
  name: string;
  mimeType: "image/jpeg" | "image/png";
  naturalWidth: number;
  naturalHeight: number;
};

function clampOffset(
  offset: { x: number; y: number },
  src: CropSource,
  zoom: number,
) {
  const baseScale = Math.max(
    VIEWPORT_SIZE / src.naturalWidth,
    VIEWPORT_SIZE / src.naturalHeight,
  );
  const drawW = src.naturalWidth * baseScale * zoom;
  const drawH = src.naturalHeight * baseScale * zoom;
  const maxX = Math.max(0, (drawW - VIEWPORT_SIZE) / 2);
  const maxY = Math.max(0, (drawH - VIEWPORT_SIZE) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

/** Pemilih & pemotong (crop 1:1) foto profil JPG/PNG maks. 2 MB. */
export function AvatarCropField({
  name,
  previewUrl,
  changed,
  error,
  onChange,
}: {
  name: string;
  previewUrl: string | null;
  changed: boolean;
  error?: string;
  onChange: (next: {
    fileId: string | null;
    previewUrl: string | null;
  }) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [localError, setLocalError] = React.useState<string>();
  const [cropSource, setCropSource] = React.useState<CropSource | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource.url);
    };
  }, [cropSource]);

  function closeCrop() {
    if (cropSource) URL.revokeObjectURL(cropSource.url);
    setCropSource(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    setLocalError(undefined);
    if (!(avatarContentTypes as readonly string[]).includes(file.type)) {
      setLocalError("Foto profil harus berformat JPG atau PNG.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setLocalError(
        `Ukuran berkas (${formatFileSize(file.size)}) melebihi batas 2 MB.`,
      );
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (
        img.naturalWidth < MIN_AVATAR_DIMENSION ||
        img.naturalHeight < MIN_AVATAR_DIMENSION
      ) {
        URL.revokeObjectURL(url);
        setLocalError(
          `Resolusi foto minimal ${MIN_AVATAR_DIMENSION}×${MIN_AVATAR_DIMENSION} px.`,
        );
        return;
      }
      if (cropSource) URL.revokeObjectURL(cropSource.url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropSource({
        url,
        name: file.name,
        mimeType: file.type === "image/png" ? "image/png" : "image/jpeg",
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setLocalError("Berkas gambar tidak dapat dibaca. Pilih gambar lain.");
    };
    img.src = url;
  }

  async function applyCrop() {
    if (!cropSource) return;
    setUploading(true);
    setLocalError(undefined);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Gagal membaca gambar."));
        el.src = cropSource.url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Kanvas tidak tersedia.");

      const baseScale = Math.max(
        VIEWPORT_SIZE / cropSource.naturalWidth,
        VIEWPORT_SIZE / cropSource.naturalHeight,
      );
      const scale = baseScale * zoom;
      const drawW = cropSource.naturalWidth * scale;
      const drawH = cropSource.naturalHeight * scale;
      const clamped = clampOffset(offset, cropSource, zoom);
      const ratio = EXPORT_SIZE / VIEWPORT_SIZE;
      const dx = ((VIEWPORT_SIZE - drawW) / 2 + clamped.x) * ratio;
      const dy = ((VIEWPORT_SIZE - drawH) / 2 + clamped.y) * ratio;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      ctx.drawImage(img, dx, dy, drawW * ratio, drawH * ratio);

      let outType: "image/jpeg" | "image/png" = cropSource.mimeType;
      let blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outType, 0.9),
      );
      if (blob && blob.size > MAX_AVATAR_SIZE && outType === "image/png") {
        outType = "image/jpeg";
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, outType, 0.88),
        );
      }
      if (!blob) {
        setLocalError("Gagal memproses potongan foto.");
        return;
      }
      if (blob.size > MAX_AVATAR_SIZE) {
        setLocalError("Hasil potongan foto melebihi 2 MB. Pilih gambar lain.");
        return;
      }

      const ext = outType === "image/png" ? "png" : "jpg";
      const file = new File([blob], `avatar.${ext}`, { type: outType });
      const uploaded = await uploadFileWithReason(file);
      if (!uploaded.file) {
        setLocalError(
          uploaded.reason === "invalid"
            ? INVALID_FILE_MESSAGE
            : "Foto gagal diunggah. Periksa koneksi lalu coba lagi.",
        );
        return;
      }
      const localPreview = URL.createObjectURL(blob);
      onChange({ fileId: uploaded.file.id, previewUrl: localPreview });
      closeCrop();
      toast.success(
        "Foto profil siap disimpan. Pilih Simpan perubahan untuk menerapkan.",
      );
    } catch {
      setLocalError("Terjadi kendala saat memproses foto. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  const shownError = localError ?? error;

  const drawStyle = React.useMemo(() => {
    if (!cropSource) return undefined;
    const baseScale = Math.max(
      VIEWPORT_SIZE / cropSource.naturalWidth,
      VIEWPORT_SIZE / cropSource.naturalHeight,
    );
    const scale = baseScale * zoom;
    const clamped = clampOffset(offset, cropSource, zoom);
    return {
      width: `${cropSource.naturalWidth * scale}px`,
      height: `${cropSource.naturalHeight * scale}px`,
      transform: `translate(calc(-50% + ${clamped.x}px), calc(-50% + ${clamped.y}px))`,
    };
  }, [cropSource, zoom, offset]);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
      <Avatar className="size-18 shrink-0">
        {previewUrl && <AvatarImage src={previewUrl} alt={name || "Profil"} />}
        <AvatarFallback className="text-h1 bg-primary-500 text-inverse">
          {initialsOf(name || "P")}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h3 text-foreground">Foto profil</h2>
          {changed && (
            <Badge tone="success" size="sm">
              Diubah
            </Badge>
          )}
        </div>
        <p className="text-caption text-muted-foreground">
          JPG atau PNG · maks. 2 MB · minimal {MIN_AVATAR_DIMENSION}×
          {MIN_AVATAR_DIMENSION} px. Foto bisa dipotong setelah dipilih.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <CameraIcon aria-hidden="true" />
            Pilih foto
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading || !previewUrl}
            onClick={() => {
              setLocalError(undefined);
              onChange({ fileId: null, previewUrl: null });
            }}
          >
            <Trash2Icon aria-hidden="true" />
            Hapus foto
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={avatarContentTypes.join(",")}
          aria-label="Pilih foto profil"
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {shownError && (
          <p role="alert" className="text-caption text-danger-600">
            {shownError}
          </p>
        )}
      </div>

      <Dialog
        open={Boolean(cropSource)}
        onOpenChange={(open) => {
          if (!open && !uploading) closeCrop();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Potong foto profil</DialogTitle>
            <DialogDescription>
              Geser gambar dan atur pembesaran untuk menyesuaikan posisi foto
              profil Anda (rasio 1:1).
            </DialogDescription>
          </DialogHeader>

          {cropSource && (
            <div className="flex flex-col items-center gap-4">
              <div
                role="application"
                aria-label="Area pemotongan foto"
                style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
                className="relative cursor-grab touch-none overflow-hidden rounded-2xl border border-border bg-muted select-none active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragRef.current = {
                    pointerId: e.pointerId,
                    startX: e.clientX,
                    startY: e.clientY,
                    originX: offset.x,
                    originY: offset.y,
                  };
                }}
                onPointerMove={(e) => {
                  const drag = dragRef.current;
                  if (!drag || drag.pointerId !== e.pointerId) return;
                  const next = clampOffset(
                    {
                      x: drag.originX + (e.clientX - drag.startX),
                      y: drag.originY + (e.clientY - drag.startY),
                    },
                    cropSource,
                    zoom,
                  );
                  setOffset(next);
                }}
                onPointerUp={(e) => {
                  if (dragRef.current?.pointerId === e.pointerId) {
                    dragRef.current = null;
                  }
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal object URL sebelum unggah */}
                <img
                  src={cropSource.url}
                  alt="Pratinjau potongan foto"
                  draggable={false}
                  style={drawStyle}
                  className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full ring-[999px] ring-foreground/45"
                />
              </div>

              <div className="flex w-full items-center gap-3">
                <ZoomInIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <input
                  type="range"
                  aria-label="Pembesaran foto"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => {
                    const nextZoom = Number(e.target.value);
                    setZoom(nextZoom);
                    setOffset((prev) =>
                      clampOffset(prev, cropSource, nextZoom),
                    );
                  }}
                  className="w-full accent-primary-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                >
                  <RotateCcwIcon aria-hidden="true" />
                  Reset
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={closeCrop}
            >
              Batal
            </Button>
            <Button
              type="button"
              loading={uploading}
              onClick={() => void applyCrop()}
            >
              {uploading ? "Mengunggah..." : "Gunakan foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
