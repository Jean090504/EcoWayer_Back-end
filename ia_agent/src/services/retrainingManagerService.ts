export class RetrainingManagerService {
  private batch: string[] = [];

  public addCorrection(item: string): void {
    this.batch.push(item);
  }

  public flush(): string[] {
    const snapshot = [...this.batch];
    this.batch = [];
    return snapshot;
  }

  public getPendingCount(): number {
    return this.batch.length;
  }
}
