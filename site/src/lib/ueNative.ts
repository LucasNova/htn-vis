export type JsonRecord = Record<string, unknown>;

export type UeNativeModel = {
  schema_version: string;
  language?: string;
  purpose?: string;
  root_asset: string;
  design_intent?: string[];
  ue_htn_contract?: JsonRecord;
  cost_model?: JsonRecord;
  worldstate_keys?: Record<string, UeWorldKey>;
  decorators?: Record<string, UeDecorator>;
  services?: Record<string, UeService>;
  task_library?: Record<string, UeTaskSpec>;
  htn_assets: Record<string, UeHtnAsset>;
  use_cases?: Record<string, UeUseCase>;
};

export type UeHtnAsset = {
  title: string;
  description?: string;
  root_node: string;
  nodes: Record<string, UeGraphNode>;
  edges: UeGraphEdge[];
};

export type UeGraphNode = JsonRecord & {
  type: UeNodeType;
  ue_class?: string;
  title: string;
  description?: string;
  task_ref?: string;
  asset_ref?: string;
  decorators?: string[];
  services?: string[];
  cost?: UeCost;
  layout?: {
    col: number;
    lane: number;
  };
};

export type UeNodeType = "root" | "structural" | "subnetwork" | "subplan" | "task";

export type UeGraphEdge = {
  from: string;
  to: string;
  label?: string;
  branch?: string;
  order?: number;
};

export type UeDecorator = JsonRecord & {
  kind?: string;
  ue_class?: string;
  description?: string;
  reads?: string[];
  condition?: string;
  check_time?: JsonRecord;
  default_alternative?: string;
};

export type UeService = JsonRecord & {
  kind?: string;
  ue_class?: string;
  description?: string;
  reads?: string[];
  writes?: string[];
  tick_interval_sec?: [number, number];
  scope?: string;
  replan?: unknown;
};

export type UeTaskSpec = JsonRecord & {
  kind?: string;
  ue_class?: string;
  description?: string;
  cost?: UeCost;
  reads?: string[];
  effects?: string[];
  create_plan_steps?: string;
  execution?: string;
  settings?: JsonRecord;
};

export type UeWorldKey = JsonRecord & {
  type?: string;
  description?: string;
  source?: string;
  range?: [number, number];
  values?: string[];
  aliases?: string[];
};

export type UeCost = {
  base?: number;
  formula?: string;
  note?: string;
  [key: string]: unknown;
};

export type UeUseCase = JsonRecord & {
  title: string;
  initial_worldstate?: JsonRecord;
  expected_plan_shape?: string[];
  should_not_plan?: string[];
  cost_notes?: string;
};

export type NativeStats = {
  assets: number;
  nodes: number;
  decorators: number;
  services: number;
  tasks: number;
  worldKeys: number;
  useCases: number;
};

export type NativeSelectionKind = "node" | "decorator" | "service" | "task" | "world" | "use_case" | "cost_model" | "contract";

export type NativeSelection = {
  kind: NativeSelectionKind;
  ref: string;
  assetId?: string;
};

export type NativeLayoutNode = {
  key: string;
  id: string;
  type: UeNodeType;
  title: string;
  subtitle: string;
  body?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  decorators: string[];
  services: string[];
  taskRef?: string;
  assetRef?: string;
  cost?: UeCost;
  outgoingSlots: NativeEdgeSlot[];
  matches: boolean;
};

export type NativeEdgeSlot = {
  key: string;
  label: string;
  to: string;
  index: number;
  count: number;
};

export type NativeLayoutEdge = {
  key: string;
  from: string;
  to: string;
  label?: string;
  slotIndex?: number;
  slotCount?: number;
  slotSignal?: "true" | "false";
};

export type NativeGraphLayout = {
  nodes: NativeLayoutNode[];
  edges: NativeLayoutEdge[];
  width: number;
  height: number;
};

export type NativeStructuralRole = "if" | "prefer" | "parallel" | "cost-choice" | "structural";

const GRID = 24;
const COL_WIDTH = 372;
const LANE_GAP = 72;
const CELL_STACK_GAP = 24;
const LEFT = 48;
const TOP = 48;
const NODE_WIDTH = 300;
const NODE_MIN_HEIGHT = 184;
const NODE_MAX_HEIGHT = 720;

