import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 md:space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Adicionar Novo Produto
        </h1>

        <p className="text-gray-600 text-sm md:text-base">
          Preencha as informações essenciais para cadastrar seu produto.
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4 md:p-6">
        <ProductForm />
      </div>
    </div>
  );
}