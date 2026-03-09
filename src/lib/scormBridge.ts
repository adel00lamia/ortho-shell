/**
 * SCORM 1.2 API Adapter
 * Implements the SCORM 1.2 Runtime Environment (RTE) API
 * that SCORM packages expect to find on window.API
 *
 * Reference: https://scorm.com/scorm-explained/technical-scorm/run-time/
 */

export interface ScormData {
  'cmi.core.lesson_status': string;
  'cmi.core.lesson_location': string;
  'cmi.core.score.raw': string;
  'cmi.core.score.min': string;
  'cmi.core.score.max': string;
  'cmi.core.session_time': string;
  'cmi.core.total_time': string;
  'cmi.core.exit': string;
  'cmi.suspend_data': string;
  'cmi.core.student_name': string;
  'cmi.core.student_id': string;
  [key: string]: string;
}

export type ScormEventCallback = (event: {
  type: 'initialize' | 'commit' | 'finish' | 'setValue';
  key?: string;
  value?: string;
  data: ScormData;
}) => void;

const DEFAULT_DATA: ScormData = {
  'cmi.core.lesson_status': 'not attempted',
  'cmi.core.lesson_location': '',
  'cmi.core.score.raw': '',
  'cmi.core.score.min': '0',
  'cmi.core.score.max': '100',
  'cmi.core.session_time': '0000:00:00',
  'cmi.core.total_time': '0000:00:00',
  'cmi.core.exit': '',
  'cmi.suspend_data': '',
  'cmi.core.student_name': '',
  'cmi.core.student_id': '',
};

export function createScormAPI(
  studentName: string,
  studentId: string,
  savedData: Partial<ScormData> | null,
  onEvent: ScormEventCallback
) {
  const data: ScormData = {
    ...DEFAULT_DATA,
    ...savedData,
    'cmi.core.student_name': studentName,
    'cmi.core.student_id': studentId,
  };

  let initialized = false;
  let finished = false;
  let lastError = '0';

  const api = {
    LMSInitialize(_param: string): string {
      if (initialized) { lastError = '101'; return 'false'; }
      initialized = true;
      lastError = '0';

      // If previously suspended, set status back
      if (data['cmi.core.lesson_status'] === 'not attempted') {
        data['cmi.core.lesson_status'] = 'incomplete';
      }

      onEvent({ type: 'initialize', data });
      return 'true';
    },

    LMSFinish(_param: string): string {
      if (!initialized) { lastError = '301'; return 'false'; }
      finished = true;
      initialized = false;
      lastError = '0';
      onEvent({ type: 'finish', data });
      return 'true';
    },

    LMSGetValue(key: string): string {
      if (!initialized) { lastError = '301'; return ''; }
      lastError = '0';
      return data[key] ?? '';
    },

    LMSSetValue(key: string, value: string): string {
      if (!initialized) { lastError = '301'; return 'false'; }
      lastError = '0';
      data[key] = value;
      onEvent({ type: 'setValue', key, value, data });
      return 'true';
    },

    LMSCommit(_param: string): string {
      if (!initialized) { lastError = '301'; return 'false'; }
      lastError = '0';
      onEvent({ type: 'commit', data });
      return 'true';
    },

    LMSGetLastError(): string {
      return lastError;
    },

    LMSGetErrorString(code: string): string {
      const errors: Record<string, string> = {
        '0': 'No Error',
        '101': 'General Exception',
        '201': 'Invalid Argument Error',
        '202': 'Element Cannot Have Children',
        '203': 'Element Not An Array',
        '301': 'Not Initialized',
        '401': 'Not Implemented Error',
        '402': 'Invalid Set Value',
        '403': 'Element Is Read Only',
        '404': 'Element Is Write Only',
        '405': 'Incorrect Data Type',
      };
      return errors[code] || 'Unknown Error';
    },

    LMSGetDiagnostic(_code: string): string {
      return '';
    },
  };

  return { api, getData: () => ({ ...data }) };
}

/**
 * Install the SCORM API on an iframe's window
 */
export function installScormAPI(
  iframe: HTMLIFrameElement,
  api: ReturnType<typeof createScormAPI>['api']
) {
  try {
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) return;

    // SCORM 1.2 expects window.API
    (iframeWindow as any).API = api;

    // Also set on parent chain (some SCORM packages walk up)
    (window as any).API = api;
  } catch {
    // Cross-origin - set on window only
    (window as any).API = api;
  }
}

/**
 * Cleanup SCORM API from window
 */
export function cleanupScormAPI() {
  delete (window as any).API;
}
