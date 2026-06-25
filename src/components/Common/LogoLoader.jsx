import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

/**
 * LogoLoader
 * ----------
 * Premium loading screen for the "تكة" restaurant management system.
 *
 * The logo depicts a black hand rising up to press a red button (top-left).
 * Animation spec:
 *   - Total duration: 2.2s, loops infinitely while the DB initializes.
 *   - The whole hand rises as ONE group (no per-path fades): y [260→120→28→-8→0].
 *   - A micro-press overshoot (-8px) in the last ~0.2s simulates the finger tap.
 *   - The red button does a subtle scale pulse (1 → 0.94 → 1) timed to the touch.
 *   - Only GPU-friendly `transform` properties are animated (no reflow).
 *   - `prefers-reduced-motion` degrades to a calm opacity fade loop.
 *
 * IMPORTANT — coordinate space:
 * The source SVG paths are authored in an OFFSET space (e.g. M1903,1996.8) that
 * sits outside the viewBox (0 0 1085.6 1146.4). Each path needs
 * translate(-987.9, -850.4) to land inside the viewBox. The red button circle is
 * the only element already in viewBox space, so it gets NO translate.
 * We isolate that translate in an inner <g> so the outer motion.g only carries
 * the animation transform.
 */

const VIEWBOX = '0 0 1085.6 1146.4';
const COORD_OFFSET = 'translate(-987.9 -850.4)'; // brings offset-space paths into the viewBox

// Shared timing — physically natural easeOutCubic curve.
const EASE_OUT_CUBIC = [0.22, 1, 0.36, 1];
const LOOP_DURATION = 2.2;

