export class Connection {
  // we need q & v arguments for the tests to work
  public async query(q: string, v: any[]): Promise<any> {
    return Promise.resolve([...v, q]);
  }
  public release(): void {
    return;
  }
}
