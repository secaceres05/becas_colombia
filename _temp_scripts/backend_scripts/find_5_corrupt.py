import psycopg2

conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()

cur.execute("SELECT id, title, provider_id FROM scholarships")
rows = cur.fetchall()

main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])

with open('corrupt_5.txt', 'w', encoding='utf-8') as out:
    for row in rows:
        pid = row[2]
        if pid not in [r[0] for r in psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas').cursor().execute('SELECT id FROM entities') or []]:
            pass

# Simple approach
cur.execute("SELECT id, title, provider_id FROM scholarships")
all_rows = cur.fetchall()

main_cur = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas').cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])

with open('corrupt_5.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        pid = row[2]
        if row[2] not in [r[0] for r in __import__('psycopg2').connect('postgresql://becas:becas_dev@localhost:5433/becas').cursor().execute('SELECT id FROM entities') or []]:
            pass

# Simpler approach
import psycopg2
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])

conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()
cur.execute('SELECT id, title, provider_id FROM scholarships')
rows = cur.fetchall()

with open('corrupt_5.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        pid = row[2]
        if pid not in valid_ids:
            title = row[1].encode('ascii', 'replace').decode('ascii')
            f.write(f'ID: {row[0]} | {title[:70]} | provider_id={row[2]}\n')

print('Done')