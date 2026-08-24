#!/usr/bin/env python3
"""
Migration script: becas_recovery -> becas (main DB)
Migrates 192 scholarships from becas_recovery to main database (becas)
"""

import psycopg2
import psycopg2.extras
import re

def extract_backup_entities_and_sources(backup_file):
    """Extract entities and sources from backup SQL file"""
    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()

    entities = {}
    sources = {}

    # Extract entities
    start = content.find('COPY public.entities')
    if start == -1:
        start = content.find('COPY public.providers')
    if start == -1:
        start = content.find('COPY public.entity')

    if start != -1:
        end = content.find('\.\n', start)
        section = content[start:content.find('\.\n', start)+2]
        lines = section.split('\n')
        for line in lines:
            if not line.strip() or line.startswith('COPY') or line.startswith('\.'):
                continue
            vals = line.strip().split('\t')
            if len(vals) >= 2:
                eid = int(vals[0]) if vals[0] != '\\N' else None
                name = vals[1] if vals[1] != '\\N' else None
                if eid and name:
                    old_entities[eid] = name

    # Extract sources
    start = content.find('COPY public.sources')
    if start != -1:
        end = content.find('\.\n', start)
        section = content[start:content.find('\.\n', start)+2]
        lines = section.split('\n')
        for line in lines:
            if not line.strip() or line.startswith('COPY') or line.startswith('\.'):
                continue
            vals = line.strip().split('\t')
            if len(vals) >= 2:
                src_id = int(vals[0]) if vals[0] != '\\N' else None
                name = vals[1] if vals[1] != '\\N' else None
                if src_id and name:
                    old_sources[src_id] = name

    return {}, {}  # We'll handle mappings differently


