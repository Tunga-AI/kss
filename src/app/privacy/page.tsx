import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
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
                    Your privacy is important to us. This policy outlines how we collect, use, and protect your data.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl prose lg:prose-lg">
            
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <p>
              Kenya School of Sales ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or attend our events. Please read this policy carefully.
            </p>

            <h2>1. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul>
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and telephone number, that you voluntarily give to us when you register for an account, a course, or an event.</li>
                <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., payment card details), that we collect when you make a purchase. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor, Paystack.</li>
                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
            </ul>

            <h2>2. Use of Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
            <ul>
                <li>Create and manage your account.</li>
                <li>Process your registrations and payments for courses and events.</li>
                <li>Email you regarding your account or order.</li>
                <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
                <li>Notify you of updates to the Site.</li>
            </ul>

            <h2>3. Media Recording and Consent</h2>
            <p>
              Please be aware that our classes, events, workshops, and other programs ("Events") may be photographed, videotaped, or otherwise recorded. By attending our Events, you consent to be photographed, videotaped, and/or otherwise recorded. You also grant us the right to use, publish, and display your name, voice, and likeness in connection with any such recordings for any purpose, including for promotional and marketing purposes, without any compensation to you. If you do not wish to be recorded, please inform our staff before the event begins.
            </p>
            
            <h2>4. Data Protection and Compliance (GDPR & Kenya DPA)</h2>
            <p>
              We are committed to complying with the General Data Protection Regulation (GDPR) and the Kenya Data Protection Act, 2019 (DPA). We process your personal data on lawful bases, including your consent, our contractual necessity to provide you with our services, and our legitimate interests.
            </p>
            <p>Your rights under these regulations include:</p>
            <ul>
              <li>The right to access – You have the right to request copies of your personal data.</li>
              <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
              <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
              <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
              <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
              <li>The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
            <p>To exercise these rights, please contact us using the contact information provided below.</p>

            <h2>5. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2>6. Contact Us</h2>
            <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
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
