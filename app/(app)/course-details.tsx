import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
ActivityIndicator,
Pressable,
ScrollView,
StyleSheet,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { useThemeColor } from '@/hooks/use-theme-color';
import { requireDb } from '@/lib/firebase';

type Course = {
title: string;
description: string;
instructor: string;
category: string;
progress: number;
};

type Topic = {
id: string;
title: string;
description: string;
content: string;
};

export default function CourseDetailsScreen() {
const { id } = useLocalSearchParams<{ id: string }>();

const card = useThemeColor({}, 'card');
const border = useThemeColor({}, 'border');
const muted = useThemeColor({}, 'muted');
const tint = useThemeColor({}, 'tint');

const [course, setCourse] = useState<Course | null>(null);
const [topics, setTopics] = useState<Topic[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
async function loadCourseAndTopics() {
if (!id) {
setLoading(false);
return;
}


  try {
    const db = requireDb();

    const courseRef = doc(db, 'courses', id);
    const courseSnapshot = await getDoc(courseRef);

    if (courseSnapshot.exists()) {
      const data = courseSnapshot.data();

      setCourse({
        title:
          typeof data.title === 'string'
            ? data.title
            : 'Untitled Course',
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
      });
    }

    const topicsQuery = query(
      collection(db, 'course_topics'),
      where('courseId', '==', id)
    );

    const topicsSnapshot = await getDocs(topicsQuery);

    const loadedTopics: Topic[] = topicsSnapshot.docs.map((topicDoc) => {
      const data = topicDoc.data();

      return {
        id: topicDoc.id,
        title:
          typeof data.title === 'string'
            ? data.title
            : 'Untitled Topic',
        description:
          typeof data.description === 'string'
            ? data.description
            : '',
        content:
          typeof data.content === 'string'
            ? data.content
            : '',
      };
    });

    setTopics(loadedTopics);
  } catch (error) {
    console.error('Failed to load course and topics:', error);
  } finally {
    setLoading(false);
  }
}

loadCourseAndTopics();


}, [id]);

if (loading) {
return (
<View style={[styles.screen, { backgroundColor: card }]}> <SafeAreaView style={styles.center}> <ActivityIndicator size="large" />


      <Text style={[styles.bodyText, { color: muted }]}>
        Loading course...
      </Text>
    </SafeAreaView>
  </View>
);


}

if (!course) {
return (
<View style={[styles.screen, { backgroundColor: card }]}> <SafeAreaView style={styles.center}> <Text style={styles.subtitle}>
Course not found </Text>


      <Pressable
        style={[styles.button, { backgroundColor: tint }]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>
          Go Back
        </Text>
      </Pressable>
    </SafeAreaView>
  </View>
);


}

return (
<View style={[styles.screen, { backgroundColor: card }]}> <SafeAreaView style={styles.safe}> <ScrollView showsVerticalScrollIndicator={false}>
<Pressable onPress={() => router.back()}>
<Text style={[styles.back, { color: tint }]}>
← Back to Courses </Text> </Pressable>


      <View
        style={[
          styles.card,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <Text style={[styles.category, { color: tint }]}>
          {course.category}
        </Text>

        <Text style={styles.title}>
          {course.title}
        </Text>

        <Text style={[styles.instructor, { color: muted }]}>
          Instructor: {course.instructor}
        </Text>

        <View style={styles.section}>
          <Text style={styles.subtitle}>
            About this course
          </Text>

          <Text style={[styles.bodyText, { color: muted }]}>
            {course.description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>
            Your Progress
          </Text>

          <Text style={[styles.bodyText, { color: muted }]}>
            {course.progress}% complete
          </Text>

          <View
            style={[
              styles.progressBackground,
              { backgroundColor: border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: tint,
                  width: `${Math.min(
                    Math.max(course.progress, 0),
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.subtitle}>
            Course Content
          </Text>

          {topics.length === 0 ? (
            <View
              style={[
                styles.emptyTopic,
                { borderColor: border },
              ]}
            >
              <Text style={[styles.bodyText, { color: muted }]}>
                No learning topics have been added yet.
              </Text>
            </View>
          ) : (
            topics.map((topic, index) => (
              <Pressable
                key={topic.id}
                style={({ pressed }) => [
                  styles.topicCard,
                  {
                    backgroundColor: card,
                    borderColor: border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() =>
                  router.push(`/topic-details?id=${topic.id}`)
                }
              >
                <Text
                  style={[
                    styles.topicNumber,
                    { color: tint },
                  ]}
                >
                  Topic {index + 1}
                </Text>

                <Text style={styles.topicTitle}>
                  {topic.title}
                </Text>

                {topic.description.length > 0 && (
                  <Text
                    style={[
                      styles.bodyText,
                      { color: muted },
                    ]}
                  >
                    {topic.description}
                  </Text>
                )}

                <View
                  style={[
                    styles.openTopicBox,
                    {
                      borderColor: border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.openTopicText,
                      { color: tint },
                    ]}
                  >
                    Tap to learn →
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
</View>


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
center: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
gap: 16,
paddingHorizontal: 20,
},
back: {
fontSize: 15,
fontWeight: '700',
marginTop: 16,
marginBottom: 16,
},
card: {
borderWidth: 1,
borderRadius: 20,
padding: 20,
gap: 12,
marginBottom: 30,
},
category: {
fontSize: 13,
fontWeight: '700',
textTransform: 'uppercase',
},
title: {
fontSize: 28,
fontWeight: '800',
lineHeight: 34,
marginTop: 4,
},
instructor: {
fontSize: 14,
},
section: {
gap: 8,
marginTop: 18,
},
subtitle: {
fontSize: 18,
fontWeight: '700',
},
bodyText: {
fontSize: 15,
lineHeight: 22,
},
progressBackground: {
height: 8,
borderRadius: 10,
overflow: 'hidden',
marginTop: 4,
},
progressFill: {
height: '100%',
borderRadius: 10,
},
contentSection: {
gap: 12,
marginTop: 24,
},
emptyTopic: {
borderWidth: 1,
borderRadius: 14,
padding: 16,
},
topicCard: {
borderWidth: 1,
borderRadius: 16,
padding: 16,
gap: 8,
},
topicNumber: {
fontSize: 12,
fontWeight: '800',
textTransform: 'uppercase',
},
topicTitle: {
fontSize: 18,
fontWeight: '700',
},
openTopicBox: {
borderWidth: 1,
borderRadius: 10,
paddingVertical: 9,
paddingHorizontal: 12,
alignSelf: 'flex-start',
marginTop: 4,
},
openTopicText: {
fontSize: 13,
fontWeight: '800',
},
button: {
paddingHorizontal: 20,
paddingVertical: 12,
borderRadius: 12,
},
buttonText: {
color: '#ffffff',
fontWeight: '700',
},
});
