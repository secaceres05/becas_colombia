import psycopg2

# Load backup entities
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

# Check specific IDs
for eid in [1, 3, 6, 16, 42, 42]:
    if eid in old_entities:
        print(f'Backup ID {eid}: {old_entities[eid]}')
    else:
        print(f'Backup ID {eid}: NOT FOUND')

# Main DB entities
import psycopg2
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id, name FROM entities WHERE id IN (1,3,6,16,42)')
for row in main_cur.fetchall():
    print(f'Main DB ID {row[0]}: {row[1]}')
main_conn.close()

# Check which provider_ids in backup are NOT in main DB
with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/mapping.txt', 'w', encoding='utf-8') as f:
    # Load backup entities
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

    main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
    main_cur = main_conn.cursor()
    main_cur.execute('SELECT id, name FROM entities')
    main_entities = {row[1]: row[0] for row in main_cur.fetchall()}
    
    # Find backup entities not in main by name
    backup_names = set(old_entities.values())
    main_names = set(main_entities.keys())
    backup_only = set(old_entities.values()) - main_entities.keys()
    
    with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/mapping.txt', 'w', encoding='utf-8') as f:
        for name in sorted(backup_only):
            f.write(f'{name}\n')
    
    print(f'Backup entities not in main by name: {len(backup_only)}')
    for name in sorted(backup_only):
        f.write(f'{name}\n')