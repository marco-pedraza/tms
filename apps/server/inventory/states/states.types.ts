// Base interface
import { MinLen, MatchesRegexp, Min } from 'encore.dev/validate';

export interface State {
  id: number;
  name: string;
  code: string;
  countryId: number;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// DTO interfaces
/**
 * DTO for creating a new state
 */
export interface CreateStateDto {
  /**
   * The name of the state
   * Must have at least 1 non-whitespace character
   * Pattern ensures it contains at least one non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The state code (e.g., "TX", "CA", "NY")
   * Must have at least 1 non-whitespace character
   * Pattern ensures it contains at least one non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The ID of the country this state belongs to
   * Must be a positive number
   */
  countryId: number & Min<1>;

  /**
   * Whether the state is active
   * @default true
   */
  active?: boolean;
}

export interface UpdateStateDto extends Partial<CreateStateDto> {}

export interface StateDto extends State {}

// Response types
export interface StateResponse extends StateDto {}

export interface StatesResponse {
  states: StateResponse[];
}
