import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  LiveKitRoom,
  VideoTrack,
  useRoomContext,
  useTracks,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { PORTAL_URL } from '@/lib/mock-tests';

/**
 * LiveKit access tokens come from the portal's livekit-token function, which checks the
 * Firebase ID token and only admits students to a class that is live right now
 * (replaces LiveKit's development token server).
 */
const TOKEN_URL = `${PORTAL_URL}/api/livekit-token`;

type Session = {
  id: string;
  courseId?: string;
  courseTitle: string;
  roomName: string;
  trainerName: string;
  status: string;
};

type Quiz = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  active: boolean;
};

async function getConnectionDetails(roomName: string, idToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error || `Could not get access to the live class (${response.status}).`
    );
  }

  const data = await response.json();

  const url = data.serverUrl;
  const token = data.participantToken;

  if (!url || !token) {
    throw new Error(
      'Live classroom token was not returned.'
    );
  }

  return { url, token };
}

export default function MeetingScreen() {
  const { firebaseUser, profile } = useAuth();

  const [session, setSession] =
    useState<Session | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [serverUrl, setServerUrl] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Find the newest currently-live classroom.
   */
  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError('Firebase is not configured.');
      return;
    }

    const liveQuery = query(
      collection(db, 'liveClassrooms'),
      where('status', '==', 'live')
    );

    const unsubscribe = onSnapshot(
      liveQuery,
      (snap) => {
        if (snap.empty) {
          setSession(null);
          setLoading(false);
          return;
        }

        const liveSessions = snap.docs
          .map((document) => {
            const data = document.data();

            return {
              id: document.id,
              courseId: data.courseId,
              courseTitle: String(
                data.courseTitle ?? 'Live Classroom'
              ),
              roomName: String(data.roomName ?? ''),
              trainerName: String(
                data.trainerName ?? 'Trainer'
              ),
              status: String(
                data.status ?? 'live'
              ),
              startedAtSeconds:
                typeof data.startedAt?.seconds === 'number'
                  ? data.startedAt.seconds
                  : 0,
            };
          })
          .filter(
            (item) => item.roomName.length > 0
          );

        liveSessions.sort(
          (a, b) =>
            b.startedAtSeconds -
            a.startedAtSeconds
        );

        const latestSession = liveSessions[0];

        if (!latestSession) {
          setSession(null);
          setLoading(false);
          return;
        }

        setSession({
          id: latestSession.id,
          courseId: latestSession.courseId,
          courseTitle: latestSession.courseTitle,
          roomName: latestSession.roomName,
          trainerName: latestSession.trainerName,
          status: latestSession.status,
        });

        setLoading(false);
      },
      (snapshotError) => {
        console.error(
          'Live classroom listener error:',
          snapshotError
        );

        setError(
          'Could not find the live classroom.'
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /*
   * Get a fresh LiveKit token for the current room.
   *
   * The identity is unique for every new visit to
   * the meeting screen.
   */
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!session || !firebaseUser) {
        return;
      }

      setError('');
      setToken(null);
      setServerUrl(null);

      try {
        // The function names the participant from the student's profile.
        const details = await getConnectionDetails(
          session.roomName,
          await firebaseUser.getIdToken()
        );

        if (cancelled) {
          return;
        }

        setServerUrl(details.url);
        setToken(details.token);
      } catch (connectionError) {
        console.error(
          'LiveKit connection preparation error:',
          connectionError
        );

        if (!cancelled) {
          setError(
            'Unable to connect to the live classroom.'
          );
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
    };
  }, [session, firebaseUser, profile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loading}>
          Checking for a live classroom...
        </Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.icon}>🎓</Text>

        <Text style={styles.title}>
          No live class right now
        </Text>

        <Text style={styles.body}>
          Your camera and microphone will not start
          until a trainer has started a live classroom.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Back to Dashboard
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>
          Connecting...
        </Text>

        <Text style={styles.body}>
          {error ||
            'Preparing the live classroom...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        audio={true}
        video={true}
        options={{
          adaptiveStream: {
            pixelDensity: 'screen',
          },
        }}
      >
        <MeetingContent
          session={session}
          firebaseUser={firebaseUser}
          profile={profile}
        />
      </LiveKitRoom>
    </SafeAreaView>
  );
}

