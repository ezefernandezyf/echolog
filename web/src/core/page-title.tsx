import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | EchoLog` : 'EchoLog';
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return null;
}
