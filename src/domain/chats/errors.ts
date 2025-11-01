export class ChatsServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ChatsServiceError';
    this.status = status;
  }
}
