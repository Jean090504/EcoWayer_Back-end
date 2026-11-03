
export interface ISanitizationResult {
  sanitizedText: string
  detectedPiiCategories: string[]
  hasSensitiveInformation: boolean
}

export class LgpdSanitizerService {
  // Regex compiladas para identificar formatos brasileiros de telemóveis/WhatsApp, CPFs e cartões bancários
  private static readonly REGEX_PHONE = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?(?:9\d{4}|\d{4})[\s.-]?\d{4}/g
  private static readonly REGEX_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g
  private static readonly REGEX_CREDIT_CARD = /\b(?:\d{4}[ -]?){3}\d{4}\b/g
  
  private static readonly EXIF_APP1_MARKER = Buffer.from([0xFF, 0xE1])

  /**
   * Remove números de telefone, CPFs e dados de cartões de conversas e descrições
   */
  static sanitizeChatMessage(rawText: string): ISanitizationResult {
    const detected: string[] = []
    let cleaned = rawText

    if (this.REGEX_PHONE.test(cleaned)) {
      detected.push('PHONE_NUMBER')
      cleaned = cleaned.replace(this.REGEX_PHONE, '[TELEFONE OCULTADO PELO SISTEMA]')
    }

    if (this.REGEX_CPF.test(cleaned)) {
      detected.push('CPF')
      cleaned = cleaned.replace(this.REGEX_CPF, '[CPF OCULTADO PELO SISTEMA]')
    }

    if (this.REGEX_CREDIT_CARD.test(cleaned)) {
      detected.push('CREDIT_CARD')
      cleaned = cleaned.replace(this.REGEX_CREDIT_CARD, '[DADOS BANCÁRIOS OCULTADOS]')
    }

    return {
      sanitizedText: cleaned,
      detectedPiiCategories: detected,
      hasSensitiveInformation: detected.length > 0
    }
  }

  /**
   * Elimina metadados ocultos de localização GPS de fotografias antes do armazenamento
   */
  static stripGeolocAndExif(imageBuffer: Buffer): Buffer {
    const markerIndex = imageBuffer.indexOf(this.EXIF_APP1_MARKER)
    if (markerIndex === -1) {
      return imageBuffer
    }

    // Leitura do comprimento do segmento
    const segmentLength = imageBuffer.readUInt16BE(markerIndex + 2)
    const cleanBuffer = Buffer.concat([
      imageBuffer.subarray(0, markerIndex),
      imageBuffer.subarray(markerIndex + 2 + segmentLength)
    ])

    return cleanBuffer
  }
}