import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface CommuneOption {
  label: string;
  value: string;
}

interface CommuneComboboxProps {
  options: CommuneOption[];
  value: string;
  onChange: (value: string) => void;
  /** Option « neutre » affichée en tête (ex. « Toutes les communes »). Optionnelle. */
  allOption?: CommuneOption;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  'aria-label'?: string;
}

/**
 * Sélecteur de commune AVEC barre de recherche (combobox).
 *
 * Construit sur Popover + cmdk (Command) : liste défilante filtrable au clavier.
 * Réutilisé par le filtre du registre (liste des fiches) et le champ Commune du
 * formulaire de prospection. Remplace le <Select> natif qui ne permettait pas la
 * recherche et dont le défilement était cassé.
 */
export function CommuneCombobox({
  options,
  value,
  onChange,
  allOption,
  placeholder = 'Commune',
  searchPlaceholder = 'Rechercher une commune…',
  emptyText = 'Aucune commune trouvée.',
  disabled = false,
  className,
  triggerClassName,
  id,
  'aria-label': ariaLabel,
}: CommuneComboboxProps) {
  const [open, setOpen] = useState(false);

  const allItems = allOption ? [allOption, ...options] : options;
  const selected = allItems.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel ?? placeholder}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            triggerClassName,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[--radix-popover-trigger-width] min-w-[200px] p-0', className)} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allItems.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
