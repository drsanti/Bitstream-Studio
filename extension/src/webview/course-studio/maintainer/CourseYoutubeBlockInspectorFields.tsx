import { Captions, MonitorPlay, Play, Youtube } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";
import type { CourseEmbedCaptionPlacement, PageBlockV1 } from "../schemas/page.v1";
import {
  COURSE_YOUTUBE_DEFAULT_CROP_BOTTOM_PX,
  COURSE_YOUTUBE_DEFAULT_CROP_TOP_PX,
  COURSE_YOUTUBE_MAX_CROP_PX,
} from "../schemas/embedBlocks";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseYoutubeBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "youtube" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const autoplayOn = block.autoplay !== false;
  const cropEnabled =
    (block.cropChrome ?? block.minimalChrome) === true ||
    (block.cropTopPx ?? 0) > 0 ||
    (block.cropBottomPx ?? 0) > 0;
  const cropTopPx = block.cropTopPx ?? COURSE_YOUTUBE_DEFAULT_CROP_TOP_PX;
  const cropBottomPx = block.cropBottomPx ?? COURSE_YOUTUBE_DEFAULT_CROP_BOTTOM_PX;
  const captionPlacement = block.captionPlacement ?? "below";

  return (
    <>
      <CourseInspectorCard
        id={`${block.id}-youtube-video`}
        title="Video"
        titleIcon={<Youtube className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Paste a watch, share, shorts, or embed link."
        defaultExpanded
      >
        <TRNFormField
          id={`${block.id}-url`}
          label="YouTube URL or video id"
          hint="Paste a watch, share, shorts, or embed link."
        >
          <TRNInput
            id={`${block.id}-url`}
            variant="outlined"
            size="sm"            value={block.url}
            onChange={(e) => updateBlock(block.id, { url: e.target.value })}
          />
        </TRNFormField>
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-youtube-playback`}
        title="Playback"
        titleIcon={<Play className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Start time, autoplay, mute, and loop."
        defaultExpanded
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${block.id}-start`} label="Start at (seconds)">
            <CourseMaintainerScrubNumberInput
              value={block.startSeconds ?? 0}
              min={0}
              max={86400}
              step={1}
              onChange={(startSeconds) =>
                updateBlock(block.id, {
                  startSeconds: startSeconds > 0 ? startSeconds : undefined,
                })
              }
            />
          </TRNFormField>
          <TRNInlineToggleRow
            label="Autoplay"
            hint="Starts automatically when the block is visible."
            checked={autoplayOn}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { autoplay: checked ? undefined : false })
            }
          />
          <TRNInlineToggleRow
            label="Start muted"
            hint={
              autoplayOn
                ? "Browsers require mute for autoplay. Viewers can unmute in the player."
                : "Load the embed with audio muted."
            }
            checked={autoplayOn ? block.muted !== false : block.muted === true}
            onCheckedChange={(checked) => {
              if (autoplayOn) {
                updateBlock(block.id, { muted: checked ? undefined : false });
                return;
              }
              updateBlock(block.id, { muted: checked ? true : undefined });
            }}
          />
          <TRNInlineToggleRow
            label="Loop video"
            checked={block.loop === true}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { loop: checked ? true : undefined })
            }
          />
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-youtube-player`}
        title="Player"
        titleIcon={<MonitorPlay className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Controls, fullscreen, branding, crop, and related videos."
        defaultExpanded
      >
        <div className="flex flex-col gap-2">
          <TRNInlineToggleRow
            label="Show controls"
            hint="Progress bar, volume, settings, and fullscreen button."
            checked={block.showControls !== false}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { showControls: checked ? undefined : false })
            }
          />
          <TRNInlineToggleRow
            label="Allow fullscreen"
            checked={block.allowFullscreen !== false}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { allowFullscreen: checked ? undefined : false })
            }
          />
          <TRNInlineToggleRow
            label="Modest YouTube logo"
            checked={block.modestBranding === true}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { modestBranding: checked ? true : undefined })
            }
          />
          <TRNInlineToggleRow
            label="Limit related videos"
            hint="Prefer same-channel suggestions at the end."
            checked={block.limitRelatedVideos === true}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { limitRelatedVideos: checked ? true : undefined })
            }
          />
          <TRNInlineToggleRow
            label="Crop title bands"
            hint="Trim the top title row and bottom suggestion bar."
            checked={cropEnabled}
            onCheckedChange={(checked) => {
              if (!checked) {
                updateBlock(block.id, {
                  cropChrome: undefined,
                  cropTopPx: undefined,
                  cropBottomPx: undefined,
                  minimalChrome: undefined,
                });
                return;
              }
              updateBlock(block.id, {
                cropChrome: true,
                cropTopPx: block.cropTopPx ?? COURSE_YOUTUBE_DEFAULT_CROP_TOP_PX,
                cropBottomPx: block.cropBottomPx ?? COURSE_YOUTUBE_DEFAULT_CROP_BOTTOM_PX,
                minimalChrome: undefined,
              });
            }}
          />
          {cropEnabled ? (
            <>
              <TRNFormField id={`${block.id}-crop-top`} label="Crop from top (px)">
                <CourseMaintainerScrubNumberField
                  ariaLabel="Crop from top in pixels"
                  value={cropTopPx}
                  min={0}
                  max={COURSE_YOUTUBE_MAX_CROP_PX}
                  step={1}
                  fractionDigits={0}
                  defaultValue={COURSE_YOUTUBE_DEFAULT_CROP_TOP_PX}
                  onChange={(cropTopPx) =>
                    updateBlock(block.id, {
                      cropChrome: true,
                      cropTopPx,
                      minimalChrome: undefined,
                    })
                  }
                />
              </TRNFormField>
              <TRNFormField id={`${block.id}-crop-bottom`} label="Crop from bottom (px)">
                <CourseMaintainerScrubNumberField
                  ariaLabel="Crop from bottom in pixels"
                  value={cropBottomPx}
                  min={0}
                  max={COURSE_YOUTUBE_MAX_CROP_PX}
                  step={1}
                  fractionDigits={0}
                  defaultValue={COURSE_YOUTUBE_DEFAULT_CROP_BOTTOM_PX}
                  onChange={(cropBottomPx) =>
                    updateBlock(block.id, {
                      cropChrome: true,
                      cropBottomPx,
                      minimalChrome: undefined,
                    })
                  }
                />
              </TRNFormField>
            </>
          ) : null}
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-youtube-caption`}
        title="Caption"
        titleIcon={<Captions className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Optional text below or over the video frame."
        defaultExpanded
      >
        <div className="flex flex-col gap-2">
          <CourseEmojiTextField
            id={`${block.id}-caption`}
            label="Caption text"
            value={block.caption ?? ""}
            onChange={(caption) =>
              updateBlock(block.id, {
                caption: caption.length > 0 ? caption : undefined,
              })
            }
          />
          <TRNFormField
            id={`${block.id}-caption-placement`}
            label="Show caption"
            hint={
              captionPlacement === "hidden"
                ? "Caption text is saved but not shown on the page."
                : captionPlacement === "above"
                  ? "Caption renders in a bar above the video."
                  : captionPlacement === "overlay"
                    ? "Caption sits over the bottom of the video frame."
                    : "Caption renders in a bar below the video."
            }
          >
            <TRNSelect
              value={captionPlacement}
              ariaLabel="Caption placement"
              options={[
                { value: "hidden", label: "Hidden" },
                { value: "above", label: "Above video" },
                { value: "below", label: "Below video" },
                { value: "overlay", label: "Over video" },
              ]}
              onValueChange={(value) => {
                const next = value as CourseEmbedCaptionPlacement;
                updateBlock(block.id, {
                  captionPlacement: next === "below" ? undefined : next,
                });
              }}
            />
          </TRNFormField>
        </div>
      </CourseInspectorCard>
    </>
  );
}
