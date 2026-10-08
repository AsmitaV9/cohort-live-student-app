import {
addDoc,
collection,
doc,
getDoc,
query,
where,
getDocs,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
ActivityIndicator,
Alert,
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
import { useAuth } from '@/contexts/auth-context';

type Topic = {
title: string;
description: string;
content: string;
};

export default function TopicDetailsScreen() {
const { id } = useLocalSearchParams<{ id: string }>();
const { firebaseUser } = useAuth();

const card = useThemeColor({}, 'card');
const border = useThemeColor({}, 'border');
const muted = useThemeColor({}, 'muted');
const tint = useThemeColor({}, 'tint');

const [topic, setTopic] = useState<Topic | null>(null);
const [loading, setLoading] = useState(true);
const [completed, setCompleted] = useState(false);
const [saving, setSaving] = useState(false);

useEffect(() => {
async function loadTopic() {
if (!id) {
setLoading(false);
return;
}


  try {
    const db = requireDb();

    const topicRef = doc(db, 'course_topics', id);
    const snapshot = await getDoc(topicRef);

    if (snapshot.exists()) {
      const data = snapshot.data();

      setTopic({
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
      });
    }

    if (firebaseUser) {
      const completionQuery = query(
        collection(db, 'topic_completions'),
        where('studentId', '==', firebaseUser.uid),
        where('topicId', '==', id)
      );

      const completionSnapshot = await getDocs(completionQuery);

      setCompleted(!completionSnapshot.empty);
    }
  } catch (error) {
    console.error('Failed to load topic:', error);
  } finally {
    setLoading(false);
  }
}

loadTopic();


}, [id, firebaseUser]);

async function markAsCompleted() {
if (!id || !firebaseUser || completed) {
return;
}


try {
  setSaving(true);

  const db = requireDb();

  await addDoc(collection(db, 'topic_completions'), {
    studentId: firebaseUser.uid,
    topicId: id,
    completedAt: new Date().toISOString(),
  });

  setCompleted(true);

  Alert.alert(
    'Topic Completed',
    'Your progress has been updated.'
  );
} catch (error) {
  console.error('Failed to mark topic complete:', error);

  Alert.alert(
    'Error',
    'Unable to save your progress. Please try again.'
  );
} finally {
  setSaving(false);
}


}

if (loading) {
return (
<View style={[styles.screen, { backgroundColor: card }]}> <SafeAreaView style={styles.center}> <ActivityIndicator size="large" />


      <Text style={[styles.bodyText, { color: muted }]}>
        Loading topic...
      </Text>
    </SafeAreaView>
  </View>
);


}

if (!topic) {
return (
<View style={[styles.screen, { backgroundColor: card }]}> <SafeAreaView style={styles.center}> <Text style={styles.title}>
Topic not found </Text>


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
← Back </Text> </Pressable>


      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <Text style={[styles.topicLabel, { color: tint }]}>
          LEARNING TOPIC
        </Text>

        <Text style={styles.title}>
          {topic.title}
        </Text>

        {topic.description.length > 0 && (
          <Text
            style={[
              styles.description,
              { color: muted },
            ]}
          >
            {topic.description}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <Text style={styles.sectionTitle}>
          Learning Material
        </Text>

        {topic.content.length > 0 ? (
          <Text style={styles.content}>
            {topic.content}
          </Text>
        ) : (
          <Text
            style={[
              styles.bodyText,
              { color: muted },
            ]}
          >
            No learning material has been added for this topic yet.
          </Text>
        )}
      </View>

      <View
        style={[
          styles.completionCard,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        {completed ? (
          <>
            <Text
              style={[
                styles.completedTitle,
                { color: tint },
              ]}
            >
              ✓ Topic Completed
            </Text>

            <Text
              style={[
                styles.bodyText,
                { color: muted },
              ]}
            >
              You have completed this learning topic.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Finish this topic
            </Text>

            <Text
              style={[
                styles.bodyText,
                { color: muted },
              ]}
            >
              Mark this topic as completed after you finish studying
              the material.
            </Text>

            <Pressable
              style={[
                styles.completeButton,
                {
                  backgroundColor: tint,
                  opacity: saving ? 0.6 : 1,
                },
              ]}
              onPress={markAsCompleted}
              disabled={saving}
            >
              <Text style={styles.completeButtonText}>
                {saving
                  ? 'Saving...'
                  : 'Mark as Completed'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable
        style={[
          styles.backButton,
          {
            borderColor: border,
          },
        ]}
        onPress={() => router.back()}
      >
        <Text
          style={[
            styles.backButtonText,
            { color: tint },
          ]}
        >
          Back to Course
        </Text>
      </Pressable>
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
headerCard: {
borderWidth: 1,
borderRadius: 20,
padding: 20,
gap: 10,
marginBottom: 16,
},
topicLabel: {
fontSize: 12,
fontWeight: '800',
letterSpacing: 0.8,
},
title: {
fontSize: 26,
fontWeight: '800',
lineHeight: 32,
},
description: {
fontSize: 15,
lineHeight: 22,
},
contentCard: {
borderWidth: 1,
borderRadius: 20,
padding: 20,
marginBottom: 16,
},
sectionTitle: {
fontSize: 19,
fontWeight: '700',
marginBottom: 14,
},
content: {
fontSize: 16,
lineHeight: 26,
},
bodyText: {
fontSize: 15,
lineHeight: 22,
},
completionCard: {
borderWidth: 1,
borderRadius: 20,
padding: 20,
marginBottom: 16,
},
completedTitle: {
fontSize: 18,
fontWeight: '800',
marginBottom: 8,
},
completeButton: {
borderRadius: 14,
paddingVertical: 14,
alignItems: 'center',
marginTop: 16,
},
completeButtonText: {
color: '#ffffff',
fontSize: 15,
fontWeight: '800',
},
backButton: {
borderWidth: 1,
borderRadius: 14,
paddingVertical: 14,
alignItems: 'center',
marginBottom: 30,
},
backButtonText: {
fontSize: 15,
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

