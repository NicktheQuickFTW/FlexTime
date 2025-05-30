export class FlextimeError extends Error {
  public code: string;
  public status?: number;
  public details?: any;

  constructor(message: string, code: string, status?: number, details?: any) {
    super(message);
    this.name = 'FlextimeError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlextimeError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details
    };
  }
}