import { db } from '../db/database';
import { countries } from '../db/schemas/countries.schema';
import { eq, and, or, not } from 'drizzle-orm';
import type {
  CountryDto,
  CreateCountryDto,
  UpdateCountryDto,
} from './countries.types';
import {
  NotFoundError,
  ValidationError,
  DuplicateError,
} from '../../shared/errors';

export class CountryHandler {
  async create(data: CreateCountryDto): Promise<CountryDto> {
    try {
      const [country] = await db.insert(countries).values(data).returning();
      return country;
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async findOne(id: number): Promise<CountryDto> {
    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, id))
      .limit(1);

    if (!country) {
      throw new NotFoundError('Country not found');
    }

    return country;
  }

  async update(id: number, data: UpdateCountryDto): Promise<CountryDto> {
    try {
      // Verify country exists
      await this.findOne(id);

      // Check for duplicates if name or code is being updated
      if (data.name || data.code) {
        const [existing] = await db
          .select()
          .from(countries)
          .where(
            and(
              or(
                eq(countries.name, data.name || ''),
                eq(countries.code, data.code || ''),
              ),
              not(eq(countries.id, id)),
            ),
          );

        if (existing) {
          throw new DuplicateError(
            'Country with this name or code already exists',
          );
        }
      }

      const [updated] = await db
        .update(countries)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(countries.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async delete(id: number): Promise<CountryDto> {
    // Verify country exists
    await this.findOne(id);
    const [deletedCountry] = await db
      .delete(countries)
      .where(eq(countries.id, id))
      .returning();
    return deletedCountry;
  }

  async findAll(): Promise<{ countries: CountryDto[] }> {
    const countriesList = await db
      .select()
      .from(countries)
      .orderBy(countries.name);

    return {
      countries: countriesList,
    };
  }
}

export const countryHandler = new CountryHandler();
