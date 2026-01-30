import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function TermsPage() {
  const termsImage = PlaceHolderImages.find(p => p.id === 'privacy-hero');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
            {termsImage && (
              <Image
                src={termsImage.imageUrl}
                alt={termsImage.description}
                fill
                className="object-cover"
                data-ai-hint={termsImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl text-white">
                  <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                    Terms of Service
                  </h1>
                  <p className="mt-4 text-lg sm:text-xl text-white/90">
                    Please read our terms of service carefully.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl prose lg:prose-lg">
            <p>
              This is a placeholder for your terms of service. You should replace this with your own terms, outlining the rules and regulations for the use of your website and services.
            </p>
            <h2>1. Introduction</h2>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. 
            </p>
             <h3>2. Intellectual Property Rights</h3>
            <p>
                Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. 
            </p>
            <h3>3. Restrictions</h3>
            <p>
                Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
