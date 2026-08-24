#!/usr/bin/env python3
"""
Migration script: becas_recovery -> becas (main DB)
Migrates 192 scholarships from becas_recovery to main database (becas)
"""

import psycopg2
import psycopg2.extras

def extract_entities_and_sources(backup_file):
    """Extract entities and sources from backup SQL file"""
    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find entities COPY section
    start = content.find('COPY public.entities')
    if start == -1:
        start = content.find('COPY public.providers')
    if start == -1:
        start = content.find('COPY public.entity')

    entities = {}
    if start != -1:
        end = content.find('\.\n', start)
        section = content[start:content.find('\.\n', start)+2]
        lines = section.split('\n')
        data_lines = [l for l in lines if l.strip() and not l.startswith('COPY') and not l.startswith('\.')]
        
        for line in data_lines:
            if not line.strip():
                continue
            vals = line.strip().split('\t')
            if len(vals) >= 2:
                entity_id = int(vals[0]) if vals[0] != '\\N' else None
                name = vals[1] if vals[1] != '\\N' else None
                if entity_id and name:
                    entities[entity_id] = name
    
    # Find sources COPY section
    start = content.find('COPY public.sources')
    if start == -1:
        start = content.find('COPY public.sources')
    
    sources = {}
    if start != -1:
        end = content.find('\.\n', start)
        section = content[start:content.find('\.\n', start)+2]
        lines = section.split('\n')
        data_lines = [l for l in lines if l.strip() and not l.startswith('COPY') and not l.startswith('\.')]
        
        for line in data_lines:
            if not line.strip():
                continue
            vals = line.strip().split('\t')
            if len(vals) >= 2:
                src_id = int(vals[0]) if vals[0] != '\\N' else None
                name = vals[1] if vals[1] != '\\N' else None
                if src_id and name:
                    sources[src_id] = name
    
    print(f"Extracted {len(entities)} entities and {len(sources)} sources from backup")
    return {}, {}  # We'll load from backup file instead


