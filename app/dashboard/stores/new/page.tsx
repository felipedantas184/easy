'use client';
import { StoreForm } from '@/components/admin/StoreForm';

export default function NewStorePage() {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white rounded-lg border p-4 lg:p-6">
        <StoreForm />
      </div>
    </div>
  );
}