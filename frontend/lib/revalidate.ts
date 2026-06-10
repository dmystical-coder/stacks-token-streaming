// Lightweight cross-tree revalidation signal. Data hooks register a silent
// refetch; the chain-events socket fires triggerRevalidate() the moment a
// transaction for the user's address is confirmed, so the whole UI updates
// without a manual refresh.

type Listener = () => void;

const listeners = new Set<Listener>();

export function onRevalidate(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function triggerRevalidate(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* a failing listener must not block the others */
    }
  });
}
