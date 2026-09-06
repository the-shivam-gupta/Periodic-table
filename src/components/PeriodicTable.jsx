import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import Element from "./Element";
import { CATEGORY_CLASS } from "../data/categories";
import {
  buildCompactGrid,
  NUMBER_MAP,
  MAIN_COLS,
} from "../data/elements";
import {
  dimOthers,
  restoreAll,
  pulseNodes,
  clearPulse,
  flashNode,
} from "../animations/tableAnimations";

// PeriodicTable renders the existing dataset exactly once per atomic number.
// Position (compact: xpos/ypos, wide: wxpos/wypos) comes straight from the data.
const PeriodicTable = forwardRef(function PeriodicTable(props, ref) {
  const {
    mode = "compact",
    hoverEnabled = true,
    onSelect,
    onHover,
    onHoverLeave,
    dimPredicate = null,
    heatStyle = null,
    heatBadge = null,
    showNames = true,
    showCategories = false,
    showAxis = true,
    locked = false,
    className = "",
    centerNode = null,
    heatLabel = "",
    heatUnit = "",
    showMass = true,
  } = props;

  const registryRef = useRef(new Map());
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const onHoverLeaveRef = useRef(onHoverLeave);
  onHoverLeaveRef.current = onHoverLeave;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const dimPredicateRef = useRef(dimPredicate);
  dimPredicateRef.current = dimPredicate;

  // Elements always keep the standard 18-group positions (dataset xpos/ypos);
  // "wide" mode only makes the same layout roomier.
  const { main, lan } = useMemo(() => buildCompactGrid(), []);
  const wideCols = MAIN_COLS;

  const baseOpacity = useCallback((num) => {
    const el = NUMBER_MAP.get(num);
    const pred = dimPredicateRef.current;
    if (!el || !pred) return 1;
    return pred(el) ? 1 : 0.3;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getNode: (num) => registryRef.current.get(num) || null,
      registry: registryRef.current,
      flash: (num) => {
        const node = registryRef.current.get(num);
        if (node) flashNode(node);
      },
      dim: (keepNumber, target = 0.16, duration = 0.5) =>
        dimOthers(registryRef.current, keepNumber, target, duration, baseOpacity),
      restore: (duration = 0.4) =>
        restoreAll(registryRef.current, baseOpacity, duration),
      pulse: (numbers, intensity = 0.5) =>
        pulseNodes(numbers, (n) => registryRef.current.get(n) || null, intensity),
      clearPulse: (numbers) =>
        clearPulse(numbers, (n) => registryRef.current.get(n) || null),
      reset: (duration = 0.4) => {
        restoreAll(registryRef.current, baseOpacity, duration);
        const all = [...registryRef.current.keys()];
        clearPulse(all, (n) => registryRef.current.get(n) || null);
      },
    }),
    [baseOpacity]
  );

  const registerNode = useCallback((num, node) => {
    registryRef.current.set(num, node);
  }, []);
  const unregisterNode = useCallback((num) => {
    registryRef.current.delete(num);
  }, []);

  const handleEnter = useCallback(
    (number, node) => {
      if (locked || !hoverEnabled) return;
      onHoverRef.current?.(number, node);
    },
    [locked, hoverEnabled]
  );

  const handleLeave = useCallback(() => {
    if (locked || !hoverEnabled) return;
    onHoverLeaveRef.current?.();
  }, [locked, hoverEnabled]);

  const renderCell = (el, extraKey) => {
    // Blank-cell keys are namespaced ("blank-…") so they can never collide
    // with a real element's key (its atomic number) — without this, a blank
    // cell sitting at column index N in a row that also contains the element
    // with atomic number N (e.g. index 3 vs. Lithium, #3) would share a key.
    if (!el) return <div key={`blank-${extraKey}`} className="blank-cell" />;
    const heatActive = !!heatStyle;
    const heatFor = heatStyle ? heatStyle(el) : null;
    const missing = heatActive && heatFor === null;
    const valueText = heatActive ? heatBadge(el) : null;
    const color = missing ? "el-void" : CATEGORY_CLASS[el.category] || "el-default";
    const dimmed = dimPredicate ? !dimPredicate(el) : false;
    return (
      <Element
        key={el.number}
        data={el}
        color={color}
        dimmed={dimmed}
        heat={heatFor}
        valueText={valueText}
        missing={missing}
        heatLabel={heatLabel}
        heatUnit={heatUnit}
        badgeText={showCategories && !heatActive ? el.category : null}
        showNames={showNames}
        showCategories={showCategories && !heatActive}
        showMass={showMass}
        onHoverEnter={handleEnter}
        onHoverLeave={handleLeave}
        onSelect={(data, node) => onSelectRef.current?.(data, node)}
        registerNode={registerNode}
        unregisterNode={unregisterNode}
      />
    );
  };

  const axisRow = () => (
    <div className="table-axis-row">
      <span className="axis-corner" aria-hidden="true" />
      {Array.from({ length: wideCols }, (_, j) => (
        <span
          key={j + 1}
          className="group-num"
          title={`Group ${j + 1}`}
        >
          {j + 1}
        </span>
      ))}
    </div>
  );

  const periodNum = (i) => (
    <span className="period-num" title={`Period ${i + 1}`}>
      {i + 1}
    </span>
  );

  return (
    <div
      className={`periodic-table${mode === "wide" ? " periodic-table--wide" : ""} ${className}`}
    >
      {centerNode != null && <div className="table-center">{centerNode}</div>}
      <div className="table-panel">
        {showAxis && axisRow()}
        {main.map((row, i) => (
          <div key={i} className="table-row">
            {periodNum(i)}
            {row.map((cell, j) => renderCell(cell, j))}
          </div>
        ))}
      </div>

      <div className="table-panel table-panel-lan">
        <div className="lan-caption">Lanthanides &amp; Actinides</div>
        {lan.map((row, i) => (
          <div key={i} className="table-row">
            <span className="lan-label" aria-hidden="true">
              {i === 0 ? "57–71" : "89–103"}
            </span>
            {row.map((cell, j) => renderCell(cell, j + 100))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default PeriodicTable;