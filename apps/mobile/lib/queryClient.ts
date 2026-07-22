import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These are the exact query keys that will be written to the Hard Drive.
// Anything NOT on this list (like 'feed', 'sessions', 'all_students') 
// will be kept strictly in RAM and cleared when the app restarts.
const PERSISTED_KEYS = [
  'faqs',
  'offices',
  'office_links',
  'my_profile',
  'notifications',
  'locations',
  'clubs',
  'club_members',
  'settings',
  'user_roles',
  'roles',
  'user_notifications',
  'post_targets'
];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time: 5 minutes. 
      // You can override this in specific useQuery calls (e.g. 24h for FAQs)
      staleTime: 1000 * 60 * 5,
      // Keep inactive data in memory for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const persistOptions = {
  persister: asyncStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: any) => {
      // React Query keys are arrays: ['faqs', 123]
      // We check if the root key (e.g. 'faqs') is in our allowed list
      if (!query.queryKey || !query.queryKey[0]) return false;
      
      const rootKey = query.queryKey[0] as string;
      return PERSISTED_KEYS.includes(rootKey);
    },
  },
};