function MeetingContent({
  session,
  firebaseUser,
  profile,
}: {
  session: Session;
  firebaseUser: any;
  profile: any;
}) {
  const room = useRoomContext();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [attendanceRef, setAttendanceRef] = useState<any>(null);

  const trackReferences = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);

  const cameraTracks = useMemo(
    () =>
      trackReferences.filter(
        (trackRef) =>
          trackRef.source === Track.Source.Camera &&
          !!trackRef.participant
      ),
    [trackReferences]
  );

  const screenTracks = useMemo(
    () =>
      trackReferences.filter(
        (trackRef) =>
          trackRef.source === Track.Source.ScreenShare &&
          !!trackRef.publication?.track
      ),
    [trackReferences]
  );

  const localIdentity = room.localParticipant.identity;

  const localCameraTrack = useMemo(
    () =>
      cameraTracks.find(
        (trackRef) => trackRef.participant.identity === localIdentity
      ) ?? null,
    [cameraTracks, localIdentity]
  );

  const remoteCameraTracks = useMemo(
    () =>
      cameraTracks.filter(
        (trackRef) => trackRef.participant.identity !== localIdentity
      ),
    [cameraTracks, localIdentity]
  );

  const trainerName = String(session.trainerName ?? '').trim().toLowerCase();

  const trainerTrack = useMemo(
    () =>
      remoteCameraTracks.find(
        (trackRef) =>
          String(trackRef.participant.name ?? '').trim().toLowerCase() === trainerName
      ) ?? remoteCameraTracks[0] ?? null,
    [remoteCameraTracks, trainerName]
  );

  const otherRemoteTracks = useMemo(
    () =>
      remoteCameraTracks.filter(
        (trackRef) => trackRef !== trainerTrack
      ),
    [remoteCameraTracks, trainerTrack]
  );

  useEffect(() => {
    if (!db || !firebaseUser) return;

    const ref = doc(collection(db, 'attendance'));
    setAttendanceRef(ref);

    setDoc(ref, {
      studentId: firebaseUser.uid,
      studentName: profile?.name || firebaseUser.email || 'Student',
      sessionId: session.id,
      courseTitle: session.courseTitle,
      roomName: session.roomName,
      joinedAt: serverTimestamp(),
      leftAt: null,
    }).catch((attendanceError) => {
      console.error('Attendance save error:', attendanceError);
    });

    return () => {
      updateDoc(ref, { leftAt: serverTimestamp() }).catch(() => undefined);
    };
  }, [session.id, session.courseTitle, session.roomName, firebaseUser, profile]);

  useEffect(() => {
    if (!db) return;

    const quizQuery = query(
      collection(db, 'liveClassrooms', session.id, 'quizzes'),
      where('active', '==', true)
    );

    return onSnapshot(
      quizQuery,
      (snap) => {
        if (snap.empty) {
          setQuiz(null);
          setSelected(null);
          setSubmitted(false);
          setCorrect(null);
          return;
        }

        const document = snap.docs[0];
        const data = document.data();
        setQuiz({
          id: document.id,
          question: String(data.question ?? ''),
          options: Array.isArray(data.options) ? data.options.map(String) : [],
          correctAnswer: String(data.correctAnswer ?? ''),
          active: true,
        });
        setSelected(null);
        setSubmitted(false);
        setCorrect(null);
      },
      (quizError) => console.error('Quiz listener error:', quizError)
    );
  }, [session.id]);

  useEffect(() => {
    return () => {
      try {
        room.disconnect();
      } catch {
        // ignore cleanup errors
      }
    };
  }, [room]);

  async function toggleMic() {
    const next = !micEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch (error) {
      console.error('Microphone toggle error:', error);
    }
  }

  async function toggleCamera() {
    const next = !cameraEnabled;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setCameraEnabled(next);
    } catch (error) {
      console.error('Camera toggle error:', error);
    }
  }

  async function submitAnswer() {
    if (!quiz || !selected || submitted || !firebaseUser || !db) return;

    const isCorrect = selected === quiz.correctAnswer;
    setCorrect(isCorrect);
    setSubmitted(true);

    try {
      await setDoc(
        doc(
          db,
          'liveClassrooms',
          session.id,
          'quizzes',
          quiz.id,
          'responses',
          firebaseUser.uid
        ),
        {
          studentId: firebaseUser.uid,
          studentName: profile?.name || firebaseUser.email || 'Student',
          answer: selected,
          correct: isCorrect,
          answeredAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error('Quiz answer submission error:', error);
    }
  }

  async function leave() {
    if (attendanceRef) {
      await updateDoc(attendanceRef, { leftAt: serverTimestamp() }).catch(() => undefined);
    }

    try {
      await room.disconnect();
    } catch {
      // ignore cleanup errors
    }

    router.back();
  }

  const totalCameraParticipants = Math.max(cameraTracks.length, 0);
  const gridColumns = landscape
    ? totalCameraParticipants <= 1
      ? 1
      : totalCameraParticipants <= 4
        ? 2
        : 3
    : totalCameraParticipants <= 2
      ? 1
      : 2;

  function initials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'P';
  }

  const tileWidth =
    gridColumns === 1
      ? '100%'
      : gridColumns === 2
        ? '49%'
        : '32%';

  function renderVideoCard(trackRef: any, local = false) {
    const participant = trackRef.participant;
    const name = local
      ? 'You'
      : String(participant?.name || participant?.identity || 'Participant');
    const hasTrack = !!trackRef.publication?.track;
    const muted = !!trackRef.publication?.isMuted;
    const videoOff = !hasTrack || muted;

    return (
      <View
        key={participant.identity}
        style={[
          styles.participantTile,
          {
            width: tileWidth,
            aspectRatio: landscape ? 16 / 9 : 1.42,
          },
        ]}
      >
        {videoOff ? (
          <View style={styles.videoOff}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
            <Text style={styles.videoOffText}>Video is off</Text>
          </View>
        ) : (
          <VideoTrack
            trackRef={trackRef}
            style={styles.video}
            objectFit="contain"
            mirror={local}
          />
        )}

        <View style={styles.videoNameBadge}>
          <Text style={styles.videoNameText}>{name}</Text>
        </View>
      </View>
    );
  }

  const allCameraTracks = [
    ...(trainerTrack ? [trainerTrack] : []),
    ...otherRemoteTracks,
    ...(localCameraTrack ? [localCameraTrack] : []),
  ];

  const uniqueCameraTracks = allCameraTracks.filter(
    (trackRef, index, array) =>
      array.findIndex(
        (candidate) =>
          candidate.participant.identity === trackRef.participant.identity
      ) === index
  );

  return (
    <View style={styles.room}>
      <View
        style={[
          styles.header,
          landscape && styles.headerLandscape,
        ]}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.brand}>COHORT LIVE</Text>
          <Text style={styles.course} numberOfLines={1}>
            {session.courseTitle}
          </Text>
          <Text style={styles.trainer}>
            Trainer: {session.trainerName}
          </Text>
        </View>
        <View style={styles.live}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.videoScroll}
        contentContainerStyle={[
          styles.videoScrollContent,
          landscape && styles.videoScrollContentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {screenTracks.length > 0 && (
          <View
            style={[
              styles.screenShareContainer,
              landscape && styles.screenShareLandscape,
              { aspectRatio: 16 / 9 },
            ]}
          >
            <VideoTrack
              trackRef={screenTracks[0]}
              style={styles.video}
              objectFit="contain"
            />
            <View style={styles.screenShareBadge}>
              <Text style={styles.screenShareBadgeText}>Trainer screen</Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.videoGrid,
            {
              paddingHorizontal: landscape ? 10 : 8,
            },
          ]}
        >
          {uniqueCameraTracks.map((trackRef) =>
            renderVideoCard(
              trackRef,
              trackRef.participant.identity === localIdentity
            )
          )}
        </View>

        {uniqueCameraTracks.length === 0 && (
          <View style={styles.noVideoStage}>
            <Text style={styles.noVideoIcon}>📹</Text>
            <Text style={styles.noVideoTitle}>Waiting for participants</Text>
          </View>
        )}

        <View style={styles.controls}>
          <Pressable
            style={[styles.control, !micEnabled && styles.off]}
            onPress={toggleMic}
          >
            <Text style={styles.controlText}>
              {micEnabled ? '🎙️ Mic On' : '🔇 Mic Off'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.control, !cameraEnabled && styles.off]}
            onPress={toggleCamera}
          >
            <Text style={styles.controlText}>
              {cameraEnabled ? '📷 Camera On' : '🚫 Video Off'}
            </Text>
          </Pressable>

          <Pressable style={styles.leaveButton} onPress={leave}>
            <Text style={styles.leaveText}>Leave</Text>
          </Pressable>
        </View>

        {quiz ? (
          <View style={styles.quizCard}>
            <Text style={styles.quizBadge}>LIVE MCQ</Text>
            <Text style={styles.quizQuestion}>{quiz.question}</Text>

            {quiz.options.map((option, index) => (
              <Pressable
                key={option}
                disabled={submitted}
                onPress={() => setSelected(option)}
                style={[
                  styles.option,
                  selected === option && styles.optionSelected,
                  submitted && option === quiz.correctAnswer && styles.optionCorrect,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    selected === option && styles.optionLetterSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}

            {!submitted ? (
              <Pressable
                disabled={!selected}
                style={[styles.submit, !selected && styles.disabled]}
                onPress={submitAnswer}
              >
                <Text style={styles.submitText}>Submit Answer</Text>
              </Pressable>
            ) : (
              <View style={[styles.feedback, correct ? styles.good : styles.bad]}>
                <Text style={styles.feedbackText}>
                  {correct ? '✓ Correct answer!' : '✕ Incorrect answer.'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.waitingTitle}>Waiting for the trainer</Text>
            <Text style={styles.waitingText}>
              A live question will appear here automatically when the trainer launches one.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },

  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#F5F8FC',
  },

  loading: {
    marginTop: 12,
    color: '#627D98',
  },

  icon: {
    fontSize: 42,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#102A43',
    textAlign: 'center',
    marginTop: 10,
  },

  body: {
    fontSize: 14,
    color: '#627D98',
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: '#1769E0',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  header: {
    backgroundColor: '#102A43',
    borderRadius: 18,
    padding: 14,
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerInfo: {
    flex: 1,
    paddingRight: 8,
  },

  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#8CC8FF',
  },

  course: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },

  trainer: {
    fontSize: 12,
    color: '#B7C9DB',
    marginTop: 3,
  },

  live: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C4055',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7BE495',
    marginRight: 5,
  },

  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7BE495',
  },

  /*
   * Main video stage.
   * Landscape 16:9 presentation.
   */
  stage: {
    marginHorizontal: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#071421',
    position: 'relative',
  },

  mainStage: {
    flex: 1,
    position: 'relative',
  },
  headerLandscape: {
    marginVertical: 4,
    paddingVertical: 8,
  },

  videoScroll: {
    flex: 1,
  },

  videoScrollContent: {
    paddingBottom: 18,
  },

  videoScrollContentLandscape: {
    paddingBottom: 10,
  },

  videoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },

  participantTile: {
    backgroundColor: '#071421',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },

  screenShareLandscape: {
    alignSelf: 'center',
    width: '94%',
    maxWidth: 900,
  },


  mainVideoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#071421',
    position: 'relative',
  },

  /*
   * Small floating self-preview.
   */
  thumbnailContainer: {
    flex: 1,
    backgroundColor: '#172B3F',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  screenShareContainer: {
    width: '100%',
    backgroundColor: '#071421',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },

  video: {
    width: '100%',
    height: '100%',
  },

  /*
   * Black video-off screen.
   */
  videoOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050B12',
  },

  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#58758C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },

  videoOffText: {
    color: '#D9E2EC',
    fontSize: 11,
    fontWeight: '700',
  },

  videoNameBadge: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    backgroundColor: '#000000AA',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  videoNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  screenShareBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: '#1769E0DD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  screenShareBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  waitingOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 18,
    backgroundColor: '#071421CC',
    borderRadius: 12,
    padding: 14,
  },

  waitingOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  waitingOverlayText: {
    color: '#D9E2EC',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  noVideoStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071421',
  },

  noVideoIcon: {
    fontSize: 32,
  },

  noVideoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 7,
  },

  thumbnailRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 7,
  },

  controls: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },

  control: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },

  off: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },

  controlText: {
    fontWeight: '800',
    color: '#243B53',
    fontSize: 12,
  },

  leaveButton: {
    flex: 0.7,
    backgroundColor: '#B42318',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  leaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  bottomScroll: {
    flex: 1,
  },

  bottomScrollContent: {
    paddingBottom: 20,
  },

  infoCard: {
    marginHorizontal: 10,
    backgroundColor: '#EAF4FF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
  },

  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1769E0',
  },

  participantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  participantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39A96B',
    marginRight: 5,
  },

  participantPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#486581',
  },

  infoText: {
    fontSize: 12,
    color: '#486581',
    lineHeight: 17,
    marginTop: 5,
  },

  quizCard: {
    marginHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  quizBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1769E0',
    letterSpacing: 1,
  },

  quizQuestion: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102A43',
    lineHeight: 25,
    marginTop: 7,
    marginBottom: 11,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
  },

  optionSelected: {
    borderColor: '#1769E0',
    backgroundColor: '#EAF4FF',
  },

  optionCorrect: {
    borderColor: '#54B77B',
    backgroundColor: '#F1FBF5',
  },

  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F1FF',
    textAlign: 'center',
    paddingTop: 5,
    fontWeight: '800',
    color: '#1769E0',
    marginRight: 9,
  },

  optionLetterSelected: {
    backgroundColor: '#1769E0',
    color: '#FFFFFF',
  },

  optionText: {
    flex: 1,
    color: '#243B53',
    fontSize: 14,
  },

  submit: {
    backgroundColor: '#1769E0',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.45,
  },

  submitText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  feedback: {
    borderRadius: 11,
    padding: 12,
    marginTop: 2,
  },

  good: {
    backgroundColor: '#E8F8EE',
  },

  bad: {
    backgroundColor: '#FEE2E2',
  },

  feedbackText: {
    fontWeight: '800',
    color: '#243B53',
  },

  waiting: {
    marginHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
  },

  waitingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102A43',
  },

  waitingText: {
    fontSize: 13,
    color: '#627D98',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
});