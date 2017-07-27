export class Connection {
  public async query(q: string, v: any[]): Promise<any> { return Promise.resolve(); }
  public release(): void { return; }
}
