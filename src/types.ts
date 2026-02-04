export interface PropertyListing {
  address: string;
  price: string;
  bedrooms: number | null;
  bathrooms: number | null;
  cars: number | null;
  propertyType: string;
  status: string;
  images: string[];
  url: string;
}

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export const AUSTRALIAN_STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export interface ScraperOptions {
  state?: AustralianState;
  type?: string;
  limit?: number;
}

export interface ScraperResult {
  listings: PropertyListing[];
  totalPages: number;
  totalListings: number;
}
