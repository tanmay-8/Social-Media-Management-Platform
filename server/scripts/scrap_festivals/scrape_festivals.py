import csv
import datetime
import logging
import re
import time
from pathlib import Path
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://kalnirnay.co.in/"
MONTH_SLUGS = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
]
OUTPUT_PATH = Path("festivals.csv")

# Headers to mimic a real browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def fetch_month_html(month_slug: str, retries: int = 3) -> str:
    """Fetch HTML for a month page with retry logic."""
    url = f"{BASE_URL}{month_slug}/"
    
    for attempt in range(retries):
        try:
            logging.info("Fetching %s (attempt %d/%d)", url, attempt + 1, retries)
            response = requests.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
            # Be respectful - add a small delay between requests
            time.sleep(1)
            return response.text
        except requests.RequestException as exc:
            if attempt == retries - 1:
                raise
            logging.warning("Attempt %d failed for %s: %s. Retrying...", attempt + 1, month_slug, exc)
            time.sleep(2 ** attempt)  # Exponential backoff
    
    raise requests.RequestException(f"Failed to fetch {url} after {retries} attempts")


def find_festival_table(soup: BeautifulSoup) -> BeautifulSoup | None:
    tables = soup.find_all("table")
    for table in tables:
        header_row = table.find("tr")
        if not header_row:
            continue
        headers = [cell.get_text(strip=True).lower() for cell in header_row.find_all(["th", "td"])]
        if len(headers) >= 3 and "date" in headers[0] and "day" in headers[1] and "festival" in headers[2]:
            return table
    return None


def parse_date(date_str: str) -> Optional[str]:
    """Parse date string in various formats to ISO format."""
    if not date_str or not date_str.strip():
        return None
    
    # Remove time ranges and extra info (e.g., "8:11 PM 10th to 5:27 PM 11th")
    date_str = date_str.strip()
    
    # Try standard format DD.MM.YYYY
    try:
        return datetime.datetime.strptime(date_str, "%d.%m.%Y").date().isoformat()
    except ValueError:
        pass
    
    # Try to extract date from strings like "01.01.2025" even if there's extra text
    date_match = re.search(r"(\d{2}\.\d{2}\.\d{4})", date_str)
    if date_match:
        try:
            return datetime.datetime.strptime(date_match.group(1), "%d.%m.%Y").date().isoformat()
        except ValueError:
            pass
    
    return None


def parse_festivals(html: str, month_slug: str) -> List[Dict[str, str]]:
    """Parse festival data from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    table = find_festival_table(soup)
    if table is None:
        logging.warning("No festival table found for month '%s'", month_slug)
        return []

    rows = []
    for row in table.find_all("tr")[1:]:  # skip header
        cells = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
        if len(cells) < 3:
            continue

        date_label, day_label, festival_label = cells[:3]
        
        # Skip rows with empty festival names
        if not festival_label or not festival_label.strip():
            continue

        # Parse date
        iso_date = parse_date(date_label)
        if not iso_date:
            logging.debug("Unable to parse date '%s' (month: %s)", date_label, month_slug)

        rows.append(
            {
                "date_iso": iso_date or "",
                "date_label": date_label,
                "day": day_label,
                "festival": festival_label,
                "month": month_slug,
                "source_url": f"{BASE_URL}{month_slug}/",
            }
        )
    return rows


def write_csv(rows: List[Dict[str, str]]) -> None:
    """Write festival data to CSV file."""
    if not rows:
        logging.info("No rows to write, skipping CSV creation.")
        return

    # Filter out rows with empty festival names
    valid_rows = [row for row in rows if row.get("festival", "").strip()]
    
    fieldnames = ["date_iso", "date_label", "day", "festival", "month", "source_url"]
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(valid_rows)
    
    logging.info("Wrote %d festival rows to %s", len(valid_rows), OUTPUT_PATH.resolve())
    
    # Print summary statistics
    rows_with_dates = sum(1 for row in valid_rows if row.get("date_iso"))
    logging.info("Summary: %d rows with valid dates, %d rows without dates", 
                 rows_with_dates, len(valid_rows) - rows_with_dates)


def main() -> None:
    """Main function to scrape all festivals and save to CSV."""
    logging.info("Starting festival scraping from %s", BASE_URL)
    all_rows: List[Dict[str, str]] = []
    
    successful_months = 0
    failed_months = []
    
    for month in MONTH_SLUGS:
        try:
            html = fetch_month_html(month)
            month_rows = parse_festivals(html, month)
            logging.info("Found %d festivals for %s", len(month_rows), month)
            all_rows.extend(month_rows)
            successful_months += 1
        except requests.HTTPError as exc:
            logging.error("HTTP error for month '%s': %s", month, exc)
            failed_months.append(month)
        except requests.RequestException as exc:
            logging.error("Request failed for month '%s': %s", month, exc)
            failed_months.append(month)
        except Exception as exc:
            logging.error("Unexpected error for month '%s': %s", month, exc)
            failed_months.append(month)

    write_csv(all_rows)
    
    logging.info("=" * 60)
    logging.info("Scraping completed!")
    logging.info("Successfully scraped: %d months", successful_months)
    if failed_months:
        logging.warning("Failed months: %s", ", ".join(failed_months))
    logging.info("Total festivals collected: %d", len(all_rows))
    logging.info("=" * 60)


if __name__ == "__main__":
    main()

