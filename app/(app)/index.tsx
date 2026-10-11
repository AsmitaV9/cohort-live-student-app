import React from 'react';
import {
Alert,
Pressable,
SafeAreaView,
ScrollView,
StyleSheet,
Text,
View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';

export default function DashboardScreen() {
const { profile, signOut } = useAuth();

const handleSignOut = async () => {
Alert.alert(
'Sign Out',
'Are you sure you want to sign out?',
[
{
text: 'Cancel',
style: 'cancel',
},
{
text: 'Sign Out',
style: 'destructive',
onPress: async () => {
try {
await signOut();
} catch (error) {
console.error('Sign out error:', error);
Alert.alert('Error', 'Could not sign out.');
}
},
},
]
);
};

return ( <SafeAreaView style={styles.safe}> <ScrollView
     style={styles.container}
     contentContainerStyle={styles.content}
     showsVerticalScrollIndicator={false}
   > <View style={styles.header}> <View style={styles.headerText}> <Text style={styles.brand}>Cohort Live</Text>


        <Text style={styles.greeting}>
          Hello, {profile?.name?.split(' ')[0] ?? 'there'} 👋
        </Text>

        <Text style={styles.subtitle}>
'Learn together, participate, and grow together.'
        </Text>
      </View>

      <View style={styles.profileCircle}>
        <Text style={styles.profileInitial}>
          {(profile?.name?.charAt(0) ?? 'U').toUpperCase()}
        </Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>
      Live Classroom
    </Text>

    <Pressable
      style={styles.liveCard}
      onPress={() => router.push('/meeting')}
    >
      <View style={styles.liveIconContainer}>
        <Text style={styles.liveIcon}>🎥</Text>
      </View>

      <View style={styles.liveTextContainer}>
        <Text style={styles.liveTitle}>
'Enter Live Class'
        </Text>

        <Text style={styles.liveDescription}>
'Join your interactive classroom with live video, audio, and quizzes.'
        </Text>

        <View style={styles.joinButton}>
          <Text style={styles.joinButtonText}>
            Join Classroom →
          </Text>
        </View>
      </View>
    </Pressable>

    <Text style={styles.sectionTitle}>
      Mock Tests
    </Text>

    <Pressable
      style={styles.mockCard}
      onPress={() => router.push('/mock-tests')}
      accessibilityRole="button"
    >
      <Text style={styles.liveIcon}>🧪</Text>
      <View style={styles.liveTextContainer}>
        <Text style={styles.mockTitle}>Proctored GATE Mocks</Text>
        <Text style={styles.mockDescription}>
          Mock tests for your department, exam times and published results.
        </Text>
      </View>
      <Text style={styles.mockArrow}>›</Text>
    </Pressable>

    <Pressable
      style={[styles.mockCard, { marginTop: 12 }]}
      onPress={() => router.push('/my-results')}
      accessibilityRole="button"
    >
      <Text style={styles.liveIcon}>🏅</Text>
      <View style={styles.liveTextContainer}>
        <Text style={styles.mockTitle}>My Results</Text>
        <Text style={styles.mockDescription}>
          Published scores, rank, answers, result reports and certificates.
        </Text>
      </View>
      <Text style={styles.mockArrow}>›</Text>
    </Pressable>

    <>        <Text style={styles.sectionTitle}>
          Quick Access
        </Text>

        <View style={styles.quickGrid}>
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/courses')}
          >
            <Text style={styles.quickIcon}>📚</Text>
            <Text style={styles.quickTitle}>My Courses</Text>
            <Text style={styles.quickSubtitle}>
              View your courses
            </Text>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/assignments')}
          >
            <Text style={styles.quickIcon}>📝</Text>
            <Text style={styles.quickTitle}>Assignments</Text>
            <Text style={styles.quickSubtitle}>
              Complete your assignments
            </Text>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/quiz-history')}
          >
            <Text style={styles.quickIcon}>❓</Text>
            <Text style={styles.quickTitle}>Quizzes</Text>
            <Text style={styles.quickSubtitle}>
              Test your knowledge
            </Text>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/attendance')}
          >
            <Text style={styles.quickIcon}>🕒</Text>
            <Text style={styles.quickTitle}>Attendance</Text>
            <Text style={styles.quickSubtitle}>View live class attendance</Text>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/progress')}
          >
            <Text style={styles.quickIcon}>📈</Text>
            <Text style={styles.quickTitle}>My Progress</Text>
            <Text style={styles.quickSubtitle}>
              View your learning progress
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Learning Journey
        </Text>

        <View style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <View style={styles.journeyText}>
              <Text style={styles.journeyTitle}>
                Keep Learning
              </Text>

              <Text style={styles.journeySubtitle}>
                Your learning journey has started
              </Text>
            </View>

            <Text style={styles.journeyIcon}>
              🚀
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.progressText}>
            Complete courses, attend live classes, and
            participate in quizzes to improve your progress.
          </Text>
        </View>
      </>

    <Text style={styles.sectionTitle}>
      Account
    </Text>

    <View style={styles.accountCard}>
      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>
          Name
        </Text>

        <Text style={styles.accountValue}>
          {profile?.name ?? 'Not available'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>
          Email
        </Text>

        <Text style={styles.accountValue}>
          {profile?.email ?? 'Not available'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>
          Role
        </Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {profile?.role ?? 'student'}
          </Text>
        </View>
      </View>
    </View>

    <Pressable
      style={styles.signOutButton}
      onPress={handleSignOut}
    >
      <Text style={styles.signOutText}>
        Sign Out
      </Text>
    </Pressable>

    <Text style={styles.footer}>
      Cohort Live • Learn Together • Grow Together
    </Text>
  </ScrollView>
</SafeAreaView>


);
}

const styles = StyleSheet.create({
mockCard: {
flexDirection: 'row',
alignItems: 'center',
gap: 14,
backgroundColor: '#FFFFFF',
borderRadius: 20,
padding: 18,
marginBottom: 8,
borderWidth: 1,
borderColor: '#DBEAFE',
elevation: 2,
},
mockTitle: {
fontSize: 17,
fontWeight: '700',
color: '#111827',
},
mockDescription: {
fontSize: 14,
color: '#6B7280',
marginTop: 4,
lineHeight: 20,
},
mockArrow: {
fontSize: 28,
color: '#2563EB',
fontWeight: '600',
},
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

header: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'flex-start',
marginBottom: 25,
},

headerText: {
flex: 1,
paddingRight: 15,
},

brand: {
fontSize: 16,
fontWeight: '800',
color: '#2563EB',
marginBottom: 8,
},

greeting: {
fontSize: 29,
fontWeight: '800',
color: '#102A56',
},

subtitle: {
fontSize: 14,
color: '#64748B',
marginTop: 7,
lineHeight: 20,
},

profileCircle: {
width: 48,
height: 48,
borderRadius: 24,
backgroundColor: '#DBEAFE',
alignItems: 'center',
justifyContent: 'center',
},

profileInitial: {
fontSize: 19,
fontWeight: '800',
color: '#2563EB',
},

sectionTitle: {
fontSize: 21,
fontWeight: '800',
color: '#102A56',
marginBottom: 12,
marginTop: 4,
},

liveCard: {
backgroundColor: '#102A56',
borderRadius: 20,
padding: 18,
flexDirection: 'row',
marginBottom: 25,
},

liveIconContainer: {
width: 48,
height: 48,
borderRadius: 14,
backgroundColor: '#1E4B91',
alignItems: 'center',
justifyContent: 'center',
marginRight: 13,
},

liveIcon: {
fontSize: 23,
},

liveTextContainer: {
flex: 1,
},

liveTitle: {
color: '#FFFFFF',
fontSize: 19,
fontWeight: '800',
},

liveDescription: {
color: '#D7E4F7',
fontSize: 13,
lineHeight: 19,
marginTop: 5,
},

joinButton: {
alignSelf: 'flex-start',
backgroundColor: '#FFFFFF',
borderRadius: 10,
paddingHorizontal: 13,
paddingVertical: 9,
marginTop: 13,
},

joinButtonText: {
color: '#102A56',
fontWeight: '800',
fontSize: 13,
},

quickGrid: {
flexDirection: 'row',
flexWrap: 'wrap',
justifyContent: 'space-between',
marginBottom: 25,
},

quickCard: {
width: '48%',
backgroundColor: '#FFFFFF',
borderRadius: 17,
padding: 17,
marginBottom: 12,
minHeight: 135,
},

quickIcon: {
fontSize: 25,
marginBottom: 13,
},

quickTitle: {
fontSize: 16,
fontWeight: '800',
color: '#172554',
},

quickSubtitle: {
fontSize: 12,
color: '#64748B',
marginTop: 5,
lineHeight: 17,
},

journeyCard: {
backgroundColor: '#FFFFFF',
borderRadius: 18,
padding: 18,
marginBottom: 25,
},

journeyHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},

journeyText: {
flex: 1,
},

journeyTitle: {
fontSize: 18,
fontWeight: '800',
color: '#172554',
},

journeySubtitle: {
fontSize: 13,
color: '#64748B',
marginTop: 4,
},

journeyIcon: {
fontSize: 27,
},

progressBackground: {
height: 9,
backgroundColor: '#E2E8F0',
borderRadius: 10,
marginTop: 18,
overflow: 'hidden',
},

progressFill: {
height: '100%',
width: '25%',
backgroundColor: '#2563EB',
borderRadius: 10,
},

progressText: {
fontSize: 12,
color: '#64748B',
lineHeight: 18,
marginTop: 10,
},

trainerButton: {
backgroundColor: '#FFFFFF',
borderRadius: 17,
padding: 16,
marginBottom: 12,
flexDirection: 'row',
alignItems: 'center',
},

trainerIconContainer: {
width: 46,
height: 46,
borderRadius: 13,
backgroundColor: '#DBEAFE',
alignItems: 'center',
justifyContent: 'center',
marginRight: 12,
},

trainerIcon: {
fontSize: 21,
},

trainerTextContainer: {
flex: 1,
},

trainerButtonText: {
fontSize: 16,
fontWeight: '800',
color: '#172554',
},

trainerButtonSubtext: {
fontSize: 12,
color: '#64748B',
marginTop: 4,
lineHeight: 17,
},

trainerArrow: {
fontSize: 22,
color: '#2563EB',
marginLeft: 8,
},

overviewCard: {
backgroundColor: '#FFFFFF',
borderRadius: 18,
padding: 17,
marginBottom: 25,
},

overviewItem: {
flexDirection: 'row',
alignItems: 'center',
paddingVertical: 2,
},

overviewPressed: {
opacity: 0.6,
},

overviewIcon: {
fontSize: 24,
width: 42,
marginRight: 10,
},

overviewTextContainer: {
flex: 1,
},

overviewTitle: {
fontSize: 14,
fontWeight: '800',
color: '#172554',
},

overviewSubtitle: {
fontSize: 11,
color: '#64748B',
marginTop: 3,
},

overviewArrow: {
fontSize: 20,
color: '#2563EB',
marginLeft: 8,
},

overviewDivider: {
height: 1,
backgroundColor: '#E2E8F0',
marginVertical: 14,
},

accountCard: {
backgroundColor: '#FFFFFF',
borderRadius: 18,
padding: 17,
marginBottom: 18,
},

accountRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingVertical: 5,
},

accountLabel: {
fontSize: 13,
color: '#64748B',
},

accountValue: {
fontSize: 14,
color: '#172554',
fontWeight: '600',
maxWidth: '70%',
textAlign: 'right',
},

divider: {
height: 1,
backgroundColor: '#E2E8F0',
marginVertical: 11,
},

roleBadge: {
backgroundColor: '#DBEAFE',
paddingHorizontal: 10,
paddingVertical: 5,
borderRadius: 8,
},

roleText: {
color: '#2563EB',
fontSize: 12,
fontWeight: '800',
},

signOutButton: {
backgroundColor: '#FFFFFF',
borderWidth: 1,
borderColor: '#FCA5A5',
borderRadius: 12,
paddingVertical: 14,
alignItems: 'center',
},

signOutText: {
color: '#DC2626',
fontSize: 15,
fontWeight: '800',
},

footer: {
textAlign: 'center',
color: '#94A3B8',
fontSize: 12,
marginTop: 22,
},
});
