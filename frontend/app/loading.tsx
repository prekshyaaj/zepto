import { PageSkeleton } from "@/components/skeleton";
import { ui } from "@/lib/tokens";

export default function Loading() {
  return (
    <main className={ui.page}>
      <div className={ui.shell}>
        <PageSkeleton />
      </div>
    </main>
  );
}
