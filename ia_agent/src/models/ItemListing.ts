export type ListingStatus = 'pending' | 'approved' | 'rejected';

export interface ItemListing {
  id: string;
  title: string;
  description: string;
  material: string;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const createItemListing = (input: Partial<ItemListing> = {}): ItemListing => ({
  id: input.id ?? 'listing_001',
  title: input.title ?? 'Material reciclável',
  description: input.description ?? 'Descrição do anúncio.',
  material: input.material ?? 'papel',
  status: input.status ?? 'pending',
  createdAt: input.createdAt ?? new Date(),
  updatedAt: input.updatedAt ?? new Date(),
});
