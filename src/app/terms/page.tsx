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
                    Please read our terms of service carefully before using our services.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl prose lg:prose-lg">
            
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing our website, registering for an account, or using our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use our services.
            </p>

            <h2>2. Intellectual Property Rights</h2>
            <p>
              Unless otherwise indicated, the Site and our courses, including source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics (collectively, the "Content") and the trademarks and logos contained therein (the "Marks") are owned or controlled by us and are protected by copyright and trademark laws. The Content and the Marks are provided on the Site "AS IS" for your information and personal use only.
            </p>

            <h2>3. User Accounts and Responsibilities</h2>
            <p>
              To access certain features, you must register for an account. You agree to provide true, accurate, current, and complete information during the registration process. You are responsible for safeguarding your password and for all activities that occur under your account.
            </p>
            
            <h2>4. Consent to Media Use and Data Processing</h2>
            <p>
              Our classes, workshops, and events may be photographed or recorded. By attending, you grant Kenya School of Sales a non-exclusive, perpetual, worldwide, royalty-free license to use your image, likeness, and voice in any and all media for promotional, educational, and other business purposes.
            </p>
            <p>
              By using our services, you also acknowledge and consent to our data practices as described in our <strong>Privacy Policy</strong>. This includes the collection, use, and sharing of your information in compliance with the GDPR and the Kenya Data Protection Act (DPA). You affirm that you understand your rights regarding your personal data as outlined in our Privacy Policy.
            </p>

            <h2>5. Payments and Refunds</h2>
            <p>
              All payments for courses, admissions, and subscriptions are processed through our third-party payment processor, Paystack. All fees are non-refundable except as required by law or as explicitly stated by us for a specific program.
            </p>

            <h2>6. Governing Law</h2>
            <p>
              These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law principles.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages arising from your use of the site or our services.
            </p>

            <h2>8. Contact Us</h2>
            <p>To resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:</p>
            <p>
              Kenya School of Sales<br />
              Email: kss@cca.co.ke<br />
              Phone: +254 722 257 323
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