const NODE_TITLE_RU: Record<string, string> = {
  "Agent / squad behavior root": "Цель агента / сквада",
  "Prefer tactical interruption": "Тактическое прерывание",
  "React to threat / stimulus": "Реагировать на угрозу",
  "Prefer assigned objective": "Назначенная задача",
  "Patrol assigned route": "Патрулировать маршрут",
  "Prefer guard objective": "Задача охраны",
  "Guard assigned area": "Охранять область",
  "Prefer move-to-interest objective": "Задача перехода",
  "Move to interest point": "Идти к точке интереса",
  "Hold objective position": "Держать позицию",
  "Patrol root": "Патруль: вход",
  "Select next patrol point": "Выбрать следующую точку",
  "Set patrol pace": "Двигаться по маршруту",
  "Move to patrol point": "Идти к точке патруля",
  "Observe while patrolling": "Осмотреться на точке",
  "Guard root": "Охрана: вход",
  "Prefer useful guard post": "Нужен другой пост?",
  "Set guard movement pace": "Подойти к посту",
  "Move to guard post": "Занять пост охраны",
  "Observe guard sector": "Наблюдать сектор",
  "Move-to-interest root": "Точка интереса: вход",
  "Set travel pace": "Переход к точке",
  "Move to point of interest": "Идти к точке интереса",
  "Hold at interest point": "Держать точку интереса",
  "Root scope": "Боевой выбор",
  "Combat choice root": "Боевой выбор",
  "Prefer immediate survival": "Приоритет выживания",
  "Survive immediate threat": "Выжить",
  "Prefer confirmed contact handling": "Подтвержденный контакт",
  "Handle confirmed contact": "Бой с видимой целью",
  "Prefer combat ammo recovery": "Оценить ammo-реакцию",
  "Recover weapon while contact remains confirmed": "Вернуть оружие в бой",
  "Prefer lost contact / stimulus handling": "Стимул или LKP",
  "Handle lost contact or sound": "Поиск / проверка",
  "Prefer ammo management": "Боезапас",
  "Manage ammo": "Боеприпасы",
  "Continue objective alerted": "Вернуться к задаче настороже",
  "Survival root": "Выживание: вход",
  "Prefer safe cover route": "Искать безопасное укрытие",
  "Find safe cover candidates": "Найти варианты укрытий",
  "Reserve selected cover": "Зарезервировать укрытие",
  "Move to selected cover": "Дойти до укрытия",
  "Stop fire before fast move": "Прекратить огонь перед быстрым движением",
  "Fast move to cover": "Быстро уйти в укрытие",
  "Enter cover stance": "Занять стойку в укрытии",
  "Wait in cover and reassess": "Переждать и переоценить",
  "Fallback: break LOS locally": "Разорвать LOS рядом",
  "Short LOS-break move": "Коротко сместиться",
  "Break LOS lateral": "Сместиться поперек линии огня",
  "Reduce exposure in place": "Снизить экспозицию на месте",
  "Fallback: suppress then move": "Подавить и сместиться",
  "Find suppressible cover route": "Найти путь под подавлением",
  "Set fire movement pace": "Темп движения для огня",
  "Parallel: move while suppressing": "Параллельно: движение + подавление",
  "Move under suppression to cover": "Двигаться в укрытие под подавлением",
  "Aim before suppressing": "Навести оружие перед подавлением",
  "Start suppressive fire": "Начать подавляющий огонь",
  "Stop suppressive fire": "Прекратить подавляющий огонь",
  "Confirmed contact root": "Подтвержденный контакт: вход",
  "Prefer close-range immediate response": "Ближняя реакция",
  "Find nearest fighting cover": "Найти ближайшее боевое укрытие",
  "Set close-fight pace": "Темп ближнего боя",
  "Parallel: fight while falling back": "Параллельно: стрелять и отходить",
  "Choose lowest-risk confirmed-contact plan": "Оценить боевые планы",
  "Prefer optional fire while falling back": "Опциональный огонь на отходе",
  "Move to nearest cover": "Отойти к ближайшему укрытию",
  "Aim while falling back": "Навести оружие при отходе",
  "Start fire while falling back": "Начать огонь при отходе",
  "Stop fire after fallback": "Прекратить огонь после отхода",
  "Skip fire while falling back": "Без огня на отходе",
  "Enter close cover stance": "Занять ближнее укрытие",
  "Prefer unseen approach": "Скрытое сближение",
  "Stalk to covered attack position": "Скрытно занять позицию",
  "Prefer direct covered engagement": "Прямой бой из укрытия",
  "Peek and sample LOS": "Выглянуть и проверить LOS",
  "Aim weapon at threat": "Навести оружие на угрозу",
  "Start controlled fire": "Начать контролируемый огонь",
  "Stop controlled fire": "Прекратить контролируемый огонь",
  "Recover and reassess": "Спрятаться и переоценить",
  "Fallback: gain safer angle": "Занять лучший угол",
  "Find survivable firing position": "Найти позицию для стрельбы",
  "Move toward firing position": "Сместиться к позиции",
  "Move to firing position": "Перейти на огневую позицию",
  "SubPlan: opportunistic shooting while moving": "SubPlan: окно огня",
  "SubPlan: opportunistic fire from new angle": "SubPlan: окно огня",
  "Fire opportunity root": "Окно огня: вход",
  "Prefer valid fire window": "Окно огня optional",
  "No fire window": "Нет окна огня",
  "Fallback to survival": "Снова выживание",
  "Stalk root": "Скрытое сближение: вход",
  "Prefer covered unseen approach": "Скрыто занять позицию",
  "Find covered attack position": "Найти позицию для атаки",
  "Move for unseen approach": "Скрытно сблизиться",
  "Move unseen to attack position": "Скрытно подойти к позиции",
  "Set aiming movement pace": "Темп перед прицеливанием",
  "Aim from ambush angle": "Навести оружие из засады",
  "Hold covered ambush angle": "Держать угол для засады",
  "Hold current angle quietly": "Тихо держать текущий угол",
  "Lost contact root": "Потерянный контакт: вход",
  "Prefer recent stimulus": "Свежий стимул",
  "Prefer concrete stimulus source": "Источник выстрела",
  "Use weapon report origin": "Источник звука выстрела",
  "Prefer impact or near miss": "Импакт / near miss",
  "Use impact / near miss": "Импакт или пуля рядом",
  "Prefer ally hit reaction": "Реакция на союзника",
  "React to ally being hit": "Реакция на ранение союзника",
  "Fallback suspicious stimulus": "Другой стимул",
  "Use other suspicious stimulus": "Общий стимул поиска",
  "Convert stimulus to search anchor": "Сделать из стимула точку поиска",
  "Hold angle and scan": "Держать угол и сканировать",
  "Prefer cautious pursuit": "Осторожное преследование",
  "Set cautious search pace": "Темп осторожного поиска",
  "Cautious cover-to-cover search step": "Короткий шаг поиска от укрытия к укрытию",
  "Return to objective alerted": "Вернуться к задаче настороже",
  "Ammo root": "Боеприпасы: вход",
  "Prefer sidearm when reload unsafe": "Вторичное оружие вместо опасной перезарядки",
  "Switch to sidearm": "Переключиться на вторичное оружие",
  "Prefer cover before reload": "Укрытие перед перезарядкой",
  "Find reload cover": "Найти укрытие для перезарядки",
  "Reserve reload cover": "Зарезервировать укрытие для перезарядки",
  "Fast move to reload cover": "Быстро уйти к укрытию для перезарядки",
  "Move to reload cover": "Идти к укрытию для перезарядки",
  "Enter reload cover stance": "Занять укрытие для перезарядки",
  "Reload after reaching cover": "Перезарядиться в укрытии",
  "Prefer safe reload": "Окно перезарядки",
  "Prefer early reload policy": "Перезарядка заранее",
  "Reload weapon": "Перезарядить оружие",
  "Tactical reload early": "Тактическая перезарядка заранее",
  "Reduce exposure without reload": "Снизить риск без перезарядки"
};

