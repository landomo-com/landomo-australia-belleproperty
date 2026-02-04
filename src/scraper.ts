import type { AustralianState, PropertyListing, ScraperOptions, ScraperResult } from './types.js';
import { parseListingsPage, hasNextPage, getNextPageNumber } from './parser.js';

// Simple logger implementation
const logger = {
  info: (message: string) => console.log(message),
  error: (message: string) => console.error(message),
};

const BASE_URL = 'https://www.belleproperty.com/listings';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Delay between requests to be respectful
const REQUEST_DELAY_MS = 1000;

/**
 * Build the URL for a listings page with optional filters
 */
function buildUrl(page: number, options: ScraperOptions): string {
  const params = new URLSearchParams();

  params.set('pg', page.toString());
  params.set('searchStatus', 'buy');
  params.set('propertyType', 'residential');
  params.set('sort', 'newold');

  if (options.state) {
    params.set('state', options.state.toLowerCase());
  } else {
    params.set('state', 'all');
  }

  if (options.type) {
    params.set('ptype', options.type);
  }

  return `${BASE_URL}?${params.toString()}`;
}

/**
 * Fetch a page with error handling and retries
 */
async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-AU,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Attempt ${attempt}/${retries} failed for ${url}: ${message}`);

      if (attempt === retries) {
        throw error;
      }

      // Wait before retry with exponential backoff
      await sleep(REQUEST_DELAY_MS * attempt);
    }
  }

  throw new Error('Failed to fetch page after retries');
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape Belle Property listings with optional filters
 */
export async function scrapeListings(options: ScraperOptions = {}): Promise<ScraperResult> {
  const listings: PropertyListing[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMore = true;

  logger.info(`Starting Belle Property scraper...`);
  if (options.state) {
    logger.info(`Filtering by state: ${options.state}`);
  }
  if (options.limit) {
    logger.info(`Limit: ${options.limit} listings`);
  }

  while (hasMore) {
    const url = buildUrl(currentPage, options);
    logger.info(`Fetching page ${currentPage}: ${url}`);

    try {
      const html = await fetchPage(url);
      const pageListings = parseListingsPage(html);

      logger.info(`Found ${pageListings.length} listings on page ${currentPage}`);

      for (const listing of pageListings) {
        listings.push(listing);

        // Check if we've reached the limit
        if (options.limit && listings.length >= options.limit) {
          logger.info(`Reached limit of ${options.limit} listings`);
          hasMore = false;
          break;
        }
      }

      // Check for next page
      if (hasMore) {
        const nextPage = getNextPageNumber(html);
        if (nextPage) {
          totalPages = Math.max(totalPages, nextPage);
          currentPage = nextPage;

          // Be respectful - wait between requests
          await sleep(REQUEST_DELAY_MS);
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching page ${currentPage}: ${message}`);
      hasMore = false;
    }
  }

  logger.info(`Scraping complete. Total listings: ${listings.length}`);

  return {
    listings,
    totalPages,
    totalListings: listings.length,
  };
}

/**
 * Scrape listings for a specific state
 */
export async function scrapeByState(state: AustralianState, limit?: number): Promise<PropertyListing[]> {
  const result = await scrapeListings({ state, limit });
  return result.listings;
}
