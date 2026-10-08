import React, { useEffect, useState } from 'react';
import {
ActivityIndicator,
ScrollView,
StyleSheet,
Text,
View,
} from 'react-native';
import {
collection,
collectionGroup,
getDocs,
query,
where,
} from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';

type Course = {
id: string;
title: string;
progress: number;
};

type Assignment = {
id: string;
title: string;
};

type QuizResult = {
id: string;
correct: boolean;
};

type Topic = {
id: string;
courseId: string;
};

type TopicCompletion = {
topicId: string;
completed: boolean;
};

export default function ProgressScreen() {
const { firebaseUser } = useAuth();

const [loading, setLoading] = useState(true);
const [courses, setCourses] = useState<Course[]>([]);
const [assignments, setAssignments] = useState<Assignment[]>([]);
const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
const [topicCompletions, setTopicCompletions] = useState<
TopicCompletion[]

> ([]);

useEffect(() => {
async function loadProgress() {
if (!firebaseUser || !db) {
setLoading(false);
return;
}


  try {
    const coursesSnapshot = await getDocs(
      query(
        collection(db, 'courses'),
        where('published', '==', true)
      )
    );

    const topicsSnapshot = await getDocs(
      collection(db, 'course_topics')
    );

    const completionsSnapshot = await getDocs(
      query(
        collection(db, 'topic_completions'),
        where('studentId', '==', firebaseUser.uid)
      )
    );

    const topics: Topic[] = topicsSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        courseId:
          typeof data.courseId === 'string'
            ? data.courseId
            : '',
      };
    });

    const completions: TopicCompletion[] =
      completionsSnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          topicId:
            typeof data.topicId === 'string'
              ? data.topicId
              : '',
          completed: data.completed !== false,
        };
      });

    setTopicCompletions(completions);

    const courseData: Course[] = coursesSnapshot.docs.map(
      (courseDoc) => {
        const data = courseDoc.data();

        const courseTopics = topics.filter(
          (topic) => topic.courseId === courseDoc.id
        );

        const completedCourseTopics =
          courseTopics.filter((topic) =>
            completions.some(
              (completion) =>
                completion.topicId === topic.id &&
                completion.completed
            )
          );

        const automaticProgress =
          courseTopics.length > 0
            ? Math.round(
                (completedCourseTopics.length /
                  courseTopics.length) *
                  100
              )
            : 0;

        return {
          id: courseDoc.id,
          title:
            typeof data.title === 'string'
              ? data.title
              : 'Course',
          progress: automaticProgress,
        };
      }
    );

    setCourses(courseData);

    const assignmentsSnapshot = await getDocs(
      query(
        collection(db, 'assignment_submissions'),
        where('studentId', '==', firebaseUser.uid)
      )
    );

    const assignmentData = assignmentsSnapshot.docs.map(
      (doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          title:
            typeof data.assignmentTitle === 'string'
              ? data.assignmentTitle
              : 'Assignment',
        };
      }
    );

    setAssignments(assignmentData);

    const quizSnapshot = await getDocs(
      query(
        collectionGroup(db, 'responses'),
        where('studentId', '==', firebaseUser.uid)
      )
    );

    const quizData = quizSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        correct: data.correct === true,
      };
    });

    setQuizResults(quizData);
  } catch (error) {
    console.error('Progress loading error:', error);
  } finally {
    setLoading(false);
  }
}

loadProgress();


}, [firebaseUser]);

const totalQuizzes = quizResults.length;

const correctQuizzes = quizResults.filter(
(item) => item.correct
).length;

const quizAccuracy =
totalQuizzes > 0
? Math.round(
(correctQuizzes / totalQuizzes) * 100
)
: 0;

const completedTopics = topicCompletions.filter(
(item) => item.completed
).length;

const topicCompletionPercentage =
topicCompletions.length > 0
? Math.round(
(completedTopics /
topicCompletions.length) *
100
)
: 0;

const averageCourseProgress =
courses.length > 0
? Math.round(
courses.reduce(
(sum, course) => sum + course.progress,
0
) / courses.length
)
: 0;

if (loading) {
return ( <View style={styles.center}> <ActivityIndicator size="large" />


    <Text style={styles.loadingText}>
      Loading your progress...
    </Text>
  </View>
);


}

