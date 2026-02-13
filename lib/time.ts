import { formatInTimeZone } from 'date-fns-tz';

export const formatDateCandidateRow = (rawDate: string) => {
    const s = (rawDate ?? '').trim();
    if (!s) return '—';
    const hasTZ = /(?:Z|[+\-]\d{2}:\d{2}|GMT)/i.test(s);
    const normalized = hasTZ ? s : `${s.replace(' ', 'T')}Z`;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return rawDate;
    return formatInTimeZone(d, 'UTC', 'dd MMM yyyy hh:mm a', { locale: undefined });
};