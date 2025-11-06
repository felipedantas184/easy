/**
 * Serviço para geração de payload PIX dinâmico
 * Baseado no padrão BR Code do Banco Central
 */

export interface PixPayload {
  payload: string;
  qrCode: string; // Base64 do QR Code
  textCode: string; // Código PIX copiável
  expiration: Date;
  transactionId: string;
}

export interface PixPaymentData {
  storeName: string;
  pixKey: string;
  amount: number;
  transactionId: string;
  description?: string;
}

export class PixGenerator {
  /**
   * Gera payload PIX no formato BR Code
   */
  static generatePayload(data: PixPaymentData): string {
    const { storeName, pixKey, amount, transactionId, description } = data;

    // Formatar valor para PIX (sem separador decimal)
    const formattedAmount = amount.toFixed(2);

    // Montar payload no padrão EMV
    const payload = [
      this.buildEMVField('00', '01'), // Payload Format Indicator
      this.buildEMVField('01', '12'), // Point of Initiation Method (dinâmico)
      this.buildEMVField('26', [
        this.buildEMVField('00', 'br.gov.bcb.pix'), // GUI
        this.buildEMVField('01', pixKey), // Chave PIX
      ]),
      this.buildEMVField('52', '0000'), // Merchant Category Code
      this.buildEMVField('53', '986'), // Transaction Currency (BRL)
      this.buildEMVField('54', formattedAmount), // Transaction Amount
      this.buildEMVField('58', 'BR'), // Country Code
      this.buildEMVField('59', this.truncateString(storeName, 25)), // Merchant Name
      this.buildEMVField('60', this.truncateString('Easy Platform', 15)), // Merchant City
      this.buildEMVField('62', [
        this.buildEMVField('05', transactionId), // Reference ID
      ]),
    ].join('');

    // Adicionar CRC16
    const crc = this.calculateCRC16(payload + '6304');
    return payload + '6304' + crc;
  }

  /**
   * Construir campo EMV
   */
  private static buildEMVField(id: string, value: string | string[]): string {
    if (Array.isArray(value)) {
      value = value.join('');
    }

    const length = value.length.toString().padStart(2, '0');
    return id + length + value;
  }

  /**
   * Calcular CRC16 para PIX
   */
  private static calculateCRC16(data: string): string {
    let crc = 0xFFFF;

    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;

      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }

    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Truncar string para limite do PIX
   */
  private static truncateString(str: string, maxLength: number): string {
    return str.substring(0, maxLength).toUpperCase();
  }

  /**
   * Gerar ID único para transação
   */
  static generateTransactionId(): string {
    return 'EP' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}