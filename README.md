# Landomo Scraper: Australia - Belle Property

Scraper for **Belle Property** in **Australia**.

## Overview

This scraper extracts real estate listings from Belle Property and sends them to the Landomo Core Service for standardization and storage.

**Portal URL**: https://www.belleproperty.com
**Country**: Australia
**Status**: Development

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your LANDOMO_API_KEY
   ```

3. **Run scraper**:
   ```bash
   npm start
   ```

4. **Development mode** (auto-reload):
   ```bash
   npm run dev
   ```

## Configuration

### Command Line Options

```bash
# Filter by state
npm start -- --state NSW

# Filter by property type
npm start -- --type house

# Limit number of results
npm start -- --limit 50

# Output as table
npm start -- --output table

# Combined options
npm start -- --state VIC --type apartment --limit 100
```

Available states: NSW, VIC, QLD, WA, SA, TAS, ACT, NT

## Architecture

This scraper follows the standard Landomo scraper pattern:

```
Portal → Scraper → Transformer → Core Service → Core DB
```

### Files

- `src/index.ts` - CLI entry point and command handling
- `src/scraper.ts` - Main scraping logic with pagination
- `src/parser.ts` - HTML parsing and data extraction
- `src/types.ts` - TypeScript type definitions

## Development

### Testing

```bash
# Run with limit to test quickly
npm test

# This runs: tsx src/index.ts --limit 40
```

## Portal-Specific Notes

**Belle Property** (www.belleproperty.com) is an Australian real estate agency network.

### Scraping Details

- **Method**: HTML scraping with Cheerio
- **Authentication**: Not required
- **Rate Limiting**: 1 second delay between requests (configurable)
- **Pagination**: Query parameter based (`pg=1`, `pg=2`, etc.)
- **Geographic Coverage**: All Australian states (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)

### Data Extracted

- Property address (street + suburb)
- Price (displayed text or "Contact Agent")
- Bedrooms, bathrooms, car spaces
- Property type (House, Apartment, Unit, Land)
- Status (For Sale, Sold, Leased, etc.)
- Property images
- Listing URL

## Deployment

This scraper is deployed via GitHub Actions on every push to `main`.

See `.github/workflows/deploy.yml` for deployment configuration.

## Contributing

See the main [Landomo Registry](https://github.com/landomo-com/landomo-registry) for contribution guidelines.

## License

UNLICENSED - Internal use only
