import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-foreground", className)}>
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Hourglass className="h-7 w-7" />
      </div>
      <span className="text-2xl font-bold font-headline tracking-tighter">Studify</span>
    </div>
  );
}
