import psycopg2
import psycopg2.extras

conn = psycopg2.connect("postgresql://becas:becas_dev@localhost:5433/becas")
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

try:
    cur.execute("SELECT status, COUNT(*) as count FROM scholarships GROUP BY status")
    for row in cur.fetchall():
        print(f"Status {row['status']}: {row['count']}")

    cur.execute("SELECT needs_review, COUNT(*) as count FROM scholarships GROUP BY needs_review")
    for row in cur.fetchall():
        print(f"needs_review={row['needs_review']}: {row['count']}")

    cur.execute("SELECT COUNT(*) FROM scholarships WHERE source_id IS NULL")
    print(f"sourceId = NULL: {cur.fetchone()['count']}")

    cur.execute("SELECT COUNT(*) FROM scholarships WHERE source_id IS NOT NULL")
    print(f"sourceId != NULL: {cur.fetchone()['count']}")

    cur.execute("SELECT COUNT(*) FROM scholarships WHERE provider_id IS NULL")
    print(f"providerId = NULL: {cur.fetchone()['count']}")

    cur.execute("SELECT COUNT(*) FROM scholarships WHERE provider_id IS NOT NULL")
    print(f"providerId != NULL: {cur.fetchone()['count']}")

    cur.execute("SELECT COUNT(*) FROM scholarships")
    print(f"TOTAL: {cur.fetchone()['count']}")

finally:
    cur.close()
    conn.close()