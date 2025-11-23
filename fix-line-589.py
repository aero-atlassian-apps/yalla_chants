import re

file_path = "node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 589 (0-indexed: 588)
if len(lines) > 588:
    # Replace originalItem with originalItem ?: Bundle() on line 589
    lines[588] = lines[588].replace(
        'musicService.tracks[musicService.getCurrentTrackIndex()].originalItem',
        'musicService.tracks[musicService.getCurrentTrackIndex()].originalItem ?: Bundle()'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Fixed line 589!")
print(f"Line 589 now: {lines[588].strip()}")
