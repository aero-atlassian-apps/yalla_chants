import React from 'react';
import { render } from '@testing-library/react-native';

// Mock useColors
jest.mock('../src/constants/Colors', () => ({
  useColors: () => ({
    surface: 'white',
    primary: 'blue',
    error: 'red',
    textSecondary: 'grey',
    text: 'black',
    surfaceLight: 'lightgrey',
  }),
}));

import { Input } from '../src/components/Input';

describe('Input', () => {
    it('renders label correctly', () => {
        const { getByText } = render(<Input label="Email" />);
        expect(getByText('Email')).toBeTruthy();
    });

    it('has accessibility label matching the visible label', () => {
        const { getByLabelText } = render(<Input label="Email" />);
        expect(getByLabelText('Email')).toBeTruthy();
    });

    it('shows error message and announces it', () => {
        const { getByText, getByLabelText } = render(<Input label="Email" error="Invalid email" />);

        // Error text should be visible
        const errorText = getByText('Invalid email');
        expect(errorText).toBeTruthy();

        // Error text should be a live region
        expect(errorText.props.accessibilityLiveRegion).toBe('polite');

        // Input should have the error as a hint or be marked invalid
        const input = getByLabelText('Email');
        expect(input.props.accessibilityHint).toBe('Invalid email');
        expect(input.props.accessibilityState.invalid).toBe(true);
    });
});
