import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    content = re.sub(r'\btext-slate-950\b', 'text-hc-ink', content)
    content = re.sub(r'\bfill-slate-950\b', 'fill-hc-ink', content)
    content = re.sub(r'\bdivide-slate-800\b', 'divide-hc-border', content)
    content = re.sub(r'\btext-slate-700\b', 'text-hc-textSecondary', content)
    content = re.sub(r'\bfrom-slate-950\b', 'from-hc-bg', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    src_dir = r"c:\Users\DELL\HydroBreach\frontend\src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js') or file.endswith('.css'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
