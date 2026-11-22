import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../lib/theme';

interface QRTicketProps {
  value: string;
  size?: number;
}

export const QRTicket: React.FC<QRTicketProps> = ({ value, size = 200 }) => {
  return (
    <View style={styles.container}>
      <QRCode 
        value={value} 
        size={size} 
        color={theme.colors.textPrimary}
        backgroundColor={theme.colors.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
