
export type ModelLifecycleState = 'EM_TREINO' | 'APROVADO' | 'EM_PRODUCAO' | 'DESATIVADO'

export interface IAICatalogEntity {
  id: string
  modelName: string
  version: string
  datasetVersion: string
  testedAccuracy: number
  state: ModelLifecycleState
  author: string
  runtimeType: 'ONNX_RUNTIME' | 'TENSOR_FLOW_LITE'
  createdAt: string
  activatedAt?: string
}

export class AICatalogModel {
  private static catalogStore = new Map<string, IAICatalogEntity>()

  static register(entity: Omit<IAICatalogEntity, 'createdAt'>): IAICatalogEntity {
    const record: IAICatalogEntity = {
      ...entity,
      createdAt: new Date().toISOString()
    }
    this.catalogStore.set(record.id, record)
    return record
  }

  static findById(id: string): IAICatalogEntity | undefined {
    return this.catalogStore.get(id)
  }

  static findActiveProductionModel(): IAICatalogEntity | undefined {
    for (const model of this.catalogStore.values()) {
      if (model.state === 'EM_PRODUCAO') {
        return model
      }
    }
    return undefined
  }

  static updateLifecycleState(id: string, nextState: ModelLifecycleState): IAICatalogEntity {
    const current = this.catalogStore.get(id)
    if (!current) {
      throw new Error(`Modelo ${id} não registado no catálogo.`)
    }

    if (current.state === 'EM_PRODUCAO' && nextState === 'EM_TREINO') {
      throw new Error('Violação de RN-001.4: Proibido rebaixar diretamente modelos em produção para treino.')
    }

    current.state = nextState
    if (nextState === 'EM_PRODUCAO') {
      current.activatedAt = new Date().toISOString()
    }

    this.catalogStore.set(id, current)
    return current
  }

  static listAll(): IAICatalogEntity[] {
    return Array.from(this.catalogStore.values())
  }
}