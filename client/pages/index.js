import Header from "./components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Chat from "./components/Chat";
import Layout from "./components/Layout";
import Hero from "./components/Hero";

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
          <Hero />
        </div>
      </SignedOut>
    </>
  );
}
