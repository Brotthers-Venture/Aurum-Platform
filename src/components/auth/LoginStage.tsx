import type { CSSProperties, ReactNode } from "react";

/**
 * Sign-in entrance shared by Aurum and every GP portal: one full-bleed background,
 * softly out of focus, with the brand top-left, a statement bottom-left and the
 * sign-in card floating on top.
 */
export function LoginStage({
  background,
  logo,
  statement,
  footer,
  children,
  style,
}: {
  /** image or artwork filling the screen (rendered out of focus) */
  background: ReactNode;
  logo: ReactNode;
  statement?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-ink-900 text-white" style={style}>
      <div className="absolute inset-0 -z-10 scale-[1.08] blur-[10px]" aria-hidden>
        {background}
      </div>
      {/* gentle vignette so white type and the card always read */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_75%_45%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.55)_100%)]" aria-hidden />

      <header className="flex items-center justify-between px-8 pt-8 sm:px-12">{logo}</header>

      <main className="mx-auto flex w-full max-w-[1320px] flex-1 items-center justify-between gap-16 px-8 py-10 sm:px-12">
        <div className="hidden max-w-[560px] self-end pb-6 lg:block">{statement}</div>
        <div className="w-full max-w-[420px] rounded-[16px] bg-white/95 p-8 text-ink-900 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.65)] ring-1 ring-white/50 backdrop-blur-xl">
          {children}
        </div>
      </main>

      {footer && <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-8 pb-6 text-[12px] text-white/60 sm:px-12">{footer}</footer>}
    </div>
  );
}
