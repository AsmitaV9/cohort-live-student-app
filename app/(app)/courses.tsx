import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { requireDb } from '@/lib/firebase';
import { router } from 'expo-router';

type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  progress: number;
};

export default function CoursesScreen() {
  const { profile } = useAuth();

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const db = requireDb();

        const coursesQuery = query(
          collection(db, 'courses'),
          where('published', '==', true)
        );

        const snapshot = await getDocs(coursesQuery);

        const loadedCourses: Course[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled Course',
            description:
              typeof data.description === 'string'
                ? data.description
                : 'No description available.',
            instructor:
              typeof data.instructor === 'string'
                ? data.instructor
                : 'Instructor',
            category:
              typeof data.category === 'string'
                ? data.category
                : 'General',
            progress:
              typeof data.progress === 'number'
                ? data.progress
                : 0,
          };
        });

        setCourses(loadedCourses);
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError('Unable to load courses right now.');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [profile]);

  function renderCourse({ item }: { item: Course }) {
    return (
<Pressable
  onPress={() => router.push(`/course-details?id=${item.id}`)}
  style={({ pressed }) => [
    styles.courseCard,          {
            backgroundColor: card,
            borderColor: border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.courseHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: tint }]}>
            <ThemedText style={styles.categoryText}>
              {item.category}
            </ThemedText>
          </View>

          <ThemedText style={{ color: muted }}>
            {item.progress}% complete
          </ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.title}>
          {item.title}
        </ThemedText>

        <ThemedText style={{ color: muted }}>
          {item.description}
        </ThemedText>

        <ThemedText style={[styles.instructor, { color: muted }]}>
          Instructor: {item.instructor}
        </ThemedText>

        <View style={[styles.progressBackground, { backgroundColor: border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: tint,
                width: `${Math.min(Math.max(item.progress, 0), 100)}%`,
              },
            ]}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <ThemedText type="title">My Courses</ThemedText>
          <ThemedText style={{ color: muted }}>
            Continue your learning journey.
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <ThemedText style={{ color: muted }}>
              Loading courses...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
            <ThemedText type="subtitle">Something went wrong</ThemedText>
            <ThemedText style={{ color: muted }}>{error}</ThemedText>
          </View>
        ) : courses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: card, borderColor: border }]}>
            <ThemedText style={styles.emptyIcon}>📚</ThemedText>
            <ThemedText type="subtitle">No courses yet</ThemedText>
            <ThemedText style={{ color: muted }}>
              Your enrolled courses will appear here when they are added to
              Cohort Live.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 6,
  },
  list: {
    gap: 16,
    paddingBottom: 30,
  },
  courseCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    marginTop: 2,
  },
  instructor: {
    fontSize: 14,
  },
  progressBackground: {
    height: 7,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 40,
  },
});