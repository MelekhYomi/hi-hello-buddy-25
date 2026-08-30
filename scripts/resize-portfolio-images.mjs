import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import path from "path";

const dir = "public/portfolio";
const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f));

for (const f of files) {
  const p = path.join(dir, f);
  const before = statSync(p).size;
  const meta = await sharp(p).metadata();
  const buf = await sharp(p)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await sharp(buf).toFile(p + ".tmp.jpg");
  const { renameSync } = await import("fs");
  renameSync(p + ".tmp.jpg", p);
  const after = statSync(p).size;
  console.log(`${f}: ${meta.width}x${meta.height}, ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB`);
}
