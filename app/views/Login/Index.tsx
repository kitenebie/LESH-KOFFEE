import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Button } from '../../../components/UI/Button';
import { Colors } from '../../../components/UI/Colors';
import { Input } from '../../../components/UI/Input';
import { login } from '../../../services/authService';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Video Player for Capybara
  const capyPlayer = useVideoPlayer(require('../../../assets/app/bara-video.mp4'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success && result.data?.user) {
        // authService.login() already saves session + token to SQLite
        router.replace('/views/Home/Index');
      } else {
        setError(result.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
      console.warn('[Login] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
      {/* Background Decorative Circles */}
      <Animated.View entering={FadeIn.duration(600)} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header — slides from bottom */}
        <Animated.View entering={SlideInDown.delay(200).duration(400)} style={styles.header}>
          <View style={styles.videoWrapper}>
            <VideoView
              style={styles.video}
              player={capyPlayer}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="cover"
              surfaceType="textureView"
            />
          </View>
          <Text style={styles.FontText}>Welcome back!</Text>
          <Text style={styles.subtext}>Have a nice coffee date with Lesh Kaffe X Pasalubong</Text>
        </Animated.View>

        {/* Form Fields — alternating left/right */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error !== '' && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Animated.View entering={SlideInLeft.delay(400).duration(400)}>
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
            />
          </Animated.View>

          <Animated.View entering={SlideInRight.delay(500).duration(400)}>
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
            />
          </Animated.View>

          <Animated.View entering={SlideInLeft.delay(600).duration(400)}>
            <Button
              title="Sign In"
              variant="primary"
              loading={isLoading}
              onPress={handleLogin}
              style={styles.loginBtn}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View entering={SlideInRight.delay(800).duration(400)}>
            <Button
              title="Register"
              variant="secondary"
              onPress={() => router.push('/views/Register/Index')}
              style={styles.showcaseBtn}
            />
          </Animated.View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FAF9F5', 
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 28,
    paddingTop: 60,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#F3F0E6',
    borderRadius: 999,
  },
  circle1: {
    width: 320,
    height: 320,
    top: -60,
    left: -80,
  },
  circle2: {
    width: 380,
    height: 380,
    bottom: -60,
    right: -100,
    opacity: 0.8,
  },
  circle3: {
    width: 200,
    height: 200,
    top: 180,
    right: -60,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  videoWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary.default,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  FontText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: Colors.primary.default,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtext: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray600,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#C62828',
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: 20,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.gray300,
  },
  dividerText: {
    marginHorizontal: 12,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray500,
  },
  showcaseBtn: {
    marginTop: 0,
  },
});
