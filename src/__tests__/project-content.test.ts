import { describe, test, expect } from 'vitest';
import {
  ProjectBaseSchema,
  GameProjectSchema,
  ClientProjectSchema,
  PersonalCategorySchema,
  IdentitySchema,
} from '@/types/project-content';

// --- Fixtures ---

const validBase = {
  slug: 'test-project',
  title: 'Test Project',
  description: 'A test project for schema validation.',
  image: '/assets/images/test.png',
  role: 'Lead Developer',
  organization: 'ORC PUNK',
  relationship: 'own' as const,
  status: 'released' as const,
  year: 2025,
};

const validIdentity = {
  name: 'Adriano',
  role: 'Creative Technologist',
  tagline: 'Building weird things on the internet.',
  bio: 'Game developer and creative technologist based in Chicago.',
  id: 'OPR-001',
  established: 2020,
  email: 'hello@orcpunk.com',
  socialLinks: [
    { platform: 'github', url: 'https://github.com/orcpunk' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/orcpunk', label: 'LinkedIn' },
  ],
  availability: {
    status: 'available' as const,
    message: 'Open to new projects.',
  },
};

// --- ProjectBaseSchema ---

describe('ProjectBaseSchema', () => {
  test('validates a complete project object', () => {
    const result = ProjectBaseSchema.safeParse({
      ...validBase,
      subtitle: 'The subtitle',
      thumbnail: '/assets/images/thumb.png',
      contributors: [
        { name: 'Jane', role: 'Artist', url: 'https://jane.dev' },
      ],
      featured: true,
      draft: false,
      links: [
        { label: 'Website', url: 'https://example.com', type: 'website' },
      ],
      tags: ['cyberpunk', 'strategy'],
      video: { src: '/video.mp4', poster: '/poster.png', type: 'hero' },
      confidential: false,
      testimonial: {
        quote: 'Great work!',
        author: 'Client',
        role: 'CEO',
        company: 'Acme',
      },
      gallery: ['/img1.png', '/img2.png'],
    });
    expect(result.success).toBe(true);
  });

  test('rejects project missing required slug field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug, ...noSlug } = validBase;
    const result = ProjectBaseSchema.safeParse(noSlug);
    expect(result.success).toBe(false);
  });

  test('rejects project with invalid status value "unknown"', () => {
    const result = ProjectBaseSchema.safeParse({
      ...validBase,
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});

// --- GameProjectSchema ---

describe('GameProjectSchema', () => {
  test('accepts storeLinks with platform enum values', () => {
    const result = GameProjectSchema.safeParse({
      ...validBase,
      platforms: ['PC', 'Mac'],
      storeLinks: [
        { platform: 'steam', url: 'https://store.steampowered.com/app/123' },
        { platform: 'itch', url: 'https://orcpunk.itch.io/game', enabled: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('rejects storeLinks with invalid platform "nintendo"', () => {
    const result = GameProjectSchema.safeParse({
      ...validBase,
      platforms: ['Switch'],
      storeLinks: [
        { platform: 'nintendo', url: 'https://nintendo.com/game' },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// --- ClientProjectSchema ---

describe('ClientProjectSchema', () => {
  test('accepts optional scope and clientLogo', () => {
    const result = ClientProjectSchema.safeParse({
      ...validBase,
      relationship: 'client',
      scope: 'Full-cycle build.',
      clientLogo: '/assets/logo.png',
    });
    expect(result.success).toBe(true);
  });

  test('requires organization and relationship (from base)', () => {
    const noOrg: Record<string, unknown> = { ...validBase };
    delete noOrg.organization;
    expect(ClientProjectSchema.safeParse(noOrg).success).toBe(false);
    const noRel: Record<string, unknown> = { ...validBase };
    delete noRel.relationship;
    expect(ClientProjectSchema.safeParse(noRel).success).toBe(false);
  });
});

// --- PersonalCategorySchema ---

describe('PersonalCategorySchema', () => {
  test('accepts medium and collaborationType', () => {
    const result = PersonalCategorySchema.safeParse({
      ...validBase,
      medium: 'Interactive Installation',
      collaborationType: 'Solo',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.medium).toBe('Interactive Installation');
      expect(result.data.collaborationType).toBe('Solo');
    }
  });
});

// --- IdentitySchema ---

describe('IdentitySchema', () => {
  test('validates complete identity object', () => {
    const result = IdentitySchema.safeParse(validIdentity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Adriano');
      expect(result.data.availability.status).toBe('available');
    }
  });
});
