import Link from 'next/link'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function ConfirmPage({ searchParams }: Props) {
  const params = await searchParams
  const isSuccess = params.status === 'success'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <main className="w-full max-w-xl text-center">
        {isSuccess ? (
          <>
            <div className="mb-6 text-5xl">&#10003;</div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
              Subscription confirmed!
            </h1>
            <p className="text-lg text-zinc-600 mb-8">
              You&apos;ll receive your first deals email on Thursday.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 text-5xl text-zinc-400">&#x26A0;</div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
              Invalid or expired confirmation link.
            </h1>
            <p className="text-lg text-zinc-600 mb-8">
              This link may have already been used or is no longer valid.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block rounded-md bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          Back to homepage
        </Link>
      </main>
    </div>
  )
}
