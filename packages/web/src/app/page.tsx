import { Suspense } from "react";
import LoginPage from "@/components/auth";
import { FullPageSpinner } from "@/components/common/loader";

export default function Home() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <LoginPage />
    </Suspense>
  );
}
