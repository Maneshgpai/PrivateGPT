import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe('pk_test_51ONGj9SGzDVqCKx1mc6lPSykMVRvItL9wvMvllR78JwP4xGTKmCbWTy5wzKfWBMPJqY6SgWReca1yqC1JhR0HeUD00j0mbKxbF');

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
