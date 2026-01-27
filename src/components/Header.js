'use client';

import Link from 'next/link';
import { Ticket } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function Header() {
    return (
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Ticket size={32} className="text-blue-500" />
                        <div>
                            <h1 className="text-xl font-bold">DeTicket</h1>
                            <p className="text-xs text-gray-400">去中心化售票系統</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/events/create" className="hover:text-blue-400 transition-colors">
                            建立活動
                        </Link>
                        <Link href="/my-tickets" className="hover:text-blue-400 transition-colors">
                            我的票券
                        </Link>
                        <Link href="/check-in" className="hover:text-blue-400 transition-colors">
                            簽到
                        </Link>
                    </nav>

                    {/* Wallet Connect */}
                    <WalletConnect />
                </div>
            </div>
        </header>
    );
}
