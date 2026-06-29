import {
  Crosshair,
  Database,
  FileJson,
  Layers3,
  ListFilter,
  Maximize2,
  Settings,
  ZoomIn,
  ZoomOut
} from "lucide-solid";
import { createContext, createMemo, createSignal, For, onMount, Show, useContext } from "solid-js";
import type { Component, JSX } from "solid-js";
import {
  buildNativeLayout,
  compactCostLabel,
  compactDecoratorLabel,
  compactNodeBody,
  compactNodeTitle,
  compactServiceLabel,
  compactTaskTitle,
  formatValue,
  getSelectedEntity,
  humanize,
  nodeTypeLabel,
  objectEntries,
  structuralNodeRole,
  titleForSelection,
  visibleDecoratorRefsForNode,
  type NativeGraphLayout,
  type NativeLayoutEdge,
  type NativeLayoutNode,
  type NativeSelection,
  type UeDecorator,
  type UeGraphNode,
  type UeNativeModel,
  type UeService,
  type UeTaskSpec,
  type UeUseCase,
  type UeWorldKey
} from "./lib/ueNative";

const DEFAULT_MODEL_URL = `${import.meta.env.BASE_URL}data/humanoid_ue_htn_model_v1.json`;
const GRID = 24;

type InspectorTab = "details" | "world";
type DetailRefTarget =
  | { type: "asset"; ref: string }
  | { type: "selection"; selection: NativeSelection };
type DetailLinkContextValue = {
  model: UeNativeModel;
  currentAssetId: string;
  onSelect: (selection: NativeSelection) => void;
  onOpenAsset: (assetId: string) => void;
};

const DetailLinkContext = createContext<DetailLinkContextValue>();
const REF_TOKEN_PATTERN = /(?:HTN|decorator|service|task|Combat|Weapon|Agent|Squad|Objective|Planner)(?:\.[A-Za-z0-9_]+)+|SelfLocation|[A-Z][A-Za-z0-9_]+/g;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const countOf = (value: unknown) => (Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.keys(value).length : 0);
const hasDetailValue = (value: unknown) => value !== undefined && value !== null && (typeof value !== "string" || value.trim().length > 0) && countOf(value) !== 0;

