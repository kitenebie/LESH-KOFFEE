import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ReAnimated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { StepContact } from '../../../components/Register/StepContact';
import { StepName } from '../../../components/Register/StepName';
import { StepOtp } from '../../../components/Register/StepOtp';
import { Colors } from '../../../components/UI/Colors';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Error States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Step Transition Animations (keep old Animated for step transitions since it's imperative)
  const stepFade = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;

  // Transition Animation helper
  const animateToStep = (nextStep: number, direction: 'forward' | 'backward') => {
    Keyboard.dismiss();
    const outValue = direction === 'forward' ? -80 : 80;
    const inValue = direction === 'forward' ? 80 : -80;

    Animated.parallel([
      Animated.timing(stepFade, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(stepTranslateX, {
        toValue: outValue,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      stepTranslateX.setValue(inValue);

      Animated.parallel([
        Animated.timing(stepFade, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Validations
  const validateStep1 = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!firstName.trim()) tempErrors.firstName = 'First name is required';
    if (!lastName.trim()) tempErrors.lastName = 'Last name is required';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const validateStep2 = () => {
    const tempErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Enter a valid email address';
    }

    if (!phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (phone.length < 10) {
      tempErrors.phone = 'Phone number must be at least 10 digits';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const validateStep3 = () => {
    const fullOtp = otp.join('');
    return fullOtp.length === 6;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        animateToStep(2, 'forward');
      }
    } else if (step === 2) {
      if (validateStep2()) {
        animateToStep(3, 'forward');
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      animateToStep(1, 'backward');
    } else if (step === 3) {
      animateToStep(2, 'backward');
    }
  };

  const handleRegister = () => {
    if (!validateStep3()) {
      alert('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const fullOtp = otp.join('');
      alert(
        `Espressia Account Registered!\n\nName: ${firstName} ${middleName ? middleName + ' ' : ''}${lastName}\nEmail: ${email}\nPhone: +63 ${phone}\nOTP Code Verified: ${fullOtp}`
      );
      router.replace('/views/Home/Index');
    }, 2000);
  };

  const getStepTitle = () => {
    switch (step) {
      case 2:
        return 'Contact details';
      case 3:
        return 'OTP Verification';
      case 1:
      default:
        return 'Tell us your name';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 2:
        return "We'll send a 6-digit validation code to verify your phone number.";
      case 3:
        return `Enter the 6-digit verification code sent to +63 ${phone}`;
      case 1:
      default:
        return 'Enter your legal name to get started with your account setup.';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      {/* Background Decorative Circles */}
      <ReAnimated.View entering={FadeIn.duration(600)} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </ReAnimated.View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Header & Step Progress Bar — slides from bottom */}
        <ReAnimated.View entering={SlideInDown.delay(200).duration(400)} style={styles.header}>
          <Text style={styles.stepsText}>STEP {step} OF 3</Text>
          
          {/* Custom Horizontal Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
        </ReAnimated.View>

        {/* Action Form Step Container — step transitions use old Animated */}
        <ReAnimated.View entering={SlideInLeft.delay(400).duration(400)}>
          <Animated.View
            style={[
              styles.stepContent,
              {
                opacity: stepFade,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            {/* Render Active Step Page File */}
            {step === 1 && (
              <StepName
                firstName={firstName}
                setFirstName={setFirstName}
                middleName={middleName}
                setMiddleName={setMiddleName}
                lastName={lastName}
                setLastName={setLastName}
                errors={errors}
                setErrors={setErrors}
                onNext={handleNext}
              />
            )}

            {step === 2 && (
              <StepContact
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                errors={errors}
                setErrors={setErrors}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {step === 3 && (
              <StepOtp
                otp={otp}
                setOtp={setOtp}
                phone={phone}
                isLoading={isLoading}
                onBack={handleBack}
                onSubmit={handleRegister}
              />
            )}
          </Animated.View>
        </ReAnimated.View>
        
        {/* Navigation bottom helper */}
        <ReAnimated.View entering={SlideInRight.delay(600).duration(400)}>
          <TouchableOpacity 
            style={styles.goBackToLogin}
            onPress={() => router.replace('/views/Login/Index')}
          >
            <Text style={styles.goBackToLoginText}>
              Already have an account? <Text style={styles.boldLabel}>Login In</Text>
            </Text>
          </TouchableOpacity>
        </ReAnimated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scrollContainer: {
    padding: 28,
    paddingTop: 16,
    paddingBottom: 60,
    zIndex: 1,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  // Background circles
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
    marginBottom: 24,
  },
  stepsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#8A887F',
    letterSpacing: 1,
    marginBottom: 6,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.neutral.gray300,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.default,
    borderRadius: 2,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary.default,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: Colors.neutral.gray600,
    lineHeight: 20,
  },
  stepContent: {
    width: '100%',
  },
  goBackToLogin: {
    alignItems: 'center',
    marginTop: 36,
  },
  goBackToLoginText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray700,
  },
  boldLabel: {
    fontFamily: 'Poppins-Bold',
    color: Colors.primary.default,
  },
});
