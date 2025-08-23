import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function Home() {
  const { user, isLoading } = useUser();
  if (isLoading) return <p>Loading…</p>;
  return (
    <main style={{ padding: 24 }}>
      <h1>Cookbook</h1>
      {user ? (
        <>
          <p>Welcome, {user.name}</p>
          <p><a href="/api/auth/logout">Logout</a></p>
          <p><Link href="/library">Go to Library</Link></p>
        </>
      ) : (
        <a href="/api/auth/login">Login</a>
      )}
    </main>
  );
}