const App: Component = () => {
  const [model, setModel] = createSignal<UeNativeModel | null>(null);
  const [loadError, setLoadError] = createSignal("");
  const [assetId, setAssetId] = createSignal("");
  const [assetPath, setAssetPath] = createSignal<string[]>([]);
  const [selected, setSelected] = createSignal<NativeSelection | null>(null);
  const [detailStack, setDetailStack] = createSignal<NativeSelection[]>([]);
  const [zoom, setZoom] = createSignal(0.88);
  const [snapScroll, setSnapScroll] = createSignal(true);
  const [showDecorators, setShowDecorators] = createSignal(true);
  const [showServices, setShowServices] = createSignal(true);
  const [showCosts, setShowCosts] = createSignal(true);
  const [tab, setTab] = createSignal<InspectorTab>("details");
  const [settingsOpen, setSettingsOpen] = createSignal(false);

  let viewportRef: HTMLDivElement | undefined;
  let snapTimer: number | undefined;
  let dragState:
    | {
        pointerId: number;
        startX: number;
        startY: number;
        scrollLeft: number;
        scrollTop: number;
      }
    | undefined;

  onMount(async () => {
    try {
      const response = await fetch(DEFAULT_MODEL_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      loadModel((await response.json()) as UeNativeModel);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить native UE HTN model");
    }
  });

  const layout = createMemo<NativeGraphLayout>(() => {
    const currentModel = model();
    if (!currentModel || !assetId()) return { nodes: [], edges: [], width: 960, height: 540 };
    return buildNativeLayout(currentModel, assetId());
  });

  const filteredWorld = createMemo(() => objectEntries(model()?.worldstate_keys ?? {}));
  const assetCrumbs = createMemo(() => {
    const currentModel = model();
    if (!currentModel) return [];
    const path = assetPath().length ? assetPath() : assetId() ? [assetId()] : [];
    return path
      .filter((id) => currentModel.htn_assets[id])
      .map((id, index) => ({
        id,
        title: index === 0 ? "Root" : currentModel.htn_assets[id].title,
        active: id === assetId()
      }));
  });
  const detailSelection = createMemo(() => {
    const stack = detailStack();
    return stack[stack.length - 1] ?? null;
  });

  function sameSelection(a: NativeSelection | undefined, b: NativeSelection) {
    return Boolean(a && a.kind === b.kind && a.ref === b.ref && a.assetId === b.assetId);
  }

  function replaceDetails(selection: NativeSelection | null) {
    setDetailStack(selection ? [selection] : []);
    if (selection) setTab("details");
  }

  function pushDetails(selection: NativeSelection) {
    setDetailStack((current) => (sameSelection(current[current.length - 1], selection) ? current : [...current, selection]));
    setTab("details");
  }

  function popDetails() {
    setDetailStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
    setTab("details");
  }

  function jumpToDetail(index: number) {
    setDetailStack((current) => current.slice(0, index + 1));
    setTab("details");
  }

  function loadModel(nextModel: UeNativeModel) {
    const root = nextModel.root_asset;
    const rootSelection: NativeSelection | null = root ? { kind: "node", assetId: root, ref: nextModel.htn_assets[root]?.root_node ?? "root" } : null;
    setModel(nextModel);
    setLoadError("");
    setAssetId(root);
    setAssetPath(root ? [root] : []);
    setSelected(rootSelection);
    replaceDetails(rootSelection);
    requestAnimationFrame(() => viewportRef?.scrollTo({ left: 0, top: 0 }));
  }

  function openAsset(nextAssetId: string) {
    const currentModel = model();
    if (!currentModel?.htn_assets[nextAssetId]) return;
    const rootSelection: NativeSelection = { kind: "node", assetId: nextAssetId, ref: currentModel.htn_assets[nextAssetId].root_node };
    setAssetId(nextAssetId);
    setAssetPath((previous) => {
      const existingIndex = previous.indexOf(nextAssetId);
      return existingIndex >= 0 ? previous.slice(0, existingIndex + 1) : [...previous, nextAssetId];
    });
    setSelected(rootSelection);
    replaceDetails(rootSelection);
    requestAnimationFrame(() => viewportRef?.scrollTo({ left: 0, top: 0, behavior: "smooth" }));
  }

  function zoomBy(delta: number) {
    setZoom((current) => Number(clamp(current + delta, 0.5, 1.45).toFixed(2)));
  }

  function fitGraph() {
    const viewport = viewportRef;
    if (!viewport) return;
    const currentLayout = layout();
    const nextZoom = clamp(
      Math.min((viewport.clientWidth - 56) / currentLayout.width, (viewport.clientHeight - 56) / currentLayout.height, 1.12),
      0.5,
      1.2
    );
    setZoom(Number(nextZoom.toFixed(2)));
    requestAnimationFrame(() => viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" }));
  }

  function centerSelected() {
    const viewport = viewportRef;
    const currentSelection = selected();
    if (!viewport || !currentSelection || currentSelection.kind !== "node") return;
    const node = layout().nodes.find((candidate) => candidate.id === currentSelection.ref);
    if (!node) return;
    const z = zoom();
    viewport.scrollTo({
      left: Math.max(0, (node.x + node.width / 2) * z - viewport.clientWidth / 2),
      top: Math.max(0, (node.y + node.height / 2) * z - viewport.clientHeight / 2),
      behavior: "smooth"
    });
  }

  function scheduleSnap() {
    if (!snapScroll()) return;
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
      const viewport = viewportRef;
      if (!viewport) return;
      const unit = GRID * zoom();
      viewport.scrollTo({
        left: Math.round(viewport.scrollLeft / unit) * unit,
        top: Math.round(viewport.scrollTop / unit) * unit,
        behavior: "smooth"
      });
    }, 110);
  }

  function handleWheel(event: WheelEvent) {
    const viewport = viewportRef;
    if (!viewport) return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setZoom((current) => Number(clamp(current * (event.deltaY > 0 ? 0.9 : 1.1), 0.5, 1.45).toFixed(2)));
      return;
    }
    if (event.shiftKey) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
    scheduleSnap();
  }

  function startPan(event: PointerEvent) {
    if ((event.target as HTMLElement).closest(".graph-node")) return;
    const viewport = viewportRef;
    if (!viewport) return;
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-panning");
  }

  function movePan(event: PointerEvent) {
    const viewport = viewportRef;
    if (!viewport || !dragState || dragState.pointerId !== event.pointerId) return;
    viewport.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
    viewport.scrollTop = dragState.scrollTop - (event.clientY - dragState.startY);
  }

  function endPan(event: PointerEvent) {
    const viewport = viewportRef;
    if (!viewport || !dragState || dragState.pointerId !== event.pointerId) return;
    viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove("is-panning");
    dragState = undefined;
    scheduleSnap();
  }

  return (
    <main class="app-shell">
      <Show when={loadError()}>
        <div class="load-error">
          <FileJson size={16} />
          {loadError()}
        </div>
      </Show>

      <section class="workspace">
        <section class="graph-column">
          <div class="graph-toolbar">
            <div class="toolbar-title">
              <ListFilter size={16} />
              <Show when={assetCrumbs().length} fallback="Загружаю модель...">
                <div class="asset-breadcrumbs">
                  <For each={assetCrumbs()}>
                    {(crumb, index) => (
                      <>
                        <button
                          class={crumb.active ? "asset-crumb active" : "asset-crumb"}
                          type="button"
                          onClick={() => openAsset(crumb.id)}
                          disabled={crumb.active}
                        >
                          {crumb.title}
                        </button>
                        <Show when={index() < assetCrumbs().length - 1}>
                          <span class="asset-crumb-separator">→</span>
                        </Show>
                      </>
                    )}
                  </For>
                </div>
              </Show>
            </div>
            <div class="toolbar-actions">
              <div class="settings-menu">
                <button
                  class={settingsOpen() ? "btn btn-xs btn-primary" : "btn btn-xs"}
                  type="button"
                  onClick={() => setSettingsOpen((open) => !open)}
                  title="Настройки отображения"
                >
                  <Settings size={14} />
                </button>
                <Show when={settingsOpen()}>
                  <div class="settings-popover">
                    <div class="settings-section">
                      <div class="settings-title">Показ на нодах</div>
                      <ToggleRow label="Decorators" checked={showDecorators()} onChange={setShowDecorators} />
                      <ToggleRow label="Services" checked={showServices()} onChange={setShowServices} />
                      <ToggleRow label="Стоимость" checked={showCosts()} onChange={setShowCosts} />
                      <ToggleRow label="Снэп скролла" checked={snapScroll()} onChange={setSnapScroll} />
                    </div>
                    <div class="settings-section">
                      <div class="settings-title">Легенда</div>
                      <LegendItem className="kind-root" label="Root / зона сервисов" />
                      <LegendItem className="kind-structural" label="IF / Parallel / Sequence" />
                      <LegendItem className="kind-subnetwork" label="SubNetwork" />
                      <LegendItem className="kind-subplan" label="SubPlan" />
                      <LegendItem className="kind-task" label="Primitive Task" />
                    </div>
                  </div>
                </Show>
              </div>
              <button class="btn btn-xs" type="button" onClick={() => zoomBy(-0.08)} title="Отдалить">
                <ZoomOut size={14} />
              </button>
              <span class="zoom-readout">{Math.round(zoom() * 100)}%</span>
              <button class="btn btn-xs" type="button" onClick={() => zoomBy(0.08)} title="Приблизить">
                <ZoomIn size={14} />
              </button>
              <button class="btn btn-xs" type="button" onClick={fitGraph}>
                <Maximize2 size={14} />
                Вписать
              </button>
              <button class="btn btn-xs" type="button" onClick={centerSelected}>
                <Crosshair size={14} />
                Выбранная
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            class="graph-viewport"
            onWheel={handleWheel}
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            <div class="graph-space" style={{ width: `${layout().width * zoom()}px`, height: `${layout().height * zoom()}px` }}>
              <div class="graph-layer" style={{ width: `${layout().width}px`, height: `${layout().height}px`, transform: `scale(${zoom()})` }}>
                <NativeEdges layout={layout()} />
                <For each={layout().nodes}>
                  {(node) => (
                    <NativeNodeCard
                      model={model()}
                      node={node}
                      selected={selected()?.kind === "node" && selected()?.assetId === assetId() && selected()?.ref === node.id}
                      showDecorators={showDecorators()}
                      showServices={showServices()}
                      showCosts={showCosts()}
                      onSelect={() => {
                        const nodeSelection: NativeSelection = { kind: "node", assetId: assetId(), ref: node.id };
                        setSelected(nodeSelection);
                        replaceDetails(nodeSelection);
                      }}
                      onOpenAsset={() => node.assetRef && openAsset(node.assetRef)}
                    />
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        <aside class="inspect-panel">
          <div class="tabs tabs-boxed inspector-tabs native-tabs">
            <button class={tab() === "details" ? "tab tab-active" : "tab"} type="button" onClick={() => setTab("details")}>
              Детали
            </button>
            <button class={tab() === "world" ? "tab tab-active" : "tab"} type="button" onClick={() => setTab("world")}>
              Blackboard keys
            </button>
          </div>

          <Show when={tab() === "details"}>
            <DetailsPanel
              model={model()}
              selection={detailSelection()}
              trail={detailStack()}
              currentAssetId={assetId()}
              onSelect={pushDetails}
              onOpenAsset={openAsset}
              onBack={popDetails}
              onTrailSelect={jumpToDetail}
            />
          </Show>
          <Show when={tab() === "world"}>
            <RegistryPanel
              icon={<Database size={16} />}
              title="Blackboard keys"
              entries={filteredWorld()}
              kind="world"
              onSelect={(ref) => {
                replaceDetails({ kind: "world", ref });
              }}
            />
          </Show>
        </aside>
      </section>
    </main>
  );
};

const NativeNodeCard: Component<{
  model: UeNativeModel | null;
  node: NativeLayoutNode;
  selected: boolean;
  showDecorators: boolean;
  showServices: boolean;
  showCosts: boolean;
  onSelect: () => void;
  onOpenAsset: () => void;
}> = (props) => {
  const classes = createMemo(() =>
    [
      "graph-node",
      `node-${props.node.type}`,
      props.node.type === "structural" ? `node-${structuralNodeRole(props.node.subtitle)}` : "",
      hasBooleanSlots(props.node) ? "node-boolean" : "",
      props.selected ? "selected" : ""
    ]
      .filter(Boolean)
      .join(" ")
  );
  const nodeTitle = createMemo(() => compactNodeTitle(props.model, props.node));
  const nodeBody = createMemo(() => compactNodeBody(props.model, props.node));
  const visibleDecorators = createMemo(() => visibleDecoratorRefsForNode(props.node));
  const visibleOutgoingSlots = createMemo(() => (hasBooleanSlots(props.node) ? [] : props.node.outgoingSlots));

  return (
    <button
      type="button"
      class={classes()}
      style={{
        transform: `translate(${props.node.x}px, ${props.node.y}px)`,
        width: `${props.node.width}px`,
        "min-height": `${props.node.height}px`
      }}
      onClick={props.onSelect}
      onDblClick={props.onOpenAsset}
    >
      <Show when={props.showDecorators && visibleDecorators().length}>
        <div class="ue-node-stack ue-decorator-stack">
          <For each={visibleDecorators()}>
            {(ref) => (
              <span class="ue-signal-chip signal-decorator" title={ref}>
                {compactDecoratorLabel(props.model, ref)}
              </span>
            )}
          </For>
        </div>
      </Show>
      <div class="node-main">
        <div class="node-head">
          <div class="node-title">{nodeTitle()}</div>
          <span class="node-kind">{nodeTypeLabel(props.node.type, props.node.subtitle)}</span>
        </div>
        <Show when={nodeBody()}>
          <p class="node-body">{nodeBody()}</p>
        </Show>
        <div class="node-ref">{props.node.subtitle}</div>
      </div>
      <Show when={(props.showServices && props.node.services.length) || (props.showCosts && props.node.cost)}>
        <div class="ue-node-stack ue-bottom-stack">
        <Show when={props.showServices && props.node.services.length}>
          <For each={props.node.services}>
            {(ref) => (
              <span class="ue-signal-chip signal-service" title={ref}>
                {compactServiceLabel(props.model, ref)}
              </span>
            )}
          </For>
        </Show>
        <Show when={props.showCosts && props.node.cost}>
          <span class="ue-signal-chip signal-cost" title={compactCostLabel(props.node.cost)}>
            {compactCostLabel(props.node.cost)}
          </span>
        </Show>
        </div>
      </Show>
      <Show when={visibleOutgoingSlots().length}>
        <div class="edge-slot-list" aria-label="Исходящие ветки">
          <For each={visibleOutgoingSlots()}>
            {(slot) => {
              const parts = branchSlotParts(slot.label, props.node);
              return (
                <div class={`edge-slot ${parts.signal ? `edge-slot-${parts.signal}` : ""}`} title={`${slot.label} -> ${slot.to}`}>
                  <Show when={parts.tag}>
                    <span class="edge-slot-tag">{parts.tag}</span>
                  </Show>
                  <span class="edge-slot-text">{parts.text}</span>
                  <span class="edge-slot-port" />
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </button>
  );
};

const NativeEdges: Component<{ layout: NativeGraphLayout }> = (props) => {
  const nodeByKey = createMemo(() => new Map(props.layout.nodes.map((node) => [node.key, node])));
  return (
    <svg class="edge-layer" width={props.layout.width} height={props.layout.height} viewBox={`0 0 ${props.layout.width} ${props.layout.height}`}>
      <For each={props.layout.edges}>
        {(edge) => <NativeEdge edge={edge} nodes={nodeByKey()} />}
      </For>
    </svg>
  );
};

const NativeEdge: Component<{ edge: NativeLayoutEdge; nodes: Map<string, NativeLayoutNode> }> = (props) => {
  const from = props.nodes.get(props.edge.from);
  const to = props.nodes.get(props.edge.to);
  if (!from || !to) return null;
  const x1 = from.x + from.width;
  const y1 = edgeStartY(from, props.edge);
  const tipX = to.x - 1;
  const arrowLength = 12;
  const arrowHalfHeight = 8;
  const endX = tipX - arrowLength;
  const y2 = to.y + to.height / 2;
  const distance = Math.max(80, endX - x1);
  const c1x = x1 + Math.min(160, distance * 0.45);
  const c2x = endX - Math.min(96, Math.max(36, distance * 0.35));
  const signalClass = props.edge.slotSignal ? `edge-${props.edge.slotSignal}` : "";
  return (
    <>
      <path class={`edge ordered ${signalClass}`} d={`M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${endX} ${y2}`} />
      <polygon
        class={`edge-arrow ${signalClass}`}
        points={`${tipX},${y2} ${endX},${y2 - arrowHalfHeight} ${endX},${y2 + arrowHalfHeight}`}
      />
      <Show when={props.edge.label}>
        <text class="edge-label" x={(x1 + tipX) / 2} y={(y1 + y2) / 2 - 8}>
          {props.edge.label}
        </text>
      </Show>
    </>
  );
};

function edgeStartY(node: NativeLayoutNode, edge: NativeLayoutEdge): number {
  if (node.type === "structural" && edge.slotSignal === "true") return node.y + node.height * 0.25;
  if (node.type === "structural" && edge.slotSignal === "false") return node.y + node.height * 0.75;
  return edge.slotIndex !== undefined && edge.slotCount ? edgeSlotY(node, edge.slotIndex, edge.slotCount) : node.y + node.height / 2;
}

function edgeSlotY(node: NativeLayoutNode, slotIndex: number, slotCount: number): number {
  const rowHeight = 32;
  const bottomPadding = 22;
  const firstSlotCenter = node.y + node.height - bottomPadding - (slotCount - 0.5) * rowHeight;
  return firstSlotCenter + slotIndex * rowHeight;
}

function hasBooleanSlots(node: NativeLayoutNode): boolean {
  if (node.type !== "structural" || structuralNodeRole(node.subtitle) !== "if") return false;
  return node.outgoingSlots.some((slot) => {
    const tag = slot.label.split(":", 1)[0]?.trim().toLowerCase();
    return tag === "top" || tag === "bottom";
  });
}

function branchSlotParts(label: string, node?: NativeLayoutNode): { tag: string; text: string; signal: "" | "true" | "false" } {
  const normalized = label.trim();
  const colon = normalized.indexOf(":");
  const rawTag = colon >= 0 ? normalized.slice(0, colon).trim() : normalized;
  const rawText = colon >= 0 ? normalized.slice(colon + 1).trim() : "";
  const signal = structuralNodeRole(node?.subtitle) === "if" ? branchSignal(rawTag) : "";
  const tag = signal ? "" : branchTagLabel(rawTag, node);
  const text = branchTextLabel(rawText || rawTag);
  return { tag, text, signal };
}

function branchSignal(value: string): "" | "true" | "false" {
  const normalized = value.toLowerCase();
  if (normalized === "top") return "true";
  if (normalized === "bottom") return "false";
  return "";
}

function branchTagLabel(value: string, node?: NativeLayoutNode): string {
  const normalized = value.toLowerCase();
  const role = structuralNodeRole(node?.subtitle);
  if (normalized === "top") return role === "prefer" ? "приоритет" : "top";
  if (normalized === "bottom") return role === "prefer" ? "иначе" : "bottom";
  if (normalized === "candidate") return "кандидат";
  if (normalized === "primary") return "primary";
  if (normalized === "secondary loop") return "secondary";
  return value;
}

function branchTextLabel(value: string): string {
  const normalized = value.toLowerCase();
  const labels: Record<string, string> = {
    "survival valid": "выжить",
    "no immediate survival plan": "иначе",
    "confirmed threat": "бой",
    bottom: "иначе",
    "fresh lkp or stimulus": "искать",
    "actionable stimulus or lkp": "искать",
    "tactical interrupt": "реагировать",
    "continue objective": "продолжить",
    "patrol objective": "патруль",
    "not patrol": "иначе",
    "guard objective": "охрана",
    "not guard": "иначе",
    "move-to-interest objective": "точка интереса",
    "no objective details": "держать позицию",
    "reload/switch useful": "перезарядка/смена полезна",
    "weapon needs ammo recovery": "боезапас",
    "weapon can continue or reposition": "позиция / огонь",
    "close fallback": "отход к укрытию",
    "covered fire": "огонь из укрытия",
    "safer angle": "сменить угол",
    "ammo recovery": "вернуть оружие",
    "unseen approach": "скрытно сблизиться",
    "survival fallback": "выживание",
    "fire opportunity": "огонь",
    "no fire opportunity": "без огня",
    "close or aware threat": "ближний бой",
    "not immediate close fight": "иначе",
    "enemy unaware and far": "скрытно сблизиться",
    "reveal or fight now": "открытый бой",
    "safe cover exists": "укрытие есть",
    "no safe cover route": "нет пути",
    "short lateral move works": "сместиться",
    "weapon can suppress": "подавить",
    "suppressible route exists": "путь под подавлением",
    "last short fallback": "последний шанс",
    primary: "движение",
    "secondary loop": "огонь",
    "can expose and fire": "выглянуть",
    "safer angle exists": "лучший угол",
    "contact too dangerous": "слишком опасно",
    "sound/impact fresh": "стимул свежий",
    "weapon report origin": "звук выстрела",
    "no weapon report": "иначе",
    "impact or near miss": "пуля рядом",
    "no impact cue": "иначе",
    "ally hit reaction": "союзник ранен",
    "no ally cue": "иначе",
    "other stimulus fresh": "другой стимул",
    "no fresh stimulus": "иначе",
    "after scan: search if still useful": "дальше искать",
    "lkp fresh enough": "LKP свежая",
    "stale or unsafe": "назад",
    "primary empty and reload unsafe": "вторичное оружие",
    "ammo low, get cover before reload": "укрытие",
    "already safe or no cover route": "перезарядка здесь",
    "safe reload window": "перезарядка",
    "no safe reload window": "иначе",
    "early reload only if policy passes": "перезарядка заранее",
    "early reload policy passes": "перезарядка заранее",
    "cannot recover weapon safely": "снизить риск",
    "safe unseen approach": "подход",
    "keep quiet angle": "держать угол"
  };
  return labels[normalized] ?? value;
}

function selectionKindLabel(kind: NativeSelection["kind"]): string {
  const labels: Record<NativeSelection["kind"], string> = {
    node: "node",
    decorator: "decorator",
    service: "service",
    task: "task",
    world: "Blackboard key",
    use_case: "use case",
    cost_model: "cost model",
    contract: "contract"
  };
  return labels[kind];
}

const DetailsPanel: Component<{
  model: UeNativeModel | null;
  selection: NativeSelection | null;
  trail: NativeSelection[];
  currentAssetId: string;
  onSelect: (selection: NativeSelection) => void;
  onOpenAsset: (assetId: string) => void;
  onBack: () => void;
  onTrailSelect: (index: number) => void;
}> = (props) => {
  const entity = createMemo(() => (props.model ? getSelectedEntity(props.model, props.selection) : undefined));
  const linkContext = createMemo<DetailLinkContextValue | undefined>(() =>
    props.model && props.selection
      ? {
          model: props.model,
          currentAssetId: props.currentAssetId,
          onSelect: props.onSelect,
          onOpenAsset: props.onOpenAsset
        }
      : undefined
  );

  return (
    <div class="details-body">
      <Show when={linkContext()} fallback={<EmptyDetails />}>
        {(ctx) => (
          <DetailLinkContext.Provider value={ctx()}>
            <Show when={props.trail.length > 1}>
              <div class="detail-nav">
                <button class="detail-back" type="button" onClick={props.onBack}>
                  Назад
                </button>
                <div class="detail-crumbs">
                  <For each={props.trail}>
                    {(item, index) => (
                      <>
                        <Show when={index() > 0}>
                          <span class="detail-crumb-separator">/</span>
                        </Show>
                        <button
                          class={index() === props.trail.length - 1 ? "detail-crumb active" : "detail-crumb"}
                          type="button"
                          disabled={index() === props.trail.length - 1}
                          onClick={() => props.onTrailSelect(index())}
                          title={item.ref}
                        >
                          <span>{selectionKindLabel(item.kind)}</span>
                          {titleForSelection(props.model!, item)}
                        </button>
                      </>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <div class="detail-header">
              <span class={`kind-dot kind-${props.selection!.kind}`} />
              <div>
                <div class="detail-kind">{selectionKindLabel(props.selection!.kind)}</div>
                <h2>{titleForSelection(props.model!, props.selection)}</h2>
                <code>{props.selection!.ref}</code>
              </div>
            </div>

            <Show when={props.selection!.kind === "node"}>
              <NodeDetails
                model={props.model!}
                assetId={props.selection!.assetId ?? props.currentAssetId}
                nodeId={props.selection!.ref}
                onSelect={props.onSelect}
                onOpenAsset={props.onOpenAsset}
              />
            </Show>
            <Show when={props.selection!.kind === "decorator"}>
              <DecoratorDetails model={props.model!} refId={props.selection!.ref} decorator={entity() as UeDecorator | undefined} />
            </Show>
            <Show when={props.selection!.kind === "service"}>
              <ServiceDetails model={props.model!} refId={props.selection!.ref} service={entity() as UeService | undefined} />
            </Show>
            <Show when={props.selection!.kind === "task"}>
              <TaskDetails model={props.model!} refId={props.selection!.ref} task={entity() as UeTaskSpec | undefined} />
            </Show>
            <Show when={props.selection!.kind === "world"}>
              <WorldKeyDetails refId={props.selection!.ref} worldKey={entity() as UeWorldKey | undefined} />
            </Show>
            <Show when={props.selection!.kind === "use_case"}>
              <UseCaseDetails useCase={entity() as UeUseCase | undefined} />
            </Show>
          </DetailLinkContext.Provider>
        )}
      </Show>
    </div>
  );
};

const NodeDetails: Component<{
  model: UeNativeModel;
  assetId: string;
  nodeId: string;
  onSelect: (selection: NativeSelection) => void;
  onOpenAsset: (assetId: string) => void;
}> = (props) => {
  const node = createMemo(() => props.model.htn_assets[props.assetId]?.nodes[props.nodeId]);
  const task = createMemo(() => (node()?.task_ref ? props.model.task_library?.[node()!.task_ref!] : undefined));

  return (
    <Show when={node()} fallback={<p class="muted">Нода не найдена.</p>}>
      <Show when={node()!.description || task()?.description}>
        <p class="detail-copy">{node()!.description ?? task()?.description}</p>
      </Show>
      <DetailSection title="UE нода">
        <div class="kv-list">
          <KeyValue name="Тип" value={nodeTypeLabel(node()!.type, node()!.ue_class)} />
          <KeyValue name="UE class" value={node()!.ue_class} />
          <KeyValue name="task_ref" value={node()!.task_ref} />
          <KeyValue name="asset_ref" value={node()!.asset_ref} />
        </div>
        <Show when={node()!.asset_ref}>
          <button class="btn btn-xs btn-primary mt-2" type="button" onClick={() => props.onOpenAsset(node()!.asset_ref!)}>
            Открыть вложенный HTN asset
          </button>
        </Show>
      </DetailSection>
      <Show when={node()!.decorators?.length}>
        <DetailSection title="Decorators" count={node()!.decorators!.length}>
          <RefButtons refs={node()!.decorators!} kind="decorator" onSelect={props.onSelect} />
        </DetailSection>
      </Show>
      <Show when={node()!.services?.length}>
        <DetailSection title="Services" count={node()!.services!.length}>
          <RefButtons refs={node()!.services!} kind="service" onSelect={props.onSelect} />
        </DetailSection>
      </Show>
      <Show when={node()!.task_ref && task()}>
        <DetailSection title="Task spec">
          <TaskDetails model={props.model} refId={node()!.task_ref} task={task()} compact />
        </DetailSection>
      </Show>
      <Show when={node()!.reads || node()!.branch_contract || node()!.top_branch_rejected_when || node()!.replan_triggers || node()!.implementation_notes}>
        <DetailSection title="Планировочный контракт">
          <div class="kv-list">
            <KeyValue name="Заметки реализации" value={node()!.implementation_notes as string | undefined} />
          </div>
          <Show when={node()!.reads}>
            <div class="mt-2">
              <div class="detail-subtitle">Blackboard keys</div>
              <ValueView value={node()!.reads} />
            </div>
          </Show>
          <Show when={node()!.branch_contract}>
            <div class="mt-2">
              <div class="detail-subtitle">Контракт веток</div>
              <ValueView value={node()!.branch_contract} />
            </div>
          </Show>
          <Show when={node()!.top_branch_rejected_when}>
            <div class="mt-2">
              <div class="detail-subtitle">Верхняя ветка отклоняется когда</div>
              <ValueView value={node()!.top_branch_rejected_when} />
            </div>
          </Show>
          <Show when={node()!.replan_triggers}>
            <div class="mt-2">
              <div class="detail-subtitle">Триггеры replan</div>
              <ValueView value={node()!.replan_triggers} />
            </div>
          </Show>
        </DetailSection>
      </Show>
      <Show when={node()!.cost ?? task()?.cost}>
        <DetailSection title="Стоимость">
          <ValueView value={node()!.cost ?? task()?.cost} />
        </DetailSection>
      </Show>
      <GenericDetails
        entity={node()}
        skip={[
          "type",
          "ue_class",
          "title",
          "description",
          "task_ref",
          "asset_ref",
          "decorators",
          "services",
          "layout",
          "cost",
          "reads",
          "branch_contract",
          "top_branch_rejected_when",
          "replan_triggers",
          "implementation_notes"
        ]}
      />
    </Show>
  );
};

const DecoratorDetails: Component<{ model: UeNativeModel; refId: string; decorator: UeDecorator | undefined }> = (props) => (
  <>
    <p class="detail-callout">{compactDecoratorLabel(props.model, props.refId)}</p>
    <Show when={props.decorator?.description}>
      <p class="detail-copy">{props.decorator?.description}</p>
    </Show>
    <Show when={hasDetailValue(props.decorator?.condition)}>
      <DetailSection title="Условие прохода">
        <ValueView value={props.decorator?.condition} />
      </DetailSection>
    </Show>
    <Show when={props.decorator?.reads?.length}>
      <DetailSection title="Читает" count={props.decorator?.reads?.length ?? 0}>
        <ValueView value={props.decorator?.reads} />
      </DetailSection>
    </Show>
    <Show when={hasDetailValue(props.decorator?.check_time)}>
      <DetailSection title="Когда проверяется">
        <ValueView value={props.decorator?.check_time} />
      </DetailSection>
    </Show>
    <DetailSection title="Реализация">
      <div class="kv-list">
        <KeyValue name="kind" value={props.decorator?.kind} />
        <KeyValue name="UE class" value={props.decorator?.ue_class} />
        <KeyValue name="Зачем кастомный" value={props.decorator?.default_alternative} />
      </div>
    </DetailSection>
  </>
);

const ServiceDetails: Component<{ model: UeNativeModel; refId: string; service: UeService | undefined }> = (props) => (
  <>
    <p class="detail-callout">{compactServiceLabel(props.model, props.refId)}</p>
    <Show when={props.service?.description}>
      <p class="detail-copy">{props.service?.description}</p>
    </Show>
    <DetailSection title="Реализация">
      <div class="kv-list">
        <KeyValue name="kind" value={props.service?.kind} />
        <KeyValue name="UE class" value={props.service?.ue_class} />
        <KeyValue name="scope" value={props.service?.scope} />
        <KeyValue name="tick_interval" value={props.service?.tick_interval_sec ? `${props.service.tick_interval_sec[0]} - ${props.service.tick_interval_sec[1]} sec` : ""} />
      </div>
    </DetailSection>
    <Show when={props.service?.reads?.length}>
      <DetailSection title="Читает" count={props.service?.reads?.length ?? 0}>
        <ValueView value={props.service?.reads} />
      </DetailSection>
    </Show>
    <Show when={props.service?.writes?.length}>
      <DetailSection title="Пишет" count={props.service?.writes?.length ?? 0}>
        <ValueView value={props.service?.writes} />
      </DetailSection>
    </Show>
    <Show when={props.service?.replan}>
      <DetailSection title="Replan поведение">
        <ValueView value={props.service?.replan} />
      </DetailSection>
    </Show>
  </>
);

const TaskDetails: Component<{ task: UeTaskSpec | undefined; compact?: boolean; model?: UeNativeModel; refId?: string }> = (props) => (
  <>
    <Show when={props.refId}>
      <p class="detail-callout">{compactTaskTitle(props.model, props.refId!)}</p>
    </Show>
    <Show when={!props.compact && props.task?.description}>
      <p class="detail-copy">{props.task?.description}</p>
    </Show>
    <div class="kv-list">
      <KeyValue name="kind" value={props.task?.kind} />
      <KeyValue name="UE class" value={props.task?.ue_class} />
    </div>
    <Show when={props.task?.cost}>
      <DetailSection title="Стоимость">
        <ValueView value={props.task?.cost} />
      </DetailSection>
    </Show>
    <Show when={props.task?.reads?.length}>
      <DetailSection title="Читает" count={props.task?.reads?.length ?? 0}>
        <ValueView value={props.task?.reads} />
      </DetailSection>
    </Show>
    <Show when={props.task?.effects?.length}>
      <DetailSection title="Эффекты" count={props.task?.effects?.length ?? 0}>
        <ValueView value={props.task?.effects} />
      </DetailSection>
    </Show>
    <Show when={props.task?.create_plan_steps || props.task?.execution}>
      <DetailSection title="Планирование / выполнение">
        <div class="kv-list">
          <KeyValue name="CreatePlanSteps" value={props.task?.create_plan_steps} />
          <KeyValue name="Выполнение" value={props.task?.execution} />
        </div>
      </DetailSection>
    </Show>
    <Show when={props.task?.settings}>
      <DetailSection title="Настройки">
        <ValueView value={props.task?.settings} />
      </DetailSection>
    </Show>
  </>
);

const WorldKeyDetails: Component<{ refId: string; worldKey: UeWorldKey | undefined }> = (props) => (
  <>
    <Show when={props.worldKey?.description}>
      <p class="detail-copy">{props.worldKey?.description}</p>
    </Show>
    <DetailSection title="Blackboard key">
      <div class="kv-list">
        <KeyValue name="type" value={props.worldKey?.type} />
        <KeyValue name="source" value={props.worldKey?.source} />
        <KeyValue name="range" value={props.worldKey?.range} />
      </div>
    </DetailSection>
    <Show when={props.worldKey?.values?.length}>
      <DetailSection title="Values" count={props.worldKey?.values?.length ?? 0}>
        <ValueView value={props.worldKey?.values} />
      </DetailSection>
    </Show>
    <Show when={props.worldKey?.aliases?.length}>
      <DetailSection title="Aliases" count={props.worldKey?.aliases?.length ?? 0}>
        <ValueView value={props.worldKey?.aliases} />
      </DetailSection>
    </Show>
    <GenericDetails entity={props.worldKey} skip={["type", "source", "description", "range", "values", "aliases"]} />
  </>
);

const UseCaseDetails: Component<{ useCase: UeUseCase | undefined }> = (props) => (
  <>
    <Show when={props.useCase?.title}>
      <p class="detail-copy">{props.useCase?.title}</p>
    </Show>
    <DetailSection title="Начальный Blackboard">
      <ValueView value={props.useCase?.initial_worldstate} />
    </DetailSection>
    <DetailSection title="Ожидаемая форма плана">
      <ValueView value={props.useCase?.expected_plan_shape} />
    </DetailSection>
    <DetailSection title="Не должен планировать">
      <ValueView value={props.useCase?.should_not_plan} />
    </DetailSection>
    <DetailSection title="Заметки по стоимости">
      <ValueView value={props.useCase?.cost_notes} />
    </DetailSection>
  </>
);

const GenericDetails: Component<{ entity: unknown; skip?: string[] }> = (props) => (
  <For each={objectEntries(props.entity).filter(([key]) => !(props.skip ?? ["title", "description"]).includes(key))}>
    {([key, value]) => (
      <DetailSection title={humanize(key)} count={countOf(value)}>
        <ValueView value={value} />
      </DetailSection>
    )}
  </For>
);

const RegistryPanel: Component<{
  icon: JSX.Element;
  title: string;
  entries: [string, unknown][];
  kind: NativeSelection["kind"];
  onSelect: (ref: string) => void;
}> = (props) => (
  <div class="list-panel">
    <div class="list-panel-head">
      {props.icon}
      <div>
        <h2>{props.title}</h2>
        <p>{props.entries.length} видно</p>
      </div>
    </div>
    <div class="side-list">
      <For each={props.entries}>
        {([id, value]) => (
          <button class={`side-row side-${props.kind}`} type="button" onClick={() => props.onSelect(id)}>
            <strong>{displayTitle(id, value, props.kind)}</strong>
            <code>{id}</code>
            <span>{displaySummary(value)}</span>
          </button>
        )}
      </For>
    </div>
  </div>
);

const RefButtons: Component<{ refs: string[]; kind: NativeSelection["kind"]; onSelect: (selection: NativeSelection) => void }> = (props) => (
  <div class="ref-chip-list">
    <For each={props.refs}>
      {(ref) => (
        <button class={`ref-chip ref-${props.kind}`} type="button" onClick={() => props.onSelect({ kind: props.kind, ref })}>
          {ref}
        </button>
      )}
    </For>
  </div>
);

const DetailSection: Component<{ title: string; count?: number; children: JSX.Element }> = (props) => (
  <section class="detail-section">
    <div class="section-head">
      <h3>{props.title}</h3>
      <Show when={props.count !== undefined}>
        <span>{props.count}</span>
      </Show>
    </div>
    {props.children}
  </section>
);

function resolveModelRef(ctx: DetailLinkContextValue, token: string): DetailRefTarget | undefined {
  if (ctx.model.htn_assets[token]) return { type: "asset", ref: token };
  if (ctx.model.decorators?.[token]) return { type: "selection", selection: { kind: "decorator", ref: token } };
  if (ctx.model.services?.[token]) return { type: "selection", selection: { kind: "service", ref: token } };
  if (ctx.model.task_library?.[token]) return { type: "selection", selection: { kind: "task", ref: token } };
  if (ctx.model.use_cases?.[token]) return { type: "selection", selection: { kind: "use_case", ref: token } };
  if (ctx.model.worldstate_keys?.[token]) return { type: "selection", selection: { kind: "world", ref: token } };

  for (const [ref, key] of Object.entries(ctx.model.worldstate_keys ?? {})) {
    const aliases = Array.isArray(key.aliases) ? key.aliases : [];
    if (aliases.includes(token)) return { type: "selection", selection: { kind: "world", ref } };
  }

  if (ctx.model.htn_assets[ctx.currentAssetId]?.nodes[token]) {
    return { type: "selection", selection: { kind: "node", assetId: ctx.currentAssetId, ref: token } };
  }

  return undefined;
}

const ModelRefLink: Component<{ text: string; target: DetailRefTarget }> = (props) => {
  const ctx = useContext(DetailLinkContext);
  if (!ctx) return <>{props.text}</>;

  const className = () => (props.target.type === "asset" ? "inline-ref inline-asset" : `inline-ref inline-${props.target.selection.kind}`);
  const title = () => (props.target.type === "asset" ? "Открыть HTN asset" : "Показать в деталях");

  return (
    <button
      class={className()}
      type="button"
      title={title()}
      onClick={(event) => {
        event.stopPropagation();
        if (props.target.type === "asset") {
          ctx.onOpenAsset(props.target.ref);
        } else {
          ctx.onSelect(props.target.selection);
        }
      }}
    >
      {props.text}
    </button>
  );
};

const LinkedText: Component<{ text: string; preferExact?: boolean }> = (props) => {
  const ctx = useContext(DetailLinkContext);
  if (!ctx) return <>{props.text}</>;

  const exactTarget = resolveModelRef(ctx, props.text);
  if (props.preferExact && exactTarget) return <ModelRefLink text={props.text} target={exactTarget} />;

  const parts: Array<string | { text: string; target: DetailRefTarget }> = [];
  let lastIndex = 0;
  for (const match of props.text.matchAll(REF_TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;
    const target = resolveModelRef(ctx, token);
    if (!target) continue;
    if (index > lastIndex) parts.push(props.text.slice(lastIndex, index));
    parts.push({ text: token, target });
    lastIndex = index + token.length;
  }
  if (!parts.length) return <>{props.text}</>;
  if (lastIndex < props.text.length) parts.push(props.text.slice(lastIndex));

  return (
    <>
      <For each={parts}>
        {(part) => (typeof part === "string" ? <>{part}</> : <ModelRefLink text={part.text} target={part.target} />)}
      </For>
    </>
  );
};

const KeyLabel: Component<{ text: string }> = (props) => (
  <span>
    <LinkedText text={props.text} preferExact />
  </span>
);

const ValueView: Component<{ value: unknown }> = (props) => (
  <Show when={props.value !== undefined && props.value !== null && countOf(props.value) !== 0} fallback={<p class="muted">Пусто.</p>}>
    <Show
      when={Array.isArray(props.value)}
      fallback={
        <Show when={typeof props.value === "object"} fallback={<p class="value-line">{formatValue(props.value)}</p>}>
          <div class="kv-list">
            <For each={objectEntries(props.value)}>
              {([key, value]) => (
                <div class="kv-row">
                  <KeyLabel text={key} />
                  <ValueLeaf value={value} />
                </div>
              )}
            </For>
          </div>
        </Show>
      }
    >
      <ul class="value-list">
        <For each={props.value as unknown[]}>
          {(item) => (
            <li>
              <ValueLeaf value={item} />
            </li>
          )}
        </For>
      </ul>
    </Show>
  </Show>
);

const ValueLeaf: Component<{ value: unknown }> = (props) => {
  if (Array.isArray(props.value)) {
    return (
      <ul class="nested-list">
        <For each={props.value}>{(item) => <li><ValueLeaf value={item} /></li>}</For>
      </ul>
    );
  }
  if (props.value && typeof props.value === "object") {
    return (
      <div class="kv-list nested-kv">
        <For each={objectEntries(props.value)}>
          {([key, value]) => (
            <div class="kv-row">
              <KeyLabel text={key} />
              <ValueLeaf value={value} />
            </div>
          )}
        </For>
      </div>
    );
  }
  if (typeof props.value === "string") {
    return (
      <span>
        <LinkedText text={props.value} />
      </span>
    );
  }
  return <span>{formatValue(props.value)}</span>;
};

const KeyValue: Component<{ name: string; value: unknown }> = (props) => (
  <Show when={props.value !== undefined && props.value !== ""}>
    <div class="kv-row">
      <KeyLabel text={props.name} />
      <ValueLeaf value={props.value} />
    </div>
  </Show>
);

const ToggleRow: Component<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = (props) => (
  <label class="toggle-row">
    <input type="checkbox" class="toggle toggle-sm" checked={props.checked} onChange={(event) => props.onChange(event.currentTarget.checked)} />
    {props.label}
  </label>
);

const LegendItem: Component<{ className: string; label: string }> = (props) => (
  <div class="legend-row">
    <span class={`kind-dot ${props.className}`} />
    <span>{props.label}</span>
  </div>
);

const EmptyDetails: Component = () => (
  <div class="empty-details">
    <Layers3 size={28} />
    <h2>Выберите элемент UE HTN</h2>
    <p>Ноды содержат decorators, services, task specs, costs, Blackboard effects и ссылки на вложенные HTN assets.</p>
  </div>
);

function displayTitle(id: string, value: unknown, kind?: NativeSelection["kind"]): string {
  if (kind === "decorator") return compactDecoratorLabel(null, id);
  if (kind === "service") return compactServiceLabel(null, id);
  if (kind === "task") return compactTaskTitle(null, id);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.title === "string") return record.title;
    if (typeof record.ue_class === "string") return record.ue_class;
  }
  return humanize(id);
}

function displaySummary(value: unknown): string {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = record.description ?? record.condition ?? record.cost_notes ?? record.type;
    if (typeof text === "string") return text;
  }
  return "";
}

export default App;
