import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { requireDb } from '@/lib/firebase';

/**
 * Proctored GATE mock tests live on the web portal (laptop + webcam). The app lists them,
 * opens them in the browser and shows published results. Data model and rules:
 * cohort-live-trainer-web (CLAUDE.md section 8, DECISIONS.md 2026-10-11).
 *
 * Exam list (same as the portal): approved exams for the student's department + batch whose
 * window hasn't ended (Upcoming / Live now), plus exams the student actually took (Completed).
 * The Firestore rules accept only these queries, so nothing else reaches the phone.
 */
export const PORTAL_URL = (process.env.EXPO_PUBLIC_PORTAL_URL || 'https://cohortlive-portal.netlify.app').replace(/\/$/, '');

export type MockExam = {
  id: string;
  title: string;
  windowStart: number;
  windowEnd: number;
  durationMin: number;
  totalQuestions: number;
  totalMarks: number;
  status: string;
  resultsPublished: boolean;
  /** The exam can be taken on a phone (portal exam setting "Allow phones", default off). */
  allowPhones: boolean;
  attempt?: string;
  submittedAt?: number | null;
};

export type MockResult = {
  examId: string;
  examTitle: string;
  total: number;
  maxMarks: number;
  percent: number;
  rank: number | null;
  candidates: number | null;
  percentile: number | null;
  pass: boolean;
  submittedAt: number | null;
  /** One certificate per student: rank (top N) or participation; null if the attempt was terminated. */
  certificate: 'rank' | 'participation' | null;
};

const ms = (t: unknown) => (t instanceof Timestamp ? t.toMillis() : typeof t === 'number' ? t : 0);
const DONE = ['submitted', 'auto_closed', 'terminated'];

/**
 * Audience keys, same as studentAudience() in the portal: department, batch, and the
 * per-student key of exams that are "Only enrolled students" (enrolled via link, code or admin).
 */
export function studentAudience(department: string, batch?: string, uid?: string): string[] {
  const keys = batch ? [`${department}|*`, `${department}|${batch}`] : [`${department}|*`];
  return uid ? [...keys, `${department}|u:${uid}`] : keys;
}

function toExam(id: string, e: Record<string, any>): MockExam {
  return {
    id,
    title: String(e.title ?? 'Mock test'),
    windowStart: ms(e.windowStart),
    windowEnd: ms(e.windowEnd),
    durationMin: Number(e.durationMin) || 0,
    totalQuestions: Number(e.totalQuestions) || 0,
    totalMarks: Number(e.totalMarks) || 0,
    status: String(e.status),
    resultsPublished: e.resultsPublished === true,
    allowPhones: e.allowPhones === true,
  };
}

export async function loadMockExams(uid: string, department: string, batch?: string): Promise<MockExam[]> {
  const db = requireDb();
  const [open, mine] = await Promise.all([
    getDocs(
      query(
        collection(db, 'exams'),
        where('audience', 'array-contains-any', studentAudience(department, batch, uid)),
        where('status', '==', 'approved'),
        where('windowEnd', '>', Timestamp.now()),
      ),
    ),
    getDocs(query(collectionGroup(db, 'attempts'), where('uid', '==', uid))),
  ]);
  const byId = new Map<string, MockExam>();
  open.docs.forEach((d) => byId.set(d.id, toExam(d.id, d.data())));
  const attempts = mine.docs.map((d) => ({ examId: d.ref.parent.parent!.id, status: String(d.data().status ?? ''), submittedAt: ms(d.data().submittedAt) || null }));
  const extra = await Promise.all(attempts.filter((a) => !byId.has(a.examId)).map((a) => getDoc(doc(db, 'exams', a.examId)).catch(() => null)));
  // Archived exams are hidden from students (the portal does the same).
  extra.forEach((s) => s?.exists() && s.data().archived !== true && byId.set(s.id, toExam(s.id, s.data())));
  for (const a of attempts) {
    const e = byId.get(a.examId);
    if (e) Object.assign(e, { attempt: a.status, submittedAt: a.submittedAt });
  }
  return [...byId.values()];
}

export type ExamGroups = { live: MockExam[]; upcoming: MockExam[]; completed: MockExam[] };

export function groupExams(list: MockExam[], now = Date.now()): ExamGroups {
  const g: ExamGroups = { live: [], upcoming: [], completed: [] };
  for (const e of list) {
    const open = e.status === 'approved' && now < e.windowEnd;
    const done = !!e.attempt && DONE.includes(e.attempt);
    if (done || !open) {
      if (e.attempt) g.completed.push(e);
    } else if (now < e.windowStart && !e.attempt) g.upcoming.push(e);
    else g.live.push(e);
  }
  g.live.sort((a, b) => a.windowEnd - b.windowEnd);
  g.upcoming.sort((a, b) => a.windowStart - b.windowStart);
  g.completed.sort((a, b) => (b.submittedAt ?? b.windowStart) - (a.submittedAt ?? a.windowStart));
  return g;
}

