import psycopg2

# Get main DB valid entity IDs
main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id FROM entities')
valid_ids = set([r[0] for r in main_cur.fetchall()])
main_conn.close()

# Get scholarships from recovery
conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas_recovery')
cur = conn.cursor()
cur.execute('SELECT id, title, provider_id FROM scholarships WHERE provider_id IS NOT NULL')
rows = cur.fetchall()

# Valid IDs in main DB
valid_ids = {101, 103, 95, 97, 12, 31, 36, 38, 40, 41, 43, 44, 45, 46, 50, 51, 52, 53, 54, 56, 59, 61, 63, 64, 65, 67, 69, 69, 70, 72, 73, 74, 75, 77, 75, 78, 79, 80, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 99, 100, 101, 101, 102, 103}

with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/5_corrupt_final.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        pid = row[2]
        if pid not in [101, 103, 95, 97, 12, 31, 36, 38, 40, 41, 43, 44, 45, 46, 50, 51, 52, 53, 54, 56, 59, 61, 63, 64, 65, 67, 69, 69, 70, 72, 73, 74, 75, 77, 75, 78, 79, 80, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 99, 100, 101, 101, 102, 103]:
            title = row[1].encode('ascii', 'replace').decode('ascii')
            with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/5_exact_corrupt.txt', 'a', encoding='utf-8') as f:
                f.write(f'ID: {row[0]} | {row[1][:60]} | provider_id={row[2]}\n')

print('Done')