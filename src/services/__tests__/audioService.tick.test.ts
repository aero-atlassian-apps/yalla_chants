import { usePlayerStore } from '../../store/playerStore'
import { audioService } from '../../services/audioService'

function expect(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const a = { id: 'a', title: 'A', artist: 'X', audio_url: 'u1', duration: 1000 }
const b = { id: 'b', title: 'B', artist: 'X', audio_url: 'u2', duration: 1000 }
const c = { id: 'c', title: 'C', artist: 'X', audio_url: 'u3', duration: 1000 }

usePlayerStore.getState().setQueue([a, b, c])
usePlayerStore.getState().setCurrentTrack(b)
usePlayerStore.getState().setRepeatMode('one')
audioService.__test_onTick(1000, 1000, false)
expect(usePlayerStore.getState().currentTrack?.id === 'b', 'repeat-one stays on b')

usePlayerStore.getState().setRepeatMode('all')
usePlayerStore.getState().toggleShuffle()
const s: any = usePlayerStore.getState()
const active = s.shuffledQueue && s.shuffledQueue.length ? s.shuffledQueue : s.queue
usePlayerStore.getState().setCurrentTrack(active[active.length - 1])
audioService.__test_onTick(1000, 1000, false)
expect(usePlayerStore.getState().currentTrack?.id === active[0].id, 'repeat-all wraps under shuffle')
