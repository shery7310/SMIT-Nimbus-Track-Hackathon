import { useEffect, useState } from 'react';

// Content for the left-hand visual panel on the auth screen.
// Each slide is a headline + supporting line; kept as data so copy
// changes don't touch layout/behavior.
const SLIDES = [
  {
    headline: 'Every team works better in Nimbus Track',
    body: 'Bring design, marketing, HR, operations, and engineering into one shared place to plan work, track progress, and move faster together.',
  },
  {
    headline: 'More than project management',
    body: 'Turn your system of record into a system of action. Every Nimbus plan comes with the AI tools you need to activate your team, wherever they work.',
  },
  {
    headline: 'Trusted by teams big and small',
    body: 'Teams of all types turn teamwork into results with Nimbus Track.',
  },
];

const AUTO_ADVANCE_MS = 5500;

export default function AuthCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [index]);

  const goTo = (i) => setIndex(i);
  const slide = SLIDES[index];

  return (
    <div className="auth-carousel">
      {/* key={index} restarts the fade-in animation on every slide change */}
      <div className="auth-carousel-slide" key={index}>
        <h1 className="auth-visual-headline">{slide.headline}</h1>
        <p className="auth-visual-tagline">{slide.body}</p>
      </div>

      <div className="auth-carousel-progress" role="tablist" aria-label="Choose slide">
        {SLIDES.map((s, i) => (
          <button
            key={s.headline}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
            className="auth-carousel-track"
            onClick={() => goTo(i)}
          >
            <span
              // Remounting on index change restarts the fill animation from 0.
              key={i === index ? `active-${index}` : 'idle'}
              className={`auth-carousel-fill ${i < index ? 'filled' : ''} ${i === index ? 'active' : ''}`}
              style={i === index ? { animationDuration: `${AUTO_ADVANCE_MS}ms` } : undefined}
            />
          </button>
        ))}
      </div>
    </div>
  );
}