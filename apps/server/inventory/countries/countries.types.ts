// API types
import { MinLen, MatchesRegexp } from 'encore.dev/validate';

/**
 * Base interface representing a country entity
 */
export interface Country {
  /** Unique identifier for the country */
  id: number;

  /** Name of the country */
  name: string;

  /** Whether the country is currently active in the system */
  active: boolean;

  /** ISO country code (e.g., "US", "CA", "MX") */
  code: string;

  /** Timestamp when the country record was created */
  createdAt: Date | null;

  /** Timestamp when the country record was last updated */
  updatedAt: Date | null;
}

export interface CountryDto extends Country {}

/**
 * DTO for creating a new country
 */
export interface CreateCountryDto {
  /**
   * The name of the country
   * Must have at least 1 non-whitespace character
   * Pattern ensures it contains at least one non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The country code (e.g., "US", "MX", "CA")
   * Must have at least 1 non-whitespace character
   * Pattern ensures it contains at least one non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Whether the country is active
   * @default true
   */
  active?: boolean;
}

export interface UpdateCountryDto extends Partial<CreateCountryDto> {}

// Response types
export interface CountryResponse extends CountryDto {}

export interface CountriesResponse {
  countries: CountryResponse[];
}
