import sqlite3

conn = sqlite3.connect(r'C:\Users\JUAN\Desktop\becas-colombia-main\scraper\scraper_checkpoint.db')
cur = conn.cursor()

# Reset 'ok' universities to 'pendiente' so spider will re-process them
cur.execute('UPDATE checkpoint SET status="pendiente", error_msg="" WHERE status="ok"')
conn.commit()
print(f'Updated {cur.rowcount} universities from ok to pendiente')

# Also clear error statuses that might be transient
cur.execute('UPDATE checkpoint SET status="pendiente", error_msg="" WHERE status IN ("error_llm", "error_playwright")')
conn.commit()
print(f'Updated {cur.rowcount} more from error states to pendiente')

conn.close()