import * as cheerio from 'cheerio';
import type { PropertyListing } from './types.js';

const BASE_URL = 'https://www.belleproperty.com';

/**
 * Parse a single property item from the listing page
 */
function parsePropertyItem($: cheerio.CheerioAPI, element: cheerio.Element): PropertyListing | null {
  const $item = $(element);

  // Get the listing URL from the image link or suburb link
  const linkHref = $item.find('.image a').attr('href') ||
                   $item.find('.suburb a').attr('href');

  if (!linkHref) {
    return null;
  }

  const url = linkHref.startsWith('http') ? linkHref : `${BASE_URL}${linkHref}`;

  // Extract address: suburb from link text, street from address div
  const suburbText = $item.find('.suburb > a').text().trim();
  const streetAddress = $item.find('.address').text().trim();
  const address = streetAddress ? `${streetAddress}, ${suburbText}` : suburbText;

  // Extract price
  const price = $item.find('.price').text().trim() || 'Contact Agent';

  // Extract features (bedrooms, bathrooms, cars)
  const bedrooms = parseFeatureValue($item.find('.feature.bed').text());
  const bathrooms = parseFeatureValue($item.find('.feature.bath').text());
  const cars = parseFeatureValue($item.find('.feature.car').text());

  // Extract status (e.g., "FIRST TO SEE", "Market Preview")
  const statusElement = $item.find('.status');
  let status = statusElement.text().trim() || 'For Sale';

  // Also check price text for status indicators
  if (price.toLowerCase().includes('sold')) {
    status = 'Sold';
  } else if (price.toLowerCase().includes('leased')) {
    status = 'Leased';
  }

  // Extract property type from URL slug if possible
  const propertyType = extractPropertyType(linkHref, address);

  // Extract images
  const images: string[] = [];
  const mainImage = $item.find('.image').attr('data-swiper-image');
  if (mainImage) {
    images.push(mainImage);
  }

  return {
    address,
    price,
    bedrooms,
    bathrooms,
    cars,
    propertyType,
    status,
    images,
    url,
  };
}

/**
 * Parse feature value (bedrooms, bathrooms, cars) from text
 */
function parseFeatureValue(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extract property type based on URL and address patterns
 */
function extractPropertyType(url: string, address: string): string {
  const urlLower = url.toLowerCase();
  const addressLower = address.toLowerCase();

  // Check for unit/apartment patterns
  if (addressLower.match(/^\d+\/\d+/) || addressLower.includes('unit')) {
    return 'Unit';
  }
  if (addressLower.includes('lot ')) {
    return 'Land';
  }
  if (urlLower.includes('apartment') || addressLower.includes('apartment')) {
    return 'Apartment';
  }

  // Default to House for standalone addresses
  return 'House';
}

/**
 * Parse the listings page HTML and extract all property listings
 */
export function parseListingsPage(html: string): PropertyListing[] {
  const $ = cheerio.load(html);
  const listings: PropertyListing[] = [];

  // Find all property items
  $('.property-item').each((_, element) => {
    const listing = parsePropertyItem($, element);
    if (listing) {
      listings.push(listing);
    }
  });

  return listings;
}

/**
 * Check if there is a next page available
 */
export function hasNextPage(html: string): boolean {
  const $ = cheerio.load(html);
  const nextLink = $('.navigation .next a');

  // Check if next link exists and is not disabled
  return nextLink.length > 0 && !nextLink.hasClass('disabled');
}

/**
 * Get the next page number from the current page HTML
 */
export function getNextPageNumber(html: string): number | null {
  const $ = cheerio.load(html);
  const nextLink = $('.navigation .next a');

  if (nextLink.length === 0 || nextLink.hasClass('disabled')) {
    return null;
  }

  const href = nextLink.attr('href');
  if (!href) return null;

  const match = href.match(/pg=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get the total number of listings from the page
 */
export function getTotalListings(html: string): number {
  const $ = cheerio.load(html);

  // Try to find total count from results text
  const resultsText = $('.results-count, .listing-count').text();
  const match = resultsText.match(/(\d+)/);

  if (match) {
    return parseInt(match[1], 10);
  }

  // Fallback: count items on current page
  return $('.property-item').length;
}
