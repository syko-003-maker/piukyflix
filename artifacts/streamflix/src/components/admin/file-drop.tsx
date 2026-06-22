import { useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Drag-and-drop file uploader. Requests a presigned URL from the backend, then
 * uploads the file directly to R2 (with progress) and returns its public URL.
 */
export function FileDrop({
  value,
  onChange,
  accept = "video/*",
  hint = "Glisse ton fichier ici ou clique pour choisir",
}: {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setProgress(0);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
      });
      if (!presignRes.ok) {
        const data = (await presignRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Échec de la préparation de l'upload");
      }
      const { uploadUrl, publicUrl } = (await presignRes.json()) as { uploadUrl: string; publicUrl: string };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload échoué (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload"));
        xhr.send(file);
      });

      onChange(publicUrl);
      setProgress(100);
      setTimeout(() => setProgress(null), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload échoué");
      setProgress(null);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void upload(file);
  };

  const uploading = progress !== null;

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/10" : "border-white/15 bg-secondary/30 hover:border-white/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-white">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Envoi… {progress}%
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : value ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" /> Fichier en ligne — clique/dépose pour remplacer
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <UploadCloud className="h-6 w-6" />
            <span className="text-sm">{hint}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
