#!/bin/bash

TARGET_FILE="node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"

echo "Fixing Kotlin nullability issues in react-native-track-player..."

# Fix line 548 - Arguments.fromBundle expects non-null Bundle
sed -i '548s/Arguments\.fromBundle(musicService\.tracks\[index\]\.originalItem)/Arguments.fromBundle(musicService.tracks[index].originalItem ?: Bundle())/' "$TARGET_FILE"

# Fix line 588 - Arguments.fromBundle expects non-null Bundle  
sed -i '588s/Arguments\.fromBundle(/Arguments.fromBundle(/' "$TARGET_FILE"
sed -i '589s/musicService\.tracks\[musicService\.getCurrentTrackIndex()\]\.originalItem/musicService.tracks[musicService.getCurrentTrackIndex()].originalItem ?: Bundle()/' "$TARGET_FILE"

echo "✅ Fixed Kotlin nullability issues!"
echo "Now creating patch..."
