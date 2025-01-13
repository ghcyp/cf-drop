export function isEqual(a: any, b: any) {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, keysA[i])) return false;
      if (!isEqual(a[keysA[i]], b[keysA[i]])) return false;
    }

    return true;
  }

  return false;
}