import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonPrimaryProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "danger";
}

export function ButtonPrimary({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  variant = "primary",
}: ButtonPrimaryProps) {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.button,
    variant === "primary" && styles.buttonPrimary,
    variant === "secondary" && styles.buttonSecondary,
    variant === "danger" && styles.buttonDanger,
    isDisabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === "primary" && styles.textPrimary,
    variant === "secondary" && styles.textSecondary,
    variant === "danger" && styles.textDanger,
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? "#0F766E" : "#FFFFFF"}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 52,
  },
  buttonPrimary: {
    backgroundColor: "#0F766E",
  },
  buttonSecondary: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#0F766E",
  },
  buttonDanger: {
    backgroundColor: "#DC2626",
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textSecondary: {
    color: "#0F766E",
  },
  textDanger: {
    color: "#FFFFFF",
  },
  textDisabled: {
    color: "#9CA3AF",
  },
});
