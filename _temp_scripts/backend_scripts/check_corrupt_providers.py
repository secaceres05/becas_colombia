import psycopg2

conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()

cur.execute("SELECT id, title, provider_id::text FROM scholarships WHERE provider_id::text NOT SIMILAR TO '^[0-9]+\$'")
rows = cur.fetchall()

print(f"Total records with non-integer provider_id: {len(rows)}")
for row in cur.fetchall():
    print(f'ID: {row[0]} | {row[1][:70]} | provider_id={row[2]}')

conn.close()