import { useSeo } from '@/lib/seo';
import { LinkButton } from '@/components/ui/Button';
import { DiamondMark } from '@/components/ui/Ornament';

export default function NotFoundPage() {
  useSeo({ title: 'Page not found | House of Dum', description: 'This page does not exist.', noindex: true });
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 pt-24 text-center">
      <DiamondMark className="h-8 w-16 text-gold-500" />
      <h1 className="gold-text mt-4 text-6xl font-bold sm:text-8xl">404</h1>
      <p className="mt-3 text-lg text-mute">We could not find that page.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton to="/">Go home</LinkButton>
        <LinkButton to="/menu" variant="outline">
          View menu
        </LinkButton>
      </div>
    </div>
  );
}
