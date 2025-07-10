import { describe, expect, it } from 'vitest';
import { createSlug } from '../shared/utils';

describe('slug-utils', () => {
  describe('createSlug', () => {
    it('should convert a simple string to a slug', () => {
      expect(createSlug('Hello World')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(createSlug('Hello  World')).toBe('hello-world');
    });

    it('should handle accented characters', () => {
      expect(createSlug('México City')).toBe('mexico-city');
    });

    it('should handle complex accented characters', () => {
      expect(createSlug('São Paulo')).toBe('sao-paulo');
    });

    it('should handle more complex examples', () => {
      expect(createSlug('Ciudad de México')).toBe('ciudad-de-mexico');
      expect(createSlug('Nuevo León')).toBe('nuevo-leon');
      expect(createSlug('Coahuila de Zaragoza')).toBe('coahuila-de-zaragoza');
    });

    it('should handle strings with numeric and special characters', () => {
      expect(createSlug('City 123')).toBe('city-123');
      expect(createSlug('City-Name')).toBe('city-name');
      expect(createSlug('City.Name')).toBe('cityname');
    });

    it('should handle empty strings', () => {
      expect(createSlug('')).toBe('');
      expect(createSlug('   ')).toBe('');
    });

    it('should add prefix when provided', () => {
      expect(createSlug('Terminal Norte', 't')).toBe('t-terminal-norte');
      expect(createSlug('Central Sur', 'term')).toBe('term-central-sur');
    });

    it('should handle prefixes with special characters', () => {
      expect(createSlug('Central', 't.')).toBe('t-central');
      expect(createSlug('Norte', 'T-1')).toBe('t1-norte');
    });

    it('should handle empty prefix', () => {
      expect(createSlug('Terminal', '')).toBe('terminal');
    });

    it('should add suffix when provided', () => {
      expect(createSlug('Terminal Norte', undefined, 'n')).toBe(
        'terminal-norte-n',
      );
      expect(createSlug('Central Sur', undefined, 'sur')).toBe(
        'central-sur-sur',
      );
    });

    it('should handle suffixes with special characters', () => {
      expect(createSlug('Central', undefined, 't.')).toBe('central-t');
      expect(createSlug('Norte', undefined, 'T-1')).toBe('norte-t1');
    });

    it('should handle empty suffix', () => {
      expect(createSlug('Terminal', undefined, '')).toBe('terminal');
    });

    it('should handle both prefix and suffix', () => {
      expect(createSlug('Terminal Norte', 't', 'n')).toBe('t-terminal-norte-n');
      expect(createSlug('Central Sur', 'term', 'sur')).toBe(
        'term-central-sur-sur',
      );
    });

    it('should handle prefix and suffix with special characters', () => {
      expect(createSlug('Central', 't.', 's.')).toBe('t-central-s');
      expect(createSlug('Norte', 'T-1', 'N-2')).toBe('t1-norte-n2');
    });
  });
});
