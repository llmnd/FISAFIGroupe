export class ERPOperationError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "ERPOperationError";
  }
}