const NODE_BODY_RU: Record<string, string> = {
  "Agent / squad behavior root": "Обычные задачи агента/сквада и тактические прерывания.",
  "Prefer tactical interruption": "Проверка опасности, контакта, свежего стимула или события с союзником.",
  "React to threat / stimulus": "Выживание, бой с видимой целью или осторожный поиск.",
  "Prefer assigned objective": "Выбор текущей цели: патруль, охрана, переход или удержание позиции.",
  "Patrol assigned route": "Спокойный обход маршрута без боевого рывка.",
  "Guard assigned area": "Занять полезный пост и наблюдать сектор.",
  "Move to interest point": "Переход к точке интереса без намерения стрелять прямо сейчас.",
  "Hold objective position": "Держать текущую полезную позицию и оставаться настороже.",
  "Root scope": "Сервисы обновляют боевые факты; дальше выбирается безопасный план.",
  "Combat choice root": "Боевой HTN вызывается как тактическое прерывание поверх обычных задач.",
  "Prefer immediate survival": "Жесткий приоритет: если обычный бой слишком смертелен, сначала строится план выживания.",
  "Survive immediate threat": "Провал внутрь отдельного HTN asset для укрытия, разрыва LOS или подавления.",
  "Prefer confirmed contact handling": "Приоритетная попытка построить план для подтвержденной угрозы перед поиском по стимулам.",
  "Handle confirmed contact": "План боя вокруг укрытия, коротких экспозиций, очередей и смены угла.",
  "Choose lowest-risk confirmed-contact plan": "Кандидаты строятся заранее: decorators отсекают невозможное, суммарная стоимость выбирает лучший допустимый план.",
  "Prefer combat ammo recovery": "Приоритет боезапаса: восстановить оружие до обычного продолжения боя.",
  "Recover weapon while contact remains confirmed": "Переход в ManageAmmo без ухода в поиск потерянного контакта: сменить оружие, перезарядиться в окне или найти позицию безопаснее.",
  "Prefer close-range immediate response": "Ближняя или осведомленная угроза требует огня и отхода к укрытию одновременно.",
  "Parallel: fight while falling back": "Основная ветка уходит к укрытию, вторичная коротко стреляет, если это возможно.",
  "Prefer optional fire while falling back": "Если короткий огонь не строится, Success не блокирует отход к укрытию.",
  "Prefer unseen approach": "Если угроза далеко и не знает о боте/скваде, можно занять лучшую позицию до первого выстрела.",
  "Stalk to covered attack position": "Провал в отдельный HTN asset для скрытого сближения к выгодной атакующей позиции.",
  "Prefer lost contact / stimulus handling": "Приоритет обработки памяти, звука, импакта или near miss без точного визуального контакта.",
  "Handle lost contact or sound": "Осторожный поиск без притворства, что бот точно знает позицию угрозы.",
  "Prefer ammo management": "Выбор между перезарядкой заранее, ожиданием безопасного окна и сменой оружия.",
  "Manage ammo": "Отдельный HTN asset для перезарядки и вторичного оружия.",
  "Prefer safe cover route": "Выбирается только если рядом есть полезное укрытие и путь к нему не слишком смертелен.",
  "Fallback: break LOS locally": "Короткая локальная реакция, если полноценное укрытие недоступно или путь слишком опасный.",
  "Fallback: suppress then move": "Последний боевой запасной вариант: снизить риск маршрута коротким подавлением и сместиться.",
  "Find suppressible cover route": "Ищет маршрут, который слишком рискован сам по себе, но становится приемлемым под коротким подавлением.",
  "Parallel: move while suppressing": "UE HTN Parallel: primary двигается, secondary кратко подавляет угрозу.",
  "Move under suppression to cover": "Движение по маршруту, который валиден только пока подавление реально снижает риск.",
  "Prefer direct covered engagement": "Атаковать можно только из достаточно защищенной позиции и короткой экспозицией.",
  "Fallback: gain safer angle": "Если текущий угол плохой, бот ищет позицию с меньшим риском и лучшим LOS.",
  "Prefer covered unseen approach": "Сближение разрешено только если маршрут не раскрывает сквад и угроза все еще не смотрит в сектор.",
  "Hold covered ambush angle": "Бот не стреляет сразу, а держит выгодный угол до подходящего момента или потери скрытности.",
  "Prefer recent stimulus": "Свежий звук или импакт дает точку поиска, но не точное знание цели.",
  "Prefer concrete stimulus source": "Источник выстрела, импакт, near miss или реакция союзника.",
  "Use weapon report origin": "Звук оружия дает примерный источник выстрела, но не гарантирует точную позицию угрозы.",
  "Use impact / near miss": "Попадание рядом или просвистевшая пуля повышают опасность и дают направление поиска.",
  "React to ally being hit": "Даже без прямого LOS агент реагирует на ранение/смерть союзника как на боевой сигнал.",
  "Fallback suspicious stimulus": "Если конкретный тип не распознан, остается общий подозрительный стимул.",
  "Prefer cautious pursuit": "Преследование разрешено только пока LKP свежая и маршрут не слишком опасен.",
  "Prefer sidearm when reload unsafe": "Когда основное оружие пустое, а перезарядка сейчас слишком опасна.",
  "Prefer cover before reload": "Если ammo pressure высокий, агент заранее идет к укрытию, чтобы не остаться пустым в открытом месте.",
  "Prefer safe reload": "Перезарядка разрешена только в безопасном окне или при отсутствии лучших вариантов."
};

