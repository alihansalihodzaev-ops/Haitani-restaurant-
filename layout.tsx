import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'HAITANI — Japanese Dining', description:'Премиальное японское меню в Алматы. Искусство вкуса в каждой детали.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ru"><body>{children}</body></html>; }
