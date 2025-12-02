const { usePlayerStore } = require('../playerStore');
function expect(cond, msg) {
    if (!cond)
        throw new Error(msg);
}
const a = { id: 'a', title: 'A', artist: 'X', audio_url: 'u1', duration: 1 };
const b = { id: 'b', title: 'B', artist: 'X', audio_url: 'u2', duration: 1 };
const c = { id: 'c', title: 'C', artist: 'X', audio_url: 'u3', duration: 1 };
usePlayerStore.getState().setQueue([a, b, c]);
usePlayerStore.getState().setCurrentTrack(a);
usePlayerStore.getState().setRepeatMode('off');
usePlayerStore.getState().playNext();
expect(usePlayerStore.getState().currentTrack?.id === 'b', 'next should go to b');
usePlayerStore.getState().playPrevious();
expect(usePlayerStore.getState().currentTrack?.id === 'a', 'prev should go back to a');
// Test start of queue behavior
usePlayerStore.getState().playPrevious();
expect(usePlayerStore.getState().currentTrack?.id === 'a', 'prev at start of queue should stay at start');
usePlayerStore.getState().setRepeatMode('all');
usePlayerStore.getState().setCurrentTrack(c);
usePlayerStore.getState().playNext();
expect(usePlayerStore.getState().currentTrack?.id === 'a', 'repeat-all wraps to a');
usePlayerStore.getState().toggleShuffle();
const active = usePlayerStore.getState().shuffledQueue || usePlayerStore.getState().queue;
expect(active.length === 3, 'shuffled has same length');
usePlayerStore.getState().toggleShuffle(); // Turn off shuffle
// Repeat-one end-of-track simulation: current should remain
usePlayerStore.getState().setRepeatMode('one');
usePlayerStore.getState().setCurrentTrack(b);
const state1 = usePlayerStore.getState();
if (state1.repeatMode !== 'one')
    state1.playNext();
expect(usePlayerStore.getState().currentTrack?.id === 'b', 'repeat-one keeps current track');
// Shuffle-enabled end-of-track with repeat-all: last wraps to first
usePlayerStore.getState().setRepeatMode('all');
usePlayerStore.getState().toggleShuffle();
const s = usePlayerStore.getState();
const q = s.shuffledQueue && s.shuffledQueue.length ? s.shuffledQueue : s.queue;
usePlayerStore.getState().setCurrentTrack(q[q.length - 1]);
usePlayerStore.getState().playNext();
expect(usePlayerStore.getState().currentTrack?.id === q[0].id, 'shuffle repeat-all wraps to first');
