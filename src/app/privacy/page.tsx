import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function PrivacyPage() {
  const privacyImage = PlaceHolderImages.find(p => p.id === 'privacy-hero');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
            {privacyImage && (
              <Image
                src={privacyImage.imageUrl}
                alt={privacyImage.description}
                fill
                className="object-cover"
                data-ai-hint={privacyImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl text-white">
                  <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                    Privacy Policy
                  </h1>
                  <p className="mt-4 text-lg sm:text-xl text-white/90">
                    Your privacy is important to us.
                  </p>
                </div>
              </div>
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

    