import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustRow } from "@/components/TrustRow";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustRow />
      </main>
    </>
  );
}
