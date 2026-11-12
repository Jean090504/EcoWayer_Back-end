
export interface ImageValidationResult {
  isValid: boolean
  detectedMime?: string
  errorReason?: string
  fileSizeBytes: number
}

export class ImageUploadValidatorModel {
  // Limite estipuladp pelos ficheiros até 10 MB
  public static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10.485.760 bytes

  // Dimensão mínima indispensável para leitura segura dos cabeçalhos binários mais longos 
  private static readonly MIN_BUFFER_HEADER_SIZE = 12

  /**
   * Executa a bateria completa de validações técnicas sobre o buffer de imagem recebido
   */
  static validate(buffer: Buffer): ImageValidationResult {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      return {
        isValid: false,
        fileSizeBytes: 0,
        errorReason: 'Ficheiro de imagem inexistente, vazio ou corrompido.'
      }
    }

    const currentSize = buffer.length

    if (currentSize > this.MAX_FILE_SIZE_BYTES) {
      const sizeInMb = (currentSize / (1024 * 1024)).toFixed(2)
      return {
        isValid: false,
        fileSizeBytes: currentSize,
        errorReason: `O ficheiro excede o tamanho máximo permitido de 10 MB. Tamanho recebido: ${sizeInMb} MB.`
      }
    }

    if (currentSize < this.MIN_BUFFER_HEADER_SIZE) {
      return {
        isValid: false,
        fileSizeBytes: currentSize,
        errorReason: 'Ficheiro corrompido: cabeçalho binário incompleto para identificação de formato.'
      }
    }

    const mime = this.detectMimeTypeByMagicNumbers(buffer)

    if (!mime) {
      return {
        isValid: false,
        fileSizeBytes: currentSize,
        errorReason: 'Formato de imagem não suportado. Apenas ficheiros genuínos JPEG, PNG e WEBP são aceites.'
      }
    }

    return {
      isValid: true,
      detectedMime: mime,
      fileSizeBytes: currentSize
    }
  }

  /**
   * Identifica o MIME Type real através da assinatura binária única do formato
   */
  private static detectMimeTypeByMagicNumbers(buffer: Buffer): string | undefined {
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
    if (isJpeg) {
      return 'image/jpeg'
    }

    // PNG: Assinatura canónica de 8 bytes
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A

    if (isPng) {
      return 'image/png'
    }

    // WEBP: Contentor RIFF com assinatura 'WEBP'
    const isRiffContainer = buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    const isWebpSignature = buffer.subarray(8, 12).toString('ascii') === 'WEBP'

    if (isRiffContainer && isWebpSignature) {
      return 'image/webp'
    }

    return undefined
  }
}