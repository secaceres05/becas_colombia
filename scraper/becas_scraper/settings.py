# Scrapy settings for becas_scraper project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html

BOT_NAME = "becas_scraper"

SPIDER_MODULES = ["becas_scraper.spiders"]
NEWSPIDER_MODULE = "becas_scraper.spiders"

# Obey robots.txt rules (no negociable - plan §4)
ROBOTSTXT_OBEY = True

# Identificación honesta
USER_AGENT = "BecasColombiaBot/1.0 (+https://becascolombia.co/bot)"

# Configure maximum concurrent requests performed by Scrapy (default: 16)
CONCURRENT_REQUESTS = 4
CONCURRENT_REQUESTS_PER_DOMAIN = 1

# Configure a delay for requests for the same website (default: 0)
DOWNLOAD_DELAY = 2

# Autothrottle
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2
AUTOTHROTTLE_MAX_DELAY = 30
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.5
AUTOTHROTTLE_DEBUG = False

# Timeout
DOWNLOAD_TIMEOUT = 30

# Reintentos
RETRY_ENABLED = True
RETRY_TIMES = 3
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Playwright
DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
PLAYWRIGHT_BROWSER_TYPE = "chromium"
PLAYWRIGHT_LAUNCH_OPTIONS = {"headless": True}
PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT = 60000

# Disable cookies (disabled by default - no queremos sesiones persistentes)
COOKIES_ENABLED = False

# Disable Telnet Console (enabled by default)
TELNETCONSOLE_ENABLED = False

# No pipeline de items de Scrapy (pipeline propio en pipeline.py)
ITEM_PIPELINES = {}

# Log level
LOG_LEVEL = "INFO"

# Feed exports desactivados (no guardamos items en archivos)
FEEDS = {}
