import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { Colors } from './Colors';

export interface InputProps extends TextInputProps {
  /**
   * The text to display above the input.
   */
  label?: string;
  /**
   * If true, displays a red asterisk next to the label text.
   */
  required?: boolean;
  /**
   * Error message to display below the input. If set, puts the input in an error state.
   */
  error?: string;
  /**
   * Helpful description text to display below the input (only visible if there's no error).
   */
  helperText?: string;
  /**
   * Optional icon to display on the left of the text input.
   */
  leftIcon?: React.ReactNode;
  /**
   * Optional icon to display on the right of the text input.
   * If secureTextEntry is true, this will be overridden by the password toggle eye icon.
   */
  rightIcon?: React.ReactNode;
  /**
   * Style for the outer wrapper container.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Style for the input wrapper (holds the icons and text input).
   */
  inputContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style for the actual text input element.
   */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Style for the label text.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Style for the error text.
   */
  errorStyle?: StyleProp<TextStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  required = false,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  onFocus,
  onBlur,
  editable = true,
  placeholderTextColor,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const isPassword = secureTextEntry === true;
  const shouldHideText = isPassword && !isPasswordVisible;

  // Determine border and background styles based on states
  const getBorderColor = () => {
    if (error) return Colors.feedback.error;
    if (isFocused) return Colors.primary.default;
    return Colors.neutral.gray300;
  };

  const getBackgroundColor = () => {
    if (!editable) return Colors.neutral.gray100;
    return Colors.neutral.white;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, !editable && styles.disabledText, labelStyle]}>
            {label}
          </Text>
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
      )}

      {/* Input container (combines icons & input) */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
          !editable && styles.disabledBorder,
          inputContainerStyle,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          style={[
            styles.textInput,
            !editable && styles.disabledTextInput,
            inputStyle,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          secureTextEntry={shouldHideText}
          placeholderTextColor={placeholderTextColor || Colors.neutral.gray500}
          {...restProps}
        />

        {/* Right Icon / Password toggle */}
        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={error ? Colors.feedback.error : Colors.neutral.gray600}
            />
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {/* Error or Helper text */}
      {error ? (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      ) : (
        helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.neutral.gray800,
  },
  requiredAsterisk: {
    color: Colors.feedback.error,
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 20,
    // Shadow for text inputs
    shadowColor: Colors.neutral.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins',
    fontSize: 15,
    color: Colors.neutral.gray900,
    paddingVertical: 0, // needed on Android to vertically center text
  },
  leftIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 12,
    fontFamily: 'Poppins',
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: Colors.neutral.gray600,
    fontSize: 12,
    fontFamily: 'Poppins',
    marginTop: 4,
    marginLeft: 4,
  },
  disabledText: {
    color: Colors.neutral.gray500,
  },
  disabledTextInput: {
    color: Colors.neutral.gray500,
  },
  disabledBorder: {
    borderColor: Colors.neutral.gray300,
  },
});
