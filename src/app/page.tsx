import Link from "next/link"

export default async function Home() {
 

  return (
    <main className="p-8">
      <Link href="/login">
      <span>Log in</span>
      </Link>    </main>
  )
}