class PolyHelperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolyHelperError';
  }

  override toString() {
    return this.message;
  }
}

export default PolyHelperError;
