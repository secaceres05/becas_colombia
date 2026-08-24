#!/usr/bin/env python3
import psycopg2
import psycopg2.extras
import re

def main():
    print("=" * 60)
    print("DRY RUN: becas_recovery -> becas (main)")
    print("=" * 60)

    # Connections
    recovery_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery")
    main_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")

    recovery_conn.autocommit = False
    main_conn.autocommit = False

    recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # 1. Main DB entities
        main_cur.execute("SELECT id, name FROM entities")
        entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"[1/5] Main DB entities: {len(entity_name_to_id)}")

        # 2. Main DB sources
        main_cur.execute("SELECT id, name FROM sources")
        source_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"[2/5] Main DB sources: {len(source_name_to_id)}")

        # 3. Get scholarships from becas_recovery
        recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        recovery_cur.execute("""
            SELECT id, title, slug, type, coverage, description, official_url, application_url,
                   opening_date, closing_date, status, needs_review, provider_id, source_id,
                   created_at, updated_at, continents
            FROM scholarships ORDER BY id
        """)
        scholarships = recovery_cur.fetchall()
        print(f"[3/5] Scholarships in recovery: {len(scholarships)}")

        # 4. Load entities from backup
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
                    if eid and name:
                        old_entities[eid] = name

        # 5. Build mappings
        # Provider mapping
        provider_mapping = {}
        for old_id, name in old_entities.items():
            if name in entity_name_to_id:
                provider_mapping[old_id] = entity_name_to_id[name]

        # 5. Get existing scholarships in main DB for deduplication
        main_cur.execute("SELECT id, title, slug, provider_id FROM scholarships")
        existing = main_cur.fetchall()
        existing_by_slug = {row['slug']: row['id'] for row in existing}
        existing_by_provider_title = {(row['provider_id'], row['title'].strip().lower()): row['id'] for row in existing}
        print(f"Existing in main DB: {len(existing)}")

        # Get scholarships from becas_recovery
        recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        recovery_cur.execute("""
            SELECT id, title, slug, type, coverage, description, official_url, application_url,
                   opening_date, closing_date, status, needs_review, provider_id, source_id,
                   created_at, updated_at, continents
            FROM scholarships ORDER BY id
        """)
        scholarships = recovery_cur.fetchall()
        print(f"Scholarships in recovery: {len(scholarships)}")

        # Build provider mapping from backup entities
        main_cur.execute("SELECT id, name FROM entities")
        entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}

        old_entities = {}
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
                    if eid and name:
                        old_entities[eid] = name

        # Provider mapping
        provider_mapping = {}
        for old_id, name in old_entities.items():
            if name in entity_name_to_id:
                provider_mapping[old_id] = entity_name_to_id[name]

        # Existing scholarships in main DB
        main_cur.execute("SELECT id, title, slug, provider_id FROM scholarships")
        existing = main_cur.fetchall()
        existing_by_slug = {row['slug']: row['id'] for row in existing}
        existing_by_provider_title = {(row['provider_id'], row['title'].strip().lower()): row['id'] for row in existing}

        # Get scholarships from recovery
        recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        recovery_cur.execute("""
            SELECT id, title, slug, type, coverage, description, official_url, application_url,
                   opening_date, closing_date, status, needs_review, provider_id, source_id,
                   created_at, updated_at, continents
            FROM scholarships ORDER BY id
        """)
        scholarships = recovery_cur.fetchall()

        # DRY RUN
        to_insert = []
        skipped_duplicate = 0
        skipped_fk = 0

        for row in scholarships:
            new_provider_id = provider_mapping.get(row['provider_id'])
            if not new_provider_id and row['provider_id']:
                old_ent_name = old_entities.get(row['provider_id'])
                if old_ent_name and old_ent_name in entity_name_to_id:
                    new_provider_id = entity_name_to_id[old_ent_name]
                    provider_mapping[row['provider_id']] = entity_name_to_id[old_ent_name]

            if not new_provider_id and row['provider_id']:
                old_ent_name = old_entities.get(row['provider_id'])
                print(f'  FK MISSING: provider for "{row["title"][:50]}" (old provider_id={row["provider_id"]})')

            slug = row['slug']
            if slug in existing_by_slug:
                skipped_duplicate += 1
                continue

            key = (new_provider_id, row['title'].strip().lower()) if new_provider_id else None
            if key and key in existing_by_provider_title:
                skipped_duplicate += 1
                continue

            if not new_provider_id:
                continue

            to_insert.append(row)

        print(f'\nDRY RUN SUMMARY:')
        print(f'  Total in backup: {len(scholarships)}')
        print(f'  Will insert: {len(to_insert)}')
        print(f'  Skipped duplicate: {skipped_duplicate}')
        print(f'  Skipped FK missing: {len(scholarships) - len(to_insert) - skipped_duplicate}')
        print(f'Final total after insert: {5 + len(to_insert)}')

        # Get existing for final check
        main_cur.execute("SELECT id, title, slug, provider_id FROM scholarships")
        existing = main_cur.fetchall()
        existing_by_slug = {row['slug']: row['id'] for row in existing}
        existing_by_provider_title = {(row['provider_id'], row['title'].strip().lower()): row['id'] for row in existing}

        # Confirm
        confirm = input("\nProceed with INSERT? (yes/no): ").strip().lower()
        if confirm != 'yes':
            print("Aborted.")
            return

        # INSERT
        print("\nExecuting INSERT...")
        inserted = 0
        for row in scholarships:
            slug = row['slug']
            if slug in existing_by_slug:
                continue

            key = (provider_mapping.get(row['provider_id']), row['title'].strip().lower())
            if key in existing_by_provider_title:
                continue

            new_provider_id = provider_mapping.get(row['provider_id'])
            if not new_provider_id:
                continue

            try:
                main_cur.execute("""
                    INSERT INTO scholarships (title, slug, type, coverage, description, official_url, application_url,
                     opening_date, closing_date, status, needs_review, provider_id, source_id,
                     created_at, updated_at, continents)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (slug) DO NOTHING RETURNING id
                """, (
                    row['title'], row['slug'], row['type'], row['coverage'],
                    row['description'], row['official_url'], row['application_url'],
                    row['opening_date'], row['closing_date'], row['status'],
                    True,  # needs_review = true
                    provider_mapping.get(row['provider_id']),
                    None,  # sourceId = NULL
                    row['created_at'], row['updated_at'], row['continents']
                ))
                if main_cur.rowcount > 0:
                    inserted += 1
            except Exception as e:
                print(f"  Error inserting '{row['title'][:50]}': {e}")
                main_conn.rollback()

        main_conn.commit()
        print(f"\nSuccessfully inserted {inserted} new scholarships!")

        main_cur.execute("SELECT COUNT(*) FROM scholarships")
        total = main_cur.fetchone()['count']
        print(f"Total scholarships in main DB now: {total}")

    finally:
        recovery_conn.close()
        main_conn.close()

if __name__ == '__main__':
    main()