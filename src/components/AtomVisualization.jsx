import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { animateAtom } from "../animations/atomAnimations";

const SIZE = 200;
const CENTER = 100;
const MAX_DOTS = 40;
const CORE_RADIUS = 17;

export default function AtomVisualization({ element }) {
  const rootRef = useRef(null);
  const ringRefs = useRef([]);

  const shells = Array.isArray(element.shells) ? element.shells : [];
  const electronTotal = shells.reduce((a, b) => a + b, 0);
  const lastIndex = Math.max(shells.length - 1, 0);
  const step = (CENTER - 30) / Math.max(lastIndex, 1);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      animateAtom(ringRefs.current, CENTER);
    }, rootRef);
    return () => ctx.revert();
  }, [element.number]);

  return (
    <div className="atom" ref={rootRef}>
      <svg
        className="atom__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Bohr model of ${element.name} with ${electronTotal} electrons`}
      >
        <circle className="atom__nucleus" cx={CENTER} cy={CENTER} r={CORE_RADIUS} />
        <text className="atom__nucleus-num" x={CENTER} y={CENTER - 1} textAnchor="middle">
          {element.number}
        </text>
        <text className="atom__nucleus-sym" x={CENTER} y={CENTER + 11} textAnchor="middle">
          {element.symbol}
        </text>

        {shells.map((count, i) => {
          const r = 30 + step * i;
          const dots = Math.max(1, Math.min(count, MAX_DOTS));
          return (
            <g
              key={`${element.number}-${i}`}
              className="atom__ring"
              ref={(el) => {
                ringRefs.current[i] = el;
              }}
            >
              <circle className="atom__orbit" cx={CENTER} cy={CENTER} r={r} />
              {Array.from({ length: dots }, (_, d) => {
                const a = (d / dots) * Math.PI * 2;
                return (
                  <circle
                    key={d}
                    className="atom__electron"
                    cx={CENTER + r * Math.cos(a)}
                    cy={CENTER + r * Math.sin(a)}
                    r={2.4}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <p className="atom__caption">
        {electronTotal} e⁻ · shells {shells.join(" · ") || "—"}
      </p>
    </div>
  );
}