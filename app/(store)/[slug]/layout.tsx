// app/(store)/[slug]/layout.tsx - MODIFICAÇÃO
import { StoreProvider } from '@/contexts/store-context';
import { CartProvider } from '@/contexts/cart-context';
import { CartStoreIntegration } from '@/contexts/cart-store-integration';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { slug } = await params;
  
  return (
    <StoreProvider slug={slug}>
      <CartProvider>
        <CartStoreIntegration />
        {children}
      </CartProvider>
    </StoreProvider>
  );
}

// Gerar metadados dinâmicos
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { store } = await getStoreData(slug);

  if (!store) {
    return {
      title: 'Loja Não Encontrada',
    };
  }

  return {
    title: store.name,
    description: store.description || `Bem-vindo à ${store.name}`,
  };
}

// Função auxiliar para buscar dados da loja
async function getStoreData(slug: string) {
  try {
    const storeServiceNew = (await import('@/lib/firebase/firestore-new')).storeServiceNew;
    const store = await storeServiceNew.getStoreBySlug(slug);
    
    return { store };
  } catch (error) {
    return { store: null };
  }
}