const TASK_TITLE_RU: Record<string, string> = {
  "task.SetPlannerFocus": "Поставить фокус отладки",
  "task.SetGaitWalk": "Задать темп движения",
  "task.SetGaitJog": "Задать тактический темп",
  "task.SetGaitSprint": "Задать быстрый темп",
  "task.AimWeaponAtThreat": "Навести оружие на цель",
  "task.StartControlledFire": "Начать контролируемый огонь",
  "task.StartSuppressiveFire": "Начать подавляющий огонь",
  "task.StopWeaponFire": "Прекратить огонь",
  "task.Success": "Ничего не делать",
  "task.FindSafeCover": "Найти безопасное укрытие",
  "task.ReserveCover": "Зарезервировать укрытие",
  "task.MoveToSelectedCover": "Дойти до выбранного укрытия",
  "task.EnterCoverStance": "Занять стойку в укрытии",
  "task.WaitInCoverReassess": "Переждать и переоценить",
  "task.ReduceExposureInPlace": "Снизить экспозицию без prone",
  "task.BreakLOSLateral": "Разорвать LOS коротким смещением",
  "task.FindFiringPosition": "Найти живучую огневую позицию",
  "task.MoveToFiringPosition": "Перейти на огневую позицию",
  "task.FindAmbushApproachPosition": "Найти скрытую атакующую позицию",
  "task.MoveToAmbushApproachPosition": "Скрытно подойти к позиции",
  "task.HoldAmbushAngle": "Держать угол засады",
  "task.PeekAndSampleLOS": "Коротко выглянуть и проверить LOS",
  "task.FireControlledBurst": "Дать короткую очередь",
  "task.SuppressThreatBriefly": "Коротко подавить угрозу",
  "task.UpdateThreatMemoryFromStimulus": "Обновить память по стимулу",
  "task.UpdateThreatMemoryFromWeaponReport": "Память по звуку выстрела",
  "task.UpdateThreatMemoryFromImpactOrNearMiss": "Память по импакту / near miss",
  "task.UpdateThreatMemoryFromAllyHitReaction": "Память по ранению союзника",
  "task.HoldAngleAndScan": "Держать угол и сканировать",
  "task.CautiousSearchStep": "Сделать осторожный шаг поиска",
  "task.SelectNextPatrolPoint": "Выбрать точку патруля",
  "task.PatrolMoveToPoint": "Идти к точке патруля",
  "task.MoveToGuardPost": "Занять пост охраны",
  "task.GuardAreaObserve": "Наблюдать сектор",
  "task.MoveToInterestPoint": "Идти к точке интереса",
  "task.HoldObjectivePosition": "Держать позицию",
  "task.ReloadWeapon": "Перезарядить оружие",
  "task.SwitchToSidearm": "Достать вторичное оружие",
  "task.ReturnToObjectiveAlerted": "Вернуться к задаче настороже"
};

