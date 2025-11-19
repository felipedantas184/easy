'use client';
import { useState, useRef, useEffect } from 'react'; // ✅ ADICIONAR useEffect
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { storageService } from '@/lib/firebase/storage';
import { useAuth } from '@/contexts/auth-context';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
}

export function ImageUpload({
  onImagesChange,
  existingImages = [],
  maxImages = 10
}: ImageUploadProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ CORREÇÃO CRÍTICA: Sincronizar images com existingImages
  useEffect(() => {
    console.log('🔄 ImageUpload: Sincronizando existingImages', existingImages);
    setImages(existingImages);
  }, [existingImages]); // ✅ Executar sempre que existingImages mudar

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    // Verificar limite de imagens
    if (images.length + files.length > maxImages) {
      alert(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Fazer upload de cada imagem
      for (const file of Array.from(files)) {
        try {
          // Gerar path único para a imagem
          const fileExtension = file.name.split('.').pop();
          const fileName = `product-${uuidv4()}.${fileExtension}`;
          const path = `products/${user.id}/${fileName}`;

          // Fazer upload para Firebase Storage
          const downloadURL = await storageService.uploadImage(file, path);
          uploadedUrls.push(downloadURL);
        } catch (error) {
          console.error('Erro no upload da imagem:', error);
          alert(`Erro ao fazer upload de ${file.name}`);
        }
      }

      // Atualizar estado com novas URLs
      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      onImagesChange(updatedImages);

    } catch (error) {
      console.error('Erro geral no upload:', error);
      alert('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];

    try {
      // Tentar deletar do Storage se for uma URL do Firebase
      if (imageToRemove.includes('firebasestorage.googleapis.com')) {
        await storageService.deleteImage(imageToRemove);
      }

      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      // Continuar mesmo se der erro no delete
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Imagens atuais */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-10 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={url}
                alt={`Imagem do produto ${index + 1}`}
                className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Botão remover */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {uploading ? 'Fazendo upload...' : 'Clique para adicionar imagens'}
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, WEBP até 5MB cada
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={uploading}
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Upload...' : 'Selecionar Imagens'}
          </Button>
        </div>
      )}

      {/* Contador */}
      <p className="text-sm text-gray-500">
        {images.length} / {maxImages} imagens
        {uploading && ' (Fazendo upload...)'}
      </p>
    </div>
  );
}