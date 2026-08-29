import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Backgrounds
    content = re.sub(r'\bbg-slate-950\b', 'bg-hc-bg', content)
    content = re.sub(r'\bbg-slate-900\b', 'bg-hc-surface', content)
    content = re.sub(r'\bbg-slate-800\b', 'bg-hc-secondary', content)
    content = re.sub(r'\bbg-slate-700\b', 'bg-hc-border', content)
    content = re.sub(r'\bbg-slate-[1-6]00\b', 'bg-hc-secondary', content)
    
    # Hover backgrounds
    content = re.sub(r'\bhover:bg-slate-800\b', 'hover:bg-hc-secondary', content)
    content = re.sub(r'\bhover:bg-slate-900\b', 'hover:bg-hc-secondary', content)
    content = re.sub(r'\bhover:bg-slate-700\b', 'hover:bg-hc-border', content)

    # Borders
    content = re.sub(r'\bborder-slate-[789]00\b', 'border-hc-border', content)
    content = re.sub(r'\bborder-slate-[1-6]00\b', 'border-hc-border', content)

    # Text
    content = re.sub(r'\btext-slate-50\b', 'text-hc-ink', content)
    content = re.sub(r'\btext-slate-100\b', 'text-hc-ink', content)
    content = re.sub(r'\btext-slate-200\b', 'text-hc-ink', content)
    content = re.sub(r'\btext-slate-300\b', 'text-hc-textSecondary', content)
    content = re.sub(r'\btext-slate-400\b', 'text-hc-textSecondary', content)
    content = re.sub(r'\btext-slate-500\b', 'text-hc-textSecondary', content)
    content = re.sub(r'\btext-slate-600\b', 'text-hc-textSecondary', content)
    
    # Primary colors
    content = re.sub(r'\bbg-cyan-500\b', 'bg-hc-active', content)
    content = re.sub(r'\bbg-cyan-[4-6]00\b', 'bg-hc-active', content)
    content = re.sub(r'\bbg-blue-600\b', 'bg-hc-primary', content)
    content = re.sub(r'\bbg-blue-500\b', 'bg-hc-primary', content)
    
    # Text Primary
    content = re.sub(r'\btext-cyan-500\b', 'text-hc-active', content)
    content = re.sub(r'\btext-cyan-400\b', 'text-hc-active', content)
    content = re.sub(r'\btext-blue-500\b', 'text-hc-primary', content)
    content = re.sub(r'\btext-blue-400\b', 'text-hc-primary', content)

    # Semantic Colors
    content = re.sub(r'\btext-red-500\b', 'text-hc-critical', content)
    content = re.sub(r'\btext-red-400\b', 'text-hc-critical', content)
    content = re.sub(r'\bbg-red-500\b', 'bg-hc-critical', content)
    content = re.sub(r'\bbg-red-500/10\b', 'bg-hc-critical/10', content)
    content = re.sub(r'\bbg-red-500/20\b', 'bg-hc-critical/20', content)
    content = re.sub(r'\bborder-red-500\b', 'border-hc-critical', content)
    content = re.sub(r'\bborder-red-500/30\b', 'border-hc-critical/30', content)
    
    content = re.sub(r'\btext-orange-500\b', 'text-hc-watch', content)
    content = re.sub(r'\btext-amber-500\b', 'text-hc-watch', content)
    content = re.sub(r'\btext-yellow-500\b', 'text-hc-watch', content)
    content = re.sub(r'\bbg-orange-500/10\b', 'bg-hc-watch/10', content)
    content = re.sub(r'\bbg-orange-500/20\b', 'bg-hc-watch/20', content)
    content = re.sub(r'\bborder-orange-500/30\b', 'border-hc-watch/30', content)
    
    content = re.sub(r'\btext-emerald-400\b', 'text-hc-success', content)
    content = re.sub(r'\btext-emerald-500\b', 'text-hc-success', content)
    content = re.sub(r'\btext-green-500\b', 'text-hc-success', content)
    content = re.sub(r'\bbg-emerald-500/10\b', 'bg-hc-success/10', content)
    content = re.sub(r'\bborder-emerald-500/30\b', 'border-hc-success/30', content)
    
    content = re.sub(r'\btext-purple-400\b', 'text-hc-assumption', content)
    content = re.sub(r'\bbg-purple-500/10\b', 'bg-hc-assumption/10', content)

    # Some specifics for dark mode shadow/ring
    content = re.sub(r'\bring-slate-800\b', 'ring-hc-border', content)
    content = re.sub(r'\bring-slate-700\b', 'ring-hc-border', content)
    content = re.sub(r'\bring-slate-900\b', 'ring-hc-border', content)

    # Note: text-white inside buttons (like bg-hc-primary) is usually fine to stay text-white. 
    # But text-slate-900 inside a light background button might need to be text-white if the button became primary.
    # We will rely on manual tweaks for edges.
    
    # Replacing slate-800/50 and similar transparency
    content = re.sub(r'\bbg-slate-900/50\b', 'bg-hc-surface/50', content)
    content = re.sub(r'\bbg-slate-900/80\b', 'bg-hc-surface/80', content)
    content = re.sub(r'\bbg-slate-950/80\b', 'bg-hc-bg/80', content)
    content = re.sub(r'\bbg-slate-800/50\b', 'bg-hc-secondary/50', content)
    content = re.sub(r'\bbg-slate-800/80\b', 'bg-hc-secondary/80', content)

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
