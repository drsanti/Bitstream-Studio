import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { catalogAngularKind } from "../../runtime/diagram/courseBindingAngularUnit";
import {
  catalogAltitudePath,
  catalogBindingDisplayUnitKind,
  catalogTemperaturePath,
} from "../../runtime/diagram/courseBindingDisplayUnit";

export function CourseBindingDisplayUnitFields({
  binding,
  idPrefix,
  catalogUnit,
  onPatch,
}: {
  binding: DiagramBindingV1 | null | undefined;
  idPrefix: string;
  catalogUnit?: string;
  onPatch: (patch: Partial<DiagramBindingV1>) => void;
}) {
  if (binding?.path == null || binding.path.length === 0) {
    return null;
  }

  const displayKind = catalogBindingDisplayUnitKind(binding.path);
  const angularKind = catalogAngularKind(binding.path);

  if (displayKind === "rate" || displayKind === "angle") {
    const angularUnit = binding.angularUnit ?? "deg";
    return (
      <TRNFormField id={`${idPrefix}-angular-unit`} label="Display unit">
        <TRNSelect
          value={angularUnit}
          ariaLabel="Angular display unit"
          options={[
            {
              value: "deg",
              label: angularKind === "rate" ? "Degrees (°/s)" : "Degrees (°)",
            },
            {
              value: "rad",
              label: angularKind === "rate" ? "Radians (rad/s)" : "Radians (rad)",
            },
          ]}
          onValueChange={(value) => {
            if (value === "deg" || value === "rad") {
              onPatch({ angularUnit: value });
            }
          }}
        />
      </TRNFormField>
    );
  }

  if (catalogTemperaturePath(binding.path)) {
    const temperatureUnit = binding.temperatureUnit ?? "celsius";
    return (
      <TRNFormField id={`${idPrefix}-temperature-unit`} label="Display unit">
        <TRNSelect
          value={temperatureUnit}
          ariaLabel="Temperature display unit"
          options={[
            { value: "celsius", label: "Celsius (°C)" },
            { value: "fahrenheit", label: "Fahrenheit (°F)" },
          ]}
          onValueChange={(value) => {
            if (value === "celsius" || value === "fahrenheit") {
              onPatch({ temperatureUnit: value });
            }
          }}
        />
      </TRNFormField>
    );
  }

  if (catalogAltitudePath(binding.path)) {
    const altitudeUnit = binding.altitudeUnit ?? "m";
    return (
      <TRNFormField id={`${idPrefix}-altitude-unit`} label="Display unit">
        <TRNSelect
          value={altitudeUnit}
          ariaLabel="Altitude display unit"
          options={[
            { value: "m", label: "Meters (m)" },
            { value: "ft", label: "Feet (ft)" },
          ]}
          onValueChange={(value) => {
            if (value === "m" || value === "ft") {
              onPatch({ altitudeUnit: value });
            }
          }}
        />
      </TRNFormField>
    );
  }

  return (
    <TRNFormField id={`${idPrefix}-unit-override`} label="Unit override">
      <TRNInput
        variant="outlined"
        size="sm"
        className="w-full"
        aria-label="Binding unit override"
        value={binding.unit ?? catalogUnit ?? ""}
        placeholder={catalogUnit ?? "unit"}
        onChange={(e) => onPatch({ unit: e.target.value })}
      />
    </TRNFormField>
  );
}

export function bindingHasSelectableDisplayUnit(path: string | null | undefined): boolean {
  return path != null && path.length > 0 && catalogBindingDisplayUnitKind(path) != null;
}
