import { Bug } from '../types/index.js';
import xml2js from 'xml2js';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class BugzillaExportImportService {
  public static exportToBugzillaXml(bugs: Bug[]): string {
    let xml = `<?xml version="1.0" standalone="yes" ?>\n<!DOCTYPE bugzilla SYSTEM "https://bugzilla.mozilla.org/bugzilla.dtd">\n<bugzilla version="5.0.4" urlbase="https://omnibug.local/" maintainer="admin@omnibug.dev">\n`;

    for (const bug of bugs) {
      xml += `  <bug>\n`;
      xml += `    <bug_id>${bug.bugNumber}</bug_id>\n`;
      xml += `    <creation_ts>${escapeXml(bug.createdAt)}</creation_ts>\n`;
      xml += `    <short_desc><![CDATA[${bug.title}]]></short_desc>\n`;
      xml += `    <delta_ts>${escapeXml(bug.updatedAt)}</delta_ts>\n`;
      xml += `    <reporter_accessible>1</reporter_accessible>\n`;
      xml += `    <cclist_accessible>1</cclist_accessible>\n`;
      xml += `    <product>${escapeXml(bug.productName)}</product>\n`;
      xml += `    <component>${escapeXml(bug.componentName)}</component>\n`;
      xml += `    <version>${escapeXml(bug.version)}</version>\n`;
      xml += `    <bug_status>${escapeXml(bug.status)}</bug_status>\n`;
      xml += `    <resolution>${escapeXml(bug.resolution || '')}</resolution>\n`;
      xml += `    <bug_severity>${escapeXml(bug.severity)}</bug_severity>\n`;
      xml += `    <priority>${escapeXml(bug.priority)}</priority>\n`;
      xml += `    <assigned_to>${escapeXml(bug.assigneeName)}</assigned_to>\n`;
      xml += `    <reporter>${escapeXml(bug.reporterName)}</reporter>\n`;
      if (bug.targetMilestone) {
        xml += `    <target_milestone>${escapeXml(bug.targetMilestone)}</target_milestone>\n`;
      }
      for (const b of bug.blocks) {
        xml += `    <blocked>${escapeXml(b.replace('bug-', ''))}</blocked>\n`;
      }
      for (const d of bug.dependsOn) {
        xml += `    <dependson>${escapeXml(d.replace('bug-', ''))}</dependson>\n`;
      }
      for (const flag of bug.flags) {
        xml += `    <flag name="${escapeXml(flag.name)}" status="${escapeXml(flag.status)}" setter="${escapeXml(flag.setterName)}" requestee="${escapeXml(flag.requesteeName)}" />\n`;
      }
      xml += `    <long_desc isprivate="0">\n`;
      xml += `      <who>${escapeXml(bug.reporterName)}</who>\n`;
      xml += `      <bug_when>${escapeXml(bug.createdAt)}</bug_when>\n`;
      xml += `      <thetext><![CDATA[${bug.description}]]></thetext>\n`;
      xml += `    </long_desc>\n`;

      for (const comment of bug.comments) {
        xml += `    <long_desc isprivate="${comment.isInternal ? 1 : 0}">\n`;
        xml += `      <who>${escapeXml(comment.authorName)}</who>\n`;
        xml += `      <bug_when>${escapeXml(comment.createdAt)}</bug_when>\n`;
        xml += `      <thetext><![CDATA[${comment.text}]]></thetext>\n`;
        xml += `    </long_desc>\n`;
      }
      xml += `  </bug>\n`;
    }

    xml += `</bugzilla>`;
    return xml;
  }

  public static async importFromBugzillaXml(xmlContent: string): Promise<Partial<Bug>[]> {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);

    const rawBugs = result.bugzilla?.bug;
    if (!rawBugs) return [];

    const bugArray = Array.isArray(rawBugs) ? rawBugs : [rawBugs];
    const parsedBugs: Partial<Bug>[] = [];

    for (const b of bugArray) {
      let desc = '';
      if (b.long_desc) {
        const descArray = Array.isArray(b.long_desc) ? b.long_desc : [b.long_desc];
        desc = descArray[0]?.thetext || '';
      }

      parsedBugs.push({
        title: b.short_desc || 'Imported Bug',
        description: desc,
        status: b.bug_status || 'NEW',
        resolution: b.resolution || null,
        severity: b.bug_severity || 'normal',
        priority: b.priority || 'P3',
        productName: b.product || 'Quantum Web Platform',
        componentName: b.component || 'Layout & CSS Engine',
        version: b.version || '1.0',
        targetMilestone: b.target_milestone,
      });
    }

    return parsedBugs;
  }
}
