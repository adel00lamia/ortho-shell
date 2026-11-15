import { HRWorkspace } from '@/components/hr-workspace/HRWorkspace';
import { buildDemoModel } from '@/lib/hrWorkspace/demoData';
import { DEMO_KEY } from '@/lib/hrWorkspace/storage';

/** Public, fully synthetic demo — never queries company tables. */
export default function HRWorkspaceDemo() {
  return <HRWorkspace storageKey={DEMO_KEY} initial={buildDemoModel} resetTo={buildDemoModel} demo />;
}