const TASK_BODY_RU: Record<string, string> = {
  "task.SetPlannerFocus": "Техническая task для телеметрии и отладки планировщика.",
  "task.SetGaitWalk": "Задает Agent.MovementGait = Walk как факт планирования: окно огня будет медленнее быстрых перемещений.",
  "task.SetGaitJog": "Задает Agent.MovementGait = Jog для короткого тактического перемещения без текущего окна огня.",
  "task.SetGaitSprint": "Задает Agent.MovementGait = Sprint для быстрого ухода или достижения укрытия; кандидаты огня должны быть неактивны.",
  "task.AimWeaponAtThreat": "Наводит оружие на цель или позицию угрозы перед началом огня.",
  "task.StartControlledFire": "Начинает короткое контролируемое окно стрельбы; требует Walk и валидный LOS.",
  "task.StartSuppressiveFire": "Начинает короткое подавление, чтобы снизить риск маршрута.",
  "task.StopWeaponFire": "Гасит намерение стрелять перед быстрым движением, перезарядкой, сменой оружия или окончанием экспозиции.",
  "task.Success": "Мгновенный Success для опциональной ветки: план остается валидным, даже если стрелять или перезаряжаться сейчас нельзя.",
  "task.FindSafeCover": "EQS или кастомная task выбирает укрытие, точку, риск маршрута и стоимость.",
  "task.ReserveCover": "Бронирует слот укрытия, чтобы участники сквада не бежали в одну точку.",
  "task.MoveToSelectedCover": "MoveTo к Combat.SelectedCoverLocation с проверкой пути во время планирования.",
  "task.EnterCoverStance": "Подстраивает стойку и экспозицию тела относительно выбранного укрытия.",
  "task.WaitInCoverReassess": "Короткая пауза в укрытии, пока сервисы обновляют угрозу и риск.",
  "task.ReduceExposureInPlace": "Локально снижает экспозицию доступными стойками/смещением, без недоступной prone-анимации.",
  "task.BreakLOSLateral": "Короткое боковое смещение, чтобы выйти из известной линии огня.",
  "task.FindFiringPosition": "Ищет позицию с приемлемым LOS, укрытием, flank risk и path cost.",
  "task.MoveToFiringPosition": "Перемещение к позиции для стрельбы, обязательно под route-risk проверками.",
  "task.FindAmbushApproachPosition": "Ищет закрытую позицию ближе к угрозе, где бот не раскрывается слишком рано.",
  "task.MoveToAmbushApproachPosition": "MoveTo к выбранной позиции скрытого сближения с учетом риска раскрытия и экспозиции.",
  "task.HoldAmbushAngle": "Держит выгодный угол, пока атака не станет удобной или угроза не заметит бота.",
  "task.PeekAndSampleLOS": "Короткая экспозиция из укрытия для обновления LOSQuality и confidence.",
  "task.FireControlledBurst": "Короткая очередь с ограниченной экспозицией и расходом боезапаса.",
  "task.SuppressThreatBriefly": "Коротко подавляет угрозу, чтобы снизить риск движения.",
  "task.UpdateThreatMemoryFromStimulus": "Общий стимул становится SearchAnchor без точного знания позиции угрозы.",
  "task.UpdateThreatMemoryFromWeaponReport": "Источник звука выстрела становится SearchAnchor со средней уверенностью.",
  "task.UpdateThreatMemoryFromImpactOrNearMiss": "Импакт рядом или near miss повышает риск и дает направление поиска, но не точную позицию стрелка.",
  "task.UpdateThreatMemoryFromAllyHitReaction": "Ранение/смерть союзника превращается в боевой стимул даже без прямого контакта со стрелком.",
  "task.HoldAngleAndScan": "Держит живучий угол на LKP/search anchor и проверяет вероятные выходы цели.",
  "task.CautiousSearchStep": "Один короткий шаг от укрытия к укрытию, без длинного рывка по открытому месту.",
  "task.SelectNextPatrolPoint": "Выбирает следующую точку маршрута и пишет Objective.TargetLocation.",
  "task.PatrolMoveToPoint": "Двигается по objective-маршруту; тактические сервисы могут перебить план.",
  "task.MoveToGuardPost": "Переходит к полезному посту охраны внутри заданной области.",
  "task.GuardAreaObserve": "Держит сектор, меняет стойку только в рамках доступных стоек и ждет стимулы.",
  "task.MoveToInterestPoint": "Идет к точке интереса без намерения стрелять в ближайший момент.",
  "task.HoldObjectivePosition": "Держит текущую позицию задачи и остается настороже.",
  "task.ReloadWeapon": "Перезарядка только в безопасном окне или когда лучших боевых действий нет.",
  "task.SwitchToSidearm": "Быстрый запасной вариант, когда основное оружие пустое, а перезарядка слишком опасна.",
  "task.ReturnToObjectiveAlerted": "Возврат к задаче с сохраненной настороженностью и памятью угрозы."
};

