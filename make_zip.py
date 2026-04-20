import zipfile, os

# Include .next (pre-built) + startup.sh, exclude node_modules (installed by startup.sh at runtime)
EXCLUDE_DIRS = {'.git', '.github', 'cypress', 'node_modules', 'sample', '.next'}
EXCLUDE_PARTS = ['.next/cache', '.next/trace', '.next/trace-build', 'scripts/data']
EXCLUDE_EXTS = {'.db', '.db-shm', '.db-wal'}
EXCLUDE_FILES = {'deploy.zip', 'make_zip.py', 'scripts/data.ts', '.gitconfig_codex', '.env.local', '.env.test.local'}

def arc_path(root, fname):
    return os.path.relpath(os.path.join(root, fname), '.').replace(os.sep, '/')

count = 0
with zipfile.ZipFile('deploy.zip', 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for fname in files:
            arc = arc_path(root, fname)
            if any(arc.startswith(p) for p in EXCLUDE_PARTS):
                continue
            if os.path.splitext(fname)[1] in EXCLUDE_EXTS:
                continue
            if arc in EXCLUDE_FILES:
                continue
            if fname.endswith('.test.ts') or fname.endswith('.spec.ts'):
                continue
            zf.write(os.path.join(root, fname), arc)
            count += 1

size_mb = os.path.getsize('deploy.zip') / 1024 / 1024
print("Created deploy.zip: {} files, {:.1f} MB".format(count, size_mb))
