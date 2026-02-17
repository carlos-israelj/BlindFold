import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { VaultProvider } from "@/contexts/VaultContext";

export const metadata: Metadata = {
  title: "BlindFold — Private Crypto Financial Advisor",
  description: "The first privacy-verified crypto financial advisor. Powered by NEAR AI Cloud TEE-based private inference and NOVA encrypted storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WalletProvider>
          <VaultProvider>
            {children}
          </VaultProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
