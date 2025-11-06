import QRCode from "qrcode";

export class QRCodeGenerator {
  /**
   * Gera o QR Code em Base64 (sem usar fetch)
   */
  static async generateQRCode(payload: string): Promise<string> {
    try {
      // Gera o QR Code diretamente em base64
      const qrCodeBase64 = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 1,
      });
      return qrCodeBase64;
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      throw new Error("Falha ao gerar QR Code");
    }
  }

  /**
   * Gera código PIX copiável (formato legível)
   */
  static formatCopyableCode(payload: string): string {
    return payload.match(/.{1,4}/g)?.join(" ") || payload;
  }
}
