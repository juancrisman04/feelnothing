import os, re

# Rename files in imgremeras and imgpantalones
for root_dir in ['imgremeras', 'imgpantalones']:
    full_root = os.path.join(os.getcwd(), root_dir)
    if os.path.exists(full_root):
        for filename in os.listdir(full_root):
            if ' ' in filename:
                old_path = os.path.join(full_root, filename)
                new_filename = filename.replace(' ', '-')
                new_path = os.path.join(full_root, new_filename)
                print(f'Renaming {old_path} to {new_path}')
                os.rename(old_path, new_path)

# Update references in .html and .js files
for root, dirs, files in os.walk(os.getcwd()):
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Skip binary files that might end with .html or .js by mistake
                continue
            
            # Simple regex to find imgremeras/ or imgpantalones/ followed by path with spaces
            # We look for matches within quotes
            # We'll use a more robust regex that targets src and data-image
            # Or just any reference starting with imgremeras/ or imgpantalones/
            
            def replace_spaces(match):
                return match.group(0).replace(' ', '-')

            # Target imgremeras/path or imgpantalones/path containing spaces
            pattern = r'img(remeras|pantalones)/[^\s\"\']+\s[^\s\"\']+(\.[a-zA-Z0-9]+)?'
            
            new_content = content
            # We might need multiple passes or a better regex
            # Let's target the whole path inside quotes
            
            new_content = re.sub(r'(img(remeras|pantalones)/[^\"\']+\.[a-zA-Z0-9]+)', lambda m: m.group(1).replace(' ', '-'), content)
            
            if new_content != content:
                print(f'Updating references in {path}')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