def main():
    print("=" * 60)
    print("SCHOLARSHIP MIGRATION: becas_recovery -> becas (main)")
    print("=" * 60)

    # Connect to both databases
    recovery_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery")
    main_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")

    recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # 1. Build entity name -> id mapping in main DB
        print("[1/5] Building entity name -> ID mapping...")
        main_cur.execute("SELECT id, name FROM entities")
        entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"  Found {len(entity_name_to_id)} entities in main DB")

        # 2. Build source name -> id mapping in main DB
        main_cur.execute("SELECT id, name FROM sources")
        source_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"  Found {len(source_name_to_id)} sources in main DB")

        # 5. Get existing scholarships in main DB for deduplication
        main_cur.execute("SELECT id, title, slug, source_id FROM scholarships")
        existing = main_cur.fetchall()

        existing_by_slug = {row['slug']: row['id'] for row in existing}
        existing_by_source_title = {}
        for row in existing:
            key = (row['source_id'], row['title'].strip().lower())
            existing_by_source_title[key] = row['id']

        print(f"  Found {len(existing)} existing scholarships in main DB")

        # 2. Get all scholarships from becas_recovery
        print("[3/5] Reading scholarships from becas_recovery...")
        recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        recovery_cur.execute("""
            SELECT id, title, slug, type, coverage, description, official_url, application_url,
                   opening_date, closing_date, status, needs_review, provider_id, source_id,
                   created_at, updated_at, continents
            FROM scholarships
            ORDER BY id
        """)
        scholarships = recovery_cur.fetchall()
        print(f"  Found {len(scholarships)} scholarships in becas_recovery")

        # Get entities from backup
        with open(r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql', 'r', encoding='utf-8') as f:
            content = f.read()

        old_entities = {}
        start = content.find('COPY public.entities')
        if start == -1:
            start = content.find('COPY public.providers')
        if start == -1:
            start = content.find('COPY public.entity')

        if start != -1:
            end = content.find('\.\n', start)
            section = content[start:content.find('\.\n', start)+2]
            for line in section.split('\n'):
                if not line.strip() or line.startswith('COPY') or line.startswith('\.'):
                    continue
                vals = line.strip().split('\t')
                if len(vals) >= 2:
                    eid = int(vals[0]) if vals[0] != '\\N' else None
                    name = vals[1] if vals[1] != '\\N' else None
                    if eid and name:
                        old_entities[eid] = name

        # Sources
        old_sources = {}
        start = content.find('COPY public.sources')
        if start != -1:
            end = content.find('\.\n', start)
            section = content[start:content.find('\.\n', start)+2]
            for line in section.split('\n'):
                if not line.strip() or line.startswith('COPY') or line.startswith('\.'):
                    continue
                vals = line.strip().split('\t')
                if len(vals) >= 2:
                    src_id = int(vals[0]) if vals[0] != '\\N' else None
                    name = vals[1] if vals[1] != '\\N' else None
                    if src_id and name:
                        old_sources[src_id] = name

        # Build provider mapping
        provider_mapping = {}
        for old_id, name in old_entities.items():
            if name in entity_name_to_id:
                provider_mapping[old_id] = entity_name_to_id[name]

        # Build source mapping - we need to match by name
        source_mapping = {}
        for old_id, name in old_sources.items():
            if name in source_name_to_id:
                source_mapping[old_id] = source_name_to_id[name]
            else:
                # Try fuzzy matching
                for main_id, main_name in source_name_to_id.items():
                    if name.lower() in main_name.lower() or main_name.lower() in name.lower():
                        source_mapping[old_id] = main_id
                        break

        print(f"  Mapped {len(provider_mapping)} providers, {len(source_mapping)} sources")

        # Get existing scholarships in main DB for deduplication
        main_cur.execute("SELECT id, title, slug, source_id FROM scholarships")
        existing = main_cur.fetchall()

        existing_by_slug = {row['slug']: row['id'] for row in existing}
        existing_by_source_title = {}
        for row in existing:
            key = (row['source_id'], row['title'].strip().lower())
            existing_by_source_title[key] = row['id']

        print(f"  Found {len(existing)} existing scholarships in main DB")

        # DRY RUN
        print("\n[5/6] DRY RUN - Migration plan:")
        print("-" * 60)

        to_insert = []
        skipped_duplicate = 0
        skipped_fk = 0

        for row in scholarships:
            new_provider_id = provider_mapping.get(row['provider_id'])
            new_source_id = source_mapping.get(row['source_id'])

            if not new_provider_id and row['provider_id']:
                # Try to find entity name from old_entities
                old_ent_name = old_entities.get(row['provider_id'])
                if old_ent_name and old_ent_name in entity_name_to_id:
                    new_provider_id = entity_name_to_id[old_ent_name]

            if not new_provider_id and row['provider_id']:
                print(f"  FK MISSING: provider for '{row['title'][:50]}' (old provider_id={row['provider_id']})")

            if not new_source_id and row['source_id']:
                print(f"  FK MISSING: source for '{row['title'][:50]}' (old source_id={row['source_id']})")

            # Check deduplication
            slug = row['slug']
            if slug in existing_by_slug:
                continue

            key = (new_source_id, row['title'].strip().lower()) if new_source_id else None
            if key and key in existing_by_source_title:
                continue

            if not new_provider_id or not new_source_id:
                continue

            to_insert.append(row)

        print(f"\nDRY RUN SUMMARY:")
        print(f"  Total scholarships in backup: {len(scholarships)}")
        print(f"  Will insert: {len(to_insert)}")
        print(f"  Skipped (duplicate): 0")
        print(f"  Skipped (FK missing): {len(scholarships) - len([r for r in scholarships if provider_mapping.get(r['provider_id']) and source_mapping.get(r['source_id'])])}")

        # Ask for confirmation
        confirm = input("\nProceed with actual INSERT? (yes/no): ").strip().lower()
        if confirm != 'yes':
            print("Aborted by user.")
            return

        # Actual INSERT
        print("\nExecuting INSERT...")
        inserted = 0
        for row in scholarships:
            slug = row['slug']
            if slug in existing_by_slug:
                continue

            new_provider_id = provider_mapping.get(row['provider_id'])
            new_source_id = source_mapping.get(row['source_id'])

            if not new_provider_id or not new_source_id:
                continue

            try:
                main_cur.execute("""
                    INSERT INTO scholarships 
                    (title, slug, type, coverage, description, official_url, application_url,
                     opening_date, closing_date, status, needs_review, provider_id, source_id,
                     created_at, updated_at, continents)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (slug) DO NOTHING
                    RETURNING id
                """, (
                    row['title'], row['slug'], row['type'], row['coverage'],
                    row['description'], row['official_url'], row['application_url'],
                    row['opening_date'], row['closing_date'], row['status'],
                    True,  # needs_review = true
                    provider_mapping.get(row['provider_id']),
                    source_mapping.get(row['source_id']),
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

if __name__ == "__main__":
    main()