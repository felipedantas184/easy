import { StoreProvider } from '@/contexts/store-context';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  // ✅ AGUARDAR params
  const { slug } = await params;
  
  return (
    <StoreProvider slug={slug}>
      {children}
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
    const storeService = (await import('@/lib/firebase/firestore')).storeService;
    const store = await storeService.getStoreBySlug(slug);
    
    return { store };
  } catch (error) {
    return { store: null };
  }
}