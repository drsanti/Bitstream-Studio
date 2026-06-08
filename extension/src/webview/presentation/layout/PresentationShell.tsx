import { Suspense, useEffect } from "react";

import { PresentationThemeProvider } from "../design/PresentationThemeProvider";

import { Bmi270FrameRefSync } from "../app/Bmi270FrameRefSync";

import { attachPresentationKeyboardNav } from "../app/useChapterStore";

import { attachPresentationPresenterNav } from "../app/attachPresentationPresenterNav";

import { flatSlides } from "../chapters/registry";

import { useChapterStore } from "../app/useChapterStore";

import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";

import { PresentationTopBar } from "./PresentationTopBar";

import { ChapterSidebar } from "./ChapterSidebar";

import { SpeakerNotesPanel } from "./SpeakerNotesPanel";

import { TheoryReaderPanel } from "./TheoryReaderPanel";

import { SlideViewport } from "./SlideViewport";

import { SlideBackdrop } from "../chapters/_shared/visual/SlideBackdrop";

import { chapterBackdropAccent } from "../chapters/_shared/visual/chapterAccent";

import "../presentation.css";



function SlideFallback() {

  return (

    <div className="flex h-full w-full items-center justify-center">

      <div

        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"

        style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }}

      />

    </div>

  );

}



function PresenterFooterHint() {

  const presentMode = usePresentationPresenterStore((s) => s.presentMode);

  if (presentMode) {

    return null;

  }



  return (

    <div className="presentation-slide-footer-hint shrink-0">

      ← → slides · P present · L laser (pauses 3D orbit) · +/− zoom · 0 reset · Shift+arrows pan when zoomed · R reader · S notes · F fullscreen

    </div>

  );

}



export function PresentationShell() {

  const slideIndex = useChapterStore((s) => s.slideIndex);

  const slide = flatSlides[slideIndex];

  const SlideComponent = slide?.Component;



  useEffect(() => attachPresentationKeyboardNav(), []);

  useEffect(() => attachPresentationPresenterNav(), []);



  return (

    <PresentationThemeProvider>

      <Bmi270FrameRefSync />

      <PresentationTopBar />

      <div className="flex min-h-0 flex-1 overflow-hidden">

        <ChapterSidebar />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">

          <div className="flex min-h-0 flex-1 overflow-hidden">

            <div className="slide-root relative min-h-0 min-w-0 flex-1">

              <SlideViewport>

                <Suspense fallback={<SlideFallback />}>

                  {SlideComponent ? (

                    <SlideBackdrop accent={chapterBackdropAccent(slide?.chapterId ?? "bitstream-studio")}>

                      <SlideComponent />

                    </SlideBackdrop>

                  ) : null}

                </Suspense>

              </SlideViewport>

            </div>

            <TheoryReaderPanel />

          </div>

          <PresenterFooterHint />

          <SpeakerNotesPanel />

        </main>

      </div>

    </PresentationThemeProvider>

  );

}


