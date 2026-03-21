'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.svg" alt="Flajko" width={100} height={29} priority />
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#how-it-works"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            How it works
          </Link>
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden sm:inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-md bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1] transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  )
}
