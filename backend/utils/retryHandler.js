/**
 * Retry utility with exponential backoff
 */
class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableErrors = options.retryableErrors || [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ESOCKETTIMEDOUT',
      'EAI_AGAIN',
      'RATE_LIMIT',
      'TWILIO_ERROR',
    ];
  }

  /**
   * Execute a function with retry on failure
   * @param {Function} fn - Async function to execute
   * @param {string} operation - Operation name for logging
   * @param {object} context - Context data for logging
   * @returns {Promise} - Result of fn
   */
  async execute(fn, operation = 'operation', context = {}) {
    let lastError;
    let delay = this.initialDelay;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isRetryable = this._isRetryable(error);

        if (attempt >= this.maxRetries || !isRetryable) {
          break;
        }

        const sleepTime = Math.min(delay, this.maxDelay);
        await this._sleep(sleepTime);
        delay *= this.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Check if error should be retried
   */
  _isRetryable(error) {
    const errorCode = error.code || error.statusCode || error.type;
    const errorMessage = error.message || '';

    // Check explicit retryable errors
    if (errorCode && this.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for network errors
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return true;
    }

    // Check for rate limiting
    if (error.statusCode === 429) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RetryHandler };