const prefersReducedMotionQuery = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LogoLoader = () => {
  // Lazily read the initial value so we never call setState synchronously in an effect.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(prefersReducedMotionQuery);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ── Reduced-motion: calm fade loop, no translation ──
  if (prefersReducedMotion) {
    return (
      <LoaderShell>
        <motion.div
          className="loader-card"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
        >
          <StaticLogo />
          <p className="loader-text">جاري التحميل...</p>
        </motion.div>
      </LoaderShell>
    );
  }

  // ── Full motion version ──
  return (
    <LoaderShell>
      <motion.div
        className="loader-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div role="img" aria-label="شعار تحميل تكة — يد تضغط زراً أحمر">
          <svg
            viewBox={VIEWBOX}
            className="loader-svg"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {/* logoBackground — white rounded card (static, offset-space) */}
            <g transform={COORD_OFFSET}>
              <path
                className="cls-1"
                fill="#fff"
                d="M1903,1996.8H1158.4a170.52,170.52,0,0,1-170.5-170.5V1020.9a170.52,170.52,0,0,1,170.5-170.5H1903a170.52,170.52,0,0,1,170.5,170.5v805.4C2073.6,1920.4,1997.2,1996.8,1903,1996.8Z"
              />
            </g>

            {/* redButton — already in viewBox space (no translate). Pulses on touch. */}
            <motion.circle
              className="red-button"
              cx="268.6"
              cy="202.1"
              r="86.9"
              fill="#c1272d"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1, 1, 0.94, 1] }}
              transition={{
                duration: LOOP_DURATION,
                times: [0, 0.82, 0.88, 0.94, 1],
                ease: EASE_OUT_CUBIC,
                repeat: Infinity,
                repeatDelay: 0,
              }}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                willChange: 'transform',
              }}
            />

            {/* handGroup — the ENTIRE hand rises as one unit + micro-press overshoot.
                Inner <g> owns the coordinate offset; this motion.g owns only the animation. */}
            <motion.g
              className="hand-group"
              initial={{ y: 260, x: 20, rotate: 4 }}
              animate={{
                y: [260, 120, 28, -8, 0],
                x: [20, 14, 5, 0, 0],
                rotate: [4, 2, 1, -1, 0],
              }}
              transition={{
                duration: LOOP_DURATION,
                times: [0, 0.45, 0.82, 0.92, 1],
                ease: EASE_OUT_CUBIC,
                repeat: Infinity,
                repeatDelay: 0,
              }}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center center',
                willChange: 'transform',
              }}
            >
              <g transform={COORD_OFFSET}>
                {/* Thumb (cls-3) */}
                <path
                  fill="none"
                  stroke="#262424"
                  strokeWidth="8px"
                  strokeMiterlimit="10"
                  d="M1355.19,1139.3c-9.4-12.1-73-98.1-83.69-96.7-24.2,2.7-27.5,37.7-20.8,80.6,7.3,35,16.7,69.2,38.3,122.9l.6,1.3c20.8,48.5,53.1,120.2,69.2,160.6,11.4,30.2,31,95.4,25.6,137.1,20.8,6,16.2-55,9.4-94.1-3.3-18.1-13.5-57.1-17.5-67.9-10.8-28.3-31.6-79.3-40.4-99.4-22.9-54.4-74.6-178.1-70.6-217,1.9-18.1,14.1-9.4,20.8,2.7,26.9,35.6,36.3,69.8,80.6,135.8,20.8,32.9,48.5,81.4,72.5,123.7a467.4,467.4,0,0,0,35,53.7c7.3,8.1,18.8,26.9,29.6,26.9,12.1,1.9,13.5-12.1,9.4-21.5-2.7-13.5-12.7-27.5-26.9-45.8-51.1-69.2-96.8-153.3-134.4-207.7"
                />
                {/* Index finger (cls-3) — points up toward the red button */}
                <path
                  fill="none"
                  stroke="#262424"
                  strokeWidth="8px"
                  strokeMiterlimit="10"
                  d="M1426.7,1241.5c27.5-8.7,56.4-4,80,25.6l9.4,11.4,9.4,14.1c14.1,22.1,22.9,41,35,59.1,7.3,12.1,15.4,26.9,25.6,37.7,17.5,14.8,26.9,2.7,16.7-22.9-5.4-14.8-23.5-39-26.9-45-35-47.1-58.5-82-90.8-94.8-15.7-8.8-47.1-9.4-60.6,2.1a6.3,6.3,0,0,0-1.5,7.6A30.14,30.14,0,0,0,1426.7,1241.5Z"
                />
                {/* Palm / main hand body (cls-3) */}
                <path
                  fill="none"
                  stroke="#262424"
                  strokeWidth="8px"
                  strokeMiterlimit="10"
                  d="M1881,1771.2c7.2-9.6,13.3-19.6,13.3-31.7-2.7-1.3,0-7.3-13.5-32.9-7.3-14.8-33.6-57.1-47.7-61.8l-3.3,1.3c-6.7,0-15.4,0-24.8,2.7,2.7-43.7,14.8-108.9,4.6-186.8-4.6-29.6-9.4-51.1-16.2-65.8-4.6-12.7-9.4-24.2-14.1-31-19.4-33.6-46.4-67.1-69.2-88.1-20.2-17.5-36.9-26.9-61.2-26.2-16.7,0-28.3,6.7-29.6,10-16.2-13.5-36.9-26.2-55.8-30.2-10,0-24.2-4-39,6-4.6,2.7-6,7.3,1.9,6.7h6c49.1,4.6,65.8,22.9,98.9,71.9l18.1,30.2c7.3,11.4,16.2,28.3,29.6,40.4,12.7,12.7,25.6,4,13.5-18.1l-13.5-22.1-20.2-30.2c-6-8.1-20.8-31-34.2-49.1,29.6-5.4,53.7,0,77.3,35,16.7,22.9,35.6,53.7,47.1,82,33.6,96.2,33.6,172.7,34.2,270.8-22.9,5.4-53.1,14.1-73.3,23.5-60.4,26.2-124.3,67.9-166,116.2-26.9-26.9-90-54.4-134.4-86-39-28.3-63.9-57.7-88.7-98.9-13.5-24.8-26.9-52.5-43.7-82.7-13.5-24.8-34.2-51.7-53.1-73.3-11.4-10-28.9-22.1-45.8-32.3,34.2-15.4,74.6,1.3,100.2,20.8,30.2,22.9,54.4,59.8,77.9,87.3,4,4.6,8.7,12.7,13.5,12.7,4.6,0,.6-8.7-.6-10-29.6-39-53.7-86-96.2-114.3-17.5-11.4-40.4-21.5-61.8-21.5-32.9-.6-73.9,18.1-73.3,32.9l2.7,3.3c16.7,12.1,31,22.1,45,36.9,33.6,32.9,59.1,76,81.4,124.3,19.4,36.3,39.6,69.8,69.8,99.4,42.3,41.7,96.8,67.9,131,86,20.2,11.4,38.3,23.5,55.8,42.3l-10,19.4c-1.9,20.2,15.4,49.1,30.2,71.2,19.4,29.6,108,23.6,72.5-31,22.9-22.1,62.5-49.8,86.7-65.2,34.2-22.1,87.3-41,128.3-59.1h1.3c7.5,13.9,16.5,19.9,24.1,22.1A20.61,20.61,0,0,0,1881,1771.2Zm-145.2,7.3c-57.1,26.9-141.8,89.4-163.9,137.7-12.7-13.5-31-55-47.7-69.8,15.4-22.1,47.7-57.1,79.3-79.3,63.9-47.1,120.2-75.2,192.9-100.8l33.6-12.1v-1.3l50.4,85.4C1853.4,1736.8,1799.7,1751.6,1735.8,1778.5Z"
                />
                {/* Knuckle detail (cls-4) */}
                <path
                  fill="#262424"
                  d="M1786.2,1690.4c-23.5,14.8-12.1,46.4,11.4,43.1C1823.2,1728.1,1817.8,1686.4,1786.2,1690.4Z"
                />
              </g>
            </motion.g>
          </svg>
        </div>
        <p className="loader-text">جاري التحميل...</p>
      </motion.div>
    </LoaderShell>
  );
};

