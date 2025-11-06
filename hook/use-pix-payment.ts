import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { PixGenerator } from '@/lib/pix/pix-generator';
import { QRCodeGenerator } from '@/lib/pix/qr-code-generator';

interface UsePixPaymentProps {
  store: Store;
  amount: number;
  orderId: string;
  expirationMinutes?: number;
}

export function usePixPayment({ 
  store, 
  amount, 
  orderId, 
  expirationMinutes = 30 
}: UsePixPaymentProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');
  const [payload, setPayload] = useState<string>('');
  const [expiration, setExpiration] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generatePixPayment();
  }, [store, amount, orderId]);

  const generatePixPayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Buscar chave PIX ativa da loja
      const activePixKey = store.contact.pixKeys?.find(key => key.isActive);
      
      if (!activePixKey) {
        throw new Error('Loja não possui chave PIX configurada');
      }

      // Gerar dados do pagamento
      const transactionId = PixGenerator.generateTransactionId();
      const expirationDate = new Date(Date.now() + expirationMinutes * 60 * 1000);

      const paymentData = {
        storeName: store.name,
        pixKey: activePixKey.key,
        amount: amount,
        transactionId: transactionId,
        description: `Pedido ${orderId}`,
      };

      // Gerar payload PIX
      const pixPayload = PixGenerator.generatePayload(paymentData);
      
      // Gerar QR Code
      const qrCodeBase64 = await QRCodeGenerator.generateQRCode(pixPayload);
      
      // Gerar código copiável
      const copyableCode = QRCodeGenerator.formatCopyableCode(pixPayload);

      setPayload(pixPayload);
      setQrCode(qrCodeBase64);
      setPixCode(copyableCode);
      setExpiration(expirationDate);

    } catch (err) {
      console.error('Erro ao gerar pagamento PIX:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      return true;
    } catch (err) {
      console.error('Erro ao copiar código PIX:', err);
      return false;
    }
  };

  const getTimeRemaining = (): { minutes: number; seconds: number } => {
    if (!expiration) return { minutes: 0, seconds: 0 };

    const now = new Date();
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) return { minutes: 0, seconds: 0 };

    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { minutes, seconds };
  };

  const isExpired = (): boolean => {
    return getTimeRemaining().minutes <= 0 && getTimeRemaining().seconds <= 0;
  };

  return {
    qrCode,
    pixCode,
    payload,
    expiration,
    loading,
    error,
    copyToClipboard,
    getTimeRemaining,
    isExpired,
    regenerate: generatePixPayment,
  };
}