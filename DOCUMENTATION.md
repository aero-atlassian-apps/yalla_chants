# Yalla Chant: The Exhaustive Product Bible

## 1. Product Vision & Mental Model

### 👶 Explain Like I'm 5
Imagine a magical book that sings football songs. When you open a page about Brazil, it doesn't just show the flag; it plays the songs the fans sing in the stadium so you can learn them. It remembers the songs even when you don't have internet, so you can sing along inside the noisy stadium.

### 🧒 Explain Like a Beginner
Yalla Chant is a mobile app for football fans. It's a library of "chants" (fan songs). You can browse by country or team, read the lyrics in different languages, and listen to the audio. It's designed to work perfectly even if you are offline, like when you are at a game with bad signal.

### 🧑‍💻 Explain Like a Junior Developer
This is a React Native app built with Expo. It uses Supabase for the backend database and file storage. The app fetches data (chants, countries) and caches it locally on the device so it loads instantly. It has a music player component that plays audio files while showing synchronized lyrics.

### 🧙‍♂️ Explain Like a Senior Engineer
Yalla Chant is an offline-first, read-heavy content delivery application. It employs a "Stale-While-Revalidate" strategy using `react-native-mmkv` for high-performance synchronous caching of JSON data, and `react-native-track-player` (native) / `HTMLAudioElement` (web) for streaming media. The architecture decouples the UI from the Data Layer via a Service Pattern (`chantService`), ensuring that components are purely presentational and resilient to network/API failures.

### 💡 WHY this design?
*   **Offline First:** Stadiums are effectively Faraday cages. A streaming-only app would fail at the exact moment of highest user intent. We chose aggressive local caching over real-time consistency.
*   **Expo:** We need to target iOS, Android, and Web simultaneously with a small team. Expo's managed workflow with Prebuild capabilities allows us to use native modules (like TrackPlayer) while maintaining a unified JS codebase.

---

## 2. User Experience & Features (EXHAUSTIVE)

### Feature: The Audio Player

#### 👶 ELI5
Just like a music box. You press play, music comes out. You can pause it, or skip to the next song. It stays at the bottom of the screen so you can keep looking at other pictures while listening.

#### 🧒 Beginner
The player appears automatically when you tap a chant. It has a "Minified" view (a small bar at the bottom) and a "Maximized" view (full screen with lyrics). You can shuffle songs or repeat them.

#### 🧑‍💻 Junior
The Player component subscribes to a global state store (`playerStore`). When a user taps a card, we update the store's `currentTrack`. The UI reacts to this change. We use `useEffect` hooks to update the progress bar every 500ms.

#### 🧙‍♂️ Senior
The Player is a singleton-like orchestrator managed by Zustand. It abstracts the underlying audio engine (TrackPlayer on Native, Audio API on Web).
*   **Data Read:** Reads `audio_url` from the `Chant` object.
*   **Data Written:** Writes "Play Events" to Supabase for analytics (`record_chant_play` RPC).
*   **Edge Cases:**
    *   **Slow Network:** We implemented a `stallCounter` in `audioService`. If playback stalls for >3 seconds, we trigger a buffering state UI.
    *   **Offline:** The service checks if the file exists in the file system cache. If yes, it plays the local `file://` URI. If no, it attempts to stream and fails gracefully with a Toast if the network is unreachable.
    *   **App Background:** We configured `UIBackgroundModes` in `app.json` so audio continues when the phone is locked.

#### 💡 WHY?
We separated the "Store" (State) from the "Service" (Logic) from the "Component" (UI). This allows the Mini-Player and Full-Player to be perfectly synced without passing props down 10 levels.

---

### Feature: The Home Feed

#### 👶 ELI5
A long list of song cards. The top ones are from your country. The next ones are popular ones. You can scroll down forever.

#### 🧒 Beginner
The main screen showing lists of chants. It tries to show you things you like first (based on the country you picked). It also shows ads every now and then.

#### 🧑‍💻 Junior
This is a `ScrollView` containing multiple `FlatList` components (horizontal). We fetch data in parallel: "My Country", "Trending", "Recents". We use `SkeletonLoader` to show gray boxes while data is loading so the screen doesn't jump around.

#### 🧙‍♂️ Senior
We use a "Composite Feed" pattern.
*   **Data Fetching:** We fire 3 concurrent promises (`Promise.all`) to Supabase.
*   **Optimization:** We use `removeClippedSubviews` and `initialNumToRender` on the horizontal lists to prevent memory spikes. Images use `expo-image` with memory caching to prevent UI thread blocking during scroll.
*   **Resilience:** If the "Trending" query fails but "My Country" succeeds, we render the page partially rather than showing a full error screen.

