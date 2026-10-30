import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * An <img> that falls back to a placeholder (the C Imperium logo card) when the image is
 * missing, or when it fails to load (deleted file, bad link, network error).
 */
export function SafeImg({
  src,
  fallback,
  alt,
  ...rest
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null; fallback: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  // An image that already failed while the page was still loading will not fire onError again
  // after hydration, so check it once on mount.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) setFailed(true);
  }, [src]);

  return <img ref={ref} src={!src || failed ? fallback : src} alt={alt} onError={() => setFailed(true)} {...rest} />;
}
