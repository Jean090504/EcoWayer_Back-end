export class LgpdSanitizerService {
  public sanitize(input: string): string {
    return input
      .replace(/\b\d{11}\b/g, '[CPF]')
      .replace(/\b\d{10,11}\b/g, '[TELEFONE]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]')
      .replace(/gps[:=]?\s*[-]?\d+\.\d+/gi, 'gps=[REMOVIDO]');
  }
}