return ( <ScrollView style={styles.container}> <Text style={styles.title}>
My Progress </Text>


  <Text style={styles.subtitle}>
    Track your learning activity and performance.
  </Text>

  <View style={styles.statsRow}>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>
        {courses.length}
      </Text>

      <Text style={styles.statLabel}>
        Courses
      </Text>
    </View>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>
        {assignments.length}
      </Text>

      <Text style={styles.statLabel}>
        Assignments
      </Text>
    </View>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>
        {totalQuizzes}
      </Text>

      <Text style={styles.statLabel}>
        Quiz Attempts
      </Text>
    </View>
  </View>

  <View style={styles.statsRow}>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>
        {completedTopics}
      </Text>

      <Text style={styles.statLabel}>
        Topics Completed
      </Text>
    </View>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>
        {topicCompletionPercentage}%
      </Text>

      <Text style={styles.statLabel}>
        Topic Progress
      </Text>
    </View>
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      Course Progress
    </Text>

    {courses.length === 0 ? (
      <Text style={styles.emptyText}>
        No courses available yet.
      </Text>
    ) : (
      courses.map((course) => (
        <View
          key={course.id}
          style={styles.courseCard}
        >
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>
              {course.title}
            </Text>

            <Text style={styles.progressText}>
              {course.progress}%
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    course.progress,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      ))
    )}
  </View>

  <View style={styles.performanceCard}>
    <Text style={styles.sectionTitle}>
      Topic Learning
    </Text>

    <Text style={styles.performanceNumber}>
      {topicCompletionPercentage}%
    </Text>

    <Text style={styles.performanceLabel}>
      Topic completion
    </Text>

    <Text style={styles.performanceDetails}>
      {completedTopics} completed topic
      {completedTopics === 1 ? '' : 's'}
    </Text>
  </View>

  <View style={styles.performanceCard}>
    <Text style={styles.sectionTitle}>
      Quiz Performance
    </Text>

    <Text style={styles.performanceNumber}>
      {quizAccuracy}%
    </Text>

    <Text style={styles.performanceLabel}>
      Accuracy
    </Text>

    <Text style={styles.performanceDetails}>
      {correctQuizzes} correct out of {totalQuizzes}{' '}
      attempts
    </Text>
  </View>

  <View style={styles.performanceCard}>
    <Text style={styles.sectionTitle}>
      Overall Learning Progress
    </Text>

    <Text style={styles.performanceNumber}>
      {averageCourseProgress}%
    </Text>

    <Text style={styles.performanceLabel}>
      Average course completion
    </Text>
  </View>

  <View style={styles.bottomSpace} />
</ScrollView>


);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#F5F7FB',
padding: 24,
},
center: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
},
loadingText: {
marginTop: 10,
color: '#6B7280',
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
statsRow: {
flexDirection: 'row',
gap: 10,
marginBottom: 12,
},
statCard: {
flex: 1,
backgroundColor: '#FFFFFF',
borderRadius: 14,
padding: 14,
alignItems: 'center',
},
statNumber: {
fontSize: 22,
fontWeight: '700',
color: '#2563EB',
},
statLabel: {
fontSize: 12,
color: '#6B7280',
marginTop: 4,
textAlign: 'center',
},
section: {
marginBottom: 20,
marginTop: 8,
},
sectionTitle: {
fontSize: 19,
fontWeight: '700',
color: '#111827',
marginBottom: 12,
},
courseCard: {
backgroundColor: '#FFFFFF',
borderRadius: 14,
padding: 16,
marginBottom: 12,
},
courseHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 10,
},
courseTitle: {
flex: 1,
fontSize: 15,
fontWeight: '600',
color: '#111827',
marginRight: 10,
},
progressText: {
fontSize: 14,
fontWeight: '700',
color: '#2563EB',
},
progressBackground: {
height: 8,
backgroundColor: '#E5E7EB',
borderRadius: 10,
overflow: 'hidden',
},
progressFill: {
height: '100%',
backgroundColor: '#2563EB',
borderRadius: 10,
},
performanceCard: {
backgroundColor: '#FFFFFF',
borderRadius: 16,
padding: 20,
marginBottom: 16,
alignItems: 'center',
},
performanceNumber: {
fontSize: 36,
fontWeight: '800',
color: '#2563EB',
},
performanceLabel: {
fontSize: 14,
color: '#6B7280',
marginTop: 2,
},
performanceDetails: {
fontSize: 14,
color: '#4B5563',
marginTop: 10,
},
emptyText: {
color: '#6B7280',
fontSize: 14,
},
bottomSpace: {
height: 30,
},
});