const DECORATOR_LABEL_RU: Record<string, string> = {
  "decorator.TacticalInterruptionNeeded": "нужно тактическое прерывание",
  "decorator.HasPatrolObjective": "патруль назначен",
  "decorator.HasGuardObjective": "охрана назначена",
  "decorator.HasMoveToInterestObjective": "точка интереса назначена",
  "decorator.HasActionableStimulusOrLKP": "есть стимул или LKP",
  "decorator.CriticalSurvivalNeeded": "жить важнее всего",
  "decorator.ThreatConfirmed": "цель подтверждена",
  "decorator.HasRecentStimulus": "есть свежий звук/импакт",
  "decorator.HasRecentWeaponReport": "слышен источник выстрела",
  "decorator.HasRecentImpactOrNearMiss": "импакт/пуля рядом",
  "decorator.HasRecentAllyHitReaction": "союзник под огнем",
  "decorator.LKPFreshEnoughForPursuit": "LKP еще свежая",
  "decorator.HasSafeCoverCandidate": "есть полезное укрытие",
  "decorator.CoverRouteAcceptable": "путь к укрытию не смертелен",
  "decorator.SuppressibleCoverRoute": "путь терпим под подавлением",
  "decorator.ApproachRouteAcceptable": "маршрут сближения безопасен",
  "decorator.ThreatUnawareOrNotFacing": "угроза не знает/не смотрит",
  "decorator.CanStalkCloser": "можно скрытно сблизиться",
  "decorator.CloseThreatRequiresImmediateFight": "угроза близко: бой сразу",
  "decorator.CanExposeForShot": "можно коротко выглянуть",
  "decorator.SafeReloadWindow": "есть окно перезарядки",
  "decorator.ShouldReloadEarly": "пора перезарядиться заранее",
  "decorator.LowAmmoRepositionSoon": "ammo скоро потребует укрытие",
  "decorator.WeaponCanFire": "оружие может стрелять",
  "decorator.NotSprintingForFire": "gait допускает огонь",
  "decorator.SprintAllowedNoImmediateFire": "быстрое движение допустимо",
  "decorator.NeedsCombatAmmoAction": "оружие требует ammo-реакции",
  "decorator.PrimaryEmptyReloadUnsafe": "основное оружие пустое, перезарядка опасна",
  "decorator.NoGrenadeOrImmediateFlush": "укрытие можно держать"
};

const SERVICE_LABEL_RU: Record<string, string> = {
  "service.UpdateObjectiveFacts": "обновляет цель агента",
  "service.UpdateThreatFacts": "обновляет угрозу, LOS и risk",
  "service.UpdateStimulusFacts": "сводит звуки/попадания",
  "service.UpdateAmmoPressure": "считает ammo pressure",
  "service.SquadFactSync": "синхронизирует факты сквада",
  "service.ReplanOnCombatFactChange": "делает replan при смене фактов",
  "service.ValidateCoverRoute": "проверяет укрытие и маршрут",
  "service.ReplanIfThreatLocationChanges": "replan при значимом смещении"
};

export function getNativeStats(model: UeNativeModel): NativeStats {
  const assets = Object.values(model.htn_assets);
  return {
    assets: assets.length,
    nodes: assets.reduce((sum, asset) => sum + Object.keys(asset.nodes).length, 0),
    decorators: Object.keys(model.decorators ?? {}).length,
    services: Object.keys(model.services ?? {}).length,
    tasks: Object.keys(model.task_library ?? {}).length,
    worldKeys: Object.keys(model.worldstate_keys ?? {}).length,
    useCases: Object.keys(model.use_cases ?? {}).length
  };
}

export function buildNativeLayout(model: UeNativeModel, assetId: string, query = ""): NativeGraphLayout {
  const asset = model.htn_assets[assetId] ?? model.htn_assets[model.root_asset] ?? Object.values(model.htn_assets)[0];
  if (!asset) return { nodes: [], edges: [], width: 960, height: 540 };
  const needle = query.trim().toLowerCase();
  const edgeBases = asset.edges.map((edge, index) => ({
    key: `${edge.from}:${edge.to}:${index}`,
    from: edge.from,
    to: edge.to,
    raw: edge,
    label: edgeLabel(edge)
  }));
  const outgoingTotals = new Map<string, number>();
  for (const edge of edgeBases) {
    outgoingTotals.set(edge.from, (outgoingTotals.get(edge.from) ?? 0) + 1);
  }

  const outgoingSlots = new Map<string, NativeEdgeSlot[]>();
  const slotMetaByEdge = new Map<string, { index: number; count: number; signal?: "true" | "false" }>();
  for (const edge of edgeBases) {
    if (!shouldCreateSlot(edge.raw, edge.label, outgoingTotals.get(edge.from) ?? 0)) continue;
    const slots = outgoingSlots.get(edge.from) ?? [];
    const slot: NativeEdgeSlot = {
      key: edge.key,
      label: edge.label!,
      to: edge.to,
      index: slots.length,
      count: 0
    };
    slots.push(slot);
    outgoingSlots.set(edge.from, slots);
  }
  for (const [fromId, slots] of outgoingSlots) {
    const fromNode = asset.nodes[fromId];
    for (const slot of slots) {
      slot.count = slots.length;
      slotMetaByEdge.set(slot.key, { index: slot.index, count: slot.count, signal: branchSignalForSlot(slot.label, fromNode) });
    }
  }

  const preparedNodes = Object.entries(asset.nodes).map(([id, node], index) => {
    const col = node.layout?.col ?? index;
    const lane = node.layout?.lane ?? 0;
    const task = node.task_ref ? model.task_library?.[node.task_ref] : undefined;
    const searchable = JSON.stringify([id, node, task]).toLowerCase();
    const slots = outgoingSlots.get(id) ?? [];
    const height = estimateNodeHeight(model, node, visibleOutgoingSlotCount(node, slots));
    return {
      col,
      lane,
      height,
      task,
      searchable,
      id,
      node,
      stackOffset: 0
    };
  });

  const cellStacks = new Map<string, typeof preparedNodes>();
  for (const prepared of preparedNodes) {
    const cellKey = `${prepared.lane}:${prepared.col}`;
    const stack = cellStacks.get(cellKey) ?? [];
    stack.push(prepared);
    cellStacks.set(cellKey, stack);
  }

  const laneColumnHeights = new Map<number, Map<number, number>>();
  for (const stack of cellStacks.values()) {
    let offset = 0;
    for (const prepared of stack) {
      prepared.stackOffset = offset;
      offset += prepared.height + CELL_STACK_GAP;
    }

    const first = stack[0];
    if (!first) continue;
    const occupiedHeight = Math.max(0, offset - CELL_STACK_GAP);
    const columnHeights = laneColumnHeights.get(first.lane) ?? new Map<number, number>();
    columnHeights.set(first.col, Math.max(columnHeights.get(first.col) ?? 0, occupiedHeight));
    laneColumnHeights.set(first.lane, columnHeights);
  }

  const laneHeights = new Map<number, number>();
  for (const [lane, columnHeights] of laneColumnHeights) {
    laneHeights.set(lane, Math.max(...columnHeights.values()));
  }

  const laneTops = new Map<number, number>();
  let laneY = TOP;
  for (const lane of [...laneHeights.keys()].sort((a, b) => a - b)) {
    laneTops.set(lane, snap(laneY));
    laneY += (laneHeights.get(lane) ?? NODE_MIN_HEIGHT) + LANE_GAP;
  }

  const nodes = preparedNodes.map(({ id, node, col, lane, task, searchable, height, stackOffset }) => {
    return {
      key: id,
      id,
      type: node.type,
      title: node.title,
      subtitle: node.ue_class ?? humanize(node.type),
      body: node.description ?? task?.description,
      x: snap(LEFT + col * COL_WIDTH),
      y: snap((laneTops.get(lane) ?? TOP) + stackOffset),
      width: NODE_WIDTH,
      height,
      decorators: node.decorators ?? [],
      services: node.services ?? [],
      taskRef: node.task_ref,
      assetRef: node.asset_ref,
      cost: node.cost ?? task?.cost,
      outgoingSlots: outgoingSlots.get(id) ?? [],
      matches: !needle || searchable.includes(needle)
    } satisfies NativeLayoutNode;
  });

  const edges = edgeBases.map((edge) => {
    const slotMeta = slotMetaByEdge.get(edge.key);
    return {
      key: edge.key,
      from: edge.from,
      to: edge.to,
      label: slotMeta ? undefined : edge.label,
      slotIndex: slotMeta?.index,
      slotCount: slotMeta?.count,
      slotSignal: slotMeta?.signal
    } satisfies NativeLayoutEdge;
  });

  const width = snap(Math.max(960, ...nodes.map((node) => node.x + node.width + 96)));
  const height = snap(Math.max(540, ...nodes.map((node) => node.y + node.height + 96)));
  return { nodes, edges, width, height };
}