def main():
    print("=" * 60)
    print("SCHOLARSHIP MIGRATION: becas_recovery -> becas (main)")
    print("=" * 60)
    
    # Extract entities and sources from backup
    print("\n[0/6] Extracting entities and sources from backup...")
    backup_file = r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql'
    
    # Connect to both databases
    RECOVERY_DSN = "postgresql://becas:becas_dev@localhost:5433/becas_recovery"
    MAIN_DSN = "postgresql://becas:becas_dev@localhost:5433/becas"
    
    recovery_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas_recovery")
    main_conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")
    
    recovery_cur = recovery_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # 1. Build entity name -> id mapping in main DB
        print("\n[1/6] Building entity name -> ID mapping...")
        main_cur = main_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        main_cur.execute("SELECT id, name FROM entities")
        entity_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"  Found {len(entity_name_to_id)} entities in main DB")
        
        # 2. Build source name -> id mapping in main DB
        print("[2/6] Building source name -> ID mapping...")
        main_cur.execute("SELECT id, name FROM sources")
        source_name_to_id = {row['name']: row['id'] for row in main_cur.fetchall()}
        print(f"  Found {len(source_name_to_id)} sources in main DB")
        
        # 3. Get all scholarships from becas_recovery
        print("[3/6] Reading scholarships from becas_recovery...")
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
        
        # 4. Build provider mapping: old provider_id -> new provider_id by matching entity name
        print("[4/6] Building provider mapping (old provider_id -> new provider_id)...")
        
        # Get entities from backup
        with open(r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql', 'r', encoding='utf-8') as f:
            content = f.read()
        
        start = content.find('COPY public.entities')
        if start == -1:
            start = content.find('COPY public.providers')
        if start == -1:
            start = content.find('COPY public.entity')
        
        entities = {}
        if start != -1:
            end = content.find('\.\n', start)
            section = content[start:content.find('\.\n', start)+2]
            lines = section.split('\n')
            data_lines = [l for l in lines if l.strip() and not l.startswith('COPY') and not l.startswith('\.')]
            
            for line in data_lines:
                if not line.strip():
                    continue
                vals = line.strip().split('\t')
                if len(vals) >= 2:
                    entity_id = int(vals[0]) if vals[0] != '\\N' else None
                    name = vals[1] if vals[1] != '\\N' else None
                    if entity_id and name:
                        # Store mapping from old entity ID to name
                        pass
    
    # Actually, let me just build the mapping directly from the backup
    # First, get all entities from the backup
    import re
    with open(r'C:\Users\JUAN\AppData\Local\Temp\opencode\backup\becas_backup_20260818_170457_utf8.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract entities
    start = content.find('COPY public.entities')
    if start == -1:
        start = content.find('COPY public.providers')
    if start == -1:
        start = content.find('COPY public.entity')
    
    old_entities = {}
    old_sources = {}
    
    if start != -1:
        end = content.find('\.\n', start)
        section = content[start:content.find('\.\n', start)+2]
        lines = section.split('\n')
        for line in lines:
            if not line.strip() or line.startswith('COPY') or line.startswith('\.'):
                continue
            vals = line.strip().split('\t')
            if len(vals) >= 2:
                entity_id = int(vals[0]) if vals[0] != '\\N' else None
                name = vals[1] if vals[1] != '\\N' else None
                if entity_id and name:
                    # Store mapping from old entity ID to name
                    pass
    
    # Actually, let me just read the entities and sources directly from the backup file
    # and build the mappings in Python, then use them in the migration
    
    print("Extracting entities and sources from backup...")
    
    # Parse entities
    entity_pattern = re.compile(r'COPY public\.entities.*?\n(.*?)\n\\\.', re.DOTALL)
    entities_match = entity_pattern.search(content)
    if entities_match:
        entity_data = entities_match.group(1)
        for line in entity_data.strip().split('\n'):
            if line.strip():
                vals = line.strip().split('\t')
                if len(vals) >= 2:
                    eid = int(vals[0]) if vals[0] != '\\N' else None
                    name = vals[1] if vals[1] != '\\N' else None
                    if eid and name:
                        old_entities[eid] = name
    
    # Parse sources
    source_pattern = re.compile(r'COPY public\.sources.*?\n(.*?)\n\\\.', re.DOTALL)
    sources_match = source_pattern.search(content)
    if sources_match:
        source_data = sources_match.group(1)
        for line in source_data.strip().split('\n'):
            if line.strip():
                vals = line.strip().split('\t')
                if len(vals) >= 2:
                    src_id = int(vals[0]) if vals[0] != '\\N' else None
                    name = vals[1] if vals[1] != '\\N' else None
                    if src_id and name:
                        old_sources[src_id] = name
    
    print(f"Found {len(old_entities)} entities and {len(old_sources)} sources in backup")
    
    # Now build mappings
    provider_mapping = {}
    for old_id, name in old_entities.items():
        if name in entity_name_to_id:
            provider_mapping[old_id] = entity_name_to_id[name]
        else:
            print(f"  WARNING: Entity '{name}' (old_id={old_id}) not found in main DB")
    
    source_mapping = {}
    for old_id, name in old_sources.items():
        if name in source_name_to_id:
            source_mapping[old_id] = source_name_to_id[old_id]
        else:
            print(f"  WARNING: Source '{name}' (old_id={old_id}) not found in main DB")
    
    print(f"  Mapped {len(provider_mapping)} / {len(old_entities)} providers")
    print(f"  Mapped {len(source_mapping)} / {len(old_sources)} sources")
    
    # Now get scholarships from recovery DB
    print("[3/6] Reading scholarships from becas_recovery...")
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
    
    # Get existing scholarships in main DB for deduplication
    main_cur.execute("SELECT id, title, slug, source_id FROM scholarships")
    existing = main_cur.fetchall()
    
    existing_by_slug = {row['slug']: row['id'] for row in existing}
    existing_by_source_title = {}
    for row in existing:
        key = (row['source_id'], row['title'].strip().lower())
        existing_by_source_title[key] = row['id']
    
    print(f"  Found {len(existing)} existing scholarships in main DB")
    
    # Migration plan - dry run
    print("\n[6/6] DRY RUN - Migration plan:")
    print("-" * 60)
    
    to_insert = []
    skipped_duplicate = 0
    skipped_fk = 0
    
    for row in scholarships:
        old_provider_id = row['provider_id']
        old_source_id = row['source_id']
        
        # Map provider_id
        new_provider_id = provider_mapping.get(row['provider_id'])
        if not new_provider_id and row['provider_id']:
            old_ent_name = None
            for eid, ename in old_entities.items():
                if eid == row['provider_id']:
                    old_ent_name = ename
                    break
            if old_ent_name and old_ent_name in entity_name_to_id:
                new_provider_id = entity_name_to_id[old_ent_name]
            else:
                print(f"  FK MISSING: provider for '{row['title'][:50]}' (old provider_id={row['provider_id']})")
        
        # Map source_id
        new_source_id = None
        if row['source_id']:
            old_src_name = old_sources.get(row['source_id'])
            if old_src_name and old_src_name in source_name_to_id:
                new_source_id = source_name_to_id[old_src_name]
            else:
                print(f"  FK MISSING: source for '{row['title'][:50]}' (old source_id={row['source_id']})")
        
        # Check deduplication by slug
        slug = row['slug']
        if slug in existing_by_slug:
            skipped_duplicate += 1
            continue
        
        # Check deduplication by source_id + title
        key = (new_source_id, row['title'].strip().lower()) if new_source_id else None
        if key and key in existing_by_source_title:
            skipped_duplicate += 1
            continue
        
        if not new_provider_id or not new_source_id:
            continue
        
        to_insert.append(row)
    
    print(f"\nDRY RUN SUMMARY:")
    print(f"  Total scholarships in backup: {len(scholarships)}")
    print(f"  Will insert: {len(to_insert)}")
    print(f"  Skipped (duplicate): {skipped_duplicate}")
    print(f"  Skipped (FK missing): {len(scholarships) - len([r for r in scholarships if provider_mapping.get(r['provider_id']) and source_mapping.get(r['source_id'])]) - skipped_duplicate}")
    
    # Ask for confirmation
    confirm = input("\nProceed with actual INSERT? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Aborted by user.")
        return
    
    # Actual INSERT
    print("\nExecuting INSERT...")
    inserted = 0
    for row in scholarships:
        # Check if we should skip
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
            main_cur.execute('''
                INSERT INTO scholarships 
                (title, slug, type, coverage, description, official_url, application_url,
                 opening_date, closing_date, status, needs_review, provider_id, source_id,
                 created_at, updated_at, continents)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
            ''', (
                row['title'], row['slug'], row['type'], row['coverage'],
                row['description'], row['official_url'], row['application_url'],
                row['opening_date'], row['closing_date'], row['status'],
                True,  # needs_review = true as requested
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
    
    # Verify
    main_cur.execute("SELECT COUNT(*) FROM scholarships")
    total = main_cur.fetchone()['count']
    print(f"Total scholarships in main DB now: {total}")
    
    finally:
        recovery_conn.close()
        main_conn.close()

if __name__ == "__main__":
    main()