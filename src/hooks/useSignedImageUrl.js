import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Given an analysis record, returns a displayable image URL.
 * If image_uri exists (private storage), generates a fresh signed URL.
 * Falls back to image_url for old records.
 */
export default function useSignedImageUrl(analysis) {
  const [url, setUrl] = useState(analysis?.image_url || null);

  useEffect(() => {
    if (!analysis) return;
    if (analysis.image_uri) {
      base44.integrations.Core.CreateFileSignedUrl({ file_uri: analysis.image_uri, expires_in: 3600 })
        .then(({ signed_url }) => setUrl(signed_url))
        .catch(() => setUrl(analysis.image_url || null));
    } else {
      setUrl(analysis.image_url || null);
    }
  }, [analysis?.id]);

  return url;
}