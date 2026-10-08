import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';

type QuizResult = {
  id: string;
  question: string;
  answer: string;
  selectedOption: string;
  correct: boolean;
  submittedAt?: any;
};

export default function QuizHistoryScreen() {
  const { firebaseUser } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser || !db) {
      setLoading(false);
      return;
    }

 const q = query(
  collectionGroup(db, 'responses'),
  where('studentId', '==', firebaseUser.uid)
);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<QuizResult, 'id'>),
        }));

        setResults(data);
        setLoading(false);
      },
      () => {
        setResults([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseUser]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading quiz history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz History</Text>
      <Text style={styles.subtitle}>
        Review your previous quiz answers and performance.
      </Text>

      {results.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No quiz attempts yet</Text>
          <Text style={styles.emptyText}>
            Your quiz results will appear here after you answer a live quiz.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.question}>{item.question}</Text>

              <Text style={styles.answer}>
                Your answer: {item.selectedOption || item.answer}
              </Text>

              <Text
                style={[
                  styles.result,
                  item.correct ? styles.correct : styles.incorrect,
                ]}
              >
                {item.correct ? '✓ Correct' : '✕ Incorrect'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F7FB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  answer: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 10,
  },
  result: {
    fontSize: 15,
    fontWeight: '700',
  },
  correct: {
    color: '#15803D',
  },
  incorrect: {
    color: '#DC2626',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
});