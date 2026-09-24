import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function CustomSelect({ form, name, label, options, placeholder = "Sélectionner...", disabled = false }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel className="text-base font-semibold">{label}</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={disabled}>
          <FormControl>
            <SelectTrigger className="h-12"><SelectValue placeholder={placeholder} /></SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );
}

export function CustomRadioGroup({ form, name, label, options, layout = "wrap" }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-3">
        <FormLabel className="text-base font-semibold">{label}</FormLabel>
        <FormControl>
          <div className={cn("flex gap-2", layout === "wrap" ? "flex-wrap" : "flex-col")}>
            {options.map((opt: any) => (
              <label 
                key={opt.value} 
                className={cn(
                  "flex items-center justify-center min-h-[48px] gap-2 px-4 py-2 border-2 rounded-md cursor-pointer transition-colors text-sm font-medium",
                  field.value === opt.value 
                    ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                    : 'bg-background hover:bg-muted text-foreground border-input'
                )}
              >
                <input 
                  type="radio" 
                  className="sr-only" 
                  value={opt.value} 
                  checked={field.value === opt.value} 
                  onChange={() => field.onChange(opt.value)} 
                />
                {opt.label}
              </label>
            ))}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

export function CustomMultiSelect({ form, name, label, options }: any) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => {
      const selected = field.value || [];
      return (
        <FormItem className="space-y-3">
          <FormLabel className="text-base font-semibold">{label}</FormLabel>
          <FormControl>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt: any) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <label 
                    key={opt.value} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 border-2 rounded-md cursor-pointer transition-colors min-h-[48px]",
                      isChecked 
                        ? 'bg-primary/10 border-primary shadow-sm' 
                        : 'bg-background hover:bg-muted border-input'
                    )}
                  >
                    <Checkbox 
                      className="mt-0.5"
                      checked={isChecked} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...selected, opt.value]);
                        } else {
                          field.onChange(selected.filter((v: string) => v !== opt.value));
                        }
                      }} 
                    />
                    <span className={cn(
                      "text-sm leading-tight flex-1",
                      isChecked ? 'font-semibold text-foreground' : 'text-muted-foreground font-medium'
                    )}>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )
    }} />
  );
}
