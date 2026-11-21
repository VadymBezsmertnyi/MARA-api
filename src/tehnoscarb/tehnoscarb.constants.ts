const tehnoscarbUrl = "https://tehnoskarb.ua";
const metalDetectorsUrl = `${tehnoscarbUrl}/json/metalloiskateli/c226/filter/vendor=898?subaction=selectItem`;
const motogarnturaUrl = `${tehnoscarbUrl}/json/katalog-komissionnojj-tekhniki/c-all?q=Мотогарнітура&subaction=selectItem`;
const headers = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ru",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Referer: "https://tehnoskarb.ua/metalloiskateli/c226",
  "X-Requested-With": "XMLHttpRequest",
};
const myPhone = "+10000000000";
const minelabEquinox900 = ["Minelab", "equinox", "900"];
const motogarntura = [
  "motogarntura",
  "sena",
  "cardo",
  "freedconn",
  "lexin",
  "vimoto",
  "fodsports",
  "ejeas",
  "bt-s2",
  "t-com",
  "tmax",
];

const DeviceType = {
  metalDetectors: "metalDetectors",
  motogarntura: "motogarntura",
} as const;

export const TEHNOSCARB_CONSTANTS = {
  myPhone,
  tehnoscarbUrl,
  metalDetectorsUrl,
  motogarnturaUrl,
  headers,
  keywords: {
    minelabEquinox900,
    minelabEquinox900Key: minelabEquinox900.join("_").toLowerCase(),
    motogarntura,
    motogarnturaKey: motogarntura.join("_").toLowerCase(),
  },
  DeviceType,
};
