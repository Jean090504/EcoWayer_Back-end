
export interface IDatasetRecord {
  id: string
  featureHash: string
  category: string
  condition: string
}

export interface ISplitDataset {
  train: IDatasetRecord[]      // 70% para a IA aprender 
  validation: IDatasetRecord[] // 15% para ajustar durante o treino 
  test: IDatasetRecord[]       // 15% para a prova final com dados inéditos
}

export class RetrainingManagerService {
  private static readonly PASSING_ACCURACY = 0.85      // 85% mínimo comprovado
  private static readonly MAX_DISCORDANCE_RATIO = 0.15 // 15% máximo de correções manuais em 24h

  /**
   * Separação automática dos dados em 70% treino, 15% validação e 15% teste cego
   */
  partitionDataset(records: IDatasetRecord[]): ISplitDataset {
    if (records.length === 0) {
      return { train: [], validation: [], test: [] }
    }

    // Ordenação consistente por hash para garantir reprodutibilidade
    const sorted = [...records].sort((a, b) => a.featureHash.localeCompare(b.featureHash))
    const total = sorted.length

    const trainEnd = Math.floor(total * 0.70)
    const validationEnd = trainEnd + Math.floor(total * 0.15)

    return {
      train: sorted.slice(0, trainEnd),
      validation: sorted.slice(trainEnd, validationEnd),
      test: sorted.slice(validationEnd)
    }
  }

  /**
   *  Interrupção imediata do treino caso a IA comece a memorizar exemplos específicos, detectado por aumento consecutivo do erro de validação
   */
  evaluateEarlyStopping(validationLossHistory: number[]): { shouldHalt: boolean; reason?: string } {
    if (validationLossHistory.length < 3) {
      return { shouldHalt: false }
    }

    const currentLoss = validationLossHistory[validationLossHistory.length - 1]
    const prevLoss = validationLossHistory[validationLossHistory.length - 2]
    const olderLoss = validationLossHistory[validationLossHistory.length - 3]

    // Se o erro de validação aumentar por duas rodadas seguidas, o treino é interrompido
    if (currentLoss > prevLoss && prevLoss > olderLoss) {
      return {
        shouldHalt: true,
        reason: 'Parada Automática de Segurança: Detecção de memorização de dados específicos.'
      }
    }

    return { shouldHalt: false }
  }

  /**
   * Validação da nota técnica de corte de 85% para autorização de aprovação
   */
  validateForRelease(measuredAccuracy: number): { isEligible: boolean; justification: string } {
    if (measuredAccuracy < RetrainingManagerService.PASSING_ACCURACY) {
      return {
        isEligible: false,
        justification: `Nota de corte não atingida: ${(measuredAccuracy * 100).toFixed(1)}% obtido (mínimo exigido: 85%).`
      }
    }

    return {
      isEligible: true,
      justification: 'Aprovação técnica concedida. Necessita de autorização manual do Administrador no painel.'
    }
  }

  /**
   * Avaliação de contingência para reversão imediata à versão anterior do modelo caso a taxa de discordância humana ultrapasse 15% em 24h
   * @param totalEvaluations Total de avaliações humanas realizadas nas últimas 24h
   * @param adminOverrides Total de correções manuais feitas por administradores nas últimas 24h
   * @returns { triggerRollback: boolean } Indica se a reversão deve ser acionada
   */
  verifyRollbackEmergency(totalEvaluations: number, adminOverrides: number): { triggerRollback: boolean } {
    if (totalEvaluations === 0) {
      return { triggerRollback: false }
    }

    const discordanceRate = adminOverrides / totalEvaluations
    return {
      triggerRollback: discordanceRate > RetrainingManagerService.MAX_DISCORDANCE_RATIO
    }
  }
}