import { useEffect, useState } from "react";
import { getProProduct } from "@/lib/iap";

/**
 * Real subscription price as reported by Apple / Google (e.g. "$9.99").
 * Returns null on web, where callers fall back to the Stripe price.
 */
export const useProPrice = () => {
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getProProduct().then((product) => {
      if (mounted && product) setPrice(product.priceString);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return price;
};
