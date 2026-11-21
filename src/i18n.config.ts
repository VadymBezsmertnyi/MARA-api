import { I18n } from "i18n";
import path from "path";
import { LANGUAGES_KEYS } from "./routers/user/user.const";

const locales: string[] = LANGUAGES_KEYS as unknown as string[];

const i18n = new I18n({
  locales,
  defaultLocale: "en",
  directory: path.join("./src/", "locales"),
});

export default i18n;
