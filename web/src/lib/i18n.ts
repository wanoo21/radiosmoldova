export const SUPPORTED_LOCALES = ["en", "ro", "uk"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type CountryCode = "md" | "ro" | "ua";

export type Dict = {
  appName: string;
  selectLanguage: string;
  listenNow: string;
  countries: string;
  stations: string;
  play: string;
  pause: string;
  playing: string;
  openStation: string;
  stationNotFound: string;
  backHome: string;
  openCountry: string;
  countriesLabel: Record<CountryCode, string>;
  seo: {
    homeTitle: string;
    homeDescription: string;
    countryTitle: string;
    countryDescription: string;
    stationTitle: string;
    stationDescription: string;
  };
};

const dict: Record<Locale, Dict> = {
  en: {
    appName: "Radio Moldova, Romania and Ukraine",
    selectLanguage: "Choose language",
    listenNow: "Listen now",
    countries: "Countries",
    stations: "Stations",
    play: "Play",
    pause: "Pause",
    playing: "Playing",
    openStation: "Open station",
    stationNotFound: "Station not found.",
    backHome: "Back to home",
    openCountry: "Open country",
    countriesLabel: { md: "Moldova", ro: "Romania", ua: "Ukraine" },
    seo: {
      homeTitle: "Online Radio: Moldova, Romania and Ukraine",
      homeDescription: "Listen to live online radio stations from Moldova, Romania and Ukraine.",
      countryTitle: "Radio stations by country",
      countryDescription: "Browse radio stations from Moldova, Romania and Ukraine.",
      stationTitle: "Listen station online",
      stationDescription: "Stream the selected radio station directly in your browser.",
    },
  },
  ro: {
    appName: "Radio Moldova, Romania si Ucraina",
    selectLanguage: "Alege limba",
    listenNow: "Asculta acum",
    countries: "Tari",
    stations: "Statii",
    play: "Play",
    pause: "Pauza",
    playing: "Se reda",
    openStation: "Deschide statia",
    stationNotFound: "Statia nu a fost gasita.",
    backHome: "Inapoi la pagina principala",
    openCountry: "Deschide tara",
    countriesLabel: { md: "Moldova", ro: "Romania", ua: "Ucraina" },
    seo: {
      homeTitle: "Radio online Moldova, Romania si Ucraina",
      homeDescription: "Asculta live posturi radio online din Moldova, Romania si Ucraina.",
      countryTitle: "Statii radio pe tara",
      countryDescription: "Exploreaza statiile radio din Moldova, Romania si Ucraina.",
      stationTitle: "Asculta statia online",
      stationDescription: "Reda statia radio selectata direct in browser.",
    },
  },
  uk: {
    appName: "Radio Moldovy, Rumuniyi ta Ukrayiny",
    selectLanguage: "Obraty movu",
    listenNow: "Slukhaty zaraz",
    countries: "Krayiny",
    stations: "Stantsiyi",
    play: "Play",
    pause: "Pauza",
    playing: "Vidtvoryuyetsya",
    openStation: "Vidkryty stantsiyu",
    stationNotFound: "Stantsiyu ne znaydeno.",
    backHome: "Nazad na holovnu",
    openCountry: "Vidkryty krayinu",
    countriesLabel: { md: "Moldova", ro: "Rumuniya", ua: "Ukrayina" },
    seo: {
      homeTitle: "Onlayn radio Moldovy, Rumuniyi ta Ukrayiny",
      homeDescription: "Slukhayte radio stantsiyi onlayn z Moldovy, Rumuniyi ta Ukrayiny.",
      countryTitle: "Radio stantsiyi za krayinoyu",
      countryDescription: "Perehlyadayte radio stantsiyi Moldovy, Rumuniyi ta Ukrayiny.",
      stationTitle: "Slukhaty stantsiyu onlayn",
      stationDescription: "Translyuyte obranu radio stantsiyu bezposeredno v brauzeri.",
    },
  },
};

export function normalizeLocale(value?: string): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return "en";
}

export function getDict(locale?: string): Dict {
  return dict[normalizeLocale(locale)];
}
