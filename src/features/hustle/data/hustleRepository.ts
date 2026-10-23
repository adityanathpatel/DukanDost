import { db, MeriDukaanDatabase } from '@/data/db';
import { DukanInvoice, SavedProject, HustleToolType } from '../types';

export function generateHustleId(prefix: string = 'inv'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class HustleRepository {
  private database: MeriDukaanDatabase;

  constructor(customDb?: MeriDukaanDatabase) {
    this.database = customDb || db;
  }

  // --- Invoices ---

  async saveInvoice(invoice: Omit<DukanInvoice, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<DukanInvoice> {
    const now = Date.now();
    const invoiceId = invoice.id || generateHustleId('inv');

    const record: DukanInvoice = {
      ...invoice,
      id: invoiceId,
      createdAt: invoice.createdAt || now,
      updatedAt: now,
    };

    await this.database.invoices.put(record);
    return record;
  }

  async getInvoice(id: string): Promise<DukanInvoice | undefined> {
    return this.database.invoices.get(id);
  }

  async listInvoices(): Promise<DukanInvoice[]> {
    const list = await this.database.invoices.toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.database.invoices.delete(id);
  }

  async updateInvoiceStatus(id: string, status: DukanInvoice['status']): Promise<void> {
    await this.database.invoices.update(id, { status, updatedAt: Date.now() });
  }

  // --- Saved Projects / Drafts ---

  async saveProject(project: Omit<SavedProject, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<SavedProject> {
    const now = Date.now();
    const projectId = project.id || generateHustleId('proj');

    const record: SavedProject = {
      ...project,
      id: projectId,
      createdAt: project.createdAt || now,
      updatedAt: now,
    };

    await this.database.savedProjects.put(record);
    return record;
  }

  async listProjects(toolType?: HustleToolType): Promise<SavedProject[]> {
    let list = await this.database.savedProjects.toArray();
    if (toolType) {
      list = list.filter((p) => p.toolType === toolType);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteProject(id: string): Promise<void> {
    await this.database.savedProjects.delete(id);
  }

  async toggleFavoriteProject(id: string): Promise<boolean> {
    const proj = await this.database.savedProjects.get(id);
    if (!proj) return false;
    const nextState = !proj.isFavorite;
    await this.database.savedProjects.update(id, { isFavorite: nextState, updatedAt: Date.now() });
    return nextState;
  }
}

export const hustleRepository = new HustleRepository();
