import psycopg2

main_conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
main_cur = main_conn.cursor()
main_cur.execute('SELECT id, name FROM entities ORDER BY id')
rows = main_cur.fetchall()

with open('C:/Users/JUAN/Desktop/becas-colombia-main/backend/entities_main.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        f.write(f'{row[0]}: {row[1]}\n')

print(f'Total entities: {len(rows)}')