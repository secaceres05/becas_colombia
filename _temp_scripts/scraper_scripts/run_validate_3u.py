import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

settings = get_project_settings()
settings.set("PLAYWRIGHT_LAUNCH_OPTIONS", {"headless": False}, priority="cmdline")

process = CrawlerProcess(settings)
process.crawl("becas_spider", ids="145,79,120")
process.start()