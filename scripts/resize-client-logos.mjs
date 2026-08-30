import sharp from "sharp";
import { readdirSync, renameSync } from "fs";
import path from "path";

const dir = "src/assets/clients";
const files = readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));

for (const f of files) {
  const p = path.join(dir, f);
  const meta = await sharp(p).metadata();
  if ((meta.height ?? 0) > 320) {
    const tmp = p + ".tmp.png";
    await sharp(p).resize({ height: 320, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(tmp);
    renameSync(tmp, p);
    console.log(`${f}: ${meta.width}x${meta.height} -> resized to h=320`);
  } else {
    console.log(`${f}: ${meta.width}x${meta.height} (kept as-is)`);
  }
}
