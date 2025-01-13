export function debounce(fn: () => void, delay = 1000) {
  let timeout: number | undefined;
  const debounced = () => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      timeout = undefined;
      fn();
    }, delay);
  };
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    fn();
  };
  return debounced;
}
