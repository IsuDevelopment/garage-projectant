import { Suspense } from 'react';
import LoginPage from './page';

// Separate layout ensures Suspense boundary for useSearchParams
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      {children}
    </Suspense>
  );
}
