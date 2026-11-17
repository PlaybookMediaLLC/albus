import type { Catalog } from "./catalog.js";
import type { Locale } from "./locales.js";
import fr from "./messages/fr.js";
import de from "./messages/de.js";
import es from "./messages/es.js";
import ar from "./messages/ar.js";
import ru from "./messages/ru.js";
import pt_BR from "./messages/pt-BR.js";
import zh_CN from "./messages/zh-CN.js";
import zh_TW from "./messages/zh-TW.js";
import nl from "./messages/nl.js";
import pl from "./messages/pl.js";
import th from "./messages/th.js";
import uk from "./messages/uk.js";

/** Every supported language's messages; English is the source in messages/en.ts. */
export const catalogs: Record<Locale, Catalog> = {
  en: {},
  fr,
  de,
  es,
  ar,
  ru,
  "pt-BR": pt_BR,
  "zh-CN": zh_CN,
  "zh-TW": zh_TW,
  nl,
  pl,
  th,
  uk,
};
