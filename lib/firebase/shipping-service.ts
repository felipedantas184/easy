// lib/firebase/shipping-service.ts
import { Store, ShippingOption, ShippingSettings } from '@/types/store';

export const shippingService = {
  /**
   * Calcular opções de frete disponíveis
   */
  async calculateShipping(
    storeSettings: ShippingSettings,
    cartTotal: number,
    destinationState: string,
    totalWeight: number = 0
  ): Promise<ShippingOption[]> {
    const options: ShippingOption[] = [];

    console.log('🚚 ShippingService: Calculando frete', {
      method: storeSettings.calculationMethod,
      cartTotal,
      destinationState,
      totalWeight
    });

    // ✅ FRETE GRÁTIS (se atingir o valor mínimo)
    if (storeSettings.freeShippingThreshold && cartTotal >= storeSettings.freeShippingThreshold) {
      options.push({
        id: 'free',
        name: 'Entrega Grátis',
        price: 0,
        deliveryDays: '7-14 dias úteis',
        description: 'Parabéns! Você ganhou frete grátis'
      });
    }

    // ✅ MÉTODO DE CÁLCULO PRINCIPAL
    switch (storeSettings.calculationMethod) {
      case 'fixed':
        options.push(...this.calculateFixedShipping(storeSettings));
        break;

      case 'regional_table':
        options.push(...this.calculateRegionalShipping(storeSettings, destinationState));
        break;

      case 'weight_based':
        options.push(...this.calculateWeightBasedShipping(storeSettings, totalWeight));
        break;

      case 'free':
        // Sempre frete grátis
        if (!options.find(opt => opt.id === 'free')) {
          options.push({
            id: 'free',
            name: 'Frete Grátis',
            price: 0,
            deliveryDays: '7-14 dias úteis'
          });
        }
        break;
    }

    // ✅ RETIRADA NA LOJA (sempre disponível se habilitado)
    if (storeSettings.pickupEnabled) {
      options.push({
        id: 'pickup',
        name: 'Retirada na Loja',
        price: 0,
        deliveryDays: 'Imediato',
        description: storeSettings.pickupMessage || 'Retire seu pedido quando quiser'
      });
    }

    // Ordenar por preço (mais barato primeiro)
    return options.sort((a, b) => a.price - b.price);
  },

  /**
   * Frete Fixo
   */
  calculateFixedShipping(settings: ShippingSettings): ShippingOption[] {
    if (!settings.fixedPrice) return [];

    return [{
      id: 'fixed',
      name: 'Entrega Padrão',
      price: settings.fixedPrice,
      deliveryDays: '5-10 dias úteis'
    }];
  },

  /**
   * Tabela Regional
   */
  calculateRegionalShipping(settings: ShippingSettings, destinationState: string): ShippingOption[] {
    if (!settings.regionalTable) return [];

    const region = settings.regionalTable.find(reg =>
      reg.states.includes(destinationState.toUpperCase())
    );

    if (region) {
      return [{
        id: `region_${region.id}`,
        name: `Entrega - ${region.name}`,
        price: region.price,
        deliveryDays: region.deliveryDays
      }];
    }

    // Fallback para frete fixo se região não encontrada
    return settings.fixedPrice ? [{
      id: 'fixed_fallback',
      name: 'Entrega Padrão',
      price: settings.fixedPrice,
      deliveryDays: '7-14 dias úteis'
    }] : [];
  },

  /**
   * Baseado em Peso
   */
  calculateWeightBasedShipping(settings: ShippingSettings, totalWeight: number): ShippingOption[] {
    if (!settings.weightBasedRates) return [];

    const rate = settings.weightBasedRates.find(r =>
      totalWeight >= r.minWeight && totalWeight <= r.maxWeight
    );

    if (rate) {
      return [{
        id: `weight_${rate.id}`,
        name: 'Entrega Padrão',
        price: rate.price,
        deliveryDays: '5-12 dias úteis'
      }];
    }

    return [];
  },

  /**
   * Obter configurações padrão para nova loja
   */
  getDefaultShippingSettings(): ShippingSettings {
    return {
      enabled: true,
      calculationMethod: 'fixed',
      freeShippingThreshold: 100,
      fixedPrice: 15.90,
      regionalTable: [
        {
          id: 'sul_sudeste',
          name: 'Sul e Sudeste',
          states: ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'],
          price: 12.90,
          deliveryDays: '3-7 dias úteis'
        },
        {
          id: 'centro_oeste',
          name: 'Centro-Oeste',
          states: ['DF', 'GO', 'MT', 'MS'],
          price: 18.90,
          deliveryDays: '5-10 dias úteis'
        },
        {
          id: 'norte_nordeste',
          name: 'Norte e Nordeste',
          states: ['AM', 'PA', 'CE', 'BA', 'PE', 'MA', 'RN', 'PB', 'AL', 'SE', 'PI', 'TO', 'AP', 'RR', 'AC', 'RO'],
          price: 24.90,
          deliveryDays: '7-14 dias úteis'
        }
      ],
      weightBasedRates: [
        {
          id: 'leve',
          minWeight: 0,
          maxWeight: 1,
          price: 12.90
        },
        {
          id: 'medio',
          minWeight: 1,
          maxWeight: 5,
          price: 18.90
        },
        {
          id: 'pesado',
          minWeight: 5,
          maxWeight: 20,
          price: 29.90
        }
      ],
      pickupEnabled: true,
      pickupMessage: 'Retire seu pedido em até 2 horas'
    };
  },

  /**
   * Validar configurações de frete
   */
  validateShippingSettings(settings: ShippingSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings.enabled) {
      return { isValid: true, errors: [] };
    }

    if (settings.calculationMethod === 'fixed' && !settings.fixedPrice) {
      errors.push('Preço fixo é obrigatório para cálculo de frete fixo');
    }

    if (settings.calculationMethod === 'regional_table' && (!settings.regionalTable || settings.regionalTable.length === 0)) {
      errors.push('Tabela regional é obrigatória para cálculo regional');
    }

    if (settings.calculationMethod === 'weight_based' && (!settings.weightBasedRates || settings.weightBasedRates.length === 0)) {
      errors.push('Tabela de peso é obrigatória para cálculo baseado em peso');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};