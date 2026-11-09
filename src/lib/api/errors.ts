/** Typed form of the backend error envelope `{code, message, fields}`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Field name to messages; feeds TanStack Form field errors. */
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Build from a failed response body; tolerates non-envelope bodies (proxy or network errors). */
  static from(status: number, body: unknown): ApiError {
    const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    const fields =
      b.fields && typeof b.fields === "object" ? (b.fields as Record<string, string[]>) : {};
    return new ApiError(
      status,
      typeof b.code === "string" ? b.code : "error",
      typeof b.message === "string" ? b.message : "İstek işlenemedi.",
      fields,
    );
  }
}
