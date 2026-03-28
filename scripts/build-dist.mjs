import { cp, mkdir, rm, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());
const dist = resolve(root, "dist");

async function copy(src, dest) {
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  await copy(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
  await cp(resolve(root, "icons"), resolve(dist, "icons"), { recursive: true });
  await cp(resolve(root, "_locales"), resolve(dist, "_locales"), { recursive: true });
  await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });

  await mkdir(resolve(dist, "data"), { recursive: true });
  await copy(
    resolve(root, "data/radiolist-md.json"),
    resolve(dist, "data/radiolist-md.json"),
  );
  await copy(
    resolve(root, "data/radiolist-ro.json"),
    resolve(dist, "data/radiolist-ro.json"),
  );
  await copy(
    resolve(root, "data/radiolist-ua.json"),
    resolve(dist, "data/radiolist-ua.json"),
  );

  console.log("Built dist/ for Chrome load unpacked.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
