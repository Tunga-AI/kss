import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-primary/5 py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-foreground/80">
              Your privacy is important to us.
            </p>
          </div>
        </section>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl prose lg:prose-lg">
            <p>
              This is a placeholder for your privacy policy. You should replace this with your own policy, detailing how you collect, use, and protect your users' data.
            </p>
            <h2>Media & Data Consent</h2>
            <p>
              This section should detail your policy on using media (photos, videos) of your students and how you handle data consent, especially concerning GDPR or other local data protection regulations.
            </p>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. 
            </p>
             <h3>Data Collection</h3>
            <p>
                Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. 
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
