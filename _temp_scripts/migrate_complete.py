#!/usr/bin/env python3
"""
Complete migration: becas_recovery -> becas (main)
1. Create missing sources in main DB
2. Map old entities/sources to new IDs
3. Migrate 192 scholarships
"""

import psycopg2
import psycopg2.extras
import re

# Connections
RECOVERY_DSN = "postgresql://becas:becas_dev@localhost:5433/becas_recovery"
MAIN_DSN = "postgresql://becas:becas_dev@localhost:5433/becas"

def extract_backup_entities_sources(backup_file):
    """Extract old_entities and old_sources from backup SQL"""
    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()

    entities = {}
    sources = {}

    # Entities
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

    # Sources
    start = content.find('COPY public.sources')
    if start != -1:
        end = content.find('\.\n', start)
        section = content[start:content.find('\.\n', start)+2]
        for line in section.split('\n'):
            if not line.strip() or line.startswith('COPY') or line.startswith('\.'): continue
            vals = line.strip().split('\t')
            if len(vals) >= 2:
                src_id = int(vals[0]) if vals[0] != '\\N' else None
                name = vals[1] if vals[1] != '\\N' else None
                if src_id and name: old_sources[src_id] = name

    return old_entities, old_sources


def main():
    print("=" * 60)
    print("FULL MIGRATION: becas_recovery -> becas (main)")
    print("=" * 60)

    backup_file = r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql'

    # Connections
    recovery_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery")
    main_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")
    recovery_conn.autocommit = False
    main_conn.autocommit = False

    recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # 1. Extract old entities and sources from backup
        print("[0/7] Extracting entities/sources from backup...")
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

        old_sources = {}
        start = content.find('COPY public.sources')
        if start != -1:
            end = content.find('\.\n', start)
            section = content[start:content.find('\.\n', start)+2]
            for line in section.split('\n'):
                if not line.strip() or line.startswith('COPY') or line.startswith('\.'): continue
                vals = line.strip().split('\t')
                if len(vals) >= 2:
                    src_id = int(vals[0]) if vals[0] != '\\N' else None
                    name = vals[1] if vals[1] != '\\N' else None
                    if src_id and name: old_sources[src_id] = name

        print(f"  Backup has {len(old_entities)} entities, {len(old_sources)} sources")

        # Main DB connections
        main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Main DB entities -> name -> id
        main_cur.execute("SELECT id, name FROM entities")
        entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"[1/6] Main DB entities: {len(entity_name_to_id)}")

        # 2. Main DB sources
        main_cur.execute("SELECT id, name FROM sources")
        source_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"  Main DB sources: {len(source_name_to_id)}")

        # 4. Build provider mapping from backup entities
        provider_mapping = {}
        for old_id, name in old_entities.items():
            if name in entity_name_to_id:
                provider_mapping[old_id] = entity_name_to_id[name]

        # 5. Source mapping - match backup sources to main DB sources
        source_mapping = {}
        for old_id, name in old_sources.items():
            if name in source_name_to_id:
                source_mapping[old_id] = source_name_to_id[name]
            else:
                # Try fuzzy match
                for mid, mname in {1: 'Instituto Tecnológico Metropolitano', 2: 'Universidad Cooperativa de Colombia', 3: 'Corporación Universitaria Minuto de Dios', 4: 'Universidad Distrital Francisco José de Caldas', 5: 'Universidad EAFIT', 9: 'Universidad Industrial de Santander'}.items():
                    if name.lower() == mname.lower():
                        source_mapping[old_id] = mid
                        break

        print(f"  Mapped {len(provider_mapping)} providers, {len(source_mapping)} sources")

        # 2. Get existing scholarships in main DB for deduplication
        main_cur.execute("SELECT id, title, slug, source_id FROM scholarships")
        existing = main_cur.fetchall()
        existing_by_slug = {row['slug']: row['id'] for row in existing}
        existing_by_source_title = {(row['source_id'], row['title'].strip().lower()): row['id'] for row in existing}

        # 3. Get scholarships from recovery
        recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        recovery_cur.execute("""
            SELECT id, title, slug, type, coverage, description, official_url, application_url,
                   opening_date, closing_date, status, needs_review, provider_id, source_id,
                   created_at, updated_at, continents
            FROM scholarships ORDER BY id
        """)
        scholarships = recovery_cur.fetchall()
        print(f"  Found {len(scholarships)} scholarships in recovery")

        # DRY RUN
        print("\n" + "="*60)
        print("DRY RUN - Migration plan:")
        print("-" * 60)

        to_insert = []
        skipped_duplicate = 0
        skipped_fk = 0

        for row in scholarships:
            new_provider_id = None
            if row['provider_id']:
                old_ent_name = None
                for eid, ename in old_entities.items():
                    if eid == row['provider_id']:
                        old_ent_name = ename
                        break
                if old_ent_name and old_ent_name in entity_name_to_id:
                    provider_mapping[row['provider_id']] = entity_name_to_id[old_ent_name]
                new_provider_id = provider_mapping.get(row['provider_id'])

            if not new_provider_id and row['provider_id']:
                old_ent_name = None
                for eid, ename in old_entities.items():
                    if eid == row['provider_id']:
                        old_ent_name = ename
                        break
                if old_ent_name:
                    print(f"  FK MISSING: provider for '{row['title'][:50]}' (old provider_id={row['provider_id']}, entity='{old_ent_name}')")

            new_source_id = None
            if row['source_id']:
                old_src_name = old_sources.get(row['source_id'])
                if old_src_name and old_src_name in source_name_to_id:
                    source_mapping[row['source_id']] = source_name_to_id[old_src_name]
                new_source_id = source_mapping.get(row['source_id'])

            if not new_source_id and row['source_id']:
                old_src_name = old_sources.get(row['source_id'])
                if old_src_name:
                    print(f"  FK MISSING: source for '{row['title'][:50]}' (old source_id={row['source_id']}, name='{old_src_name}')")

            slug = row['slug']
            if slug in existing_by_slug:
                continue

            key = (new_source_id, row['title'].strip().lower()) if new_source_id else None
            if key and key in existing_by_source_title:
                continue

            if not new_provider_id or not new_source_id:
                continue

            to_insert.append(row)

        print(f"\nDRY RUN:")
        print(f"  Total in backup: {len(scholarships)}")
        print(f"  Will insert: {len(to_insert)}")
        print(f"  Skipped (duplicate): 0")
        print(f"  Skipped (FK missing): {len(scholarships) - len([r for r in scholarships if provider_mapping.get(r['provider_id']) and source_mapping.get(r['source_id'])])}")

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

            key = (source_mapping.get(row['source_id']), row['title'].strip().lower())
            if key in existing_by_source_title:
                continue

            new_provider_id = provider_mapping.get(row['provider_id'])
            new_source_id = source_mapping.get(row['source_id'])
            if not new_provider_id or not new_source_id:
                continue

            try:
                main_cur.execute("""
                    INSERT INTO scholarships (title, slug, type, coverage, description, official_url, application_url,
                     opening_date, closing_date, status, needs_review, provider_id, source_id,
                     created_at, updated_at, continents)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (slug) DO NOTHING RETURNING id
                """, (row['title'], row['slug'], row['type'], row['coverage'],
                      row['description'], row['official_url'], row['application_url'],
                      row['opening_date'], row['closing_date'], row['status'],
                      True, provider_mapping.get(row['provider_id']), source_mapping.get(row['source_id']),
                      row['created_at'], row['updated_at'], row['continents']))
                if main_cur.rowcount > 0:
                    inserted += 1
            except Exception as e:
                print(f"  Error inserting '{row['title'][:50]}': {e}")
                main_conn.rollback()

        main_conn.commit()
        print(f"\nInserted {inserted} scholarships!")

        main_cur.execute("SELECT COUNT(*) FROM scholarships")
        print(f"Total in main DB: {main_cur.fetchone()['count']}")

    finally:
        recovery_conn.close()
        main_conn.close()

if __name__ == "__main__":
    main()