"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import {
  ARTICLE_IMAGE_BUCKET,
  validateArticleImage,
} from "@/lib/article-image-upload.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

export type ImageUploadState = {
  error: string;
  url: string;
};

export async function uploadArticleImage(
  _previousState: ImageUploadState,
  formData: FormData,
): Promise<ImageUploadState> {
  await requireAdmin();

  const file = formData.get("image_file");
  if (!(file instanceof File)) {
    return { error: "Choose an image to upload.", url: "" };
  }

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const validation = validateArticleImage({
    type: file.type,
    size: file.size,
    bytes: signature,
  });

  if (!validation.ok) {
    return { error: validation.error ?? "The selected image is not valid.", url: "" };
  }

  const path = `${new Date().getUTCFullYear()}/${randomUUID()}.${validation.extension}`;
  const supabase = getAdminSupabase();
  const { error } = await supabase.storage
    .from(ARTICLE_IMAGE_BUCKET)
    .upload(path, new Uint8Array(await file.arrayBuffer()), {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Article image upload failed:", {
      code: error.name,
      message: error.message,
    });
    return {
      error: "The image could not be uploaded. Confirm the storage migration is applied and try again.",
      url: "",
    };
  }

  const { data } = supabase.storage.from(ARTICLE_IMAGE_BUCKET).getPublicUrl(path);
  return { error: "", url: data.publicUrl };
}
