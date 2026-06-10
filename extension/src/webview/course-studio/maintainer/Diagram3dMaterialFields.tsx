import { Image, Palette } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNColorRingPicker } from "../../ui/TRN/TRNColorRingPicker";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNToggleSwitch } from "../../ui/TRN/TRNToggleSwitch";
import type { Diagram3dMaterialKindV1, Diagram3dMaterialV1 } from "../schemas/diagram.v1";
import type { Diagram3dNodePatch } from "../runtime/diagram/diagram3dNodeMutations";
import {
  DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
  mergeDiagram3dMaterial,
  resolveDiagram3dMaterialKind,
} from "../runtime/diagram/diagram3dMaterial";
import {
  buildDiagram3dMaterialPresetSelectOptions,
  DIAGRAM_3D_MATERIAL_KIND_OPTIONS,
  findDiagram3dMaterialPreset,
} from "../runtime/diagram/diagram3dMaterialPresets";
import {
  DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS,
  diagram3dTextureUrlFieldLabel,
  sanitizeDiagram3dTextureUrl,
} from "../runtime/diagram/diagram3dTextureMaps";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";

export function Diagram3dMaterialFields({
  nodeId,
  material,
  onPatch,
  defaultExpanded = false,
  hint = "Prebuilt PBR presets or custom overrides for procedural meshes and catalog GLB tint. Axis colors on triad/gimbal presets stay semantic.",
}: {
  nodeId: string;
  material?: Diagram3dMaterialV1;
  onPatch: (patch: Pick<Diagram3dNodePatch, "material">) => void;
  defaultExpanded?: boolean;
  hint?: string;
}) {
  const resolved = mergeDiagram3dMaterial(DEFAULT_DIAGRAM_3D_MESH_MATERIAL, material);
  const kind = resolveDiagram3dMaterialKind(material);
  const activePreset = material?.presetId ? findDiagram3dMaterialPreset(material.presetId) : undefined;

  const patchMaterial = (next: Partial<Diagram3dMaterialV1>) => {
    onPatch({ material: next });
  };

  const applyPreset = (presetId: string) => {
    if (presetId.length === 0) {
      onPatch({ material: null });
      return;
    }
    const preset = findDiagram3dMaterialPreset(presetId);
    if (preset == null) {
      return;
    }
    onPatch({ material: { ...preset.material } });
  };

  return (
    <CourseInspectorCard
      title="Material"
      hint="Preset library, Three.js material kind, and editable PBR parameters."
      titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={defaultExpanded}
    >
      <div className="flex flex-col gap-3">
        <TRNFormField id={`${nodeId}-mat-preset`} label="Preset library">
          <TRNSelect
            value={material?.presetId ?? ""}
            ariaLabel="3D material preset"
            options={buildDiagram3dMaterialPresetSelectOptions()}
            onValueChange={applyPreset}
          />
        </TRNFormField>

        {activePreset ? (
          <TRNHintText className="!text-[10px]">{activePreset.hint}</TRNHintText>
        ) : null}

        <TRNFormField id={`${nodeId}-mat-target`} label="GLB material target">
          <TRNSelect
            value={material?.materialTarget ?? "all"}
            ariaLabel="Catalog GLB material target"
            options={[
              { value: "all", label: "All meshes" },
              { value: "byName", label: "Named slot" },
            ]}
            onValueChange={(value) =>
              patchMaterial({
                materialTarget: value as "all" | "byName",
                ...(value === "all" ? { materialName: undefined } : {}),
              })
            }
          />
        </TRNFormField>

        {(material?.materialTarget ?? "all") === "byName" ? (
          <TRNFormField id={`${nodeId}-mat-target-name`} label="Material name">
            <TRNInput
              id={`${nodeId}-mat-target-name`}
              variant="outlined"
              size="sm"
              className="w-full"
              placeholder="Body"
              value={material?.materialName ?? ""}
              onChange={(event) => patchMaterial({ materialName: event.target.value })}
            />
          </TRNFormField>
        ) : null}

        <TRNFormField id={`${nodeId}-mat-kind`} label="Material kind">
          <TRNSelect
            value={kind}
            ariaLabel="Three.js material kind"
            options={[...DIAGRAM_3D_MATERIAL_KIND_OPTIONS]}
            onValueChange={(value) =>
              patchMaterial({ kind: value as Diagram3dMaterialKindV1 })
            }
          />
        </TRNFormField>

        <TRNFormField id={`${nodeId}-mat-color`} label="Base color">
          <div className="flex min-w-0 items-center gap-2">
            <TRNColorRingPicker
              ariaLabel="3D model base color"
              valueHex={resolved.color}
              enableAlpha={false}
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={(hex) => patchMaterial({ color: hex })}
            />
            <span className="truncate text-[10px] text-zinc-500">
              {material?.color ?? "preset default"}
            </span>
          </div>
        </TRNFormField>

        {kind !== "basic" && kind !== "toon" ? (
          <TRNFormField id={`${nodeId}-mat-emissive`} label="Emissive">
            <div className="flex min-w-0 items-center gap-2">
              <TRNColorRingPicker
                ariaLabel="3D model emissive color"
                valueHex={resolved.emissive}
                enableAlpha={false}
                triggerVariant="swatch"
                size="sm"
                onValueHexChange={(hex) => patchMaterial({ emissive: hex })}
              />
              <CourseMaintainerScrubNumberInput
                value={resolved.emissiveIntensity}
                step={0.02}
                min={0}
                max={2}
                onChange={(value) => patchMaterial({ emissiveIntensity: value })}
              />
            </div>
          </TRNFormField>
        ) : null}

        {kind === "standard" || kind === "physical" ? (
          <div className="grid grid-cols-2 gap-2">
            <TRNFormField id={`${nodeId}-mat-metal`} label="Metalness">
              <CourseMaintainerScrubNumberInput
                value={resolved.metalness}
                step={0.05}
                min={0}
                max={1}
                onChange={(value) => patchMaterial({ metalness: value })}
              />
            </TRNFormField>
            <TRNFormField id={`${nodeId}-mat-rough`} label="Roughness">
              <CourseMaintainerScrubNumberInput
                value={resolved.roughness}
                step={0.05}
                min={0}
                max={1}
                onChange={(value) => patchMaterial({ roughness: value })}
              />
            </TRNFormField>
          </div>
        ) : null}

        {kind === "physical" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <TRNFormField id={`${nodeId}-mat-clearcoat`} label="Clearcoat">
                <CourseMaintainerScrubNumberInput
                  value={resolved.clearcoat}
                  step={0.05}
                  min={0}
                  max={1}
                  onChange={(value) => patchMaterial({ clearcoat: value })}
                />
              </TRNFormField>
              <TRNFormField id={`${nodeId}-mat-clearcoat-rough`} label="Clearcoat rough">
                <CourseMaintainerScrubNumberInput
                  value={resolved.clearcoatRoughness}
                  step={0.05}
                  min={0}
                  max={1}
                  onChange={(value) => patchMaterial({ clearcoatRoughness: value })}
                />
              </TRNFormField>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TRNFormField id={`${nodeId}-mat-transmission`} label="Transmission">
                <CourseMaintainerScrubNumberInput
                  value={resolved.transmission}
                  step={0.05}
                  min={0}
                  max={1}
                  onChange={(value) => patchMaterial({ transmission: value })}
                />
              </TRNFormField>
              <TRNFormField id={`${nodeId}-mat-ior`} label="IOR">
                <CourseMaintainerScrubNumberInput
                  value={resolved.ior}
                  step={0.01}
                  min={1}
                  max={2.5}
                  onChange={(value) => patchMaterial({ ior: value })}
                />
              </TRNFormField>
            </div>
            <TRNFormField id={`${nodeId}-mat-thickness`} label="Thickness">
              <CourseMaintainerScrubNumberInput
                value={resolved.thickness}
                step={0.05}
                min={0}
                max={5}
                onChange={(value) => patchMaterial({ thickness: value })}
              />
            </TRNFormField>
          </>
        ) : null}

        <TRNFormField id={`${nodeId}-mat-wireframe`} label="Wireframe">
          <TRNToggleSwitch
            checked={resolved.wireframe}
            ariaLabel="Toggle wireframe material"
            onCheckedChange={(checked) => patchMaterial({ wireframe: checked })}
          />
        </TRNFormField>

        <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-3">
          <div className="flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Texture maps (URL)
            </span>
          </div>
          <TRNHintText className="text-[10px]!">
            Paste HTTPS image URLs for online textures. Maps apply to procedural meshes and catalog
            GLB tint.
          </TRNHintText>
          <div className="grid grid-cols-2 gap-2">
            <TRNFormField id={`${nodeId}-mat-repeat-u`} label="Map repeat U">
              <CourseMaintainerScrubNumberInput
                value={material?.mapRepeat?.[0] ?? 1}
                step={0.25}
                min={0.25}
                max={16}
                onChange={(value) =>
                  patchMaterial({
                    mapRepeat: [value, material?.mapRepeat?.[1] ?? 1],
                  })
                }
              />
            </TRNFormField>
            <TRNFormField id={`${nodeId}-mat-repeat-v`} label="Map repeat V">
              <CourseMaintainerScrubNumberInput
                value={material?.mapRepeat?.[1] ?? 1}
                step={0.25}
                min={0.25}
                max={16}
                onChange={(value) =>
                  patchMaterial({
                    mapRepeat: [material?.mapRepeat?.[0] ?? 1, value],
                  })
                }
              />
            </TRNFormField>
          </div>

          {DIAGRAM_3D_MATERIAL_TEXTURE_URL_FIELDS.map((field) => {
            const rawValue = material?.[field] ?? "";
            const sanitized = sanitizeDiagram3dTextureUrl(rawValue);
            const showInvalid = rawValue.trim().length > 0 && sanitized == null;
            return (
              <TRNFormField
                key={field}
                id={`${nodeId}-mat-${field}`}
                label={diagram3dTextureUrlFieldLabel(field)}
              >
                <TRNInput
                  id={`${nodeId}-mat-${field}`}
                  variant="outlined"
                  size="sm"
                  className="w-full"
                  placeholder="https://example.com/texture.png"
                  value={rawValue}
                  onChange={(event) => patchMaterial({ [field]: event.target.value })}
                />
                {showInvalid ? (
                  <TRNHintText className="text-[10px]! text-amber-400/90">
                    Enter a valid http(s) image URL.
                  </TRNHintText>
                ) : null}
              </TRNFormField>
            );
          })}
        </div>

        <TRNButton size="compact" className="self-start" onClick={() => onPatch({ material: null })}>
          Reset material to preset defaults
        </TRNButton>

        <TRNHintText className="!text-[10px]">{hint}</TRNHintText>
      </div>
    </CourseInspectorCard>
  );
}
