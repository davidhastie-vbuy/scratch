import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import type { ProviderFormData } from "./ProviderSignupStepper";

interface Props {
  form: ProviderFormData;
  updateForm: (u: Partial<ProviderFormData>) => void;
  errors: Record<string, string>;
}

// UK postcode district pattern: 1-2 letters followed by 1-2 digits (e.g. CW2, SW1, EC1)
const UK_POSTCODE_DISTRICT = /^[A-Z]{1,2}\d{1,2}$/i;

const StepOperatingAreas = ({ form, updateForm, errors }: Props) => {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");

  const addArea = () => {
    const value = input.trim();
    if (!value) return;

    // Check if it looks like a postcode district - validate format
    const isPostcodeFormat = /\d/.test(value);
    if (isPostcodeFormat && !UK_POSTCODE_DISTRICT.test(value)) {
      setInputError("Invalid UK postcode district (e.g. CW2, SW1)");
      return;
    }

    // Min length for town names
    if (!isPostcodeFormat && value.length < 2) {
      setInputError("Town/city name must be at least 2 characters");
      return;
    }

    const normalized = value.toUpperCase();
    if (form.operatingAreas.includes(normalized)) {
      setInputError("Already added");
      return;
    }

    updateForm({ operatingAreas: [...form.operatingAreas, normalized] });
    setInput("");
    setInputError("");
  };

  const removeArea = (area: string) => {
    updateForm({ operatingAreas: form.operatingAreas.filter((a) => a !== area) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addArea();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Add postcodes or town/city names</Label>
        <p className="text-xs text-muted-foreground">
          Enter UK postcode districts (e.g. CW2, CW1) or town/city names and press Enter or click Add.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. CW2 or Crewe"
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(""); }}
            onKeyDown={handleKeyDown}
            maxLength={50}
          />
          <Button type="button" variant="outline" size="sm" onClick={addArea}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        {inputError && <p className="text-xs text-destructive">{inputError}</p>}
        {errors.operatingAreas && <p className="text-xs text-destructive">{errors.operatingAreas}</p>}
      </div>

      {form.operatingAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {form.operatingAreas.map((area) => (
            <Badge key={area} variant="secondary" className="gap-1 pr-1">
              {area}
              <button
                type="button"
                onClick={() => removeArea(area)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {form.operatingAreas.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center">
          <p className="text-sm text-muted-foreground">No areas added yet. Add the postcodes and towns where you offer services.</p>
        </div>
      )}
    </div>
  );
};

export default StepOperatingAreas;