#### 💡 WHY?
Horizontal lists inside a vertical scroll is a classic pattern (Netflix style) that maximizes density. We prioritized "perceived performance" (skeletons) over "actual completion" (waiting for all data).

---

## 3. Screen-by-Screen Breakdown

### Screen 1: `HomeScreen`
*   **Purpose:** Discovery & Dashboard.
*   **UI Components:** `HeroSection`, `HorizontalChantList`, `AdBanner`.
*   **Layout:** Vertical Scroll. Hero Image (static) -> "My Country" (Horizontal) -> "Trending" (Horizontal) -> "Countries Grid" (Vertical Grid).
*   **Interaction:** Tapping a card plays audio immediately. Tapping "View All" navigates to `PlaylistDetail`.
*   **Perf:** Uses `FlashList` for the Countries grid due to the large number of items (~200).

### Screen 2: `SearchScreen`
*   **Purpose:** Find specific content.
*   **UI:** `SearchBar` (sticky header), `FilterPills` (Team, Tournament, Lyric), `SearchResultsList`.
*   **Layout:** Flat list of results.
*   **Logic:** Debounces input by 500ms. Triggers `chantService.searchAll(query)`.
*   **Empty State:** Shows "Suggested Searches" or "Trending Teams".
*   **Offline:** Falls back to searching the local MMKV cache for matching strings (limited result set).

### Screen 3: `LibraryScreen`
*   **Purpose:** Browse the taxonomy.
*   **UI:** Grid of Country Flags. Alphabetical index on the right (A-Z).
*   **Interaction:** Tapping a Country -> Navigates to `PlaylistDetail` (filtered by that country).
*   **Perf:** Since flags are SVGs, we use `react-native-svg` optimized with `memo`.

### Screen 4: `ProfileScreen`
*   **Purpose:** User management and personalization.
*   **UI:** Avatar, "My Likes" list, "My Playlists", "Logout" button.
*   **Logic:** Checks `authStore.session`. If Guest, shows "Sign Up to save favorites" banner.
*   **Data:** Reads `user_profiles` table.

### Screen 5: `JamSessionScreen` (The "Multiplayer" Feature)
*   **Purpose:** Synchronized playback.
*   **UI:** Big "SYNC" button, list of connected users (Avatars).
*   **Logic:** Uses Supabase Realtime channels.
    1.  Host presses "Play".
    2.  Message broadcast: `{ event: 'PLAY', timestamp: server_time + 2000ms }`.
    3.  Clients schedule playback to start exactly at that timestamp.
*   **Error Handling:** If clock drift is >500ms, shows a warning "Sync quality low".

---

## 4. Component Architecture

### 👶 ELI5
We build with Lego blocks. Small blocks (Buttons) make medium blocks (Cards), which make big blocks (Screens).

### 🧒 Beginner
*   **Atoms:** Buttons, Inputs, Icons.
*   **Molecules:** A "Chant Card" (Image + Text + Play Button).
*   **Organisms:** The "Player" (Controls + Artwork + Queue List).

### 🧑‍💻 Junior
We use "Container/Presentational" separation loosely.
*   `EnhancedChantCard.tsx`: Pure presentation. Takes a `Chant` prop and `onPress` callback.
*   `HomeScreen.tsx`: Container. Fetches data, handles state, passes data to cards.

### 🧙‍♂️ Senior
Our components must be **Stateless** whenever possible to allow for predictable rendering.
*   **Props Interface:** Every component exports its Props interface (e.g., `EnhancedChantCardProps`).
*   **Memoization:** `React.memo` is used on `EnhancedChantCard` to prevent re-renders when the parent ScrollView updates but the card data hasn't changed.

### 💡 WHY?
React Native rendering is expensive. By making leaf nodes (Cards) memoized and pure, we ensure 60fps scrolling even with complex gradients and shadows.

---

## 5. Navigation System

### 👶 ELI5
It's like a map. You start at "Home". You can go to "Search" or "Library" using the buttons at the bottom. If you click a specific playlist, you "stack" a new page on top like a card.

### 🧒 Beginner
We use tabs for the main sections. When you go deeper (like clicking a playlist), a new screen slides in from the right. You can always go "Back".

### 🧑‍💻 Junior
We use React Navigation v7.
*   `TabNavigator`: The bottom bar.
*   `RootNavigator`: A Native Stack that holds the Tabs + specific screens (`PlaylistDetail`).
*   `Modal`: The `Player` isn't a screen; it's a view absolutely positioned *on top* of the navigator in `App.tsx`.

