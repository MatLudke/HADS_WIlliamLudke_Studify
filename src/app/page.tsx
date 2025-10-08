import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-8">
      <div className="max-w-2xl mx-auto">
        <Logo className="justify-center mb-8" />
        <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-foreground mb-6 fade-in">
          Foco. Produtividade. Sucesso.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 slide-in-from-bottom">
          Studify é sua nova ferramenta para transformar o estudo em uma atividade mais inteligente e eficiente.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pop-in">
          <Button asChild size="lg" className="text-lg py-7 px-8">
            <Link href="/login">Comece a Estudar</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
