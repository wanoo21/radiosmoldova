import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const APPLY = process.argv.includes("--apply");
const ADD_NEW = process.argv.includes("--add-new");
const MAX_NEW = Number(
  process.argv.find((arg) => arg.startsWith("--max-new="))?.split("=")[1] || 15,
);
const ONLY = process.argv
  .find((arg) => arg.startsWith("--only="))
  ?.split("=")[1]
  ?.split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

const SOURCES = [
  {
    id: "md",
    country: "MD",
    file: "data/radiolist-md.json",
  },
  {
    id: "ro",
    country: "RO",
    file: "data/radiolist-ro.json",
  },
  {
    id: "ua",
    country: "UA",
    file: "data/radiolist-ua.json",
  },
].filter((s) => !ONLY || ONLY.includes(s.id));

const API_BASES = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
];

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.host}${pathname}`.toLowerCase();
  } catch {
    return String(url)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[;*?].*$/, "")
      .replace(/\/+$/, "");
  }
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1);
}

function overlapScore(a, b) {
  const as = new Set(tokenize(a));
  const bs = new Set(tokenize(b));
  if (!as.size || !bs.size) return 0;
  let common = 0;
  for (const token of as) if (bs.has(token)) common += 1;
  return common / Math.max(as.size, bs.size);
}

function candidateScore(targetName, candidate) {
  const target = normalize(targetName);
  const name = normalize(candidate.name);

  let score = 0;
  if (name === target) score += 120;
  if (name.includes(target) || target.includes(name)) score += 45;
  score += overlapScore(targetName, candidate.name) * 60;
  if (candidate.lastcheckok === 1) score += 20;
  if (String(candidate.codec || "").toLowerCase().includes("mp3")) score += 8;
  if (String(candidate.codec || "").toLowerCase().includes("aac")) score += 6;

  const bitrate = Number(candidate.bitrate || 0);
  if (bitrate > 0) score += Math.min(12, bitrate / 16);

  return score;
}

async function fetchStations(countryCode) {
  const path = `/json/stations/bycountrycodeexact/${countryCode}?hidebroken=true&limit=10000&order=clickcount&reverse=true`;

  let lastError = null;
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Failed to fetch stations for ${countryCode}`);
}

function pickBest(targetName, stations) {
  let best = null;
  let bestScore = -1;
  let bestOverlap = 0;
  const targetNorm = normalize(targetName);

  for (const station of stations) {
    const url = station.url_resolved || station.url;
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const candidateNorm = normalize(station.name);
    const overlap = overlapScore(targetName, station.name);
    const containsRelation =
      candidateNorm.includes(targetNorm) || targetNorm.includes(candidateNorm);

    // Strong guardrails: skip weak fuzzy matches.
    if (!containsRelation && overlap < 0.34) continue;

    const score = candidateScore(targetName, station);
    if (score > bestScore) {
      bestScore = score;
      best = station;
      bestOverlap = overlap;
    }
  }

  // Guardrail to avoid bad fuzzy matches.
  if (!best || bestScore < 120 || bestOverlap < 0.34) return null;
  return {
    score: bestScore,
    name: best.name,
    url: best.url_resolved || best.url,
    codec: best.codec,
    bitrate: best.bitrate,
  };
}

