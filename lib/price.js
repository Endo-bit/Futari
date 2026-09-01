/* Store prices, rendered in the conventions of the country the device is set to.

   RevenueCat hands us `product.priceString` already formatted by StoreKit — but
   StoreKit formats it with the *product's* locale, which is derived from the App
   Store storefront, not from the phone's region. On a device set to Japan whose
   App Store account still sits on a European storefront that lands as "€4,99":
   the right amount, formatted for the wrong country.

   We can't change the currency a user is charged in — that is fixed by their App
   Store account's country and Apple bills in it — but we can always render the
   amount the way that device formats money (symbol placement, decimal separator,
   grouping, and the symbol form the locale actually uses). `currencyCode` comes
   from the product, so the number and its currency always stay truthful. */

let cachedTag;
function deviceLanguageTag() {
  if (cachedTag !== undefined) return cachedTag;
  try {
    const { getLocales } = require("expo-localization");
    cachedTag = getLocales()?.[0]?.languageTag || null;
  } catch {
    cachedTag = null;
  }
  return cachedTag;
}

/** The ISO country the device's region is set to, e.g. "JP". Null when unknown. */
export function deviceRegion() {
  try {
    const { getLocales } = require("expo-localization");
    return getLocales()?.[0]?.regionCode || null;
  } catch {
    return null;
  }
}

/**
 * A store product's price formatted for this device's locale.
 * Falls back to StoreKit's own `priceString` whenever anything is missing —
 * an unformattable price must never render as blank or as a bare number.
 */
export function formatPrice(product, lang) {
  if (!product) return "";
  const { price, priceString, currencyCode } = product;
  if (typeof price !== "number" || !Number.isFinite(price) || !currencyCode) return priceString || "";
  try {
    return new Intl.NumberFormat(deviceLanguageTag() || lang || "en", {
      style: "currency",
      currency: currencyCode,
    }).format(price);
  } catch {
    // Hermes without full Intl data, or a currency code it doesn't know.
    return priceString || "";
  }
}
