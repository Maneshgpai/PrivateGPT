import { ClerkProvider } from "@clerk/nextjs";

import '@/styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider appearance={{
      elements: {
        footer: "hidden",
      },
    }}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
