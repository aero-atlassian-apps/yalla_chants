import { useNetworkStore } from '../store/networkStore';

export const ensureOnline = () => {
  const { isOnline } = useNetworkStore.getState();
  if (!isOnline) {
    const err = new Error('Network unavailable');
    // throw a lightweight error for quick UI feedback
    throw err;
  }
};

