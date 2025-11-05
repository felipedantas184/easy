import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const storageService = {
  // Upload de imagem
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      throw new Error('Falha no upload da imagem');
    }
  },

  // Deletar imagem
  async deleteImage(url: string): Promise<void> {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw new Error('Falha ao deletar imagem');
    }
  },

  // Upload múltiplo de imagens
  async uploadMultipleImages(files: File[], basePath: string): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const extension = file.name.split('.').pop();
      const filename = `image_${Date.now()}_${index}.${extension}`;
      const path = `${basePath}/${filename}`;
      return this.uploadImage(file, path);
    });

    return Promise.all(uploadPromises);
  },
};