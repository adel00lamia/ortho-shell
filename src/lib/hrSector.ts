/** Match technology keywords as words, never as fragments of retail/hospitality. */
export const guessSector = (industry: string | null | undefined): string => {
  const value = (industry || '').toLocaleLowerCase();
  if (/\b(tech|technology|technologies|software|digital|it|internet|data|ai|fintech|edtech|gaming)\b/.test(value)) return 'Tech & digital';
  if (/bank|insur|finance|invest|credit|wealth|accounting/.test(value)) return 'Finance & assurance';
  if (/manufact|industr|automotive|aero|machin|electron|chemical|food|textil|energy|oil|mining|pharma|medical device/.test(value)) return 'Industrie & manufacturing';
  if (/construction|material/.test(value)) return 'BTP & construction';
  if (/retail|fashion|grocery|e-?commerce|supermarket|store|beauty|furniture/.test(value)) return 'Distribution & retail';
  if (/transport|logistic|shipping|airline|truck|delivery/.test(value)) return 'Transport & logistique';
  if (/health|\bhospitals?\b|care|dental|veterinary/.test(value)) return 'Santé & social';
  if (/consult|agency|service|legal|marketing|architecture|engineering|research/.test(value)) return 'Services B2B & conseil';
  return 'Autres / à préciser';
};