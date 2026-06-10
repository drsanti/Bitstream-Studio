import { Ruler } from "lucide-react";
import type { ReactNode } from "react";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import {
  catalogAngularKind,
  resolveAngularDisplayUnit,
} from "../../runtime/diagram/courseBindingAngularUnit";
import {
  catalogAltitudePath,
  catalogBindingDisplayUnitKind,
  catalogTemperaturePath,
  resolveAltitudeDisplayUnit,
  resolveTemperatureDisplayUnit,
} from "../../runtime/diagram/courseBindingDisplayUnit";
import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "../CourseInspectorFieldGrid";

const UNIT_LABEL_HINT =
  "Optional suffix on the widget. Leave empty to use the value-format default.";
const VALUE_FORMAT_HINT = "Converts live samples before scale and visualization.";

function CourseBindingUnitLabelInput({
  binding,
  idPrefix,
  placeholder,
  onPatch,
}: {
  binding: DiagramBindingV1;
  idPrefix: string;
  placeholder: string;
  onPatch: (patch: Partial<DiagramBindingV1>) => void;
}) {
  return (
    <TRNInput
      variant="outlined"
      size="sm"
      className="w-full"
      prefixIcon={Ruler}
      aria-label="Unit label"
      value={binding.unit ?? ""}
      placeholder={placeholder.length > 0 ? placeholder : "unit"}
      onChange={(e) => {
        const next = e.target.value.trim();
        onPatch({ unit: next.length > 0 ? next : undefined });
      }}
    />
  );
}

function CourseBindingFormatAndLabelGrid({
  binding,
  idPrefix,
  placeholder,
  formatControl,
  onPatch,
}: {
  binding: DiagramBindingV1;
  idPrefix: string;
  placeholder: string;
  formatControl: ReactNode;
  onPatch: (patch: Partial<DiagramBindingV1>) => void;
}) {
  return (
    <CourseInspectorFieldGrid>
      <CourseInspectorFieldGridLabels
        left={{ label: "Value format", description: VALUE_FORMAT_HINT }}
        right={{ label: "Unit label", description: UNIT_LABEL_HINT }}
      />
      <CourseInspectorFieldGridControls
        left={formatControl}
        right={
          <CourseBindingUnitLabelInput
            binding={binding}
            idPrefix={idPrefix}
            placeholder={placeholder}
            onPatch={onPatch}
          />
        }
      />
    </CourseInspectorFieldGrid>
  );
}

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
      <CourseBindingFormatAndLabelGrid
        binding={binding}
        idPrefix={idPrefix}
        placeholder={resolveAngularDisplayUnit(binding, displayKind)}
        onPatch={onPatch}
        formatControl={
          <TRNSelect
            value={angularUnit}
            ariaLabel="Angular value format"
            variant="field"
            size="sm"
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
        }
      />
    );
  }

  if (catalogTemperaturePath(binding.path)) {
    const temperatureUnit = binding.temperatureUnit ?? "celsius";
    return (
      <CourseBindingFormatAndLabelGrid
        binding={binding}
        idPrefix={idPrefix}
        placeholder={resolveTemperatureDisplayUnit(binding)}
        onPatch={onPatch}
        formatControl={
          <TRNSelect
            value={temperatureUnit}
            ariaLabel="Temperature value format"
            variant="field"
            size="sm"
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
        }
      />
    );
  }

  if (catalogAltitudePath(binding.path)) {
    const altitudeUnit = binding.altitudeUnit ?? "m";
    return (
      <CourseBindingFormatAndLabelGrid
        binding={binding}
        idPrefix={idPrefix}
        placeholder={resolveAltitudeDisplayUnit(binding)}
        onPatch={onPatch}
        formatControl={
          <TRNSelect
            value={altitudeUnit}
            ariaLabel="Altitude value format"
            variant="field"
            size="sm"
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
        }
      />
    );
  }

  return (
    <TRNFormField id={`${idPrefix}-unit-label`} label="Unit label" hint={UNIT_LABEL_HINT}>
      <CourseBindingUnitLabelInput
        binding={binding}
        idPrefix={idPrefix}
        placeholder={catalogUnit ?? ""}
        onPatch={onPatch}
      />
    </TRNFormField>
  );
}

export function bindingHasSelectableDisplayUnit(path: string | null | undefined): boolean {
  return path != null && path.length > 0 && catalogBindingDisplayUnitKind(path) != null;
}
