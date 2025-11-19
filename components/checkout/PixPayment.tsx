'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Check, Clock, AlertCircle, Info, Loader2, Smartphone } from 'lucide-react';
import { usePixPayment } from '@/hook/use-pix-payment';
import { formatPrice } from '@/lib/utils/helpers';

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
    {/* ✅ HEADER SIMPLIFICADO */}
    <div className="text-center mb-2">
      <p className="text-gray-600">
        Escaneie o QR Code ou copie o código PIX
      </p>
    </div>

    {/* ✅ CONTADOR DE EXPIRAÇÃO OTIMIZADO */}
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="text-white" size={18} />
          </div>
          <div>
            <p className="font-semibold text-orange-900 text-sm">
              QR Code expira em:
            </p>
            <p className="text-orange-700 text-xs">
              Complete o pagamento antes do expirar
            </p>
          </div>
        </div>
        
        <div className="bg-white border border-orange-300 rounded-lg px-4 py-2">
          <span className="text-orange-900 font-mono text-xl font-bold">
            {formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}
          </span>
        </div>
      </div>
      
      {isExpired() && (
        <div className="mt-3 text-center">
          <Button 
            onClick={regenerate} 
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RefreshCw size={16} className="mr-2" />
            Gerar Novo QR Code
          </Button>
        </div>
      )}
    </div>

    {/* ✅ QR CODE SECTION - Design Moderno */}
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 shadow-sm">
        {qrCode ? (
          <img
            src={qrCode}
            alt="QR Code PIX"
            className="w-56 h-56 object-contain"
          />
        ) : (
          <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Gerando QR Code...</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center max-w-sm">
        Abra seu app de banco, escaneie o QR Code ou cole o código PIX abaixo
      </p>
    </div>

    {/* ✅ CÓDIGO PIX COPIÁVEL - Design Melhorado */}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          PIX Copia e Cola
        </label>
        <Button
          onClick={handleCopyCode}
          variant="outline"
          size="sm"
          disabled={copied}
          className={copied ? 'bg-green-50 border-green-200 text-green-700' : ''}
        >
          {copied ? (
            <>
              <Check size={16} className="mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy size={16} className="mr-2" />
              Copiar Código
            </>
          )}
        </Button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-700">
        <code className="text-sm font-mono break-all select-all leading-relaxed">
          {pixCode}
        </code>
      </div>
    </div>

    {/* ✅ INSTRUÇÕES INTERATIVAS */}
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
      <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
        <Smartphone size={18} className="mr-2" />
        Como pagar com PIX
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <p className="text-blue-800">Abra o app do seu banco</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <p className="text-blue-800">Acesse a área PIX</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <p className="text-blue-800">Escaneie o QR Code acima</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <p className="text-blue-800">
              Confirme o valor de <strong>{formatPrice(amount)}</strong>
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">5</span>
            </div>
            <p className="text-blue-800">Autorize o pagamento</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">6</span>
            </div>
            <p className="text-blue-800">Aguarde a confirmação</p>
          </div>
        </div>
      </div>
    </div>

    {/* ✅ INFORMAÇÕES DA TRANSFERÊNCIA */}
    <div className="border-t pt-6">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Info size={18} className="mr-2 text-gray-600" />
        Informações da Transferência
      </h4>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Beneficiário:</span>
          <span className="font-medium text-gray-900">{store.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Valor:</span>
          <span className="font-medium text-gray-900">{formatPrice(amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Identificador:</span>
          <span className="font-medium text-gray-900">Pedido #{orderId}</span>
        </div>
      </div>
    </div>
  </div>
);
}