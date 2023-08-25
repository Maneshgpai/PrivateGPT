import Header from "./components/Header";
import Hero from "./components/Hero";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Chat from "./components/Chat";
import Layout from "./components/Layout";

export default function Home() {
  return (
    <>
      <SignedIn>
        <div className="bg-gray-900">
          <Layout>
            <Chat />
          </Layout>
        </div>
      </SignedIn>
      <SignedOut>
        <div>
          <Header />
          <Hero />
        </div>
      </SignedOut>
    </>
  );
}
