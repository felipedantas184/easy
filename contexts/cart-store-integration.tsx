// contexts/cart-store-integration.tsx - NOVO ARQUIVO
'use client';
import { useStore } from './store-context';
import { useCart } from './cart-context';
import { useEffect } from 'react';

export function CartStoreIntegration() {
  const { store } = useStore();
  const { setStoreId } = useCart();

  useEffect(() => {
    if (store?.id && setStoreId) {
      console.log('🔄 CartStoreIntegration: Definindo storeId no carrinho:', store.id);
      setStoreId(store.id);
    }
  }, [store?.id, setStoreId]);

  return null;
}