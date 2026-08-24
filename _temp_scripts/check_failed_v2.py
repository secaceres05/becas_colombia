#!/usr/bin/env python3
import psycopg2
import psycopg2.extras

recovery_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery")
main_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")

recovery_conn.autocommit = False
main_conn.autocommit = False

recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

try:
    # Main DB entities
    main_cur.execute("SELECT id, name FROM entities")
    entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}

    # Load old entities from backup
    with open(r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql', 'r', encoding='utf-8') as f:
        content = f.read()
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

    # Provider mapping
    main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    main_cur.execute("SELECT id, name FROM entities")
    entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}

    provider_mapping = {}
    for old_id, name in old_entities.items():
        if name in entity_name_to_id:
            provider_mapping[old_id] = entity_name_to_id[name]

    # Get scholarships from recovery
    recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    recovery_cur.execute("""
        SELECT id, title, slug, type, coverage, description, official_url, application_url,
               opening_date, closing_date, status, needs_review, provider_id, source_id,
               created_at, updated_at, continents
        FROM scholarships ORDER BY id
    """)
    scholarships = recovery_cur.fetchall()

    # Existing in main DB
    main_cur = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas").cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    main_cur.execute("SELECT id, title, slug, provider_id FROM scholarships")
    existing = main_cur.fetchall()
    existing_by_slug = {row['slug']: row['id'] for row in existing}
    existing_by_provider_title = {(row['provider_id'], row['title'].strip().lower()): row['id'] for row in existing}

    # Get scholarships from recovery
    recovery_cur = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery").cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    recovery_cur.execute("""
        SELECT id, title, slug, type, coverage, description, official_url, application_url,
               opening_date, closing_date, status, needs_review, provider_id, source_id,
               created_at, updated_at, continents
        FROM scholarships ORDER BY id
    """)
    scholarships = recovery_cur.fetchall()

    # Check each
    failed = []
    for row in scholarships:
        new_provider_id = None
        if row['provider_id']:
            old_ent_name = None
            for eid, ename in old_entities.items():
                if eid == row['provider_id']:
                    old_ent_name = ename
                    break
            if old_ent_name and old_ent_name in entity_name_to_id:
                pass
            elif old_ent_name:
                print(f"  FK MISSING: provider for '{row['title'][:50]}' (old provider_id={row['provider_id']}, entity='{old_ent_name}') -> NO EXISTE EN BD PRINCIPAL")
            else:
                print(f"  FK MISSING: provider for '{row['title'][:50]}' (old provider_id={row['provider_id']}) -> NO EXISTE EN BACKUP ENTITIES")
except Exception as e:
    print(f'Error: {e}')
finally:
    recovery_conn.close()
    main_conn.close()