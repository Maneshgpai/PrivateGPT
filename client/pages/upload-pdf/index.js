import Header from "../components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Chat from "../components/Chat";
import Layout from "../components/Layout";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <>
      <SignedIn>
        <div style={{
              backgroundColor: "#ebeef4",
              color: "#000"
            
            
            }}>
          <Layout>
            <Chat pdfView={true} />
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
