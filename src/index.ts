#!/usr/bin/env node

import { Command } from 'commander';
import { scrapeListings } from './scraper.js';
import { AUSTRALIAN_STATES, type AustralianState, type ScraperOptions } from './types.js';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('module');

const program = new Command();

program
  .name('belleproperty-scraper')
  .description('Scrape property listings from Belle Property Australia')
  .version('1.0.0')
  .option('-s, --state <state>', `Filter by state (${AUSTRALIAN_STATES.join(', ')})`)
  .option('-t, --type <type>', 'Filter by property type (e.g., house, apartment, unit, land)')
  .option('-l, --limit <number>', 'Maximum number of listings to scrape', parseInt)
  .option('-o, --output <format>', 'Output format: json or table', 'json')
  .action(async (opts) => {
    try {
      // Validate state option
      if (opts.state) {
        const stateUpper = opts.state.toUpperCase() as AustralianState;
        if (!AUSTRALIAN_STATES.includes(stateUpper)) {
          logger.error(`Invalid state: ${opts.state}. Valid states: ${AUSTRALIAN_STATES.join(', ')}`);
          process.exit(1);
        }
        opts.state = stateUpper;
      }

      const options: ScraperOptions = {
        state: opts.state,
        type: opts.type,
        limit: opts.limit,
      };

      logger.info('\n=== Belle Property Scraper ===\n');

      const result = await scrapeListings(options);

      logger.info('\n=== Results ===\n');

      if (opts.output === 'table') {
        // Table output
        logger.info(`Total listings: ${result.totalListings}\n`);

        for (const listing of result.listings) {
          logger.info('---');
          logger.info(`Address: ${listing.address}`);
          logger.info(`Price: ${listing.price}`);
          logger.info(`Beds: ${listing.bedrooms ?? '-'} | Baths: ${listing.bathrooms ?? '-'} | Cars: ${listing.cars ?? '-'}`);
          logger.info(`Type: ${listing.propertyType} | Status: ${listing.status}`);
          logger.info(`URL: ${listing.url}`);
          if (listing.images.length > 0) {
            logger.info(`Images: ${listing.images.length}`);
          }
        }
        logger.info('---');
      } else {
        // JSON output
        logger.info('Data dump', result));
      }

      logger.info(`\nTotal listings scraped: ${result.totalListings}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
