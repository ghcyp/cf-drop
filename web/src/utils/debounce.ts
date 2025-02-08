/**
 * make a debounced function. last args will apply
 */
export function debounce<T extends any[]>(fn: (...args: T) => void, delay = 1000) {
  let timeout: number | undefined;
  let finalArgs: T | undefined;

  const reset = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
      finalArgs = undefined;
    }
  };

  const flush = () => {
    if (!timeout) return;
    const args = finalArgs!;
    reset();
    return fn(...args);
  };

  const debounced = (...args: T) => {
    if (timeout) clearTimeout(timeout);
    finalArgs = args;
    timeout = window.setTimeout(flush, delay);
  };
  debounced.cancel = reset;
  debounced.flush = flush;
  return debounced;
}
