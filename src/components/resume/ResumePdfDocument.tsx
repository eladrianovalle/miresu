import type { ReactNode } from 'react';
import { Document, Page, Text, View, Link, StyleSheet } from '@react-pdf/renderer';
import type {
  ResumeModel,
  ResumeHeader,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
  SkillGroup,
} from '@/lib/resume/types';
import { contactFields, formatDateRange, cleanUrl, projectPath, SITE_ORIGIN } from '@/lib/resume/format';

// Brand-NEUTRAL, ATS-parseable. Built-in Standard-14 fonts only (Helvetica
// family) — no Font.register, no font files, no icon fonts. Single column,
// linear top-to-bottom. Bullets are literal "•" text glyphs (extractable),
// not CSS-generated markers. The on-site HTML view (src/app/resume/page.tsx)
// carries the site's visual brand; this downloadable PDF deliberately does not.
const COLORS = {
  ink: '#1a1a1a',
  muted: '#52525b',
  faint: '#71717a',
  rule: '#d4d4d8',
  ruleStrong: '#3f3f46',
};

// Tuned for a confident single-page fit on A4 while staying readable: ~9.5pt
// body, controlled line-heights, and tight-but-even section rhythm.
const styles = StyleSheet.create({
  page: {
    paddingTop: 27,
    paddingBottom: 20,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.4,
  },
  // Header
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    letterSpacing: 0.4,
    lineHeight: 1.1,
    marginBottom: 6,
  },
  // Contact: a wrap-capable row of whole-item units. Fits one line at 8pt today;
  // if any item ever lengthens it wraps at an item boundary (each unit is
  // wrap={false}) — never mid-URL, and the separator trails its item so a wrap
  // can't orphan a "•" at the start of a line.
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', rowGap: 2 },
  contactItem: { flexDirection: 'row', alignItems: 'baseline' },
  contactText: { fontSize: 8, color: COLORS.faint },
  contactSep: { fontSize: 8, color: COLORS.rule, marginHorizontal: 4 },
  headerRule: {
    marginTop: 7,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.ruleStrong,
  },
  // Sections
  section: { marginTop: 8 },
  sectionHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: COLORS.ink,
    marginBottom: 5,
    paddingBottom: 2.5,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.rule,
  },
  // Experience entry
  entry: { marginBottom: 4 },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1.5,
  },
  entryTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10.5 },
  entryOrg: { fontFamily: 'Helvetica', fontSize: 10, color: COLORS.muted },
  entryDates: {
    fontSize: 8.5,
    color: COLORS.faint,
    letterSpacing: 0.3,
  },
  bulletRow: { flexDirection: 'row', marginTop: 1 },
  bulletGlyph: { width: 11, fontSize: 8.5, color: COLORS.faint },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.27, color: COLORS.muted },
  // Projects — portfolio highlights, title links to the live site page.
  project: { marginBottom: 4 },
  projectTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: COLORS.ink,
    textDecoration: 'none',
  },
  projectStack: {
    fontSize: 8.5,
    color: COLORS.faint,
    letterSpacing: 0.3,
    marginTop: 0.5,
    marginBottom: 1.5,
  },
  projectSummary: { fontSize: 9.5, lineHeight: 1.27, color: COLORS.muted },
  // Skills — tight label column keeps the items column wide (fewer wraps).
  skillGroupRow: { marginBottom: 2, flexDirection: 'row' },
  skillGroupLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    width: 116,
    paddingRight: 10,
  },
  skillGroupItems: { flex: 1, fontSize: 9.5, lineHeight: 1.35, color: COLORS.muted },
  // Education
  eduRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  eduCredential: { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  eduInstitution: { fontSize: 9.5, color: COLORS.muted },
  eduDates: { fontSize: 8.5, color: COLORS.faint },
});

