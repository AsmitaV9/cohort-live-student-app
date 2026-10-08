import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { router } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';

type Assignment = {
  id: string;
  title: string;
  description: string;
  course: string;
  instructor: string;
};

type Submission = {
  id: string;
  assignmentId: string;
  answer: string;
  submittedAt?: any;
  marks?: number | null;
  gradedAt?: any;
};

export default function AssignmentsScreen() {
  const { firebaseUser, profile } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (!db || !firebaseUser) return;

    const submissionsQuery = query(
      collection(db, 'assignment_submissions'),
      where('studentId', '==', firebaseUser.uid)
    );

    return onSnapshot(
      submissionsQuery,
      (snapshot) => {
        const next: Record<string, Submission> = {};
        snapshot.docs.forEach((submissionDoc) => {
          const data = submissionDoc.data();
          next[String(data.assignmentId ?? '')] = {
            id: submissionDoc.id,
            assignmentId: String(data.assignmentId ?? ''),
            answer: String(data.answer ?? ''),
            submittedAt: data.submittedAt,
            marks: typeof data.marks === 'number' ? data.marks : null,
            gradedAt: data.gradedAt,
          };
        });
        setSubmissions(next);
      },
      (error) => console.error('Assignment submission listener error:', error)
    );
  }, [firebaseUser?.uid]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('published', '==', true)
      );

      const snapshot = await getDocs(assignmentsQuery);

      const loadedAssignments: Assignment[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          title: data.title ?? 'Untitled Assignment',
          description: data.description ?? '',
          course: data.course ?? 'General',
          instructor: data.instructor ?? 'Cohort Live',
        };
      });

      setAssignments(loadedAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert(
        'Error',
        'Could not load assignments. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async () => {
    if (!selectedAssignment) {
      return;
    }

    if (!answer.trim()) {
      Alert.alert(
        'Answer Required',
        'Please enter your answer before submitting.'
      );
      return;
    }

    if (!firebaseUser) {
      Alert.alert(
        'Not Signed In',
        'Please sign in again before submitting.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const submissionId = `${selectedAssignment.id}_${firebaseUser.uid}`;
      const submissionRef = doc(db, 'assignment_submissions', submissionId);
      const existingSubmission = await getDoc(submissionRef);

      const submissionData: Record<string, unknown> = {
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        studentId: firebaseUser.uid,
        studentName: profile?.name ?? 'Student',
        studentEmail: profile?.email ?? firebaseUser.email ?? '',
        answer: answer.trim(),
        submittedAt: serverTimestamp(),
      };

      // Do not erase trainer marks when a student resubmits an answer.
      if (!existingSubmission.exists()) {
        submissionData.marks = null;
        submissionData.gradedAt = null;
        submissionData.gradedBy = null;
      }

      await setDoc(submissionRef, submissionData, { merge: true });

      Alert.alert(
        'Submitted',
        'Your assignment has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedAssignment(null);
              setAnswer('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting assignment:', error);

      Alert.alert(
        'Error',
        'Could not submit the assignment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedAssignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setSelectedAssignment(null);
              setAnswer('');
            }}
          >
            <Text style={styles.backText}>← Back to Assignments</Text>
          </Pressable>

          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentTitle}>
              {selectedAssignment.title}
            </Text>

            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>
                {selectedAssignment.course}
              </Text>
            </View>
          </View>

          {submissions[selectedAssignment.id] && (
            <View style={styles.submissionStatusCard}>
              <Text style={styles.submissionStatusTitle}>Submission received</Text>
              <Text style={styles.submissionStatusText}>
                {submissions[selectedAssignment.id].marks == null
                  ? 'Your trainer has not graded this assignment yet.'
                  : `Trainer marks: ${submissions[selectedAssignment.id].marks}/10`}
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Description</Text>

            <Text style={styles.description}>
              {selectedAssignment.description ||
                'No description provided.'}
            </Text>

            <Text style={styles.instructor}>
              Instructor: {selectedAssignment.instructor}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Your Answer</Text>

          <TextInput
            style={styles.answerInput}
            placeholder="Write your answer here..."
            placeholderTextColor="#94A3B8"
            value={answer}
            onChangeText={setAnswer}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            style={[
              styles.submitButton,
              submitting && styles.disabledButton,
            ]}
            onPress={submitAssignment}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Assignment
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Dashboard</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Assignments</Text>

        <Text style={styles.pageSubtitle}>
          Complete your assignments and submit your work.
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />

            <Text style={styles.loadingText}>
              Loading assignments...
            </Text>
          </View>
        ) : assignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📝</Text>

            <Text style={styles.emptyTitle}>
              No assignments yet
            </Text>

            <Text style={styles.emptyText}>
              Your trainer has not published any assignments yet.
            </Text>
          </View>
        ) : (
          assignments.map((assignment) => (
            <Pressable
              key={assignment.id}
              style={styles.assignmentCard}
              onPress={() => {
                const submission = submissions[assignment.id];
                setSelectedAssignment(assignment);
                setAnswer(submission?.answer ?? '');
              }}
            >
              <View style={styles.assignmentIcon}>
                <Text style={styles.assignmentIconText}>📝</Text>
              </View>

              <View style={styles.assignmentContent}>
                <Text style={styles.cardTitle}>
                  {assignment.title}
                </Text>

                <Text style={styles.cardCourse}>
                  {assignment.course}
                </Text>

                <Text
                  style={styles.cardDescription}
                  numberOfLines={2}
                >
                  {assignment.description ||
                    'Complete this assignment.'}
                </Text>

                {submissions[assignment.id] && (
                  <Text style={styles.submittedText}>
                    ✓ Submitted{submissions[assignment.id].marks != null ? ` · ${submissions[assignment.id].marks}/10` : ' · Awaiting marks'}
                  </Text>
                )}

                <Text style={styles.openText}>
                  Open Assignment →
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  backText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#102A56',
  },

  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 22,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginTop: 15,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172554',
  },

  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },

  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 13,
    flexDirection: 'row',
  },

  assignmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  assignmentIconText: {
    fontSize: 23,
  },

  assignmentContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172554',
  },

  cardCourse: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 4,
  },

  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 7,
  },

  openText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  assignmentHeader: {
    marginBottom: 18,
  },

  assignmentTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#102A56',
    lineHeight: 34,
  },

  courseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },

  courseBadgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },

  instructor: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102A56',
    marginBottom: 12,
  },

  answerInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    minHeight: 180,
    padding: 16,
    fontSize: 14,
    color: '#172554',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  submissionStatusCard: {
    backgroundColor: '#EAF4FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  submissionStatusTitle: {
    color: '#1769E0',
    fontSize: 14,
    fontWeight: '800',
  },

  submissionStatusText: {
    color: '#486581',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  submittedText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },
});