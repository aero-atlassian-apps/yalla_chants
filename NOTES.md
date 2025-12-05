# Notes

- For a vector supporters icon, add react-native-svg and wire a small SVG component; I can add this next.
  - Install: `npx expo install react-native-svg`
  - Create: `src/components/icons/SupportersIcon.tsx` exporting an SVG-based icon.
  - Replace emoji in the country card top row:
    - `src/screens/HomeScreen.tsx` inside `renderCountryCard` top row (around the "👥" usage).
    - `src/screens/SearchScreen.tsx` inside `renderCountryCard` top row (around the "👥" usage).

- If you prefer the Sign In CTAs to jump straight to Login instead of Profile, I can switch both Home and Search CTAs accordingly.
  - Current behavior:
    - `GuestBanner` CTA navigates to `Profile` (`src/components/GuestBanner.tsx`).
    - Home empty-countries panel CTA navigates to `Profile` (`src/screens/HomeScreen.tsx`).
    - Search empty-countries panel CTA navigates to `Profile` (`src/screens/SearchScreen.tsx`).
    - From Profile, guest view `onSignIn` navigates to `Login` (`src/screens/ProfileScreen.tsx`).
  - Direct-to-Login option (if desired):
    - Change `GuestBanner` CTA to `navigation.navigate('Login')`.
    - Change Home and Search fallback CTAs to `navigation.navigate('Login')`.
    - This keeps flows consistent and skips the extra step.

