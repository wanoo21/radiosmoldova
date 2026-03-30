import { cp, mkdir, rm, copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());

function getArg(name, fallback) {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
}

const target = getArg("target", "chrome").toLowerCase();
const outDir = getArg("out", target === "chrome" ? "dist" : `dist-${target}`);
const dist = resolve(root, outDir);

async function copy(src, dest) {
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
}

async function writeManifest(targetName) {
  const manifestPath = resolve(root, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  // update_url is Chrome Web Store specific. Remove for non-Chrome stores.
  if (targetName !== "chrome") {
    delete manifest.update_url;
  }

  // Opera validator can reject __MSG_*__ tokens in short_name during upload.
  // Use literal branding values for Opera package manifests.
  if (targetName === "opera") {
    manifest.name = "Radio Moldova, Romania and Ukraine";
    manifest.short_name = "Radio MRU";
    manifest.description =
      "Listen online to radio stations from Moldova, Romania and Ukraine.";
    if (manifest.action) {
      manifest.action.default_title = "Radio Moldova, Romania and Ukraine";
    }
    // manifest.default_locale = "en";
  }

  await writeFile(
    resolve(dist, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  await writeManifest(target);
  await cp(resolve(root, "icons"), resolve(dist, "icons"), { recursive: true });
  await cp(resolve(root, "_locales"), resolve(dist, "_locales"), {
    recursive: true,
  });
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

  console.log(`Built ${outDir}/ for ${target}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
