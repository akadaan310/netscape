import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Netscape Infinite — computational interpretation studio',description:'A deterministic interpretation surface for public knowledge. Explore sources, shape a surface, and keep the evidence close.'};
export const viewport:Viewport={width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
