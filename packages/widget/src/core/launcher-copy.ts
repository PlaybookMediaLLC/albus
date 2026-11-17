// The launcher's own words in the host page. The SDK bundle carries only these few phrases;
// the panel's copy comes with the iframe page (src/ui/i18n).

type Copy = { open: string; close: string; dismiss: string; newUpdate: string };

const COPY: Record<string, Copy> = {
  en: {
    open: "Open feedback widget",
    close: "Close feedback widget",
    dismiss: "Dismiss",
    newUpdate: "New: {title}",
  },
  fr: {
    open: "Ouvrir le widget d’aide",
    close: "Fermer le widget d’aide",
    dismiss: "Ignorer",
    newUpdate: "Nouveau : {title}",
  },
  de: {
    open: "Feedback-Widget öffnen",
    close: "Feedback-Widget schließen",
    dismiss: "Schließen",
    newUpdate: "Neu: {title}",
  },
  es: {
    open: "Abrir el widget de ayuda",
    close: "Cerrar el widget de ayuda",
    dismiss: "Descartar",
    newUpdate: "Nuevo: {title}",
  },
  ar: {
    open: "فتح أداة المساعدة",
    close: "إغلاق أداة المساعدة",
    dismiss: "تجاهل",
    newUpdate: "جديد: {title}",
  },
  ru: {
    open: "Открыть виджет поддержки",
    close: "Закрыть виджет поддержки",
    dismiss: "Скрыть",
    newUpdate: "Новое: {title}",
  },
  pt: {
    open: "Abrir widget de ajuda",
    close: "Fechar widget de ajuda",
    dismiss: "Dispensar",
    newUpdate: "Novo: {title}",
  },
  zh: {
    open: "打开帮助小组件",
    close: "关闭帮助小组件",
    dismiss: "关闭提示",
    newUpdate: "新：{title}",
  },
  "zh-tw": {
    open: "開啟說明小工具",
    close: "關閉說明小工具",
    dismiss: "關閉提示",
    newUpdate: "新：{title}",
  },
  nl: {
    open: "Hulpwidget openen",
    close: "Hulpwidget sluiten",
    dismiss: "Negeren",
    newUpdate: "Nieuw: {title}",
  },
  pl: {
    open: "Otwórz widżet pomocy",
    close: "Zamknij widżet pomocy",
    dismiss: "Odrzuć",
    newUpdate: "Nowość: {title}",
  },
  th: {
    open: "เปิดวิดเจ็ตช่วยเหลือ",
    close: "ปิดวิดเจ็ตช่วยเหลือ",
    dismiss: "ปิด",
    newUpdate: "ใหม่: {title}",
  },
  uk: {
    open: "Відкрити віджет підтримки",
    close: "Закрити віджет підтримки",
    dismiss: "Сховати",
    newUpdate: "Нове: {title}",
  },
};

/** The launcher copy for a language tag; English when the language is not supported. */
export function launcherCopy(locale: string | undefined): Copy {
  const tag = (locale ?? "").toLowerCase();
  const traditional = /^zh-(tw|hk|mo|hant)/.test(tag);
  return (
    COPY[traditional ? "zh-tw" : tag] ?? COPY[tag.split("-")[0]!] ?? COPY.en!
  );
}