### 🧙‍♂️ Senior
The Navigation Tree is a "State Machine".
*   **Deep Linking:** We map `yallachant://chant/123` to the `Main` tab, then hydrate the `Player` state with chant `123`.
*   **Android Back Button:** We handle the hardware back button to minimize the player if it's open, rather than exiting the app.

### 💡 WHY?
We chose Native Stack over JS Stack for performance (uses native iOS/Android transitions). We kept the Player *outside* the navigation tree so it persists across screen changes without unmounting.

---

## 6. State Management (CRITICAL)

### 👶 ELI5
The app has a "brain" that remembers things. It remembers who you are, what song is playing, and if you have internet.

### 🧒 Beginner
We use a library called **Zustand**. It's like a global variable that any screen can read.
*   `authStore`: Are you logged in?
*   `playerStore`: What song is playing?

### 🧑‍💻 Junior
Zustand allows us to create "hooks".
*   `usePlayerStore(state => state.isPlaying)`: Only re-renders the component if `isPlaying` changes.
*   We avoid "Context Hell" by using atomic selectors.

### 🧙‍♂️ Senior
*   **Persistence:** `authStore` syncs with Supabase Auth (AsyncStorage). `guestStore` syncs with AsyncStorage manually.
*   **Derived State:** We don't store "isBuffering" in the database; it's ephemeral state derived from the audio service events.
*   **updates:** State updates are batched. The audio service emits an update every 500ms. We carefully throttle this to avoid React bridge traffic congestion.

### 💡 WHY?
Redux was rejected as too boilerplate-heavy. Context API triggers too many re-renders. Zustand provides the perfect balance of atomic updates and simplicity.

---

## 7. Data Layer & API Interaction

### 👶 ELI5
We keep our stickers in a sticker book (Database). When you open the app, we copy the stickers to your pocket (Cache) so you can look at them even if you lose the book.

### 🧒 Beginner
*   **Supabase:** The cloud database.
*   **Service:** A helper file that talks to the cloud.
*   **Cache:** A local copy of the data.

### 🧑‍💻 Junior
*   `chantService.ts`: Wraps Supabase calls.
*   `cacheService.ts`: Wraps `mmkv`.
*   **Flow:** UI calls `chantService.getAll()`. Service checks Cache. If empty, calls Supabase, saves to Cache, returns data.

### 🧙‍♂️ Senior
*   **DTOs (Data Transfer Objects):** We normalize the raw SQL response (snake_case) into TypeScript interfaces (camelCase-ish).
*   **RPC usage:** We use Postgres Functions (`search_chants`) for complex logic (e.g., text search + tag matching) to offload processing from the JS thread to the DB.
*   **Rate Limiting:** We rely on Supabase's built-in API gateway limits but implement exponential backoff in our `fetchWithTimeout` utility.

### 💡 WHY?
Supabase gives us a "Backend-as-a-Service" so we don't manage servers. MMKV is chosen because `AsyncStorage` is too slow for reading large JSON blobs during app boot.

---

## 8. Offline, Sync & Resilience Strategy

### 👶 ELI5
If the internet breaks, the app doesn't break. It just shows you what it remembers.

### 🧒 Beginner
We check if you have internet. If not, we don't try to load new things. We just show you the old things we saved.

### 🧑‍💻 Junior
*   `netGuard.ts`: Checks `NetInfo`.
*   `ensureOnline()`: A function we call before every API request. If offline, it throws a "Network Error".
*   **Fallback:** The UI catches this error and displays "Offline Mode" toast.

### 🧙‍♂️ Senior
*   **Optimistic UI:** We don't implement optimistic updates for "Likes" currently (we wait for server ACK) because consistency is prioritized over perceived speed for write actions.
*   **Cache Invalidation:** We use a TTL (Time To Live) strategy.
    *   `Trending`: 5 minutes TTL (High churn).
    *   `Countries`: 24 hours TTL (Static data).

### 💡 WHY?
Syncing databases (CRDTs) is overly complex for a read-heavy app. A simple "Cache-First" strategy covers 99% of use cases (reading chants in a stadium).

---

## 9. Performance Engineering

### 👶 ELI5
We make sure the app doesn't freeze or feel slow, like a video game that lags.

### 🧒 Beginner
*   We compress images so they download fast.
*   We only load the list items you can see on the screen.

### 🧑‍💻 Junior
*   `FlashList`: Used instead of `ScrollView` for long lists. It recycles views.
*   `LazyImage`: A component that shows a gray box until the image is downloaded.

