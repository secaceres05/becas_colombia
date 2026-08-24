import psycopg2

# Get backup entities
with open(r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql', 'r', encoding='utf-8') as f:
    content = f.read()

old_entities = {}
start = content.find('COPY public.entities')
if start == -1: start = content.find('COPY public.providers')
if start == -1: start = content.find('COPY public.entity')
if start != -1:
    end = content.find('\.\n', start)
    section = content[start:content.find('\.\n', start)+2]
    for line in section.split('\n'):
        if not line.strip() or line.startswith('COPY') or line.startswith('\.'): continue
        vals = line.strip().split('\t')
        if len(vals) >= 2:
            eid = int(vals[0]) if vals[0] != '\\N' else None
            name = vals[1] if vals[1] != '\\N' else None
            if eid and name: old_entities[eid] = name

print(f'Backup entities: {len(old_entities)}')

# Main DB entities
import psycopg2
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id, name FROM entities')
main_entities = {row[1]: row[0] for row in main_cur.fetchall()}

# Find backup entities not in main by name
backup_names = set(old_entities.values())
main_names = set(main_entities.keys())
backup_only = set(old_entities.values()) - main_entities.keys()

print(f'Backup entities not in main by name: {len(backup_only)}')
for name in sorted(backup_only):
    print(f'  {name}')

# Now find scholarships with these provider_ids
conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()
cur.execute('SELECT id, title, provider_id FROM scholarships WHERE provider_id IS NOT NULL')
rows = cur.fetchall()

# Build old_id -> name mapping
old_id_to_name = {eid: name for eid, name in old_entities.items()}

with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/5_exact_corrupt.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        pid = row[2]
        if pid in old_entities and old_entities[pid] not in main_entities:
            title = row[1].encode('ascii', 'replace').decode('ascii')
            with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/5_exact_corrupt.txt', 'a', encoding='utf-8') as f:
                f.write(f'ID: {row[0]} | {row[1][:60]} | provider_id={row[2]} | entity="{old_entities[pid]}" not in main DB\n')

print('Done - check 5_exact_corrupt.txt')