/** Only published results are readable (security rules), so this is exactly the student's released results. */
export async function loadMyResults(uid: string): Promise<MockResult[]> {
  const snap = await getDocs(query(collection(requireDb(), 'results'), where('uid', '==', uid), where('published', '==', true)));
  return snap.docs
    .map((d) => {
      const r = d.data();
      return {
        examId: String(r.examId),
        examTitle: String(r.examTitle ?? ''),
        total: Number(r.total) || 0,
        maxMarks: Number(r.maxMarks) || 0,
        percent: Number(r.percent) || 0,
        rank: r.rank ?? null,
        candidates: r.candidates ?? null,
        percentile: r.percentile ?? null,
        pass: r.pass === true,
        submittedAt: ms(r.submittedAt) || null,
        certificate: r.certificates?.rank ? ('rank' as const) : r.certificates?.participation ? ('participation' as const) : null,
      };
    })
    .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
}

export type ExamState = { label: string; tone: 'live' | 'upcoming' | 'done' | 'closed' | 'bad'; canOpen: boolean; hint: string };

export function examState(e: MockExam, now = Date.now()): ExamState {
  const done = !!e.attempt && DONE.includes(e.attempt);
  if (e.attempt === 'terminated') return { label: 'Terminated', tone: 'bad', canOpen: false, hint: e.resultsPublished ? 'Results are published.' : 'Ended by proctoring. Contact your proctor.' };
  if (done && e.resultsPublished) return { label: 'Result out', tone: 'done', canOpen: false, hint: 'See My Results.' };
  if (done) return { label: 'Submitted', tone: 'done', canOpen: false, hint: 'Results appear after the admin publishes them.' };
  if (e.attempt === 'in_progress' || e.attempt === 'paused') {
    return now < e.windowEnd && e.status === 'approved'
      ? { label: 'In progress', tone: 'live', canOpen: true, hint: e.allowPhones ? 'Resume on the device you started on.' : 'Resume on the laptop you started on.' }
      : { label: 'Closed', tone: 'closed', canOpen: false, hint: 'The exam has closed; your saved answers will be evaluated.' };
  }
  if (now < e.windowStart) return { label: 'Upcoming', tone: 'upcoming', canOpen: true, hint: 'Opens at the time shown.' };
  return { label: 'Live now', tone: 'live', canOpen: true, hint: e.allowPhones ? 'Take it on a laptop, or on this phone (this exam allows phones).' : 'Take it on a laptop with a webcam.' };
}

export type Announcement = { id: string; text: string; scope: string; examId?: string; examTitle?: string; department?: string; byName: string; at: number | null; expiresAt: number | null };

/** Everyone / department / exam announcements for this student, newest first (rules check the same keys). */
export async function loadAnnouncements(department: string, batch: string | undefined, examIds: Set<string>, uid?: string): Promise<Announcement[]> {
  const snap = await getDocs(
    query(
      collection(requireDb(), 'announcements'),
      where('audience', 'array-contains-any', ['all', ...studentAudience(department, batch, uid)]),
      orderBy('at', 'desc'),
      limit(20),
    ),
  );
  const dismissed = await getDismissed();
  const now = Date.now();
  return snap.docs
    .map((d) => {
      const a = d.data();
      return { id: d.id, text: String(a.text ?? ''), scope: String(a.scope ?? ''), examId: a.examId, examTitle: a.examTitle, department: a.department, byName: String(a.byName ?? ''), at: ms(a.at) || null, expiresAt: ms(a.expiresAt) || null };
    })
    .filter((a) => !dismissed.includes(a.id) && (!a.expiresAt || a.expiresAt > now) && (a.scope !== 'exam' || (a.examId && examIds.has(a.examId))));
}

const DISMISSED_KEY = 'cl-dismissed-announcements';
async function getDismissed(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(DISMISSED_KEY)) || '[]');
  } catch {
    return [];
  }
}
export async function dismissAnnouncement(id: string) {
  const list = [...(await getDismissed()), id].slice(-200);
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(list)).catch(() => undefined);
}

export const examUrl = (examId: string) => `${PORTAL_URL}/student/exams/${encodeURIComponent(examId)}/instructions`;
/** The portal's three student downloads: Result Report, Answer Key & Solutions, Certificate. */
export type ResultDownload = 'report' | 'answers' | 'certificate';
export const resultUrl = (examId: string, download?: ResultDownload) =>
  `${PORTAL_URL}/student/results/${encodeURIComponent(examId)}${download ? `?download=${download}` : ''}`;

/** All times in IST (CLAUDE.md 11). */
export function fmtIst(msValue: number | null): string {
  if (!msValue) return '—';
  try {
    return (
      new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(msValue) +
      ' IST'
    );
  } catch {
    // Hermes without full Intl: shift to UTC+05:30 by hand.
    const d = new Date(msValue + 330 * 60_000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} IST`;
  }
}
