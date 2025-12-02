const { fetchWithTimeout } = require('../../services/fetchWithTimeout');
// const { playlistService } = require('../../services/playlistService')
// const { jamService } = require('../../services/jamService')
function expect(cond, msg) { if (!cond)
    throw new Error(msg); }
expect(typeof fetchWithTimeout === 'function', 'fetchWithTimeout exists');
// expect(typeof playlistService === 'object', 'playlistService object exported')
// expect(typeof jamService === 'object', 'jamService object exported')
console.log('Imports smoke tests OK');
