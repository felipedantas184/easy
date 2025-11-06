'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Check, Clock, AlertCircle } from 'lucide-react';
import { usePixPayment } from '@/hook/use-pix-payment';

interface PixPaymentProps {
  store: Store;
  amount: number;
  orderId: string;
}

export function PixPayment({ store, amount, orderId }: PixPaymentProps) {
  const {
    qrCode,
    pixCode,
    loading,
    error,
    copyToClipboard,
    getTimeRemaining,
    isExpired,
    regenerate,
  } = usePixPayment({
    store,
    amount,
    orderId,
    expirationMinutes: store.settings.pixSettings.expirationTime,
  });

  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  // Atualizar contador a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTimeRemaining]);

  const handleCopyCode = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-900">Gerando QR Code PIX...</p>
        <p className="text-gray-600">Aguarde um momento</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Erro ao gerar PIX
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={regenerate} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento via PIX
        </h3>
        <p className="text-gray-600">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      {/* Contador de Expiração */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="text-yellow-600" size={20} />
          <span className="text-yellow-800 font-medium">
            Este QR Code expira em:
          </span>
          <div className="bg-yellow-100 px-3 py-1 rounded-lg">
            <span className="text-yellow-900 font-mono text-lg">
              {formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}
            </span>
          </div>
        </div>
        
        {isExpired() && (
          <div className="mt-2 text-center">
            <Button onClick={regenerate} size="sm">
              <RefreshCw size={16} className="mr-2" />
              Gerar Novo QR Code
            </Button>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
          {qrCode ? (
            <img
              src={qrCode}
              alt="QR Code PIX"
              className="w-64 h-64 object-contain"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">QR Code não disponível</p>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 text-center max-w-md">
          Abra seu app de banco, escaneie o QR Code ou cole o código PIX abaixo
        </p>
      </div>

      {/* Código PIX Copiável */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Código PIX (copie e cole)
          </label>
          <Button
            onClick={handleCopyCode}
            variant="outline"
            size="sm"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <code className="text-sm font-mono text-gray-800 break-all select-all">
            {pixCode}
          </code>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">
          📱 Como pagar com PIX
        </h4>
        <ol className="text-sm text-blue-800 space-y-2">
          <li>1. Abra o app do seu banco</li>
          <li>2. Acesse a área PIX</li>
          <li>3. Escaneie o QR Code ou cole o código</li>
          <li>4. Confirme o pagamento de <strong>R$ {amount.toFixed(2)}</strong></li>
          <li>5. Aguarde a confirmação automática</li>
        </ol>
      </div>

      {/* Informações da Loja */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-2">Informações para Transferência</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Beneficiário:</strong> {store.name}</p>
          <p><strong>Valor:</strong> R$ {amount.toFixed(2)}</p>
          <p><strong>Identificador:</strong> Pedido {orderId}</p>
        </div>
      </div>
    </div>
  );
}