/**
 * ============================================================================
 * MÓDULO: app/layout.tsx (Layout Global)
 * DESCRIÇÃO: Estrutura HTML raiz, metadados industriais e PWA do Talhação PRO v2.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE CRIAÇÃO: 2026-08-03 14:22
 * ============================================================================
 */

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alto Vale Talhação - PRO v2',
  description: 'Sistema Industrial de Gestão de Ordens de Serviço e Chão de Fábrica',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <div id="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}