import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "FPL Knights | Football intelligence", description: "A clearer view of Fantasy Premier League performance." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