function estimateNodeHeight(model: UeNativeModel, node: UeGraphNode, outgoingSlotCount = 0): number {
  const title = NODE_TITLE_RU[node.title] ?? (node.task_ref ? TASK_TITLE_RU[node.task_ref] ?? model.task_library?.[node.task_ref]?.ue_class ?? node.title : node.title);
  const body = node.task_ref ? TASK_BODY_RU[node.task_ref] ?? model.task_library?.[node.task_ref]?.description ?? node.description ?? "" : NODE_BODY_RU[node.title] ?? node.description ?? "";
  const titleLines = Math.min(2, Math.max(1, Math.ceil(title.length / 20)));
  const bodyLines = body ? Math.min(3, Math.max(1, Math.ceil(body.length / 34))) : 0;
  const decoratorRows = estimateSignalRows(visibleDecoratorRefsForNode(node), DECORATOR_LABEL_RU);
  const serviceRows = estimateSignalRows(node.services ?? [], SERVICE_LABEL_RU);
  const cost = node.cost || (node.task_ref && model.task_library?.[node.task_ref]?.cost) ? node.cost ?? model.task_library?.[node.task_ref!]?.cost : undefined;
  const costRows = cost ? Math.max(1, Math.ceil(compactCostLabel(cost).length / 34)) : 0;
  const signalRows = decoratorRows + serviceRows + costRows;
  const technicalLine = node.ue_class ? 1 : 0;
  const slotRows = outgoingSlotCount;
  const rawHeight =
    48 +
    titleLines * 25 +
    bodyLines * 20 +
    technicalLine * 18 +
    signalRows * 34 +
    Math.max(0, signalRows - 1) * 6 +
    slotRows * 32 +
    (slotRows ? 16 : 0);
  return ceilSnap(clampNumber(rawHeight, NODE_MIN_HEIGHT, NODE_MAX_HEIGHT));
}

function visibleOutgoingSlotCount(node: UeGraphNode, slots: NativeEdgeSlot[]): number {
  if (node.type === "structural" && structuralNodeRole(node.ue_class) === "if" && slots.some((slot) => branchSignalForSlot(slot.label, node))) return 0;
  return slots.length;
}

function estimateSignalRows(refs: string[], labels: Record<string, string>): number {
  return refs.reduce((sum, ref) => sum + Math.max(1, Math.ceil((labels[ref] ?? humanize(ref)).length / 34)), 0);
}

function edgeLabel(edge: UeGraphEdge): string | undefined {
  return edge.branch || edge.label || (edge.order ? `#${edge.order}` : undefined);
}

function shouldCreateSlot(edge: UeGraphEdge, label: string | undefined, outgoingTotal: number): boolean {
  if (!label || label.startsWith("#")) return false;
  if (edge.label && !edge.branch && outgoingTotal <= 1) return false;
  return outgoingTotal > 1 || Boolean(edge.branch);
}

