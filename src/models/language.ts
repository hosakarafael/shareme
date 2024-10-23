export interface LanguageEntity {
  shortName: string;
  longName: string;
}

const LANGUAGE_LIST = [
  { shortName: "en", longName: "English" },
  { shortName: "pt", longName: "Português" },
  { shortName: "ja", longName: "日本語" },
];

export function getLanguageList(): LanguageEntity[] {
  return LANGUAGE_LIST;
}

export function getLanguageByShortName(shortName: string) {
  return LANGUAGE_LIST.filter((lang) => lang.shortName === shortName)[0];
}
