import { useCallback, useEffect, useState } from "react";
import {
  getMarketProductId,
  MARKET_CART_CHANGE_EVENT,
  MARKET_CART_KEY,
  MARKET_CART_MAX_QUANTITY,
  readMarketCart,
  writeMarketCart,
} from "@/lib/marketCart";
import type { MarketCartItem, MarketCartItemInput } from "@/lib/marketCart";

export default function useMarketCart() {
  const [items, setItems] = useState<MarketCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    const refresh = () => {
      try {
        setItems(readMarketCart());
        setStorageError("");
      } catch (error) {
        console.error("Impossible de lire le panier FiSAFi Market.", error);
        setItems([]);
        setStorageError("Impossible de charger le panier enregistré. Ajoutez à nouveau vos produits.");
      }
      setReady(true);
    };
    const refreshFromOtherTab = (event: StorageEvent) => {
      if (event.key === null || event.key === MARKET_CART_KEY) refresh();
    };

    refresh();
    window.addEventListener(MARKET_CART_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refreshFromOtherTab);
    return () => {
      window.removeEventListener(MARKET_CART_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refreshFromOtherTab);
    };
  }, []);

  const commit = useCallback((nextItems: MarketCartItem[]) => {
    try {
      writeMarketCart(nextItems);
      setItems(nextItems);
      setStorageError("");
    } catch (error) {
      console.error("Impossible d’enregistrer le panier FiSAFi Market.", error);
      setStorageError("Le panier n’a pas pu être enregistré sur cet appareil.");
    }
  }, []);

  const addItem = useCallback((product: MarketCartItemInput) => {
    const id = getMarketProductId(product.departmentId, product.name, product.odooProductId);
    const existing = items.find((item) => item.id === id);
    commit(existing
      ? items.map((item) => item.id === id
        ? {
            ...item,
            ...product,
            quantity: Math.min(
              MARKET_CART_MAX_QUANTITY,
              item.quantity + (product.quantity ?? 1),
            ),
          }
        : item)
      : [...items, {
          ...product,
          id,
          quantity: Math.min(MARKET_CART_MAX_QUANTITY, product.quantity ?? 1),
        }]);
  }, [commit, items]);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 0) return;
    commit(quantity === 0
      ? items.filter((item) => item.id !== id)
      : items.map((item) => item.id === id ? { ...item, quantity } : item));
  }, [commit, items]);

  const removeItem = useCallback((id: string) => {
    commit(items.filter((item) => item.id !== id));
  }, [commit, items]);

  const clearCart = useCallback(() => commit([]), [commit]);

  return { items, ready, storageError, addItem, setQuantity, removeItem, clearCart };
}
