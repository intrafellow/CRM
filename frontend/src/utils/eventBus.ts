export type StoreKey = 'deals' | 'contacts';
const EVT = 'dataset:updated';

export function broadcastStoreUpdate(key: StoreKey) {
  const ev = new CustomEvent(EVT, { detail: { key } });
  window.dispatchEvent(ev);
}

export function onStoreUpdate(cb: (key: StoreKey)=>void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent<{key: StoreKey}>;
    if (ce?.detail?.key) cb(ce.detail.key);
  };
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
