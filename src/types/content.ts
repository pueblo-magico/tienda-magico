/** HTML producido exclusivamente por el serializador con lista de nodos permitidos. */
export type SafeRichTextHtml = string & {
  readonly __safeRichText: unique symbol;
};
