// ============================================================
//  PROJECT LIST  –  edit this file to add, rename or remove projects
// ============================================================
//
//  Each project has:
//    code : short ID saved with every donation (letters, digits, no spaces).
//           Keep the same code for the same project year after year,
//           so reports can compare years. The donation's date shows the year.
//    en   : name shown in English
//    fr   : name shown in French
//    he   : name shown in Hebrew
//
//  To add a project, copy one line, paste it below, and change the values.
//  Don't forget the comma at the end of each line.
//  The first project in the list is selected by default.
//
//  Tip: a link like  https://donate.chabadlubavitch.ca/?project=CHAN
//  opens the page with that project already selected (good for posters).
// ============================================================

// ORDER OF THE LIST ON THE PAGE
//   "year"     = the order written below (the Jewish year, starting from Tishrei)
//   "alphabet" = alphabetical, in each language's own alphabet (A–Z, French accents, א–ת)
// "General Donation" (the first line) always stays on top, and "Other" always at the bottom.
export const SORT = "year";

export default [
  { code: "GEN",    en: "General Donation",    fr: "Don général",          he: "תרומה כללית" },
  { code: "TISH",   en: "Tishrei",             fr: "Tichri",               he: "תשרי" },
  { code: "RCK",    en: "Rosh Chodesh Kislev", fr: "Roch 'Hodech Kislev",  he: "ראש חודש כסלו" },
  { code: "YDK",    en: "Yud Daled Kislev",    fr: "Youd-Dalet Kislev",    he: "י״ד כסלו" },
  { code: "CHAN",   en: "Chanukah",            fr: "Hanoukka",             he: "חנוכה" },
  { code: "PURIM",  en: "Purim",               fr: "Pourim",               he: "פורים" },
  { code: "YAN",    en: "Yud Aleph Nissan",    fr: "Youd-Alef Nissan",     he: "י״א ניסן" },
  { code: "PESACH", en: "Pesach",              fr: "Pessa'h",              he: "פסח" },
  { code: "LAG",    en: "Lag Ba'Omer",         fr: "Lag Baomer",           he: "ל״ג בעומר" },
  { code: "SHAV",   en: "Shavuos",             fr: "Chavouot",             he: "שבועות" },
  { code: "CHAI",   en: "Chai Elul",           fr: "'Haï Elloul",          he: "ח״י אלול" },
  { code: "MIVTZ",  en: "Mivtzoim",            fr: "Mivtzoim",             he: "מבצעים" },
  { code: "TANK",   en: "Mivtza Tank",         fr: "Mivtza Tank",          he: "מבצע טנק" },
  { code: "BOX",    en: "Charity Box",         fr: "Boîte de tsedaka",     he: "קופת צדקה" },
];
