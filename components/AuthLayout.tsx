import Image from 'next/image'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left column — travel image, hidden on mobile */}
      <div className="hidden md:block relative md:w-[60%]">
        <Image
          src="/travel-image.jpg"
          alt="People travelling"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right column — form */}
      <div className="w-full md:w-[40%] bg-white flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-12 pt-10 pb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to the Website
          </Link>
          <Link href="/">
            <Image src="/logo.svg" alt="Flajko" width={80} height={23} />
          </Link>
        </div>

        {/* Centered form content */}
        <div className="flex-1 flex flex-col justify-center px-12 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
