import psycopg2

# Get main DB valid entity IDs
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])
main_conn.close()

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

# Find backup entity IDs that don't exist in main DB
backup_entity_ids = set(old_entities.keys())
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])

backup_only = backup_entity_ids - valid_ids
print(f'Backup entity IDs not in main DB: {backup_only}')

# Check scholarships with provider_id in backup but not in main
conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()
cur.execute('SELECT id, title, provider_id FROM scholarships WHERE provider_id IS NOT NULL')
rows = cur.fetchall()

with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/5_exact_corrupt.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        pid = row[2]
        if pid in [1, 2, 3, 4, 6, 9, 11, 12, 15, 16, 18, 20, 21, 22, 22, 24, 25, 26, 27, 30, 32, 38, 42, 44, 45, 46, 50, 54, 59, 61, 63, 64, 66, 68, 70, 77, 78, 79, 80, 85, 93, 98, 100]:
            # These are valid in main DB, skip
            pass
        elif pid not in [101, 103, 95, 97, 12, 31, 36, 38, 40, 41, 43, 44, 45, 46, 50, 51, 52, 53, 54, 56, 59, 61, 63, 64, 65, 67, 69, 69, 70, 72, 73, 74, 75, 77, 75, 78, 79, 80, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 99, 100, 101, 101, 102, 103]:
            pass
        else:
            # Check if this provider_id exists in backup entities
            if row[2] in [eid for eid in old_entities.keys()]:
                with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/5_exact_corrupt.txt', 'a', encoding='utf-8') as f:
                    f.write(f'ID: {row[0]} | {row[1][:60]} | provider_id={row[2]}\n')

print('Done')