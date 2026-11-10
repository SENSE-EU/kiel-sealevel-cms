import type { Core } from "@strapi/strapi";

const LOCALES = [
  { code: "de", name: "German (de)" },
  { code: "en", name: "English (en)" },
] as const;

export async function configureLocales(strapi: Core.Strapi) {
  const localeService = strapi.plugin("i18n").service("locales");

  for (const locale of LOCALES) {
    const existingLocale = await localeService.findByCode(locale.code);
    if (!existingLocale) {
      await localeService.create(locale);
    }
  }

  const defaultLocale = await localeService.getDefaultLocale();
  if (defaultLocale !== "de") {
    await localeService.setDefaultLocale({ code: "de" });
  }
}
