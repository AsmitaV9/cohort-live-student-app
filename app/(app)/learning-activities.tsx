import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';

import { db } from '@/lib/firebase';

type ActivityStats = {
  courses: number;
  topics: number;
  assignments: number;
  liveQuestions: number;
};

type ActivityItem = {
  id: string;
  title: string;
  type: string;
};

export default function LearningActivitiesScreen() {
  const router = useRouter();

  const [stats, setStats] = useState<ActivityStats>({
    courses: 0,
    topics: 0,
    assignments: 0,
    liveQuestions: 0,
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);

      const coursesSnapshot = await getDocs(
        query(collection(db, 'courses'), where('published', '==', true))
      );

      const topicsSnapshot = await getDocs(
        collection(db, 'course_topics')
      );

      const assignmentsSnapshot = await getDocs(
        query(collection(db, 'assignments'), where('published', '==', true))
      );

      const questionsSnapshot = await getDocs(
        collection(db, 'live_questions')
      );

      const recentActivities: ActivityItem[] = [];

      coursesSnapshot.docs.slice(0, 5).forEach((doc) => {
        const data = doc.data();

        recentActivities.push({
          id: doc.id,
          title: data.title || 'Untitled course',
          type: 'Course',
        });
      });

      assignmentsSnapshot.docs.slice(0, 5).forEach((doc) => {
        const data = doc.data();

        recentActivities.push({
          id: doc.id,
          title: data.title || data.assignmentTitle || 'Untitled assignment',
          type: 'Assignment',
        });
      });

      topicsSnapshot.docs.slice(0, 5).forEach((doc) => {
        const data = doc.data();

        recentActivities.push({
          id: doc.id,
          title: data.title || 'Untitled topic',
          type: 'Topic',
        });
      });

      questionsSnapshot.docs.slice(0, 5).forEach((doc) => {
        const data = doc.data();

        recentActivities.push({
          id: doc.id,
          title: data.question || 'Live quiz question',
          type: 'Live Quiz',
        });
      });

      setStats({
        courses: coursesSnapshot.size,
        topics: topicsSnapshot.size,
        assignments: assignmentsSnapshot.size,
        liveQuestions: questionsSnapshot.size,
      });

      setActivities(recentActivities.slice(0, 12));
    } catch (error) {
      console.error('Error loading learning activities:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Learning Activities</Text>
      <Text style={styles.subtitle}>
        Overview of courses, topics, assignments and live quizzes.
      </Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.courses}</Text>
              <Text style={styles.statLabel}>Published Courses</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.topics}</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.assignments}</Text>
              <Text style={styles.statLabel}>Assignments</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.liveQuestions}</Text>
              <Text style={styles.statLabel}>Live Quiz Questions</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Learning Activities</Text>

            {activities.length === 0 ? (
              <Text style={styles.emptyText}>
                No learning activities available yet.
              </Text>
            ) : (
              activities.map((activity) => (
                <View key={`${activity.type}-${activity.id}`} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityIconText}>
                      {activity.type === 'Course'
                        ? 'C'
                        : activity.type === 'Assignment'
                        ? 'A'
                        : activity.type === 'Topic'
                        ? 'T'
                        : 'Q'}
                    </Text>
                  </View>

                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      {activity.title}
                    </Text>

                    <Text style={styles.activityType}>
                      {activity.type}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
    marginBottom: 24,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  emptyText: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 14,
    color: '#6b7280',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8eefc',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  activityType: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
});