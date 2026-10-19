import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X, Database } from 'lucide-react';

export interface PickerOption<T extends string | number = string> {
  value: T;
  label: string;
  secondaryLabel?: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

export interface PickerProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: PickerOption<T>[];
  title?: string;
  placeholder?: string;
  variant?: 'toolbar' | 'form' | 'compact';
  triggerClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function Picker<T extends string | number = string>({
  value,
  onChange,
  options,
  title = 'Select Option',
  placeholder = 'Select...',
  variant = 'toolbar',
  triggerClassName = '',
  ariaLabel,
  disabled = false,
}: PickerProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const idx = options.findIndex((opt) => opt.value === value);
    return idx >= 0 ? idx : 0;
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  // Responsive breakpoint detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobile = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    updateMobile(mediaQuery);

    const listener = (e: MediaQueryListEvent) => updateMobile(e);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Update active index when value or options change
  useEffect(() => {
    const idx = options.findIndex((opt) => opt.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [value, options]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close handlers
  const handleClose = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSelect = useCallback(
    (val: T) => {
      onChange(val);
      handleClose();
    },
    [onChange, handleClose]
  );

  // Handle keyboard navigation for desktop/tablet popover
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[activeIndex]) {
          handleSelect(options[activeIndex].value);
        }
        break;
      case 'Tab':
        handleClose();
        break;
    }
  };

  // Scroll active item into view when activeIndex changes
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const activeElement = listboxRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  // Click outside listener for desktop popover
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, handleClose]);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Swipe-down to dismiss handler on mobile bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchCurrentY.current === null) return;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }
    if (deltaY > 60) {
      handleClose();
    }
    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  // Trigger button styling variants
  const getTriggerClasses = () => {
    if (triggerClassName) return triggerClassName;

    if (variant === 'toolbar') {
      return 'h-9 px-2.5 rounded-lg bg-[#1e1e1e] border border-[#333333] hover:border-[#555555] text-white text-xs font-mono flex items-center justify-between gap-2 transition-colors select-none focus:outline-none focus:ring-1 focus:ring-blue-500 relative before:absolute before:-inset-1 before:content-[\'\']';
    }

    if (variant === 'compact') {
      return 'h-7 px-2 rounded bg-[#1e1e1e] border border-[#333333] hover:border-[#555555] text-white text-[11px] font-mono flex items-center justify-between gap-1.5 transition-colors select-none focus:outline-none focus:ring-1 focus:ring-blue-500';
    }

    // Default form variant
    return 'w-full h-10 px-3 rounded-lg bg-[#1e1e1e] border border-[#333333] hover:border-[#555555] text-white text-xs flex items-center justify-between gap-2 transition-colors select-none focus:outline-none focus:ring-1 focus:ring-blue-500';
  };

  return (
    <div className={`relative inline-block ${variant === 'form' ? 'w-full' : ''}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || title}
        className={getTriggerClasses()}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.colorDot ? (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.colorDot }}
            />
          ) : selectedOption?.icon ? (
            <span className="shrink-0 text-blue-400">{selectedOption.icon}</span>
          ) : null}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#858585] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Mobile Bottom Sheet (< 768px) */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-[2px] animate-backdrop-fade-in"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Sliding Bottom Sheet Container */}
          <div
            ref={sheetRef}
            className="relative z-10 w-full max-h-[80vh] flex flex-col bg-[#1e1e1e] border-t border-[#333333] rounded-t-2xl shadow-2xl pb-[max(20px,env(safe-area-inset-bottom))] animate-sheet-slide-up select-none overflow-hidden"
          >
            {/* Sheet Header with Drag Handle & Close */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="pt-3 pb-2 px-4 border-b border-[#2d2d2d] flex flex-col items-center shrink-0 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1.5 bg-[#4f4f4f] rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <span className="font-semibold text-sm text-white tracking-tight">{title}</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] text-[#858585] hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sheet Options List */}
            <div
              ref={listboxRef}
              role="listbox"
              aria-label={title}
              tabIndex={-1}
              className="flex-1 overflow-y-auto overscroll-contain py-1"
            >
              {options.map((option, idx) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={String(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`h-12 min-h-[48px] px-4 flex items-center justify-between transition-colors border-b border-[#2d2d2d]/40 last:border-b-0 cursor-pointer active:bg-[#2c2c2e] ${
                      isSelected ? 'bg-blue-600/10 text-white' : 'text-[#d4d4d4] hover:bg-[#252526]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {option.colorDot ? (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: option.colorDot }}
                        />
                      ) : option.icon ? (
                        <span className="shrink-0 text-blue-400">{option.icon}</span>
                      ) : (
                        <Database className="w-4 h-4 text-[#858585] shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-xs font-medium truncate ${
                            isSelected ? 'text-blue-400 font-semibold' : 'text-white'
                          }`}
                        >
                          {option.label}
                        </span>
                        {option.secondaryLabel && (
                          <span className="text-[10px] text-[#858585] truncate font-mono">
                            {option.secondaryLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Tablet Popover Dropdown (>= 768px) */}
      {isOpen && !isMobile && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={title}
          tabIndex={-1}
          className="absolute left-0 mt-1.5 z-40 w-72 max-h-72 overflow-y-auto rounded-xl bg-[#1e1e1e] border border-[#333333] shadow-2xl py-1.5 animate-popover-fade-in select-none"
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isFocussed = idx === activeIndex;

            return (
              <div
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`h-12 min-h-[48px] px-4 flex items-center justify-between transition-colors border-b border-[#2d2d2d]/30 last:border-b-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 text-white font-medium'
                    : isFocussed
                    ? 'bg-[#282828] text-white'
                    : 'text-[#d4d4d4] hover:bg-[#252526]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {option.colorDot ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: option.colorDot }}
                    />
                  ) : option.icon ? (
                    <span className="shrink-0 text-blue-400">{option.icon}</span>
                  ) : (
                    <Database className="w-4 h-4 text-[#858585] shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs truncate ${
                        isSelected ? 'text-blue-400 font-semibold' : 'text-[#e0e0e0]'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.secondaryLabel && (
                      <span className="text-[10px] text-[#858585] font-mono truncate">
                        {option.secondaryLabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
