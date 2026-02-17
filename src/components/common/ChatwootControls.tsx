import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, MessageCircle, MessageCircleOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Locale } from '../../types';
import { chatwootService } from '../../utils/chatwoot';

const labels: Record<Locale, {
  move: string;
  hide: string;
  show: string;
}> = {
  en: {
    move: 'Move chat left/right',
    hide: 'Hide chat widget',
    show: 'Show chat widget',
  },
  he: {
    move: 'העבר צ׳אט שמאלה/ימינה',
    hide: 'הסתר צ׳אט',
    show: 'הצג צ׳אט',
  },
  es: {
    move: 'Mover chat izquierda/derecha',
    hide: 'Ocultar chat',
    show: 'Mostrar chat',
  },
  de: {
    move: 'Chat links/rechts verschieben',
    hide: 'Chat ausblenden',
    show: 'Chat anzeigen',
  },
  pt: {
    move: 'Mover chat esquerda/direita',
    hide: 'Ocultar chat',
    show: 'Mostrar chat',
  },
  fr: {
    move: 'Deplacer le chat gauche/droite',
    hide: 'Masquer le chat',
    show: 'Afficher le chat',
  },
};

export function ChatwootControls() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const t = labels[locale] ?? labels.en;

  const [position, setPosition] = useState<'left' | 'right'>(chatwootService.getPosition());
  const [hidden, setHidden] = useState<boolean>(chatwootService.isHidden());
  const [isHoveringWidget, setIsHoveringWidget] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const positionClass = useMemo(
    () => (position === 'right' ? 'right-6' : 'left-6'),
    [position]
  );

  useEffect(() => {
    if (hidden) {
      setIsHoveringWidget(false);
      return;
    }

    const selectors = [
      '#cw-widget-holder',
      '.woot-widget-holder',
      '.woot--widget-holder',
      '.woot-widget-bubble',
      '.woot--bubble-holder',
      '#cw-widget-holder iframe',
      '.woot-widget-holder iframe',
      '.woot--widget-holder iframe',
    ];

    const getTargets = (): HTMLElement[] => {
      const all = selectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
      ) as HTMLElement[];
      return Array.from(new Set(all));
    };

    const isPointInsideTarget = (x: number, y: number): boolean => {
      const targets = getTargets();
      return targets.some((target) => {
        const rect = target.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      });
    };

    const scheduleHide = () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsHoveringWidget(false);
      }, 300);
    };

    const onMouseMove = (event: MouseEvent) => {
      const inside = isPointInsideTarget(event.clientX, event.clientY);
      if (inside) {
        if (hideTimeoutRef.current) {
          window.clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setIsHoveringWidget(true);
      } else if (!isHoveringControls) {
        scheduleHide();
      }
    };

    const onMouseLeaveDocument = () => {
      setIsHoveringWidget(false);
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeaveDocument, { passive: true });

    // Re-evaluate visibility when Chatwoot injects/replaces DOM nodes
    const observer = new MutationObserver(() => {
      // Keep current hover state stable until mouse moves again,
      // but clear if all widget targets are gone.
      if (getTargets().length === 0) {
        setIsHoveringWidget(false);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      observer.disconnect();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeaveDocument);
    };
  }, [hidden, isHoveringControls]);

  useEffect(() => {
    if (isHoveringControls && hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, [isHoveringControls]);

  const showControls = hidden || isHoveringWidget || isHoveringControls;

  return (
    <div
      className={`fixed bottom-28 ${positionClass} z-[60] flex items-center gap-2 transition-all duration-200 ${
        showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onMouseEnter={() => setIsHoveringControls(true)}
      onMouseLeave={() => setIsHoveringControls(false)}
    >
      {!hidden && (
        <button
          type="button"
          title={t.move}
          aria-label={t.move}
          onClick={() => setPosition(chatwootService.togglePosition())}
          className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
        >
          <ArrowLeftRight size={16} className="text-gray-700 dark:text-gray-200" />
        </button>
      )}
      <button
        type="button"
        title={hidden ? t.show : t.hide}
        aria-label={hidden ? t.show : t.hide}
        onClick={() => setHidden(chatwootService.toggleHidden())}
        className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
      >
        {hidden ? (
          <MessageCircle size={16} className="text-gray-700 dark:text-gray-200" />
        ) : (
          <MessageCircleOff size={16} className="text-gray-700 dark:text-gray-200" />
        )}
      </button>
    </div>
  );
}
