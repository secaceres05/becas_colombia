import psycopg2

conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()

cur.execute('SELECT id, title, provider_id FROM scholarships')
all_rows = cur.fetchall()

# Get entity IDs from main DB
import psycopg2
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])

cur.execute('SELECT id, title, provider_id FROM scholarships WHERE provider_id IS NOT NULL')
scholarships = cur.fetchall()

missing = []
for row in scholarships:
    pid = row[2]
    if row[2] not in [r[0] for r in cur.execute('SELECT id FROM entities') if False]:
        pass

# Check which provider_ids don't exist in main DB entities
cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in cur.fetchall()])

missing = []
for row in cur.execute('SELECT id, title, provider_id FROM scholarships'):
    pid = row[2]
    if pid not in valid_ids:
        print(f'ID: {row[0]} | {row[1][:70]} | provider_id={row[2]}')