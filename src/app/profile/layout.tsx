import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-muted">
        <div className="container mx-auto px-4 py-16 sm:py-24">
            {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
