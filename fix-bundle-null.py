import re

file_path = "node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the second occurrence - line ~589
# We need to match the exact pattern across multiple lines
pattern = r'(else Arguments\.fromBundle\(\s+musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem)'
replacement = r'\1 ?: Bundle()'

content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed the nullable Bundle issue on line ~589!")

# Print the fixed section to verify
lines = content.split('\n')
for i, line in enumerate(lines[585:592], start=586):
    print(f"{i}: {line}")
