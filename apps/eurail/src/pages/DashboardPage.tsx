// The dashboard — the exhaustive, browse-it-yourself surface over the whole corpus. Ten zones,
// each a lens onto one body of evidence. Every claim drills to its source.
import { OrientationZone } from '../components/zones/OrientationZone.js';
import { SnapshotZone } from '../components/zones/SnapshotZone.js';
import { DomainLensesZone } from '../components/zones/DomainLensesZone.js';
import { FindingsZone } from '../components/zones/FindingsZone.js';
import { StrategicFrameZone } from '../components/zones/StrategicFrameZone.js';
import { EngagementZone } from '../components/zones/EngagementZone.js';
import { DocumentLibraryZone } from '../components/zones/DocumentLibraryZone.js';
import { EvidenceExplorerZone } from '../components/zones/EvidenceExplorerZone.js';
import { ConflictLogZone } from '../components/zones/ConflictLogZone.js';
import { MethodologyZone } from '../components/zones/MethodologyZone.js';
import { ChatEntryZone } from '../components/zones/ChatEntryZone.js';

export function DashboardPage() {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
      <OrientationZone />
      <SnapshotZone />
      <DomainLensesZone />
      <FindingsZone />
      <StrategicFrameZone />
      <EngagementZone />
      <DocumentLibraryZone />
      <EvidenceExplorerZone />
      <ConflictLogZone />
      <MethodologyZone />
      <ChatEntryZone />
    </div>
  );
}
