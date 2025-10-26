import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';
// Minimal local type to map DB rows without depending on generated client types at edit time
type DBMarketplaceItem = {
  id: string;
  name: string;
  type: string;
  developerId: string;
  price: number;
  downloads: number;
  rating: number | null;
};

export interface MarketplaceItem {
  id: string;
  name: string;
  type: 'plugin' | 'theme' | 'integration';
  developerId: string;
  price: number;
  downloads: number;
  rating: number; // 0-5
}

export class MarketplaceManager extends EventEmitter {
  constructor() {
    super();
  }

  public async listAll(): Promise<MarketplaceItem[]> {
    const rows = await prisma.marketplaceItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: DBMarketplaceItem) => ({
      id: r.id,
      name: r.name,
      type: r.type as MarketplaceItem['type'],
      developerId: r.developerId,
      price: r.price,
      downloads: r.downloads,
      rating: typeof r.rating === 'number' ? r.rating : 0,
    }));
  }

  public async purchaseItem(userId: string, itemId: string): Promise<boolean> {
    const item = await prisma.marketplaceItem.findUnique({ where: { id: itemId } });
    if (!item) {
      logger.warn(`Attempt to purchase missing item ${itemId}`);
      return false;
    }
    await prisma.$transaction([
      prisma.marketplacePurchase.create({
        data: {
          userId,
          itemId,
          pricePaid: item.price,
        },
      }),
      prisma.marketplaceItem.update({
        where: { id: itemId },
        data: { downloads: { increment: 1 } },
      }),
    ]);
    logger.info(`Purchase of "${item.name}" by user ${userId} successful.`);
    this.emit('itemPurchased', { userId, item: {
      id: item.id,
      name: item.name,
      type: item.type as MarketplaceItem['type'],
      developerId: item.developerId,
      price: item.price,
      downloads: item.downloads + 1,
      rating: typeof item.rating === 'number' ? item.rating : 0,
    } });
    return true;
  }

  public async submitItem(item: MarketplaceItem): Promise<MarketplaceItem> {
    // Basic validation
    if (!item.name) throw new Error('name is required');
    if (!item.type) throw new Error('type is required');
    if (!item.developerId) throw new Error('developerId is required');
    const price = Math.max(0, Number(item.price ?? 0));

    const created = await prisma.marketplaceItem.create({
      data: {
        name: item.name,
        type: item.type as any,
        developerId: item.developerId,
        price,
        downloads: item.downloads ?? 0,
        rating: item.rating ?? 0,
      },
    });

    const out: MarketplaceItem = {
      id: created.id,
      name: created.name,
      type: created.type as MarketplaceItem['type'],
      developerId: created.developerId,
      price: created.price,
      downloads: created.downloads,
      rating: typeof created.rating === 'number' ? created.rating : 0,
    };
    logger.info(`New marketplace item submitted: ${out.name} (${out.type})`);
    this.emit('newItemSubmitted', out);
    return out;
  }

  public async getItemsByDeveloper(developerId: string): Promise<MarketplaceItem[]> {
    const rows = await prisma.marketplaceItem.findMany({ where: { developerId } });
    return rows.map((r: DBMarketplaceItem) => ({
      id: r.id,
      name: r.name,
      type: r.type as MarketplaceItem['type'],
      developerId: r.developerId,
      price: r.price,
      downloads: r.downloads,
      rating: typeof r.rating === 'number' ? r.rating : 0,
    }));
  }
}

export const marketplaceManager = new MarketplaceManager();
