import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import { Colors } from './Colors';

export interface ButtonProps {
  /**
   * The text to display inside the button.
   */
  title?: string;
  /**
   * Content inside the button (e.g. for custom layouts). If provided, overrides title.
   */
  children?: React.ReactNode;
  /**
   * Callback to run when button is pressed.
   */
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * The button variant type.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'info' | 'danger' | 'warning';
  /**
   * The button size.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * If true, disables user interaction and styles the button as disabled.
   */
  disabled?: boolean;
  /**
   * If true, displays a loading spinner instead of the text and disables interaction.
   */
  loading?: boolean;
  /**
   * Optional icon to render on the left of the text.
   */
  leftIcon?: React.ReactNode;
  /**
   * Optional icon to render on the right of the text.
   */
  rightIcon?: React.ReactNode;
  /**
   * Custom style for the button container.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom style for the button text.
   */
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const isInteractionDisabled = disabled || loading;

  // Background configurations
  const getBackgroundColor = (pressed: boolean) => {
    if (isInteractionDisabled) {
      return Colors.neutral.gray200;
    }
    switch (variant) {
      case 'secondary':
        return pressed ? Colors.secondary.pressed : Colors.secondary.default;
      case 'info':
        return pressed ? Colors.info.pressed : Colors.info.default;
      case 'danger':
        return pressed ? Colors.danger.pressed : Colors.danger.default;
      case 'warning':
        return pressed ? Colors.warning.pressed : Colors.warning.default;
      case 'primary':
      default:
        return pressed ? Colors.primary.pressed : Colors.primary.default;
    }
  };

  // Text color configurations
  const getTextColor = () => {
    if (isInteractionDisabled) {
      return Colors.neutral.gray500;
    }
    switch (variant) {
      case 'secondary':
        return Colors.secondary.text;
      case 'primary':
      case 'info':
      case 'danger':
      case 'warning':
      default:
        return Colors.neutral.white;
    }
  };

  return (
    <Pressable
      onPress={isInteractionDisabled ? undefined : onPress}
      disabled={isInteractionDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        { backgroundColor: getBackgroundColor(pressed) },
        // Subtle shadow for standard buttons (not disabled or secondary)
        !isInteractionDisabled && variant !== 'secondary' && styles.shadow,
        disabled && styles.disabledBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          
          {children ? (
            children
          ) : (
            <Text
              style={[
                styles.textBase,
                styles[`text_${size}` as keyof typeof styles] as StyleProp<TextStyle>,
                { color: getTextColor() },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}

          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  // Sizes
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 38,
    borderRadius: 19,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 52,
    borderRadius: 26,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 58,
    borderRadius: 29,
  },
  // Text sizes
  textBase: {
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
  // Icon containers
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  // Shadows
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledBorder: {
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
});
