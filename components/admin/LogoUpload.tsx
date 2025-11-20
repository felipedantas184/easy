'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Building } from 'lucide-react';
import { storageService } from '@/lib/firebase/storage';
import { useAuth } from '@/contexts/auth-context';

interface LogoUploadProps {
  onLogoChange: (url: string | null) => void;
  existingLogo?: string;
}

export function LogoUpload({ onLogoChange, existingLogo = '' }: LogoUploadProps) {
  const { user } = useAuth();
  const [logo, setLogo] = useState<string>(existingLogo);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];

    // Validações
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Gerar path único para o logo
      const fileExtension = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExtension}`;
      const path = `stores/${user.id}/${fileName}`;

      // Fazer upload para Firebase Storage
      const downloadURL = await storageService.uploadImage(file, path);

      // Se já existia um logo, deletar o antigo
      if (logo && logo.includes('firebasestorage.googleapis.com')) {
        try {
          await storageService.deleteImage(logo);
        } catch (error) {
          console.warn('Não foi possível deletar o logo antigo:', error);
        }
      }

      setLogo(downloadURL);
      onLogoChange(downloadURL);

    } catch (error) {
      console.error('Erro no upload do logo:', error);
      alert('Erro ao fazer upload do logo. Tente novamente.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeLogo = async () => {
    if (!logo) return;

    try {
      // Tentar deletar do Storage se for uma URL do Firebase
      if (logo.includes('firebasestorage.googleapis.com')) {
        await storageService.deleteImageByUrl(logo); // ✅ USAR A NOVA FUNÇÃO
      }

      setLogo('');
      onLogoChange(null);
    } catch (error) {
      console.error('Erro ao deletar logo:', error);
      // Continuar mesmo se der erro no delete
      setLogo('');
      onLogoChange(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Preview do Logo */}
      {logo ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <img
              src={logo}
              alt="Logo da loja"
              className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg shadow-sm"
            />
            <button
              type="button"
              onClick={removeLogo}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              disabled={uploading}
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Logo atual •{' '}
            <button
              type="button"
              onClick={triggerFileInput}
              className="text-blue-600 hover:text-blue-700 underline"
              disabled={uploading}
            >
              Alterar
            </button>
          </p>
        </div>
      ) : (
        /* Área de Upload */
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {uploading ? 'Fazendo upload...' : 'Clique para adicionar logo'}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            PNG, JPG, SVG até 5MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Upload...' : 'Selecionar Logo'}
          </Button>
        </div>
      )}

      {/* Status do Upload */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Fazendo upload do logo...</span>
        </div>
      )}
    </div>
  );
}