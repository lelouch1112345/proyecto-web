<script lang="ts">
  import { onMount } from 'svelte';
  import { planRepo, resultRepo } from '$lib/db';
  import { heartRepo, streakRepo } from '$lib/db/repositories/hearts';
  import { achievementRepo } from '$lib/db';
  import { settingsRepo } from '$lib/db';
  import type { Day, Task, Hearts, Streak, TaskResult, XpEvent, CheckIn, BossBattle, Achievement } from '$lib/types';
  import { DISCIPLINES } from '$lib/constants';
  import { calcXP, getLevel, applyDailyXpCap } from '$lib/gamification/xp';
  import { getLevel as getLevelData } from '$lib/gamification/xp';
  import { checkAchievements, createInitialAchievements, calcDisciplineCounts, getNewlyUnlocked } from '$lib/gamification/achievements';
  import { calcBossBattle } from '$lib/gamification/boss-battle';
  import { genId, today, now } from '$lib/utils/id';

  import HeartDisplay from '$lib/components/HeartDisplay.svelte';
  import StreakBadge from '$lib/components/StreakBadge.svelte';
  import XpBar from '$lib/components/XpBar.svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import CheckInForm from '$lib/components/CheckInForm.svelte';
  import LevelUpModal from '$lib/components/LevelUpModal.svelte';
  import BossBattleWidget from '$lib/components/BossBattleWidget.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  // ─── State ───
  let currentDay = $state<Day | null>(null);
  let hearts = $state<Hearts | null>(null);
  let streak = $state<Streak | null>(null);
  let completedTaskIds = $state<Set<string>>(new Set());
  let totalXp = $state(0);
  let todayCheckIn = $state<CheckIn | undefined>(undefined);
  let bossBattle = $state<BossBattle | null>(null);
  let achievements = $state<Achievement[]>([]);
  let levelUpAchievements = $state<Achievement[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let newLevel = $state<{ level: number; title: string } | null>(null);
  let xpAnimation = $state(0);

  // ─── Derived ───
  const levelData = $derived(getLevelData(totalXp));
  const todayDate = $derived(today());

  // ─── Group tasks by discipline ───
  const disciplines = $derived(DISCIPLINES);
  const groupedTasks = $derived(() => {
    if (!currentDay) return [];
    const groups: { discipline: typeof DISCIPLINES[0]; tasks: Task[] }[] = [];
    for (const disc of disciplines) {
      const tasks = currentDay.tasks.filter((t) => t.discipline === disc.id);
      if (tasks.length > 0) {
        groups.push({ discipline: disc, tasks });
      }
    }
    return groups;
  });

  // ─── Load Data ───
  onMount(async () => {
    try {
      const plan = await planRepo.getActive();
      if (!plan) {
        error = 'Study plan not loaded. Reinstall the app.';
        return;
      }

      const dayNumber = planRepo.getCurrentDayNumber(plan);
      const day = await planRepo.getDay(plan.id, dayNumber);
      currentDay = day ?? null;

      // Load hearts & streak
      hearts = (await heartRepo.getState()) ?? null;
      streak = (await streakRepo.getState()) ?? null;

      // Load total XP
      totalXp = await resultRepo.getTotalXp();

      // Load today's check-in
      todayCheckIn = await resultRepo.getCheckInByDate(todayDate);

      // Load achievements
      const savedAchievements = await achievementRepo.getAll();
      if (savedAchievements.length === 0) {
        // Initialize if not yet seeded
        const initial = createInitialAchievements();
        for (const a of initial) {
          await achievementRepo.save(a);
        }
        achievements = initial;
      } else {
        achievements = savedAchievements;
      }

      // Load completed tasks for today
      if (day) {
        const dayResults = await resultRepo.getByDayId(day.id);
        const completed = dayResults.filter((r) => r.completed);
        completedTaskIds = new Set(completed.map((r) => r.taskId));
      }

      // Check boss battle (Sunday)
      const isSunday = new Date().getDay() === 0;
      if (isSunday && currentDay && currentDay.tasks.length > 0) {
        // Get current week's results
        const todayStr = today();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekResults = await resultRepo.getByDateRange(weekStartStr, todayStr + 'T23:59:59');
        const bb = calcBossBattle(weekResults, currentDay.tasks.length, currentDay.week);
        bossBattle = bb as BossBattle;
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
      error = 'Study plan not loaded. Reinstall the app.';
    } finally {
      loading = false;
    }
  });

  // ─── Task Completion ───
  async function handleComplete(task: Task, timeSpentMin: number) {
    if (completedTaskIds.has(task.id)) return;

    // 1. Calculate XP
    const xpAwarded = calcXP(task.difficulty, task.discipline);

    // 2. Check daily XP cap
    const todayEvents = await resultRepo.getXpByDateRange(
      todayDate + 'T00:00:00',
      todayDate + 'T23:59:59'
    );
    const cappedXp = applyDailyXpCap(todayEvents, xpAwarded);
    if (cappedXp <= 0) return; // Cap reached

    // 3. Save task result
    const result: TaskResult = {
      id: genId(),
      taskId: task.id,
      dayId: task.dayId,
      completed: true,
      xpAwarded: cappedXp,
      timeSpentMin,
      discipline: task.discipline,
      difficulty: task.difficulty,
      completedAt: now(),
      skipped: false
    };
    await resultRepo.saveResult(result);

    // 4. Save XP event
    const xpEvent: XpEvent = {
      id: genId(),
      date: todayDate,
      amount: cappedXp,
      source: 'task_completion',
      discipline: task.discipline,
      description: `Completed: ${task.description}`,
      createdAt: now()
    };
    await resultRepo.saveXpEvent(xpEvent);

    // 5. Update UI
    const prevTotal = totalXp;
    totalXp += cappedXp;
    completedTaskIds = new Set([...completedTaskIds, task.id]);
    xpAnimation = cappedXp;

    // 6. Check level up
    const prevLevel = getLevelData(prevTotal);
    const afterLevel = getLevelData(totalXp);
    if (afterLevel.level > prevLevel.level) {
      newLevel = { level: afterLevel.level, title: afterLevel.title };
    }

    // 7. Update streak (only first task of the day)
    const todayStr = todayDate;
    if (!streak || streak.lastDate !== todayStr) {
      streak = await streakRepo.increment(todayStr);
    }

    // 8. Check achievements
    const allResults = await resultRepo.getAll();
    const allEvents = await resultRepo.getXpEvents(1000);
    const totalCheckIns = await resultRepo.countCheckIns();
    const disciplineCounts = calcDisciplineCounts(allResults);

    const achCtx = {
      events: allEvents,
      results: allResults,
      currentStreak: streak?.current ?? 0,
      totalCheckIns,
      perfectWeeks: 0, // Will be calculated from boss battles
      recoveryCount: 0,
      disciplineTaskCounts: disciplineCounts,
      heartSaverDays: 0
    };

    const updatedAchievements = checkAchievements(achievements, achCtx);
    const newUnlocked = getNewlyUnlocked(achievements, updatedAchievements);

    // Save any newly unlocked
    for (const ach of updatedAchievements) {
      const old = achievements.find((a) => a.id === ach.id);
      if (old?.unlocked !== ach.unlocked || old?.progress !== ach.progress) {
        await achievementRepo.save(ach);
      }
    }

    levelUpAchievements = newUnlocked;
    achievements = updatedAchievements;

    // Clear XP animation after 2s
    setTimeout(() => (xpAnimation = 0), 2000);
  }

  async function handleUncomplete(task: Task) {
    // Find and delete the task result
    const dayResults = await resultRepo.getByDayId(task.dayId);
    const result = dayResults.find((r) => r.taskId === task.id && r.completed);
    if (result) {
      await resultRepo.delete(result.id);
      totalXp -= result.xpAwarded;
      completedTaskIds = new Set(
        [...completedTaskIds].filter((id) => id !== task.id)
      );
    }
  }

  async function handleCheckIn(data: Omit<CheckIn, 'id' | 'date' | 'createdAt'>) {
    const checkIn: CheckIn = {
      id: genId(),
      date: todayDate,
      ...data,
      createdAt: now()
    };
    await resultRepo.saveCheckIn(checkIn);
    todayCheckIn = checkIn;
  }

  function handleLevelUpClose() {
    newLevel = null;
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-64">
    <span class="loading loading-spinner loading-lg text-red-500"></span>
  </div>
{:else if error}
  <EmptyState icon="&#9888;&#65039;" title="No Plan Loaded" description={error} action={{ label: 'Go to Settings', href: '/settings' }} />
{:else if currentDay}
  <div class="space-y-4">
    <!-- XP Animation Toast -->
    {#if xpAnimation > 0}
      <div class="fixed top-4 right-4 z-40 animate-bounce">
        <div class="bg-red-800 text-red-200 px-4 py-2 rounded-lg shadow-lg text-sm font-bold">
          +{xpAnimation} XP
        </div>
      </div>
    {/if}

    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">
          {currentDay.label || `Day ${currentDay.day}`}
        </h1>
        {#if currentDay.title}
          <p class="text-gray-400 text-sm">{currentDay.title}</p>
        {/if}
      </div>
    </div>

    <!-- Gamification Bar -->
    <div class="card bg-base-200 border border-red-900/20 p-3">
      <div class="flex flex-wrap items-center gap-3">
        {#if hearts}
          <HeartDisplay current={hearts.current} max={hearts.max} breakMode={hearts.breakMode} />
        {/if}
        <div class="divider divider-horizontal mx-0 hidden sm:flex" />
        {#if streak}
          <StreakBadge current={streak.current} longest={streak.longest} freezeAvailable={streak.freezeAvailable} />
        {/if}
        <div class="flex-1 min-w-[200px]">
          <XpBar totalXp={totalXp} compact />
        </div>
        <div class="text-xs text-gray-500 font-mono">
          Lv.{levelData.level}
        </div>
      </div>
    </div>

    <!-- Boss Battle (Sunday) -->
    {#if bossBattle}
      <BossBattleWidget battle={bossBattle} />
    {/if}

    <!-- Tasks By Discipline -->
    {#if currentDay.tasks.length === 0}
      <div class="card bg-base-200 border border-red-900/20 p-8 text-center">
        <p class="text-xl text-gray-400">No tasks scheduled — enjoy your rest</p>
      </div>
    {:else}
      {#each groupedTasks() as group}
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span style="color: {group.discipline.color}">{group.discipline.emoji}</span>
            <h3 class="font-bold text-sm" style="color: {group.discipline.color}">
              {group.discipline.name}
            </h3>
            <span class="text-xs text-gray-600">
              ({group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div class="space-y-2">
            {#each group.tasks as task}
              <TaskCard
                {task}
                completed={completedTaskIds.has(task.id)}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
              />
            {/each}
          </div>
        </div>
      {/each}
    {/if}

    <!-- Check-In -->
    <CheckInForm onCheckIn={handleCheckIn} saved={!!todayCheckIn} />

    <!-- Micro-Objective -->
    <div class="card bg-base-200 border border-red-900/20 p-3">
      <div class="flex items-center gap-2 text-sm">
        <span>🎯</span>
        <span class="text-gray-400 italic">Micro-objective: Complete your first highlighted task</span>
      </div>
    </div>
  </div>
{:else}
  <EmptyState icon="&#128203;" title="No tasks scheduled" description="Enjoy your rest day!" action={{ label: 'Go to Plan', href: '/plan' }} />
{/if}

<!-- Level Up Modal -->
{#if newLevel}
  <LevelUpModal level={newLevel.level} title={newLevel.title} onClose={handleLevelUpClose} />
{/if}
