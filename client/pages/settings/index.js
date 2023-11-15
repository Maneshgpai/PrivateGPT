import Header from "../components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import styles from './Settings.module.css'; // Make sure to create a CSS module file with your styles

export default function Home() {
  return (
    <>
      <SignedIn>
        <div className="bg-gray-900">
          <Layout>
          <div className={`${styles.settingsContainer}  bg-gray-900`}>
      <h1>Settings</h1>
     </div>
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
