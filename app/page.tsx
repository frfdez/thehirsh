// app/page.tsx
"use client";

import Login from "@/components/login";

export default function HomePage() {
  const handleLogin = (username: string) => {
    // handle login
    console.log('User logged in:', username);
  };

  return <Login onLogin={handleLogin} />;
}
