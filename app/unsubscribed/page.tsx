import Link from 'next/link'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function UnsubscribedPage({ searchParams }: Props) {
  const params = await searchParams
  const isSuccess = params.status === 'success'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <main className="w-full max-w-xl text-center">
        {isSuccess ? (
          <>
            <div className="mb-6 text-5xl text-zinc-400">&#x1F44B;</div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
              You&apos;ve been unsubscribed.
            </h1>
            <p className="text-lg text-zinc-600 mb-8">
              Sorry to see you go. You won&apos;t receive any more emails from us.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 text-5xl text-zinc-400">&#x26A0;</div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
              Invalid unsubscribe link.
            </h1>
            <p className="text-lg text-zinc-600 mb-8">
              You may have already been unsubscribed, or this link is no longer valid.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block rounded-md bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          Changed your mind? Subscribe again
        </Link>
      </main>
    </div>
  )
}
