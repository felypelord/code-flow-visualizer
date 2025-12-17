import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function convertDir(dir) {
  const entries = await fs.readdir(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) {
      await convertDir(full);
      continue;
    }

    const ext = path.extname(entry).toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const out = full.replace(/\.(png|jpe?g)$/i, '.webp');
      try {
        await sharp(full).webp({ quality: 80 }).toFile(out);
        console.log(`converted ${entry} -> ${path.basename(out)}`);
      } catch (err) {
        console.error(`failed ${entry}:`, err.message);
      }
    }
  }
}

const imagesDir = path.resolve(process.cwd(), 'attached_assets', 'generated_images');
(async () => {
  try {
    await convertDir(imagesDir);
    console.log('done');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
