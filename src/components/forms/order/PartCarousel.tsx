'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

import type { PartSummary } from '@/domain/cad/types';
import type { PartSpecificationState } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartPreview } from '@/components/cad/STEPViewer/PartPreview';

interface PartCarouselProps {
  parts: PartSummary[];
  specifications: PartSpecificationState;
  onConfigure: (partId: string) => void;
}

export function PartCarousel({
  parts,
  specifications,
  onConfigure,
}: PartCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedPartId, setExpandedPartId] = useState<string | null>(
    parts.length > 0 ? parts[0].storagePath : null
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    const updateScrollButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateScrollButtons();
    emblaApi.on('select', updateScrollButtons);
    emblaApi.on('reInit', updateScrollButtons);
  }, [emblaApi, onSelect]);

  // Update expanded part when carousel index changes
  useEffect(() => {
    if (parts[selectedIndex]) {
      setExpandedPartId(parts[selectedIndex].storagePath);
    }
  }, [selectedIndex, parts]);

  if (parts.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <p className="text-center text-sm text-gray-400">
          No parts linked to this assembly yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Preview Section */}
      <div
        className="w-full animate-in fade-in slide-in-from-top-2 duration-300"
      >
        {expandedPartId && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <PartPreview
              storagePath={expandedPartId}
              name={
                parts.find((p) => p.storagePath === expandedPartId)?.name ?? ''
              }
              hierarchy={
                parts.find((p) => p.storagePath === expandedPartId)?.hierarchy
              }
            />
          </div>
        )}
      </div>

      {/* Carousel Section */}
      <div className="space-y-3">
        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3 touch-pan-y">
              {parts.map((part) => {
                const specRecord = specifications[part.storagePath];
                const isComplete = Boolean(specRecord);
                const isSelected = expandedPartId === part.storagePath;

                return (
                  <div
                    key={part.storagePath}
                    className="flex-[0_0_calc(50%-0.375rem)] min-w-0 animate-in fade-in duration-200"
                  >
                    <Card
                      className={`h-full cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-1'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setExpandedPartId(part.storagePath)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <span className="truncate">{part.name}</span>
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {part.hierarchy.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {part.hierarchy.join(' / ')}
                          </p>
                        )}
                        {isComplete ? (
                          <p className="text-xs text-muted-foreground">
                            {specRecord.specifications.material.material} |{' '}
                            {specRecord.specifications.process.type}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Not configured
                          </p>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={isComplete ? 'outline' : 'default'}
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigure(part.storagePath);
                          }}
                        >
                          {isComplete ? 'Edit' : 'Configure'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          {parts.length > 1 && (
            <div className="absolute inset-y-0 left-0 top-1/2 -translate-y-1/2">
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="relative -left-3 inline-flex items-center justify-center rounded-full bg-white p-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          )}

          {parts.length > 1 && (
            <div className="absolute inset-y-0 right-0 top-1/2 -translate-y-1/2">
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="relative -right-3 inline-flex items-center justify-center rounded-full bg-white p-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Indicators */}
        {parts.length > 1 && (
          <div className="flex items-center justify-center gap-1.5">
            {parts.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (emblaApi) {
                    emblaApi.scrollTo(index);
                  }
                }}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? 'bg-primary w-6'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Part Counter */}
        <p className="text-center text-xs text-muted-foreground">
          Part {selectedIndex + 1} of {parts.length}
        </p>
      </div>
    </div>
  );
}
