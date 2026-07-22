import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/UI/Button';
import { Colors } from '../components/UI/Colors';
import { isLoggedIn } from '../lib/authSession';

export default function Welcome() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Animation values
  const bgFade = useRef(new Animated.Value(0)).current;
  const imageFade = useRef(new Animated.Value(0)).current;
  const imageTranslateY = useRef(new Animated.Value(45)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(30)).current;

  // Check if user is already logged in — skip to Home if true
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          router.replace('/views/Home/Index');
          return;
        }
      } catch (err) {
        // If check fails, show welcome screen normally
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return; // Don't animate until auth check is done
    // Run all mounting animations in parallel with stagger effect
    Animated.parallel([
      // 1. Background elements fade in
      Animated.timing(bgFade, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }),
      // 2. Coffee Cup image fade in & slide up smoothly
      Animated.timing(imageFade, {
        toValue: 1,
        duration: 950,
        useNativeDriver: true,
      }),
      Animated.timing(imageTranslateY, {
        toValue: 0,
        duration: 950,
        useNativeDriver: true,
      }),
      // 3. Hero text animation starts with slight delay
      Animated.sequence([
        Animated.delay(250),
        Animated.parallel([
          Animated.timing(textFade, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // 4. Action buttons animation starts last
      Animated.sequence([
        Animated.delay(450),
        Animated.parallel([
          Animated.timing(buttonsFade, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(buttonsTranslateY, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [checkingAuth, bgFade, imageFade, imageTranslateY, textFade, textTranslateY, buttonsFade, buttonsTranslateY]);

  // Video Player for the Capybara avatar
  const capyPlayer = useVideoPlayer(require('../assets/app/bara-landscape-video.mp4'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // While checking auth, show nothing (prevents flash of welcome screen)
  if (checkingAuth) return null;

  return (
    <View style={styles.container}>

      {/* Abstract Background Decorative Circles */}
      <Animated.View style={{ opacity: bgFade, position: 'absolute', width: '100%', height: '100%' }}>
        <View style={[styles.circle, styles.circle2]} />
      </Animated.View>

      {/* Coffee Cup and beans Image */}
      <Animated.View style={[styles.imageContainer, { opacity: imageFade, transform: [{ translateY: imageTranslateY }] }]}>


        <VideoView
          style={styles.image}
          player={capyPlayer}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="cover"
          surfaceType="textureView"
        />

        {/* Soft edge gradient fades */}
        <LinearGradient
          colors={['#FAF9F5', 'rgba(250, 249, 245, 0)']}
          style={styles.fadeTop}
        />
        <LinearGradient
          colors={['rgba(250, 249, 245, 0)', '#FAF9F5']}
          style={styles.fadeBottom}
        />
        <LinearGradient
          colors={['#FAF9F5', 'rgba(250, 249, 245, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeLeft}
        />
        <LinearGradient
          colors={['rgba(250, 249, 245, 0)', '#FAF9F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeRight}
        />
      </Animated.View>

      {/* Abstract Background Decorative Circles */}
      <Animated.View style={{ opacity: bgFade, position: 'absolute', width: '100%', height: '100%' }}>
        <View style={[styles.circle, styles.circle3]} />
        <View style={[styles.circle, styles.circle1]} />
      </Animated.View>

      {/* Hero Text */}
      <Animated.View style={[styles.textContainer, { opacity: textFade, transform: [{ translateY: textTranslateY }] }]}>
        <Text style={styles.title}>Welcome to{"\n"}Foam Coffee!</Text>
        <Text style={styles.subtitle}>
          Where quality meets every sip. Elevating coffee excellence. One cup at a time.
        </Text>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonsFade, transform: [{ translateY: buttonsTranslateY }] }]}>
        <Button
          title="Continue"
          variant="primary"
          onPress={() => router.replace('/views/Home/Index')}
          style={styles.registerBtn}
          textStyle={styles.registerBtnText}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5', // Soft ivory / beige background
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
  // Background decorative circles
  circle: {
    position: 'absolute',
    backgroundColor: '#E1EEFA', // Soft cloud blue to match brand theme
    borderRadius: 999,
  },
  circle1: {
    width: 220,
    height: 220,
    top: -120,
    left: -120,
    opacity: 0.2,
  },
  circle2: {
    width: 380,
    height: 380,
    bottom: -60,
    right: -100,
    opacity: 0.6,
  },
  circle3: {
    width: 100,
    height: 100,
    top: 280,
    right: -60,
    opacity: 0.3,
  },
  // Image layout
  imageContainer: {
    width: '100%',
    height: 350,
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF9F5',
  },
  // Text content layout
  textContainer: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 34,
    lineHeight: 42,
    color: Colors.primary.default, // Coffee dark color matching screenshot
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    lineHeight: 22,
    color: '#8A887F', // Warm grey-brown color matching screenshot
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  // Action buttons layout
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  registerBtn: {
    borderRadius: 28,
    height: 56,
    backgroundColor: Colors.primary.default, // Custom dark olive green matching screenshot
    borderWidth: 0,
    // Add extra shadow/elevation for premium feel
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  registerBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontStyle: 'italic', // Italic style as seen in screenshot
    fontSize: 17,
  },
  loginBtn: {
    borderRadius: 28,
    height: 56,
    backgroundColor: Colors.secondary.default, // Custom light cream matching screenshot
    borderWidth: 0,
    marginTop: 14,
    // Add extra shadow/elevation for premium feel
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginBtnText: {
    fontFamily: 'Poppins-SemiBold',
    color: Colors.primary.default,
    fontSize: 17,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 1,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 1,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 32,
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    zIndex: 1,
  },
});
