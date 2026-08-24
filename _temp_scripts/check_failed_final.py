#!/usr/bin/env python3
import psycopg2
import psycopg2.extras

# Load old entities from backup
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

recovery_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery")
main_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")

main_cur = main_conn.cursor()
main_cur.execute("SELECT id, name FROM entities")
entity_name_to_id = {row[1]: row[0] for row in main_cur.fetchall()}

recovery_cur = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery").cursor()
recovery_cur.execute("""
    SELECT id, title, slug, type, coverage, description, official_url, application_url,
           opening_date, closing_date, status, needs_review, provider_id, source_id,
           created_at, updated_at, continents
    FROM scholarships ORDER BY id
""")
scholarships = recovery_cur.fetchall()

with open('failed_fks.txt', 'w', encoding='utf-8') as out:
    for row in scholarships:
        # Columns: id, title, slug, type, coverage, description, official_url, application_url,
        #          opening_date, closing_date, status, needs_review, provider_id, source_id,
        #          created_at, updated_at, continents
        provider_id = row[12]  # provider_id is at index 12
        old_ent_name = None
        for eid, ename in old_entities.items():
            if eid == row[12]:
                old_ent_name = ename
                break
        if old_ent_name and old_ent_name not in entity_name_to_id:
            print(f"FK MISSING: {row[1][:50]} | old_provider_id={row[12]} | entity='{old_ent_name}' -> NO EXISTE EN BD PRINCIPAL")
        elif old_ent_name:
            pass
        else:
            out.write(f"FK MISSING: {row[1][:50]} | old_provider_id={row[12]} -> NO EXISTE EN BACKUP ENTITIES\n")