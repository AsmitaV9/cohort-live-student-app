import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';

import { requireDb } from '@/lib/firebase';

/**
 * Proctored GATE mock tests live on the web portal (laptop + webcam). The app only
 * lists them for the student's department, opens them in the browser and shows
 * published results. Data model: cohort-live-trainer-web, CLAUDE.md section 8.
 */
export const PORTAL_URL = (process.env.EXPO_PUBLIC_PORTAL_URL || 'https://cohortlive-portal.netlify.app').replace(/\/$/, '');

const VISIBLE = ['approved', 'ended', 'evaluated', 'results_published'];

export type MockExam = {
  id: string;
  title: string;
  windowStart: number;
  windowEnd: number;
  durationMin: number;
  totalQuestions: number;
  totalMarks: number;
  status: string;
  attempt?: string;
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
};

const ms = (t: unknown) => (t instanceof Timestamp ? t.toMillis() : typeof t === 'number' ? t : 0);

export async function loadMockExams(uid: string, department: string): Promise<MockExam[]> {
  const db = requireDb();
  const snap = await getDocs(
    query(collection(db, 'exams'), where('departments', 'array-contains', department), where('status', 'in', VISIBLE)),
  );
  const list = await Promise.all(
    snap.docs.map(async (d) => {
      const e = d.data();
      const a = await getDoc(doc(db, 'exams', d.id, 'attempts', uid)).catch(() => null);
      return {
        id: d.id,
        title: String(e.title ?? 'Mock test'),
        windowStart: ms(e.windowStart),
        windowEnd: ms(e.windowEnd),
        durationMin: Number(e.durationMin) || 0,
        totalQuestions: Number(e.totalQuestions) || 0,
        totalMarks: Number(e.totalMarks) || 0,
        status: String(e.status),
        attempt: a?.exists() ? String(a.data().status) : undefined,
      };
    }),
  );
  return list.sort((a, b) => b.windowStart - a.windowStart);
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
      };
    })
    .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
}

export type ExamState = { label: string; tone: 'live' | 'upcoming' | 'done' | 'closed' | 'bad'; canOpen: boolean; hint: string };

export function examState(e: MockExam, now = Date.now()): ExamState {
  const done = e.attempt === 'submitted' || e.attempt === 'auto_closed' || e.attempt === 'terminated';
  if (done && e.status === 'results_published') return { label: 'Result out', tone: 'done', canOpen: false, hint: 'See your result below.' };
  if (e.attempt === 'terminated') return { label: 'Terminated', tone: 'bad', canOpen: false, hint: 'Ended by proctoring. Contact your proctor.' };
  if (done) return { label: 'Submitted', tone: 'done', canOpen: false, hint: 'Results appear after the admin publishes them.' };
  if (e.attempt === 'in_progress' || e.attempt === 'paused') return { label: 'In progress', tone: 'live', canOpen: true, hint: 'Resume on the laptop you started on.' };
  if (e.status !== 'approved' || now >= e.windowEnd) return { label: 'Closed', tone: 'closed', canOpen: false, hint: 'The exam window has closed.' };
  if (now < e.windowStart) return { label: 'Upcoming', tone: 'upcoming', canOpen: true, hint: 'Opens at the time shown.' };
  return { label: 'Live now', tone: 'live', canOpen: true, hint: 'Take it on a laptop with a webcam.' };
}

export const examUrl = (examId: string) => `${PORTAL_URL}/student/exam/${encodeURIComponent(examId)}`;
export const resultUrl = (examId: string, download?: 'scorecard' | 'certificate') =>
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
