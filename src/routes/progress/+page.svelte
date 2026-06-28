<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { resultRepo, calibrationRepo } from '$lib/db';
  import type { XpEvent, Calibration } from '$lib/types';
  import { getLevel } from '$lib/gamification/xp';
  import { DISCIPLINES, MAX_XP } from '$lib/constants';
  import { calcCalibrationStats } from '$lib/gamification/calibration';
  import { Chart, registerables } from 'chart.js';
  import ChartDataLabels from 'chartjs-plugin-datalabels';

  // Register Chart.js components
  Chart.register(...registerables);

  let loading = $state(true);
  let xpEvents = $state<XpEvent[]>([]);
  let calibrations = $state<Calibration[]>([]);
  let xpChartCanvas: HTMLCanvasElement | undefined = $state(undefined);
  let radarChartCanvas: HTMLCanvasElement | undefined = $state(undefined);
  let calibrationChartCanvas: HTMLCanvasElement | undefined = $state(undefined);
  let streakData = $state<{ date: string; count: number }[]>([]);

  let xpChart: Chart | null = null;
  let radarChart: Chart | null = null;
  let calChart: Chart | null = null;

  // ─── Derived ───
  const totalXp = $derived(xpEvents.reduce((sum, e) => sum + e.amount, 0));
  const levelData = $derived(getLevel(totalXp));
  const disciplineXp = $derived(() => {
    const map: Record<string, number> = {};
    for (const d of DISCIPLINES) map[d.id] = 0;
    for (const e of xpEvents) {
      map[e.discipline] = (map[e.discipline] ?? 0) + e.amount;
    }
    return map;
  });

  const calStats = $derived(calcCalibrationStats(calibrations));

  // ─── XP History: group by date ───
  const xpByDate = $derived(() => {
    const map = new Map<string, number>();
    for (const e of xpEvents) {
      const day = e.date.split('T')[0];
      map.set(day, (map.get(day) ?? 0) + e.amount);
    }
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      dates: sorted.map(([d]) => d.slice(5)), // MM-DD
      values: sorted.map(([, v]) => v)
    };
  });

  function buildStreakCalendar(): { date: string; count: number }[] {
    const data: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEvents = xpEvents.filter(
        (e) => e.date.split('T')[0] === dateStr
      );
      data.push({
        date: dateStr,
        count: dayEvents.length > 0 ? dayEvents.reduce((s, e) => s + e.amount, 0) : 0
      });
    }
    return data;
  }

  // ─── Mount ───
  onMount(async () => {
    try {
      xpEvents = await resultRepo.getXpEvents(2000);
      calibrations = await calibrationRepo.getAll();
      streakData = buildStreakCalendar();
    } catch (e) {
      console.error('Failed to load progress data:', e);
    } finally {
      loading = false;
    }
  });

  // ─── Chart Effects ───
  $effect(() => {
    if (loading || !xpChartCanvas) return;
    const data = xpByDate();

    if (xpChart) xpChart.destroy();
    xpChart = new Chart(xpChartCanvas, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: [{
          label: 'Daily XP',
          data: data.values,
          borderColor: '#ab0000',
          backgroundColor: 'rgba(171, 0, 0, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#ab0000',
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: { display: false },
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#888', maxTicksLimit: 14, font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#888', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            beginAtZero: true
          }
        }
      }
    });

    return () => { if (xpChart) xpChart.destroy(); };
  });

  $effect(() => {
    if (loading || !radarChartCanvas) return;

    if (radarChart) radarChart.destroy();
    const xp = disciplineXp();

    radarChart = new Chart(radarChartCanvas, {
      type: 'radar',
      data: {
        labels: DISCIPLINES.map((d) => `${d.emoji} ${d.name}`),
        datasets: [{
          label: 'XP',
          data: DISCIPLINES.map((d) => xp[d.id] ?? 0),
          backgroundColor: 'rgba(171, 0, 0, 0.2)',
          borderColor: '#ab0000',
          pointBackgroundColor: DISCIPLINES.map((d) => d.color),
          pointBorderColor: '#fff',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: { display: false },
          legend: { display: false }
        },
        scales: {
          r: {
            ticks: { color: '#888', backdropColor: 'transparent', font: { size: 9 } },
            grid: { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#ccc', font: { size: 11 } }
          }
        }
      }
    });

    return () => { if (radarChart) radarChart.destroy(); };
  });

  $effect(() => {
    if (loading || !calibrationChartCanvas) return;

    if (calChart) calChart.destroy();
    const sorted = [...calibrations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const labels = sorted.map((c) => c.date.slice(5));
    const predicted = sorted.map((c) => c.predictedMin);
    const actual = sorted.map((c) => c.actualMin);

    calChart = new Chart(calibrationChartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Predicted (min)',
            data: predicted,
            backgroundColor: 'rgba(171, 0, 0, 0.6)',
            borderRadius: 3
          },
          {
            label: 'Actual (min)',
            data: actual,
            backgroundColor: 'rgba(212, 168, 67, 0.6)',
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: { display: false },
          legend: {
            labels: { color: '#aaa', font: { size: 10 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#888', font: { size: 9 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#888', font: { size: 9 } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            beginAtZero: true
          }
        }
      }
    });

    return () => { if (calChart) calChart.destroy(); };
  });

  // ─── Streak calendar helpers ───
  function getCellColor(count: number): string {
    if (count === 0) return 'bg-base-300';
    if (count < 50) return 'bg-red-950';
    if (count < 100) return 'bg-red-900';
    if (count < 150) return 'bg-red-800';
    return 'bg-red-600';
  }

  function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Group streak data by weeks for the grid
  const streakWeeks = $derived(() => {
    const weeks: { date: string; count: number }[][] = [];
    let week: { date: string; count: number }[] = [];
    for (const item of streakData) {
      const dayOfWeek = new Date(item.date + 'T00:00:00').getDay();
      if (dayOfWeek === 0 && week.length > 0) {
        weeks.push(week);
        week = [];
      }
      week.push(item);
    }
    if (week.length > 0) weeks.push(week);
    return weeks;
  });

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Progress</h1>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg text-red-500"></span>
    </div>
  {:else}
    <!-- Summary Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-red-400">{totalXp}</div>
        <div class="text-xs text-gray-500">Total XP</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-gold-400">Lv.{levelData.level}</div>
        <div class="text-xs text-gray-500">{levelData.title}</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-blue-400">{xpEvents.length}</div>
        <div class="text-xs text-gray-500">Events</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-green-400">{calStats.averageAccuracy}%</div>
        <div class="text-xs text-gray-500">Accuracy</div>
      </div>
    </div>

    <!-- XP History -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-3">XP History</h2>
      {#if xpEvents.length === 0}
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      {:else}
        <div class="h-48 sm:h-64">
          <canvas bind:this={xpChartCanvas} />
        </div>
      {/if}
    </div>

    <!-- Discipline Radar -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-3">Discipline Breakdown</h2>
      {#if xpEvents.length === 0}
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      {:else}
        <div class="h-48 sm:h-64 flex justify-center">
          <canvas bind:this={radarChartCanvas} />
        </div>
        <!-- Discipline list -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {#each DISCIPLINES as disc}
            {@const xp = disciplineXp()[disc.id] ?? 0}
            <div class="text-center text-xs">
              <span style="color: {disc.color}">{disc.emoji} {disc.name}</span>
              <div class="font-bold text-sm" style="color: {disc.color}">{xp} XP</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Streak Calendar Heatmap -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-3">Streak Calendar (90 days)</h2>
      {#if xpEvents.length === 0}
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      {:else}
        <div class="overflow-x-auto">
          <div class="flex gap-1" style="min-width: max-content;">
            <!-- Day labels column -->
            <div class="flex flex-col gap-1 mr-1 text-xs text-gray-600">
              {#each dayLabels as label}
                <div class="h-3 flex items-center">{label}</div>
              {/each}
            </div>
            <!-- Week columns -->
            {#each streakWeeks() as week}
              <div class="flex flex-col gap-1">
                {#each week as day}
                  <div
                    class="w-3 h-3 rounded-sm {getCellColor(day.count)}"
                    title="{formatDateShort(day.date)}: {day.count} XP"
                  />
                {/each}
              </div>
            {/each}
          </div>
        </div>
        <!-- Legend -->
        <div class="flex items-center gap-1 mt-3 text-xs text-gray-500 justify-end">
          <span>Less</span>
          <div class="w-3 h-3 rounded-sm bg-base-300" />
          <div class="w-3 h-3 rounded-sm bg-red-950" />
          <div class="w-3 h-3 rounded-sm bg-red-900" />
          <div class="w-3 h-3 rounded-sm bg-red-800" />
          <div class="w-3 h-3 rounded-sm bg-red-600" />
          <span>More</span>
        </div>
      {/if}
    </div>

    <!-- Calibration Accuracy -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-1">Calibration Accuracy</h2>
      {#if calibrations.length === 0}
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      {:else}
        <div class="flex gap-4 text-sm mb-3">
          <div>
            <span class="text-gray-500">Accuracy: </span>
            <span class="font-bold text-{calStats.averageAccuracy >= 70 ? 'green' : calStats.averageAccuracy >= 40 ? 'yellow' : 'red'}-400">
              {calStats.averageAccuracy}%
            </span>
          </div>
          <div>
            <span class="text-gray-500">Trend: </span>
            <span class="font-bold">{calStats.trend}</span>
          </div>
          <div>
            <span class="text-gray-500">Entries: </span>
            <span class="font-bold">{calStats.totalEntries}</span>
          </div>
        </div>
        <div class="h-48 sm:h-64">
          <canvas bind:this={calibrationChartCanvas} />
        </div>
        <div class="flex gap-4 text-xs text-gray-500 mt-2">
          <span>🔴 Overestimated: {calStats.totalOverestimated}</span>
          <span>🟡 Underestimated: {calStats.totalUnderestimated}</span>
          <span>✅ Exact: {calStats.totalExact}</span>
        </div>
      {/if}
    </div>

    <div class="text-center mt-4">
      <a href={base} class="btn btn-outline btn-error">Back to Dashboard</a>
    </div>
  {/if}
</div>