### 🧙‍♂️ Senior
*   **JS Thread FPS:** We offload animations to the UI thread using `react-native-reanimated` (via `AnimatedTouchable`).
*   **Bridge Traffic:** We minimize passes over the React Native bridge by batching state updates in the Player.
*   **Memory:** We strictly monitor memory usage with `FlashList`'s `estimatedItemSize` to prevent "Blank Space" rendering issues.

### 💡 WHY?
React Native performance is fragile. One un-memoized context provider can tank FPS. We engineer for 60fps on mid-range Android devices, not just iPhones.

---

## 10. Error Handling & Observability

### 👶 ELI5
If something goes wrong, we show a nice message instead of a scary white screen. We also write down what happened in a secret diary so we can fix it.

### 🧒 Beginner
*   **User:** Sees "Oops, something went wrong".
*   **Developer:** Sees a crash report in Sentry.

### 🧑‍💻 Junior
*   `ErrorBoundary`: A React component that catches crashes in its children.
*   `try/catch`: Wrapped around every async service call.

### 🧙‍♂️ Senior
*   **Silent Failures:** For non-critical failures (e.g., analytics ping fails), we swallow the error to avoid interrupting the user flow.
*   **Contextual Logging:** We log not just the error, but the `userId`, `route`, and `deviceModel` to debug effectively.

### 💡 WHY?
Users tolerate bugs if the app recovers gracefully. They uninstall if it crashes to home screen.

---

## 11. Security & Permissions

### 👶 ELI5
We ask for permission to use the internet. We promise not to steal your data.

### 🧒 Beginner
We use secure connections (HTTPS). We only ask for permissions we really need (Audio, Internet).

### 🧑‍💻 Junior
*   **RLS (Row Level Security):** Configured in Postgres. A user can only DELETE their *own* playlist.
*   **Env Variables:** API Keys are stored in `.env`.

### 🧙‍♂️ Senior
*   **Supabase Anon Key:** It is technically public, but restricted by RLS.
*   **JWT:** Auth tokens are stored in encrypted storage (or AsyncStorage depending on platform implementation) and refreshed automatically.

### 💡 WHY?
Security defaults in Supabase + RLS mean we don't have to write custom authorization middleware.

---

## 12. Internationalization (i18n)

### 👶 ELI5
The app speaks English, Arabic, and French. It knows which one to use based on your phone settings.

### 🧒 Beginner
All the text in the app is stored in special files. When the app starts, it picks the right file.

### 🧑‍💻 Junior
*   `i18n/en.json`: Key-value pairs. `{"hello": "Hello"}`.
*   `t('hello')`: Function that returns the string.

### 🧙‍♂️ Senior
*   **Data i18n:** The database has columns `title_en`, `title_ar`.
*   **RTL:** We use `I18nManager.isRTL` to flip layouts for Arabic.
*   **Fallback:** If `title_fr` is missing, we fall back to `title_en`.

### 💡 WHY?
Football is global. An English-only app ignores half the world's fans.

---

## 13. Build System & Tooling

### 👶 ELI5
We use a robot called "Expo" to build the app for us.

### 🧒 Beginner
Expo takes our code and turns it into an `.apk` (Android) or `.ipa` (iOS).

### 🧑‍💻 Junior
*   `app.json`: Configuration file. Sets the name, icon, and version.
*   `eas.json` (implied): Configuration for Expo Application Services cloud builds.

### 🧙‍♂️ Senior
*   **Continuous Integration:** We run `tsc` (TypeScript Check) before every build.
*   **Prebuild:** We use `npx expo prebuild` to generate the native `android` and `ios` folders so we can link native libraries like `track-player`.

### 💡 WHY?
Expo EAS allows us to build iOS apps without a Mac.

---

## 14. Deployment & Distribution

### 👶 ELI5
We put the app in the App Store so you can download it.

### 🧒 Beginner
We upload a new version. Apple/Google reviews it. Then it appears on your phone.

### 🧑‍💻 Junior
*   **OTA Updates:** We can push small JavaScript fixes using `expo-updates` without waiting for App Store review.
*   **Versioning:** Semantic versioning (1.0.0).

### 🧙‍♂️ Senior
*   **Phased Release:** We roll out to 1% of users first to catch crash loops.
*   **PWA:** The web build is deployed to Vercel via Git hooks.

### 💡 WHY?
Web reach is wider than App Store reach. PWA is a zero-friction entry point.

---

## 15. Folder Structure (FROM SCRATCH)

### 👶 ELI5
A place for everything, and everything in its place.
*   `src`: The kitchen where we cook.
*   `assets`: The pantry (pictures).