function pickNewStations(existingStations, remoteStations, maxNew) {
  const existingNameSet = new Set(
    existingStations.map((s) => normalize(s.name)).filter(Boolean),
  );
  const existingUrlSet = new Set(
    existingStations.map((s) => canonicalUrl(s.url)).filter(Boolean),
  );

  const scored = [];
  for (const station of remoteStations) {
    const url = station.url_resolved || station.url;
    if (!url || !/^https?:\/\//i.test(url)) continue;
    if (station.lastcheckok !== 1) continue;

    const nameNorm = normalize(station.name);
    const urlKey = canonicalUrl(url);
    if (!nameNorm || !urlKey) continue;
    if (existingNameSet.has(nameNorm)) continue;
    if (existingUrlSet.has(urlKey)) continue;

    // Avoid near-duplicate names from the existing list.
    let tooSimilar = false;
    for (const existing of existingNameSet) {
      if (!existing) continue;
      if (existing === nameNorm) {
        tooSimilar = true;
        break;
      }
      const overlap = overlapScore(existing, nameNorm);
      if (overlap > 0.82) {
        tooSimilar = true;
        break;
      }
    }
    if (tooSimilar) continue;

    let quality = 0;
    quality += Number(station.clickcount || 0) / 25;
    quality += Number(station.votes || 0) / 5;
    if (String(station.codec || "").toLowerCase().includes("mp3")) quality += 6;
    if (String(station.codec || "").toLowerCase().includes("aac")) quality += 4;
    quality += Math.min(8, Number(station.bitrate || 0) / 24);

    if (quality < 5) continue;

    scored.push({
      name: station.name.trim(),
      url,
      codec: station.codec || "",
      bitrate: Number(station.bitrate || 0),
      clickcount: Number(station.clickcount || 0),
      votes: Number(station.votes || 0),
      quality,
      urlKey,
      nameNorm,
    });
  }

  scored.sort((a, b) => b.quality - a.quality || b.clickcount - a.clickcount);

  const picked = [];
  const pickedNames = new Set();
  const pickedUrls = new Set();
  for (const candidate of scored) {
    if (picked.length >= maxNew) break;
    if (pickedNames.has(candidate.nameNorm) || pickedUrls.has(candidate.urlKey)) continue;
    picked.push(candidate);
    pickedNames.add(candidate.nameNorm);
    pickedUrls.add(candidate.urlKey);
  }
  return picked;
}

async function processSource(source) {
  const filePath = resolve(process.cwd(), source.file);
  const stations = JSON.parse(await readFile(filePath, "utf8"));
  const remoteStations = await fetchStations(source.country);

  let repaired = 0;
  let unresolved = 0;
  let added = 0;
  const changes = [];
  const additions = [];

  for (const station of stations) {
    if (station.disable !== true) continue;
    if (!station.name) continue;

    const match = pickBest(station.name, remoteStations);
    if (!match) {
      unresolved += 1;
      continue;
    }

    const previousUrl = station.url;
    station.url = match.url;
    delete station.disable;
    repaired += 1;
    changes.push({
      name: station.name,
      from: previousUrl,
      to: match.url,
      score: match.score.toFixed(1),
    });
  }

  if (ADD_NEW && MAX_NEW > 0) {
    const newCandidates = pickNewStations(stations, remoteStations, MAX_NEW);
    for (const candidate of newCandidates) {
      stations.push({
        name: candidate.name,
        url: candidate.url,
      });
      added += 1;
      additions.push({
        name: candidate.name,
        url: candidate.url,
        codec: candidate.codec,
        bitrate: candidate.bitrate,
        clickcount: candidate.clickcount,
        quality: candidate.quality.toFixed(1),
      });
    }
  }

  if (APPLY && (repaired > 0 || added > 0)) {
    await writeFile(filePath, `${JSON.stringify(stations, null, 2)}\n`);
  }

  return { source, repaired, unresolved, added, changes, additions };
}

async function main() {
  if (!SOURCES.length) {
    console.log("No matching sources. Use --only=md,ro,ua");
    return;
  }

  console.log(
    APPLY
      ? `Refreshing disabled stations (apply mode${ADD_NEW ? ", add-new enabled" : ""})`
      : `Refreshing disabled stations (dry-run${ADD_NEW ? ", add-new enabled" : ""})`,
  );

  for (const source of SOURCES) {
    const result = await processSource(source);
    console.log(
      `\n[${source.id.toUpperCase()}] repaired=${result.repaired} unresolved=${result.unresolved} added=${result.added}`,
    );
    for (const change of result.changes.slice(0, 20)) {
      console.log(`- ${change.name} [score=${change.score}]`);
      console.log(`  from: ${change.from}`);
      console.log(`  to:   ${change.to}`);
    }
    if (result.changes.length > 20) {
      console.log(`  ... and ${result.changes.length - 20} more`);
    }
    if (result.additions.length) {
      console.log("  New stations:");
      for (const station of result.additions.slice(0, 20)) {
        console.log(
          `  + ${station.name} [${station.codec || "?"}/${station.bitrate || 0}kbps clicks=${station.clickcount} q=${station.quality}]`,
        );
        console.log(`    ${station.url}`);
      }
      if (result.additions.length > 20) {
        console.log(`    ... and ${result.additions.length - 20} more`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
