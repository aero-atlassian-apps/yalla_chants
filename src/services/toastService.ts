import { Platform } from 'react-native';
import Toast from 'react-native-root-toast';

export const showErrorToast = (message: string) => {
    Toast.show(message, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
        shadow: Platform.OS !== 'web',
        animation: true,
        hideOnPress: true,
        backgroundColor: '#DC2626',
        textColor: '#fff',
        ...(Platform.OS === 'web' ? { containerStyle: { boxShadow: '0px 2px 8px rgba(0,0,0,0.35)' } } : { shadowColor: '#000' }),
        opacity: 0.95,
        delay: 0,
    });
};

export const showSuccessToast = (message: string) => {
    Toast.show(message, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
        shadow: Platform.OS !== 'web',
        animation: true,
        hideOnPress: true,
        backgroundColor: '#10B981',
        textColor: '#fff',
        ...(Platform.OS === 'web' ? { containerStyle: { boxShadow: '0px 2px 8px rgba(0,0,0,0.35)' } } : { shadowColor: '#000' }),
        opacity: 0.95,
        delay: 0,
    });
};

export const showInfoToast = (message: string) => {
    Toast.show(message, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
        shadow: Platform.OS !== 'web',
        animation: true,
        hideOnPress: true,
        backgroundColor: '#3B82F6',
        textColor: '#fff',
        ...(Platform.OS === 'web' ? { containerStyle: { boxShadow: '0px 2px 8px rgba(0,0,0,0.35)' } } : { shadowColor: '#000' }),
        opacity: 0.95,
        delay: 0,
    });
};