### 🧒 Beginner
*   `components`: Buttons and cards.
*   `screens`: Full pages.
*   `services`: Helpers.

### 🧑‍💻 Junior
```
/src
  /components  (UI)
  /screens     (Views)
  /navigation  (Routing)
  /store       (State)
  /services    (API/Logic)
  /types       (TS Interfaces)
```

### 🧙‍♂️ Senior
We organize by "Technical Role" rather than "Feature" because the app is small.
*   `hooks/`: Custom hooks (`useAuth`, `useDebounce`).
*   `constants/`: Magic numbers and config strings.

---

## 16. Step-by-Step Rebuild Guide

**Objective:** Recreate "Yalla Chant" from zero.

### 👶 ELI5
We are going to build the Lego castle from the instructions.

### 🧒 Beginner
We will install the tools, set up the empty project, and add the features one by one.

### 🧑‍💻 Junior
1.  Initialize Expo project.
2.  Install libraries.
3.  Copy the code files.
4.  Run it.

### 🧙‍♂️ Senior (The Real Guide)

**Step 1: Initialization**
```bash
npx create-expo-app yalla-chants -t expo-template-blank-typescript
cd yalla-chants
```

**Step 2: Dependencies (Crucial)**
You MUST install these exact packages.
*Note: We rely on `react-native-track-player` for native audio, even if `expo-audio` is present in other manifests. The native code needs it.*
```bash
# Core
npx expo install expo-router react-native-safe-area-context react-native-screens
# State
npm install zustand
# Data
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-mmkv
# Audio
npm install react-native-track-player
# UI
npx expo install expo-image expo-linear-gradient
```

**Step 3: Database Setup (SQL)**
Run this SQL in your Supabase SQL Editor to create the necessary tables.
```sql
-- 1. Countries Table
create table countries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  flag_emoji text,
  flag_svg_url text
);

-- 2. Chants Table
create table chants (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  lyrics text,
  audio_url text not null,
  country_id uuid references countries(id),
  football_team text,
  play_count bigint default 0,
  created_at timestamptz default now()
);

-- 3. Search Function (RPC)
create or replace function search_chants(p_query text, p_limit int)
returns setof chants as $$
begin
  return query
  select * from chants
  where title ilike '%' || p_query || '%'
  or lyrics ilike '%' || p_query || '%'
  limit p_limit;
end;
$$ language plpgsql;
```

**Step 4: Configuration (`app.json`)**
Add the background audio config inside `expo.ios` and `expo.android`.
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    },
    "android": {
      "permissions": ["FOREGROUND_SERVICE", "WAKE_LOCK"]
    }
  }
}
```

**Step 5: Service Implementation**
Create `src/services/chantService.ts`:
```typescript
import { supabase } from './supabase'; // You must init this client yourself
export const chantService = {
  async getAll() {
    // 1. Check Cache (Implement CacheService using MMKV separately)
    // 2. Fetch from Supabase
    const { data } = await supabase.from('chants').select('*');
    return data;
  }
};
```

**Step 6: The Player Store**
Create `src/store/playerStore.ts`:
```typescript
import { create } from 'zustand';
interface PlayerState {
  currentTrack: any;
  setCurrentTrack: (track: any) => void;
}
export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  setCurrentTrack: (t) => set({ currentTrack: t }),
}));
```

**Step 7: The UI**
*Create `src/screens/HomeScreen.tsx`*: Fetch data from `chantService` and render a `FlatList`.

**Step 8: Run Native**
```bash
npx expo run:ios
```
*Note: This will trigger Prebuild, generating the `ios` folder and linking TrackPlayer.*

---

## 17. Long-Term Evolution (3–5 Years)

### 👶 ELI5
We want the app to grow big and strong, so we plan ahead.

### 🧒 Beginner
We will add more songs, more countries, and maybe let you record your own songs.

### 🧑‍💻 Junior
*   **Refactor:** As the codebase grows, we might move to "Feature-based" folder structure (`src/features/player`, `src/features/auth`).
*   **Testing:** We need to add E2E tests with Maestro or Detox.

### 🧙‍♂️ Senior
*   **Federation:** If the team grows to 20+, we might split the app into Micro-frontends (unlikely for React Native, but modularizing packages is feasible).
*   **Server Side Rendering:** If the Web version becomes primary, we might migrate the Web target to Next.js while keeping the Native target in Expo.

### 💡 WHY?
Software that isn't planned to evolve dies. We anticipate the "Monolithic Service" pattern becoming a bottleneck and plan to modularize.

---
**End of Documentation.**
