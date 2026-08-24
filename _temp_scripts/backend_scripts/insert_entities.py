import psycopg2
import re

def main():
    with open(r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find entities COPY section
    start = content.find('COPY public.entities')
    if start == -1:
        start = content.find('COPY public.providers')
    if start == -1:
        start = content.find('COPY public.entity')

    if start == -1:
        print('No entities COPY section found')
        return

    end = content.find('\.\n', start)
    section = content[start:content.find('\.\n', start)+2]
    lines = section.split('\n')
    data_lines = [l for l in lines if l.strip() and not l.startswith('COPY') and not l.startswith('\.')]
    print(f'Found {len(data_lines)} entity/provider rows')

    conn = psycopg2.connect('postgresql://becas:becas_dev@localhost:5433/becas')
    cur = conn.cursor()

    inserted = 0
    for line in data_lines:
        if not line.strip():
            continue
        try:
            vals = line.strip().split('\t')
            vals_parsed = []
            for v in vals:
                if v == '\\N' or v == '':
                    vals_parsed.append(None)
                else:
                    vals_parsed.append(v)

            if len(vals_parsed) >= 2:
                cur.execute('''
                    INSERT INTO entities (id, name, type, acronym, website)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                ''', (vals_parsed[0], vals_parsed[1], vals_parsed[2] if len(vals_parsed)>2 else None, 
                      vals_parsed[3] if len(vals_parsed)>3 else None, 
                      vals_parsed[4] if len(vals_parsed)>4 else None))
                inserted += 1
        except Exception as e:
            print(f'Error: {e}')
            conn.rollback()

    conn.commit()
    print(f'Inserted {inserted} entities/providers')
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()