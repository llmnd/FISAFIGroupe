import type { ERPProvider } from "./contracts";
import { OdooERPProvider } from "./odooProvider";

let provider: ERPProvider | undefined;

export function getERPProvider(): ERPProvider {
  provider ??= new OdooERPProvider();
  return provider;
}
