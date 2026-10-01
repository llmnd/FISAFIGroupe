import Head from "next/head";
import Header from "@/components/Header";
import BusinessBrands from "@/components/BusinessBrands";

export default function BusinessPage() {
  return (
    <>
      <Head>
        <title>Our Business — FiSAFi Groupe</title>
        <meta
          name="description"
          content="Explorez FiSAFi Groupe et FiSAFi Market."
        />
      </Head>
      <Header />
      <main className="business-page business-brands-page">
        <BusinessBrands />
      </main>
    </>
  );
}
