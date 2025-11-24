import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/main.css";
import "@/styles/responsive.css";
import "@/styles/common.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${poppins.className}`}>{children}</body>
    </html>
  );
}
