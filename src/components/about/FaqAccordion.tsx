import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '../../data/about';
import { Card } from '../page/Card';

export interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div className="faq-accordion-list">
      {items.map(item => {
        const isOpen = openId === item.id;
        return (
          <Card key={item.id} className="faq-card">
            <button
              type="button"
              className="faq-question-btn"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${item.id}`}
            >
              <span className="faq-question-text">{item.question}</span>
              <ChevronDown
                size={16}
                className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div id={`faq-answer-${item.id}`} className="faq-answer-wrap" role="region">
                <p className="faq-answer-text">{item.answer}</p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
