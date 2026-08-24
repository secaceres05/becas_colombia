import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

ids_arg = sys.argv[1] if len(sys.argv) > 1 else ""
settings = get_project_settings()
settings.set("PLAYWRIGHT_LAUNCH_OPTIONS", {"headless": False}, priority="cmdline")

process = CrawlerProcess(settings)
process.crawl("becas_spider", ids=ids_arg)
process.start()