function HeaderBlock({ header }: { header: ResumeHeader }) {
  // Order/presence come from contactFields (shared with the HTML view); the PDF
  // renders every field as plain text, cleanUrl'd for links. Fits one line at
  // 8pt; wraps gracefully at item boundaries if content grows (styles.contactRow).
  const items = contactFields(header).map((f) => (f.kind === 'link' ? cleanUrl(f.url) : f.value));
  return (
    <View>
      <Text style={styles.name}>{header.name}</Text>
      <View style={styles.contactRow}>
        {items.map((item, i) => (
          <View key={i} style={styles.contactItem} wrap={false}>
            <Text style={styles.contactText}>{item}</Text>
            {i < items.length - 1 ? <Text style={styles.contactSep}>•</Text> : null}
          </View>
        ))}
      </View>
      <View style={styles.headerRule} />
    </View>
  );
}

// A section: heading + pre-rendered item Views. The heading is bound to its
// FIRST item inside a wrap={false} block, so a page break can never strand the
// heading at the foot of a page without content — they move to the next page
// together. Remaining items flow and break normally.
function Section({ title, items }: { title: string; items: ReactNode[] }) {
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{title}</Text>
        {first}
      </View>
      {rest}
    </View>
  );
}

function ExperienceSection({ entries }: { entries: ExperienceEntry[] }) {
  const items = entries.map((entry, i) => (
    <View key={`${entry.org}-${i}`} style={styles.entry} wrap={false}>
      <View style={styles.entryHeaderRow}>
        <Text style={styles.entryTitle}>
          {entry.title}
          <Text style={styles.entryOrg}>{`  —  ${entry.displayOrg}`}</Text>
        </Text>
        <Text style={styles.entryDates}>{formatDateRange(entry.dateRange)}</Text>
      </View>
      {entry.bullets.map((bullet, b) => (
        <View key={b} style={styles.bulletRow}>
          <Text style={styles.bulletGlyph}>{'•'}</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  ));
  return <Section title="Experience" items={items} />;
}

function ProjectsSection({ entries }: { entries: ProjectEntry[] }) {
  const items = entries.map((project, i) => (
    <View key={`${project.slug}-${i}`} style={styles.project} wrap={false}>
      <View style={styles.entryHeaderRow}>
        <Link src={`${SITE_ORIGIN}${projectPath(project.slug)}`} style={styles.projectTitle}>
          {project.title}
        </Link>
        <Text style={styles.entryDates}>{String(project.year)}</Text>
      </View>
      <Text style={styles.projectStack}>{project.stack.join(', ')}</Text>
      <Text style={styles.projectSummary}>{project.summary}</Text>
    </View>
  ));
  return <Section title="Projects" items={items} />;
}

function SkillsSection({ skills }: { skills: SkillGroup[] }) {
  const items = skills.map((group, i) => (
    <View key={`${group.group}-${i}`} style={styles.skillGroupRow}>
      <Text style={styles.skillGroupLabel}>{group.group}</Text>
      <Text style={styles.skillGroupItems}>{group.items.join(', ')}</Text>
    </View>
  ));
  return <Section title="Skills" items={items} />;
}

function EducationSection({ entries }: { entries: EducationEntry[] }) {
  const items = entries.map((edu, i) => (
    <View key={`${edu.institution}-${i}`} style={styles.eduRow}>
      <Text>
        <Text style={styles.eduCredential}>{edu.credential}</Text>
        <Text style={styles.eduInstitution}>{`  —  ${edu.institution}`}</Text>
      </Text>
      {edu.year ? <Text style={styles.eduDates}>{edu.year}</Text> : null}
    </View>
  ));
  return <Section title="Education" items={items} />;
}

export interface ResumePdfDocumentProps {
  model: ResumeModel;
}

export function ResumePdfDocument({ model }: ResumePdfDocumentProps) {
  return (
    <Document title={`${model.header.name} — Resume`} author={model.header.name}>
      <Page size="A4" style={styles.page}>
        <HeaderBlock header={model.header} />

        <SkillsSection skills={model.skills} />
        <ExperienceSection entries={model.experience} />
        <ProjectsSection entries={model.projects} />
        <EducationSection entries={model.education} />
      </Page>
    </Document>
  );
}

export default ResumePdfDocument;
