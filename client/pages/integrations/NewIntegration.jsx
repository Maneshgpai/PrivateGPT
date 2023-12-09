import Header from "../components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Layout from "../components/Layout";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <>
      <SignedIn>
      <div className="flex w-full flex-col items-center">
          <Layout>
      <h1>Coming soon, all your favourite EMRs and EHRs. For seamless and fully automated coding and billing experience!</h1>
          </Layout>
        </div>
      </SignedIn>
      <SignedOut>
        <div>
          <Hero />
        </div>
      </SignedOut>
    </>
  );
}
