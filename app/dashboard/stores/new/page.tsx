'use client';
import { StoreForm } from '@/components/admin/StoreForm';

export default function NewStorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Criar Nova Loja</h1>
        <p className="text-gray-600 mt-1">
          Configure sua nova loja virtual em poucos minutos
        </p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <StoreForm />
      </div>
    </div>
  );
}