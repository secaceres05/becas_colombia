import psycopg2

conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()

# Find non-integer provider_ids
cur.execute("SELECT id, title, provider_id::text FROM scholarships WHERE provider_id::text NOT SIMILAR TO '^[0-9]+\$'")
rows = cur.fetchall()

with open('failed_fks.txt', 'w', encoding='utf-8') as out:
    for row in cur.fetchall():
        out.write(f'ID: {row[0]} | {row[1][:70]} | provider_id={row[2]}\n')

# Also count
cur.execute("SELECT provider_id::text, COUNT(*) FROM scholarships GROUP BY provider_id::text ORDER BY 2 DESC")
for row in cur.fetchall():
    print(f'provider_id={row[0]}: {row[1]} records')

conn.close()