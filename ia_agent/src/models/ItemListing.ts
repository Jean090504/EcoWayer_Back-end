
export type MaterialCategory = 'Vidro e Garrafas' | 'Plásticos e Polímeros' | 'Papel e Papelão' | 'Metais' | 'Eletrônicos e Baterias' | 'Não Identificado'
export type ItemConservationState = 'novo' | 'ótimo estado' | 'usado' | 'danificado'
export type ListingStatus = 'PUBLICADO' | 'PENDENTE_CONFERENCIA_HUMANA' | 'REJEITADO'

export interface IItemListingEntity {
  listingId: string
  userId: string
  title: string
  description: string
  category: MaterialCategory
  condition: ItemConservationState
  confidenceScore: number
  verifiedByAi: boolean
  status: ListingStatus
  systemNotes?: string
  createdAt: string
  updatedAt: string
}

export class ItemListing {
  private static listingsStore = new Map<string, IItemListingEntity>()

  static create(data: Omit<IItemListingEntity, 'createdAt' | 'updatedAt'>): IItemListingEntity {
    const now = new Date().toISOString()
    const listing: IItemListingEntity = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    this.listingsStore.set(listing.listingId, listing)
    return listing
  }

  static findById(listingId: string): IItemListingEntity | undefined {
    return this.listingsStore.get(listingId)
  }

  /**
   * Marcação de itens que falharam na IA para a fila de conferência humana
   */
  static flagForHumanReview(listingId: string, reason: string): IItemListingEntity {
    const item = this.listingsStore.get(listingId)
    if (!item) {
      throw new Error(`Anúncio ${listingId} não encontrado.`)
    }

    item.verifiedByAi = false
    item.status = 'PENDENTE_CONFERENCIA_HUMANA'
    item.systemNotes = `não verificado pela IA: ${reason}`
    item.updatedAt = new Date().toISOString()

    this.listingsStore.set(listingId, item)
    return item
  }

  static listPendingReview(): IItemListingEntity[] {
    return Array.from(this.listingsStore.values()).filter(
      item => item.status === 'PENDENTE_CONFERENCIA_HUMANA'
    )
  }
}