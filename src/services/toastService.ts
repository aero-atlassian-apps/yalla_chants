import Toast from 'react-native-root-toast';

export const showErrorToast = (message: string) => {
    Toast.show(message, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        backgroundColor: '#DC2626',
        textColor: '#fff',
        shadowColor: '#000',
        opacity: 0.95,
        delay: 0,
    });
};

export const showSuccessToast = (message: string) => {
    Toast.show(message, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        backgroundColor: '#10B981',
        textColor: '#fff',
        shadowColor: '#000',
        opacity: 0.95,
        delay: 0,
    });
};

export const showInfoToast = (message: string) => {
    Toast.show(message, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        backgroundColor: '#3B82F6',
        textColor: '#fff',
        shadowColor: '#000',
        opacity: 0.95,
        delay: 0,
    });
};
