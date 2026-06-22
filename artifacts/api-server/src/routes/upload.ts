import { Router, type IRouter, type Request, type Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { requireStaff } from "../middlewares/auth";

const router: IRouter = Router();

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

function r2Config(): R2Config | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl };
}

/**
 * POST /uploads/presign  { filename, contentType }
 * Returns a presigned PUT URL so the browser uploads the file directly to R2,
 * plus the public URL the object will be served from.
 */
router.post("/uploads/presign", async (req: Request, res: Response) => {
  if (!(await requireStaff(req, res))) return;

  const cfg = r2Config();
  if (!cfg) {
    res.status(400).json({ error: "Stockage de fichiers non configuré (variables R2_* manquantes)." });
    return;
  }

  const contentType = typeof req.body?.contentType === "string" && req.body.contentType
    ? req.body.contentType
    : "application/octet-stream";
  const rawName = typeof req.body?.filename === "string" ? req.body.filename : "file";
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  const key = `uploads/${randomUUID()}-${safeName}`;

  const s3 = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });

  try {
    const command = new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `${cfg.publicUrl.replace(/\/+$/, "")}/${key}`;
    res.json({ uploadUrl, publicUrl });
  } catch (err) {
    req.log.error({ err }, "R2 presign failed");
    res.status(500).json({ error: "Échec de la génération de l'URL d'upload" });
  }
});

export default router;
