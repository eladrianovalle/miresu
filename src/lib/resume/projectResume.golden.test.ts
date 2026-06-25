import { describe, test, expect } from 'vitest';
import {
  getProjects,
  getIdentity,
  getSkillsTaxonomy,
  getResumeProjects,
  getEducation,
  getResumeHeader,
} from '@/lib/projects';
import { projectResume } from './projectResume';

// Golden snapshot of the ResumeModel projected from the REAL site content (all
// project JSONs + the resume singletons). This is the safety net for the Phase B
// migrations: any change that unintentionally alters the resume output — the
// surfaces rename, the organization/relationship collapse, etc. — fails here
// until the snapshot is deliberately reviewed and updated with `-u`.
describe('projectResume — golden (live content)', () => {
  test('ResumeModel from live content matches snapshot', async () => {
    const [projects, identity, skills, resumeProjects, education, header] = await Promise.all([
      getProjects(),
      getIdentity(),
      getSkillsTaxonomy(),
      getResumeProjects(),
      getEducation(),
      getResumeHeader(),
    ]);

    const model = projectResume(projects, identity, {
      skills,
      projects: resumeProjects,
      education,
      header,
    });

    expect(model).toMatchSnapshot();
  });
});
