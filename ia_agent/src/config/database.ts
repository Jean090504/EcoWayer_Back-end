export const database = {
  connected: false,
  async connect(): Promise<void> {
    this.connected = true;
    console.log('Database connection initialized.');
  },
  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('Database connection closed.');
  },
};
