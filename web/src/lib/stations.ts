import md from "../../../data/radiolist-md.json";
import ro from "../../../data/radiolist-ro.json";
import ua from "../../../data/radiolist-ua.json";
import type { CountryCode } from "~/lib/i18n";

export type Station = {
  name: string;
  url: string;
  disable?: boolean;
};

type StationMap = Record<CountryCode, Station[]>;

const stationsByCountry: StationMap = {
  md: normalize(md),
  ro: normalize(ro),
  ua: normalize(ua),
};

function normalize(input: Station[]): Station[] {
  return input.filter((item) => Boolean(item?.url) && item.disable !== true);
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['".,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCountries(): CountryCode[] {
  return ["md", "ro", "ua"];
}

export function getStations(country: CountryCode): Station[] {
  return stationsByCountry[country] || [];
}

export function getStationSlug(station: Station): string {
  return slugify(station.name);
}

export function getStationBySlug(slug: string) {
  for (const country of getCountries()) {
    const station = stationsByCountry[country].find(
      (item) => getStationSlug(item) === slug,
    );
    if (station) {
      return { country, station };
    }
  }
  return null;
}
