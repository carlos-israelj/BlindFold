import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { VaultProvider } from "@/contexts/VaultContext";

export const metadata: Metadata = {
  title: "BlindFold - Private Crypto Financial Advisor",
  description: "The first privacy-verified crypto financial advisor. Powered by NEAR AI Cloud TEE-based private inference and NOVA encrypted storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WalletProvider>
          <VaultProvider>
            {children}
          </VaultProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
