import { describe, test, expect } from 'vitest';
import { toJsonResume } from './jsonResume';
import { SITE_ORIGIN } from './format';
import type { ResumeModel } from './types';

const model: ResumeModel = {
  header: {
    name: 'Test Person',
    email: 'a@b.com',
    phone: '555-1234',
    location: 'White Plains, NY',
    links: [{ label: 'GitHub', url: 'https://github.com/x' }],
  },
  experience: [
    {
      org: 'BigCo',
      displayOrg: 'BigCo',
      title: 'Engineer',
      dateRange: { start: '2022-01', end: 'present' },
      bullets: ['Did a thing.'],
      sourceSlugs: ['a'],
    },
    {
      org: 'SecretCo',
      displayOrg: 'Confidential (under NDA)',
      title: 'Eng',
      dateRange: { start: '2019-01', end: '2020-06' },
      bullets: ['Under NDA.'],
      sourceSlugs: ['b'],
    },
  ],
  projects: [{ title: 'Game', year: 2024, slug: 'game', stack: ['Unity', 'C#'], summary: 'A game.' }],
  skills: [
    { group: 'Engineering', items: ['Unity', 'C#'] },
    { group: 'Languages', items: ['English (native)', 'Spanish (fluent)'] },
  ],
  education: [{ institution: 'Pratt', credential: "Bachelor's Degree", year: '2003' }],
};

describe('toJsonResume', () => {
  const jr = toJsonResume(model);

  test('basics map header (location parsed, links → profiles, site url)', () => {
    expect(jr.basics.name).toBe('Test Person');
    expect(jr.basics.email).toBe('a@b.com');
    expect(jr.basics.phone).toBe('555-1234');
    expect(jr.basics.url).toBe(SITE_ORIGIN);
    expect(jr.basics.location).toEqual({ city: 'White Plains', region: 'NY' });
    expect(jr.basics.profiles).toEqual([{ network: 'GitHub', url: 'https://github.com/x' }]);
  });

  test('ongoing role omits endDate; closed role keeps it', () => {
    expect(jr.work[0]).toMatchObject({ name: 'BigCo', position: 'Engineer', startDate: '2022-01' });
    expect(jr.work[0]).not.toHaveProperty('endDate');
    expect(jr.work[1].endDate).toBe('2020-06');
  });

  test('work uses the masked displayOrg (respects NDA)', () => {
    expect(jr.work[1].name).toBe('Confidential (under NDA)');
  });

  test('education credential → studyType, year → endDate', () => {
    expect(jr.education[0]).toEqual({
      institution: 'Pratt',
      studyType: "Bachelor's Degree",
      endDate: '2003',
    });
  });

  test('skills exclude Languages; Languages section is parsed', () => {
    expect(jr.skills).toEqual([{ name: 'Engineering', keywords: ['Unity', 'C#'] }]);
    expect(jr.languages).toEqual([
      { language: 'English', fluency: 'native' },
      { language: 'Spanish', fluency: 'fluent' },
    ]);
  });

  test('projects map title/year/stack/summary + absolute site url', () => {
    expect(jr.projects[0]).toEqual({
      name: 'Game',
      startDate: '2024',
      description: 'A game.',
      keywords: ['Unity', 'C#'],
      url: `${SITE_ORIGIN}/projects/game/`,
    });
  });

  test('carries a $schema and meta', () => {
    expect(jr.$schema).toContain('jsonresume');
    expect(jr.meta.canonical).toBe(SITE_ORIGIN);
  });
});
