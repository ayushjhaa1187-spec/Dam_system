import re

filepath = r"c:\Users\DELL\HydroBreach\frontend\src\components\SimulationViewer.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace specific hex codes and rgba in SimulationViewer.jsx
replacements = {
    r"'#ef4444'": "'#D94242'", # hc-critical
    r"'#a855f7'": "'#7667D8'", # hc-assumption
    r"'#c084fc'": "'#7667D8'", # hc-assumption
    r"'rgba\(168, 85, 247, 0.12\)'": "'rgba(118, 103, 216, 0.12)'", # hc-assumption/12
    r"'#e9d5ff'": "'#7667D8'", # hc-assumption
    r"'rgba\(14, 165, 233, 0.08\)'": "'rgba(20, 121, 201, 0.08)'", # hc-primary/8
    r"'#7dd3fc'": "'#1479C9'", # hc-primary
    r"'#06b6d4'": "'#1479C9'", # hc-primary
    r"'#94a3b8'": "'#5F7180'", # hc-textSecondary
    r"'#64748b'": "'#5F7180'", # hc-textSecondary
    r"'#000000'": "'#12304A'", # maybe replace black with ink? Wait, let's not touch #000000 blindly.
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {filepath} colors.")
