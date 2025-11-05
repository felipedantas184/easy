import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Página Não Encontrada
          </h2>
          
          <p className="text-gray-600 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="space-y-4">
            <Link href="/">
              <Button size="lg" className="w-full">
                Voltar para a Página Inicial
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full">
                Acessar Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}