/**
 * Full-screen centered shell + compact card. Inline styles keep the sizing
 * deterministic regardless of Tailwind config, so the logo stays small and centered.
 */
const LoaderShell = ({ children }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)',
      fontFamily: "'Cairo', sans-serif",
      padding: '24px',
    }}
  >
    {children}
    <style>{`
      .loader-card {
        width: 220px;
        max-width: 100%;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(226,232,240,0.7);
        border-radius: 28px;
        padding: 28px 24px;
        box-shadow: 0 20px 45px -12px rgba(15,23,42,0.18), 0 8px 16px -8px rgba(15,23,42,0.08);
        text-align: center;
      }
      .loader-svg {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 6px 10px rgba(15,23,42,0.12));
      }
      .loader-text {
        margin: 14px 0 0;
        color: #334155;
        font-weight: 600;
        font-size: 0.95rem;
        letter-spacing: 0.01em;
      }
    `}</style>
  </div>
);

/**
 * Static, non-animated logo (used by the reduced-motion branch).
 * Contains the COMPLETE logo with the coordinate offset applied.
 */
const StaticLogo = () => (
  <div role="img" aria-label="شعار تحميل تكة">
    <svg
      viewBox={VIEWBOX}
      className="loader-svg"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g transform={COORD_OFFSET}>
        <path
          fill="#fff"
          d="M1903,1996.8H1158.4a170.52,170.52,0,0,1-170.5-170.5V1020.9a170.52,170.52,0,0,1,170.5-170.5H1903a170.52,170.52,0,0,1,170.5,170.5v805.4C2073.6,1920.4,1997.2,1996.8,1903,1996.8Z"
        />
        <path
          fill="none"
          stroke="#262424"
          strokeWidth="8px"
          strokeMiterlimit="10"
          d="M1355.19,1139.3c-9.4-12.1-73-98.1-83.69-96.7-24.2,2.7-27.5,37.7-20.8,80.6,7.3,35,16.7,69.2,38.3,122.9l.6,1.3c20.8,48.5,53.1,120.2,69.2,160.6,11.4,30.2,31,95.4,25.6,137.1,20.8,6,16.2-55,9.4-94.1-3.3-18.1-13.5-57.1-17.5-67.9-10.8-28.3-31.6-79.3-40.4-99.4-22.9-54.4-74.6-178.1-70.6-217,1.9-18.1,14.1-9.4,20.8,2.7,26.9,35.6,36.3,69.8,80.6,135.8,20.8,32.9,48.5,81.4,72.5,123.7a467.4,467.4,0,0,0,35,53.7c7.3,8.1,18.8,26.9,29.6,26.9,12.1,1.9,13.5-12.1,9.4-21.5-2.7-13.5-12.7-27.5-26.9-45.8-51.1-69.2-96.8-153.3-134.4-207.7"
        />
        <path
          fill="none"
          stroke="#262424"
          strokeWidth="8px"
          strokeMiterlimit="10"
          d="M1426.7,1241.5c27.5-8.7,56.4-4,80,25.6l9.4,11.4,9.4,14.1c14.1,22.1,22.9,41,35,59.1,7.3,12.1,15.4,26.9,25.6,37.7,17.5,14.8,26.9,2.7,16.7-22.9-5.4-14.8-23.5-39-26.9-45-35-47.1-58.5-82-90.8-94.8-15.7-8.8-47.1-9.4-60.6,2.1a6.3,6.3,0,0,0-1.5,7.6A30.14,30.14,0,0,0,1426.7,1241.5Z"
        />
        <path
          fill="none"
          stroke="#262424"
          strokeWidth="8px"
          strokeMiterlimit="10"
          d="M1881,1771.2c7.2-9.6,13.3-19.6,13.3-31.7-2.7-1.3,0-7.3-13.5-32.9-7.3-14.8-33.6-57.1-47.7-61.8l-3.3,1.3c-6.7,0-15.4,0-24.8,2.7,2.7-43.7,14.8-108.9,4.6-186.8-4.6-29.6-9.4-51.1-16.2-65.8-4.6-12.7-9.4-24.2-14.1-31-19.4-33.6-46.4-67.1-69.2-88.1-20.2-17.5-36.9-26.9-61.2-26.2-16.7,0-28.3,6.7-29.6,10-16.2-13.5-36.9-26.2-55.8-30.2-10,0-24.2-4-39,6-4.6,2.7-6,7.3,1.9,6.7h6c49.1,4.6,65.8,22.9,98.9,71.9l18.1,30.2c7.3,11.4,16.2,28.3,29.6,40.4,12.7,12.7,25.6,4,13.5-18.1l-13.5-22.1-20.2-30.2c-6-8.1-20.8-31-34.2-49.1,29.6-5.4,53.7,0,77.3,35,16.7,22.9,35.6,53.7,47.1,82,33.6,96.2,33.6,172.7,34.2,270.8-22.9,5.4-53.1,14.1-73.3,23.5-60.4,26.2-124.3,67.9-166,116.2-26.9-26.9-90-54.4-134.4-86-39-28.3-63.9-57.7-88.7-98.9-13.5-24.8-26.9-52.5-43.7-82.7-13.5-24.8-34.2-51.7-53.1-73.3-11.4-10-28.9-22.1-45.8-32.3,34.2-15.4,74.6,1.3,100.2,20.8,30.2,22.9,54.4,59.8,77.9,87.3,4,4.6,8.7,12.7,13.5,12.7,4.6,0,.6-8.7-.6-10-29.6-39-53.7-86-96.2-114.3-17.5-11.4-40.4-21.5-61.8-21.5-32.9-.6-73.9,18.1-73.3,32.9l2.7,3.3c16.7,12.1,31,22.1,45,36.9,33.6,32.9,59.1,76,81.4,124.3,19.4,36.3,39.6,69.8,69.8,99.4,42.3,41.7,96.8,67.9,131,86,20.2,11.4,38.3,23.5,55.8,42.3l-10,19.4c-1.9,20.2,15.4,49.1,30.2,71.2,19.4,29.6,108,23.6,72.5-31,22.9-22.1,62.5-49.8,86.7-65.2,34.2-22.1,87.3-41,128.3-59.1h1.3c7.5,13.9,16.5,19.9,24.1,22.1A20.61,20.61,0,0,0,1881,1771.2Zm-145.2,7.3c-57.1,26.9-141.8,89.4-163.9,137.7-12.7-13.5-31-55-47.7-69.8,15.4-22.1,47.7-57.1,79.3-79.3,63.9-47.1,120.2-75.2,192.9-100.8l33.6-12.1v-1.3l50.4,85.4C1853.4,1736.8,1799.7,1751.6,1735.8,1778.5Z"
        />
        <path
          fill="#262424"
          d="M1786.2,1690.4c-23.5,14.8-12.1,46.4,11.4,43.1C1823.2,1728.1,1817.8,1686.4,1786.2,1690.4Z"
        />
      </g>
      <circle cx="268.6" cy="202.1" r="86.9" fill="#c1272d" />
    </svg>
  </div>
);

export default LogoLoader;
