import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Adicionar Novo Produto</h1>
        <p className="text-gray-600 mt-1">
          Preencha as informações do novo produto
        </p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <ProductForm />
      </div>
    </div>
  );
}