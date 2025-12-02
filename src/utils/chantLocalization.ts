import { Chant } from '../services/chantService';
import i18n from '../i18n/i18n';

export type SupportedLanguage = 'en' | 'fr' | 'pt' | 'ar';

/**
 * Get localized title based on user language preference
 */
export const getLocalizedTitle = (chant: Chant, languageCode?: string): string => {
  const lang = (languageCode || i18n.language) as SupportedLanguage;
  
  switch (lang) {
    case 'ar':
      return chant.title_arabic || chant.title;
    case 'fr':
      return chant.title_french || chant.title;
    default:
      return chant.title;
  }
};

/**
 * Get localized description based on user language preference
 */
export const getLocalizedDescription = (chant: Chant, languageCode?: string): string | undefined => {
  const lang = (languageCode || i18n.language) as SupportedLanguage;
  
  switch (lang) {
    case 'en':
      return chant.description_en;
    case 'fr':
      return chant.description_fr || chant.description_en;
    case 'pt':
      return chant.description_pt || chant.description_en;
    case 'ar':
      return chant.description_ar || chant.description_en;
    default:
      return chant.description_en;
  }
};

/**
 * Get localized viral moment based on user language preference
 */
export const getLocalizedViralMoment = (chant: Chant, languageCode?: string): string | undefined => {
  const lang = (languageCode || i18n.language) as SupportedLanguage;
  
  switch (lang) {
    case 'en':
      return chant.viral_moment_en;
    case 'fr':
      return chant.viral_moment_fr || chant.viral_moment_en;
    case 'pt':
      return chant.viral_moment_pt || chant.viral_moment_en;
    case 'ar':
      return chant.viral_moment_ar || chant.viral_moment_en;
    default:
      return chant.viral_moment_en;
  }
};

/**
 * Get localized lyrics based on user language preference
 */
export const getLocalizedLyrics = (chant: Chant, languageCode?: string): string | undefined => {
  const lang = (languageCode || i18n.language) as SupportedLanguage;
  
  switch (lang) {
    case 'en':
      return chant.lyrics;
    case 'fr':
      return chant.lyrics_french || chant.lyrics;
    case 'ar':
      return chant.lyrics_arabic || chant.lyrics;
    default:
      return chant.lyrics;
  }
};

/**
 * Get display artist (prefer artist over football_team)
 */
export const getDisplayArtist = (chant: Chant): string | undefined => {
  return chant.artist || chant.football_team;
};

/**
 * Check if chant has multilingual content
 */
export const hasMultilingualContent = (chant: Chant): boolean => {
  return !!(
    chant.title_arabic ||
    chant.title_french ||
    chant.description_en ||
    chant.description_fr ||
    chant.description_pt ||
    chant.description_ar ||
    chant.viral_moment_en ||
    chant.viral_moment_fr ||
    chant.viral_moment_pt ||
    chant.viral_moment_ar
  );
};

/**
 * Get all available languages for a chant
 */
export const getAvailableLanguages = (chant: Chant): SupportedLanguage[] => {
  const languages: SupportedLanguage[] = ['en'];
  
  if (chant.title_arabic || chant.description_ar || chant.viral_moment_ar) {
    languages.push('ar');
  }
  if (chant.title_french || chant.description_fr || chant.viral_moment_fr) {
    languages.push('fr');
  }
  if (chant.description_pt || chant.viral_moment_pt) {
    languages.push('pt');
  }
  
  return languages;
};