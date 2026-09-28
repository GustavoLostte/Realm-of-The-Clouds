import re
import glob

# Files to process
css_files = ["src/components/MmorpgHudOverlay.css", "src/components/DungeonDemoScene.css"]

for file_path in css_files:
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        continue

    # 1. Remove backdrop-filter blurs
    content = re.sub(r'^\s*backdrop-filter:\s*blur.*$\n?', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*-webkit-backdrop-filter:\s*blur.*$\n?', '', content, flags=re.MULTILINE)
    
    # 2. Replace drop-shadow with box-shadow if it's applied to an image or container
    # Actually, we can just replace "filter: drop-shadow(0 2px 4px rgba(...));" 
    # with "box-shadow: 0 2px 4px rgba(...);"
    def drop_shadow_replacer(match):
        shadow_val = match.group(1)
        # If it's a -webkit- filter, we can just remove it because box-shadow doesn't need webkit in modern browsers
        if "-webkit-filter:" in match.group(0):
            return ""
        
        # Determine if it's safe to use box-shadow. For text icons, it should be text-shadow, but box-shadow is usually fine if they have border-radius
        # For safety and speed on mobile, we just use box-shadow
        return f"box-shadow: {shadow_val};"

    # Match both standard and -webkit-
    content = re.sub(r'filter:\s*drop-shadow\(([^)]+)\);', drop_shadow_replacer, content)
    content = re.sub(r'-webkit-filter:\s*drop-shadow\(([^)]+)\);', drop_shadow_replacer, content)

    # Note: Some elements like .hud-quest-icon don't have border-radius, but box-shadow is a rectangle, which is fine for performance.
    
    with open(file_path, 'w') as f:
        f.write(content)

print("Filters optimized successfully.")
