import { useState, useEffect } from 'react';
import { Toaster, type ToasterProps } from 'sonner';

export function MobileAwareToaster(props: ToasterProps) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <Toaster
      position={isMobile ? 'bottom-center' : 'bottom-right'}
      expand={isMobile}
      duration={3000}
      richColors
      gap={8}
      visibleToasts={3}
      style={isMobile ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
      {...props}
    />
  );
}
