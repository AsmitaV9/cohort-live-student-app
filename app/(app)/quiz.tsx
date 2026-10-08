import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

type Question = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  active: boolean;
  roomName: string;
};

export default function QuizScreen() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    const questionsQuery = query(
      collection(db, 'live_questions'),
      where('active', '==', true),
      where('roomName', '==', 'cohort-live-demo')
    );

    const unsubscribe = onSnapshot(
      questionsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setQuestion(null);
          setSelectedAnswer(null);
        } else {
          const doc = snapshot.docs[0];

          setQuestion({
            id: doc.id,
            ...(doc.data() as Omit<Question, 'id'>),
          });

          setSelectedAnswer(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error('Live question error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  function selectAnswer(answer: string) {
    if (selectedAnswer) {
      return;
    }

    setSelectedAnswer(answer);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loading}>
          Connecting to live quiz...
        </Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.center}>
        <Text style={styles.waitingIcon}>⏳</Text>

        <Text style={styles.waitingTitle}>
          Waiting for your trainer
        </Text>

        <Text style={styles.waitingText}>
          The next question will appear here when your trainer
          launches it during the live class.
        </Text>
      </View>
    );
  }

  const options = [
    { key: 'A', value: question.optionA },
    { key: 'B', value: question.optionB },
    { key: 'C', value: question.optionC },
    { key: 'D', value: question.optionD },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Cohort Live</Text>
          <Text style={styles.subtitle}>Live Question</Text>
        </View>

        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>● LIVE</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.questionLabel}>
          Trainer's Question
        </Text>

        <Text style={styles.question}>
          {question.question}
        </Text>

        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = selectedAnswer === option.key;
            const isCorrect =
              selectedAnswer !== null &&
              option.key === question.correctAnswer;

            return (
              <Pressable
                key={option.key}
                onPress={() => selectAnswer(option.key)}
                style={[
                  styles.option,
                  isSelected && styles.selectedOption,
                  isCorrect && styles.correctOption,
                ]}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {option.key}
                  </Text>
                </View>

                <Text style={styles.optionText}>
                  {option.value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedAnswer && (
          <View
            style={[
              styles.feedback,
              selectedAnswer === question.correctAnswer
                ? styles.correctFeedback
                : styles.wrongFeedback,
            ]}
          >
            <Text style={styles.feedbackTitle}>
              {selectedAnswer === question.correctAnswer
                ? '✓ Correct!'
                : '✕ Incorrect'}
            </Text>

            <Text style={styles.feedbackText}>
              {selectedAnswer === question.correctAnswer
                ? 'Your answer is correct.'
                : `The correct answer is ${question.correctAnswer}.`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 14,
  },

  liveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  liveText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 12,
  },

  content: {
    padding: 22,
  },

  questionLabel: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },

  question: {
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 25,
  },

  options: {
    gap: 13,
  },

  option: {
    minHeight: 65,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedOption: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  correctOption: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },

  optionLetter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  optionLetterText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
  },

  optionText: {
    flex: 1,
    fontSize: 17,
    color: '#111827',
    fontWeight: '600',
  },

  feedback: {
    marginTop: 22,
    padding: 18,
    borderRadius: 14,
  },

  correctFeedback: {
    backgroundColor: '#DCFCE7',
  },

  wrongFeedback: {
    backgroundColor: '#FEE2E2',
  },

  feedbackTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 5,
  },

  feedbackText: {
    color: '#374151',
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F7F9FC',
  },

  waitingIcon: {
    fontSize: 50,
    marginBottom: 15,
  },

  waitingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  waitingText: {
    marginTop: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },

  loading: {
    marginTop: 15,
    color: '#6B7280',
  },
});