function branchSignalForSlot(label: string, node?: Pick<UeGraphNode, "ue_class" | "type">): "true" | "false" | undefined {
  if (!node || structuralNodeRole(node.ue_class) !== "if") return undefined;
  const tag = label.split(":", 1)[0]?.trim().toLowerCase();
  if (tag === "top") return "true";
  if (tag === "bottom") return "false";
  return undefined;
}

export function getSelectedEntity(model: UeNativeModel, selection: NativeSelection | null): unknown {
  if (!selection) return undefined;
  if (selection.kind === "node") {
    const assetId = selection.assetId ?? model.root_asset;
    return model.htn_assets[assetId]?.nodes[selection.ref];
  }
  if (selection.kind === "decorator") return model.decorators?.[selection.ref];
  if (selection.kind === "service") return model.services?.[selection.ref];
  if (selection.kind === "task") return model.task_library?.[selection.ref];
  if (selection.kind === "world") return model.worldstate_keys?.[selection.ref];
  if (selection.kind === "use_case") return model.use_cases?.[selection.ref];
  if (selection.kind === "cost_model") return model.cost_model;
  if (selection.kind === "contract") return model.ue_htn_contract;
  return undefined;
}

export function titleForSelection(model: UeNativeModel, selection: NativeSelection | null): string {
  if (!selection) return "Nothing selected";
  const entity = getSelectedEntity(model, selection) as JsonRecord | undefined;
  if (typeof entity?.title === "string") {
    return selection.kind === "node" ? NODE_TITLE_RU[entity.title] ?? entity.title : entity.title;
  }
  if (typeof entity?.description === "string" && selection.kind === "world") return selection.ref;
  return humanize(selection.ref);
}

export function structuralNodeRole(ueClass: string | undefined): NativeStructuralRole {
  const normalized = (ueClass ?? "").toLowerCase();
  if (normalized.includes("costchoice") || normalized.includes("cost_choice") || normalized.includes("cost choice")) return "cost-choice";
  if (normalized.includes("htnnode_if")) return "if";
  if (normalized.includes("htnnode_prefer")) return "prefer";
  if (normalized.includes("htnnode_parallel")) return "parallel";
  return "structural";
}

export function nodeTypeLabel(type: UeNodeType, ueClass?: string): string {
  if (type === "root") return "Root";
  if (type === "structural") {
    const role = structuralNodeRole(ueClass);
    if (role === "if") return "IF";
    if (role === "prefer") return "Prefer";
    if (role === "parallel") return "Parallel";
    if (role === "cost-choice") return "Cost";
    return "Structure";
  }
  if (type === "subnetwork") return "SubNetwork";
  if (type === "subplan") return "SubPlan";
  return "Task";
}

export function summarizeCost(cost: UeCost | undefined): string {
  if (!cost) return "No explicit cost";
  const base = typeof cost.base === "number" ? `base ${cost.base}` : "";
  const formula = typeof cost.formula === "string" ? cost.formula : "";
  const note = typeof cost.note === "string" ? cost.note : "";
  return [base, formula, note].filter(Boolean).join(" / ");
}

export function compactNodeTitle(model: UeNativeModel | null | undefined, node: NativeLayoutNode): string {
  if (NODE_TITLE_RU[node.title]) return NODE_TITLE_RU[node.title];
  if (node.taskRef) return compactTaskTitle(model, node.taskRef);
  return NODE_TITLE_RU[node.title] ?? node.title;
}

export function compactNodeBody(model: UeNativeModel | null | undefined, node: NativeLayoutNode): string {
  if (node.taskRef) return TASK_BODY_RU[node.taskRef] ?? model?.task_library?.[node.taskRef]?.description ?? node.body ?? "";
  return NODE_BODY_RU[node.title] ?? node.body ?? "";
}

export function compactTaskTitle(model: UeNativeModel | null | undefined, ref: string): string {
  return TASK_TITLE_RU[ref] ?? model?.task_library?.[ref]?.ue_class ?? humanize(ref);
}

export function compactDecoratorLabel(model: UeNativeModel | null | undefined, ref: string): string {
  return DECORATOR_LABEL_RU[ref] ?? model?.decorators?.[ref]?.ue_class ?? humanize(ref);
}

export function visibleDecoratorRefsForNode(node: Pick<UeGraphNode | NativeLayoutNode, "decorators" | "type">): string[] {
  return node.decorators ?? [];
}

export function compactServiceLabel(model: UeNativeModel | null | undefined, ref: string): string {
  return SERVICE_LABEL_RU[ref] ?? model?.services?.[ref]?.ue_class ?? humanize(ref);
}

export function compactCostLabel(cost: UeCost | undefined): string {
  if (!cost) return "";
  const base = typeof cost.base === "number" ? `base ${cost.base}` : "";
  const formula = typeof cost.formula === "string" ? cost.formula : "";
  const note = typeof cost.note === "string" ? cost.note : "";
  const text = [base, formula || note].filter(Boolean).join(" / ");
  return text ? `стоимость: ${text}` : "стоимость задана";
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  return JSON.stringify(value, null, 2);
}

export function objectEntries(value: unknown): [string, unknown][] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as JsonRecord);
}

export function humanize(id: string): string {
  return id
    .split(".")
    .pop()!
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

function ceilSnap(value: number): number {
  return Math.ceil(value / GRID) * GRID;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
