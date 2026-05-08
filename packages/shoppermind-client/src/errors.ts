export class ShopperMindApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ShopperMindApiError';
    this.status = status;
    this.body = body;
  }
}

export class ShopperMindAuthError extends ShopperMindApiError {
  constructor(body: unknown) {
    super(401, 'unauthorized', body);
    this.name = 'ShopperMindAuthError';
  }
}

export class ShopperMindValidationError extends ShopperMindApiError {
  constructor(body: unknown) {
    super(400, 'validation_error', body);
    this.name = 'ShopperMindValidationError';
  }
}

export class ShopperMindNetworkError extends Error {
  cause: unknown;
  constructor(cause: unknown) {
    super('network_error');
    this.name = 'ShopperMindNetworkError';
    this.cause = cause;
  }
}
