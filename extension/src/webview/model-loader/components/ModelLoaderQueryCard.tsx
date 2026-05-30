import React from "react";
import { List } from "lucide-react";
import { NumericInputRow } from "@ternion/t3d/ui";
import { Button } from "../../ui/components/Button";
import { Input } from "../../ui/components/Input";
import { GlassDropdown } from "../../ui/components/GlassDropdown";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";

export interface ModelLoaderQueryCardProps {
  page: number;
  limit: number;
  loading: boolean;
  buttonClassName: string;
  searchText: string;
  selectedCategory: string;
  categoryOptions: string[];
  onPageChange: (value: number) => void;
  onLimitChange: (value: number) => void;
  onSearchTextChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onListModels: () => void;
}

export function ModelLoaderQueryCard({
  page,
  limit,
  loading,
  buttonClassName,
  searchText,
  selectedCategory,
  categoryOptions,
  onPageChange,
  onLimitChange,
  onSearchTextChange,
  onSelectedCategoryChange,
  onListModels,
}: ModelLoaderQueryCardProps) {
  return (
    <ModelLoaderGroupCard title="Model Store Query" defaultOpen={false}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-2 model-catalog-filter-row">
        <Input
          placeholder="Search models..."
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          inputClassName="h-9 rounded-md py-1.5 text-sm"
        />
        <GlassDropdown
          value={selectedCategory}
          onChange={onSelectedCategoryChange}
          options={[
            { value: "all", label: "All Categories" },
            ...categoryOptions.map((category) => ({
              value: category,
              label: category,
            })),
          ]}
          aria-label="Filter models by category"
          triggerClassName="border-white/10 bg-neutral-950/80 focus:border-white/25 focus:ring-white/10"
          menuClassName="border-white/10 bg-neutral-950/85"
        />
      </div>
      <div className="space-y-2 model-loader-glass-numeric">
        <NumericInputRow
          label="Page"
          labelWidth="w-14"
          value={page}
          unit=""
          step={1}
          decimals={0}
          onValueChange={(value) => onPageChange(Math.max(1, Math.round(value) || 1))}
        />
        <NumericInputRow
          label="Limit"
          labelWidth="w-14"
          value={limit}
          unit=""
          step={1}
          decimals={0}
          onValueChange={(value) =>
            onLimitChange(Math.min(100, Math.max(1, Math.round(value) || 25)))
          }
        />
      </div>
      <div className="flex justify-end">
        <Button
          variant="secondary"
          className={buttonClassName}
          onClick={onListModels}
          disabled={loading}
        >
          <List className="h-3.5 w-3.5" />
          List Models
        </Button>
      </div>
    </ModelLoaderGroupCard>
  );
}
