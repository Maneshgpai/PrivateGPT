import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider
      appearance={{
      }}
    >
      <Elements stripe={stripePromise}>
        <Component {...pageProps} />
      </Elements>
    </ClerkProvider>
  );
}
