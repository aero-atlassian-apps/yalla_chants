
import { fetchWithTimeout } from '../fetchWithTimeout';

describe('Import smoke tests', () => {
  it('fetchWithTimeout exists', () => {
    expect(typeof fetchWithTimeout).toBe('function');
  });
});
