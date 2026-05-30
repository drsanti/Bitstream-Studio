import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import chroma from 'chroma-js';
import { Card } from '../Card';

export const TailwindTestCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const badge1Ref = useRef<HTMLSpanElement>(null);
  const badge2Ref = useRef<HTMLSpanElement>(null);
  const badge3Ref = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create color scale using chroma.js
    const colorScale = chroma
      .scale(['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'])
      .mode('lab')
      .colors(10);

    let currentColorIndex = 0;

    // Create master timeline
    const masterTimeline = gsap.timeline({ repeat: -1 });

    // Animation 1: Card entrance - position, size, and rotation
    masterTimeline
      .fromTo(
        containerRef.current,
        {
          x: 100,
          y: -50,
          scale: 0.8,
          rotation: -15,
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
        }
      )
      // Animation 2: Continuous floating motion (position)
      .to(containerRef.current, {
        y: -10,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      })
      // Animation 3: Scale pulse
      .to(
        containerRef.current,
        {
          scale: 1.05,
          duration: 0.5,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: 1,
        },
        '-=1'
      )
      // Animation 4: Rotation wiggle
      .to(
        containerRef.current,
        {
          rotation: 3,
          duration: 0.3,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: 1,
        },
        '-=0.5'
      );

    // Animate gradient background colors
    const animateGradient = () => {
      if (!gradientRef.current) return;

      const nextColor = colorScale[currentColorIndex];
      const nextColorIndex = (currentColorIndex + 1) % colorScale.length;
      const targetColor = colorScale[nextColorIndex];

      // Create gradient from current to target color
      const gradientColors = chroma
        .scale([nextColor, targetColor])
        .mode('lab')
        .colors(5);

      gsap.to(gradientRef.current, {
        background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[4]})`,
        duration: 2,
        ease: 'sine.inOut',
        onComplete: () => {
          currentColorIndex = nextColorIndex;
          animateGradient();
        },
      });
    };

    // Start gradient animation after card entrance
    gsap.delayedCall(0.8, animateGradient);

    // Animate badges with stagger
    if (badge1Ref.current && badge2Ref.current && badge3Ref.current) {
      const badges = [badge1Ref.current, badge2Ref.current, badge3Ref.current];

      // Initial badge animation - scale and rotation
      gsap.fromTo(
        badges,
        {
          scale: 0,
          rotation: -180,
          opacity: 0,
        },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(2)',
          stagger: 0.1,
          delay: 0.5,
        }
      );

      // Continuous badge animations - color changes using chroma
      badges.forEach((badge, index) => {
        const badgeColors = chroma
          .scale(['#3b82f6', '#8b5cf6', '#ec4899'])
          .mode('lab')
          .colors(6);

        gsap.to(badge, {
          backgroundColor: () =>
            badgeColors[(index + currentColorIndex) % badgeColors.length],
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.2,
        });

        // Badge position animation
        gsap.to(badge, {
          y: -5,
          duration: 1.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.15,
        });
      });
    }

    // Button animation
    if (buttonRef.current) {
      // Continuous button rotation
      gsap.to(buttonRef.current, {
        rotation: 360,
        duration: 20,
        ease: 'none',
        repeat: -1,
      });

      // Button scale pulse
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 1.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }

    timelineRef.current = masterTimeline;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      gsap.killTweensOf([
        containerRef.current,
        gradientRef.current,
        badge1Ref.current,
        badge2Ref.current,
        badge3Ref.current,
        buttonRef.current,
      ]);
    };
  }, []);

  const handleButtonClick = () => {
    if (!containerRef.current || !isVisible) return;

    // Kill all ongoing animations
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    gsap.killTweensOf([
      containerRef.current,
      gradientRef.current,
      badge1Ref.current,
      badge2Ref.current,
      badge3Ref.current,
      buttonRef.current,
    ]);

    // Animate card out - reverse of entrance
    gsap.to(containerRef.current, {
      x: 100,
      y: -50,
      scale: 0.8,
      rotation: -15,
      opacity: 0,
      duration: 0.5,
      ease: 'back.in(1.7)',
      onComplete: () => {
        setIsVisible(false);
      },
    });
  };

  if (!isVisible) return null;

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        ref={gradientRef}
        className="rounded-lg p-px"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        }}
      >
        <Card
          title="Tailwind CSS Test"
          className="bg-card/95 backdrop-blur-sm"
          footer={
            <button
              ref={buttonRef}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors transform-gpu"
              onClick={handleButtonClick}
            >
              Close
            </button>
          }
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This card demonstrates Tailwind CSS is working correctly in the
              extension.
            </p>
            <div className="flex gap-2">
              <span
                ref={badge1Ref}
                className="px-2 py-1 text-accent-foreground rounded text-xs transform-gpu"
                style={{ backgroundColor: '#3b82f6' }}
              >
                Accent
              </span>
              <span
                ref={badge2Ref}
                className="px-2 py-1 text-secondary-foreground rounded text-xs transform-gpu"
                style={{ backgroundColor: '#8b5cf6' }}
              >
                Secondary
              </span>
              <span
                ref={badge3Ref}
                className="px-2 py-1 text-muted-foreground rounded text-xs transform-gpu"
                style={{ backgroundColor: '#ec4899' }}
              >
                Muted
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
