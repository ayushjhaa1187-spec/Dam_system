import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    replacements = {
        r'"#1e293b"': '"#D7E4EC"', # slate-800 -> hc-border
        r'"#334155"': '"#D7E4EC"', # slate-700 -> hc-border
        r'"#475569"': '"#D7E4EC"', # slate-600 -> hc-border
        r'"#64748b"': '"#5F7180"', # slate-500 -> hc-textSecondary
        r'"#94a3b8"': '"#5F7180"', # slate-400 -> hc-textSecondary
        r'"#06b6d4"': '"#00A9C6"', # cyan-500 -> hc-active
        r'"#38bdf8"': '"#1479C9"', # sky-400 -> hc-primary
        r'"#ef4444"': '"#D94242"', # red-500 -> hc-critical
        r'"#eab308"': '"#D98A11"', # yellow-500 -> hc-watch
        r'"#10b981"': '"#178A72"', # emerald-500 -> hc-success
        r'"#8b5cf6"': '"#7667D8"', # violet-500 -> hc-assumption
        r'"#f8fafc"': '"#12304A"', # slate-50 -> hc-ink
        r'"#f1f5f9"': '"#12304A"', # slate-100 -> hc-ink
    }

    for old, new in replacements.items():
        content = re.sub(old, new, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    src_dir = r"c:\Users\DELL\HydroBreach\frontend\src\components\charts"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
