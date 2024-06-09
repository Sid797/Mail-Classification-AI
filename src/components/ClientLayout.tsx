// /src/components/ClientProvider.tsx
'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

const ClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};

export default ClientProvider;
