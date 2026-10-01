import Link from 'next/link';
import { pillPrimary } from '@/components/ui/PageHeader';

export default function NotFound() {
  return (
    <div className="rise mx-auto flex max-w-xl flex-col items-center py-24 text-center">
      <p className="eyebrow mb-5">404</p>
      <h1 className="font-display text-[44px] font-semibold leading-tight text-ink">
        Nothing <em className="font-medium italic text-accent">here.</em>
      </h1>
      <p className="mt-3 text-[15px] text-muted">That page isn&rsquo;t part of LeadOps Studio. Press Ctrl K to search, or head back to the pipeline.</p>
      <Link href="/overview" className={`${pillPrimary} mt-8`}>
        Open the overview
      </Link>
    </div>
  );
}
