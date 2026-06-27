<script lang="ts">
  import { onMount } from 'svelte';
  import { planRepo, resultRepo } from '$lib/db';
  import type { Plan, Day, TaskResult } from '$lib/types';
  import { DISCIPLINES } from '$lib/constants';

  let plan = $state<Plan | null>(null);
  let days = $state<Day[]>([]);
  let results = $state<TaskResult[]>([]);
  let loading = $state(true);
  let currentWeek = $state(1);
  let totalWeeks = $state(12);
  let viewMode = $state<'month' | 'week'>('month');

  // ─── Mount ───
  onMount(async () => {
    try {
      const activePlan = await planRepo.getActive();
      if (activePlan) {
        plan = activePlan;
        days = await planRepo.getDays(activePlan.id);
        totalWeeks = activePlan.totalWeeks ?? Math.ceil(activePlan.totalDays / 7);
        results = await resultRepo.getAll();
        const todayNum = planRepo.getCurrentDayNumber(activePlan);
        currentWeek = Math.ceil(todayNum / 7);
      }
    } catch (e) {
      console.error('Failed to load plan:', e);
    } finally {
      loading = false;
    }
  });

  // ─── Derived ───
  const todayDayNum = $derived(plan ? planRepo.getCurrentDayNumber(plan) : 1);

  // Day status: 'completed' | 'partial' | 'missed' | 'rest'
  function getDayStatus(day: Day | undefined): 'completed' | 'partial' | 'missed' | 'rest' | 'future' {
    if (!day || day.tasks.length === 0) return 'rest';
    if (day.day > todayDayNum) return 'future';
    if (day.day === todayDayNum) return 'partial'; // Today is always partial until all done

    const dayResults = results.filter((r) => r.dayId === day.id);
    if (dayResults.length === 0) return 'missed';

    const completed = dayResults.filter((r) => r.completed).length;
    if (completed === day.tasks.length) return 'completed';
    if (completed > 0) return 'partial';
    return 'missed';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-800 text-green-200';
      case 'partial': return 'bg-yellow-800 text-yellow-200';
      case 'missed': return 'bg-red-900 text-red-300';
      case 'future': return 'bg-base-300 text-gray-600';
      default: return 'bg-base-300 text-gray-500';
    }
  }

  function getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'partial': return '🟡';
      case 'missed': return '❌';
      case 'future': return '·';
      default: return '·';
    }
  }

  // ─── Week data ───
  const weekDays = $derived(() => {
    if (!plan) return [];
    const startDay = (currentWeek - 1) * 7 + 1;
    const week: (Day | undefined)[] = [];
    for (let i = 0; i < 7; i++) {
      const dayNum = startDay + i;
      const day = days.find((d) => d.day === dayNum);
      week.push(day);
    }
    return week;
  });

  // ─── Month data: group days by weeks ───
  const monthWeeks = $derived(() => {
    if (!plan) return [];
    const weeks: { weekNum: number; days: (Day | undefined)[] }[] = [];
    for (let w = 1; w <= totalWeeks; w++) {
      const startDay = (w - 1) * 7 + 1;
      const week: (Day | undefined)[] = [];
      for (let i = 0; i < 7; i++) {
        const dayNum = startDay + i;
        if (dayNum > plan.totalDays) {
          week.push(undefined);
        } else {
          week.push(days.find((d) => d.day === dayNum));
        }
      }
      weeks.push({ weekNum: w, days: week });
    }
    return weeks;
  });

  // ─── Phase info ───
  const phaseNames = $derived(() => {
    const phases = new Map<string, { name: string; startWeek: number }>();
    for (const d of days) {
      if (d.phase && !phases.has(d.phase)) {
        const week = Math.ceil(d.day / 7);
        phases.set(d.phase, { name: d.phase, startWeek: week });
      }
    }
    return [...phases.values()].sort((a, b) => a.startWeek - b.startWeek);
  });

  function goToWeek(week: number) {
    currentWeek = Math.max(1, Math.min(totalWeeks, week));
    viewMode = 'week';
  }

  function getDayTasks(day: Day | undefined) {
    if (!day) return [];
    const dayResults = results.filter((r) => r.dayId === day.id);
    return day.tasks.map((task) => {
      const result = dayResults.find((r) => r.taskId === task.id);
      return { task, completed: result?.completed ?? false };
    });
  }

  // Selected day for detail view
  let selectedDay = $state<Day | null>(null);

  const disciplineColors: Record<string, string> = {
    english: 'text-blue-400',
    music: 'text-purple-400',
    japanese: 'text-red-400',
    spanish: 'text-yellow-400'
  };
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h1 class="text-3xl font-bold">Study Plan</h1>
    <div class="join">
      <button
        class="join-item btn btn-sm {viewMode === 'month' ? 'btn-error' : 'btn-ghost'}"
        onclick={() => (viewMode = 'month')}
      >
        Month
      </button>
      <button
        class="join-item btn btn-sm {viewMode === 'week' ? 'btn-error' : 'btn-ghost'}"
        onclick={() => (viewMode = 'week')}
      >
        Week
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg text-red-500"></span>
    </div>
  {:else if !plan}
    <div class="card bg-base-200 border border-red-900/20 p-8 text-center">
      <p class="text-gray-400">No study plan loaded.</p>
    </div>
  {:else}
    <!-- Plan Info -->
    <div class="card bg-base-200 border border-red-900/20 p-3">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <span class="font-bold">{plan.name}</span>
        <span class="text-gray-500">{plan.totalDays} days · {totalWeeks} weeks</span>
        {#each phaseNames() as phase}
          <span class="badge badge-outline badge-sm">{phase.name}</span>
        {/each}
      </div>
    </div>

    {#if viewMode === 'month'}
      <!-- Month View: all weeks as a grid -->
      <div class="overflow-x-auto">
        <table class="table table-zebra table-xs w-full">
          <thead>
            <tr>
              <th class="text-gray-500">Week</th>
              <th class="text-gray-500">Mon</th>
              <th class="text-gray-500">Tue</th>
              <th class="text-gray-500">Wed</th>
              <th class="text-gray-500">Thu</th>
              <th class="text-gray-500">Fri</th>
              <th class="text-gray-500">Sat</th>
              <th class="text-gray-500">Sun</th>
            </tr>
          </thead>
          <tbody>
            {#each monthWeeks() as { weekNum, days: week }}
              <tr
                class="cursor-pointer hover:opacity-80"
                onclick={() => goToWeek(weekNum)}
              >
                <td class="font-mono text-xs text-gray-500">W{weekNum}</td>
                {#each week as day, i}
                  <td class="p-1">
                    {#if day}
                      {@const status = getDayStatus(day)}
                      <div
                        class="w-full h-10 rounded flex flex-col items-center justify-center text-xs font-bold {getStatusColor(status)} cursor-pointer"
                        title="{day.label}: {status}"
                      >
                        <span class="text-[10px]">{day.day}</span>
                        <span class="text-xs">{getStatusEmoji(status)}</span>
                      </div>
                    {:else}
                      <div class="w-full h-10 rounded bg-base-300/50" />
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-4 text-xs text-gray-500">
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-800" /> All done</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-yellow-800" /> Partial</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-900" /> Missed</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-base-300" /> Future</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-base-300 text-gray-500" /> Rest</span>
      </div>

    {:else}
      <!-- Week View -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <button
            class="btn btn-ghost btn-sm"
            disabled={currentWeek <= 1}
            onclick={() => currentWeek--}
          >
            ← Previous
          </button>
          <h2 class="font-bold">Week {currentWeek}</h2>
          <button
            class="btn btn-ghost btn-sm"
            disabled={currentWeek >= totalWeeks}
            onclick={() => currentWeek++}
          >
            Next →
          </button>
        </div>

        {#each weekDays() as day, i}
          <div
            class="card bg-base-200 border p-3 cursor-pointer transition-colors hover:border-red-700/30 {selectedDay?.day === day?.day ? 'border-red-700/50' : 'border-red-900/20'}"
            onclick={() => (selectedDay = selectedDay?.day === day?.day ? null : day ?? null)}
          >
            {#if day}
              {@const status = getDayStatus(day)}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{getStatusEmoji(status)}</span>
                  <div>
                    <span class="font-bold text-sm">{day.label || `Day ${day.day}`}</span>
                    {#if day.title}
                      <span class="text-xs text-gray-500 ml-2">{day.title}</span>
                    {/if}
                  </div>
                </div>
                <span class="badge badge-sm {status === 'completed' ? 'badge-success' : status === 'partial' ? 'badge-warning' : status === 'missed' ? 'badge-error' : 'badge-ghost'}">
                  {status}
                </span>
              </div>

              {#if selectedDay?.day === day.day}
                <div class="mt-3 space-y-1 border-t border-red-900/20 pt-3">
                  {#each getDayTasks(day) as { task, completed }}
                    <div class="flex items-center gap-2 text-sm">
                      <span class="{completed ? 'text-green-400' : 'text-gray-600'}">{completed ? '✅' : '⬜'}</span>
                      <span class="{disciplineColors[task.discipline] ?? ''} text-xs">{task.discipline}</span>
                      <span class="{completed ? 'line-through text-gray-500' : ''}">{task.description}</span>
                      <span class="text-xs text-gray-600 ml-auto">{task.durationMin}m</span>
                    </div>
                  {/each}
                  {#if day.tasks.length === 0}
                    <p class="text-xs text-gray-600 italic">Rest day — no tasks</p>
                  {/if}
                </div>
              {/if}
            {:else}
              <div class="text-sm text-gray-600 italic">Day {(currentWeek - 1) * 7 + i + 1} — beyond plan</div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="text-center">
        <button class="btn btn-ghost btn-sm" onclick={() => (viewMode = 'month')}>
          ↑ Back to Month View
        </button>
      </div>
    {/if}
  {/if}
</div>
