<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { errorLogRepo } from '$lib/db';
  import { ERROR_CATEGORIES, STUDY_ERROR_CATEGORIES } from '$lib/constants';
  import type { ErrorLog, ErrorCategory } from '$lib/types';
  import { genId, today, now } from '$lib/utils/id';
  import { Chart, registerables } from 'chart.js';
  import ChartDataLabels from 'chartjs-plugin-datalabels';

  Chart.register(...registerables);

  let allErrors = $state<ErrorLog[]>([]);
  let loading = $state(true);
  let filterCategory = $state<ErrorCategory | 'all'>('all');
  let dateFrom = $state('');
  let dateTo = $state('');
  let showAddForm = $state(false);
  let statsChartCanvas: HTMLCanvasElement | undefined = $state(undefined);
  let statsChart: Chart | null = null;

  // Add form fields
  let newError = $state({
    date: today(),
    category: 'pronunciation' as ErrorCategory,
    description: '',
    correction: '',
    resolved: false
  });
  let addErrorMsg = $state<string | null>(null);

  onMount(async () => {
    try {
      allErrors = await errorLogRepo.getAll();
    } catch (e) {
      console.error('Failed to load error logs:', e);
    } finally {
      loading = false;
    }
  });

  // Filtered errors
  const filteredErrors = $derived(() => {
    let result = allErrors;
    if (filterCategory !== 'all') {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (dateFrom) {
      result = result.filter((e) => e.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((e) => e.date <= dateTo);
    }
    // Sort by date descending
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  });

  // Stats data
  const categoryStats = $derived(() => {
    const counts: Record<string, number> = {};
    for (const e of allErrors) {
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    // Sort by count descending
    return Object.entries(counts)
      .map(([cat, count]) => ({ category: cat, label: ERROR_CATEGORIES[cat as keyof typeof ERROR_CATEGORIES] ?? cat, count }))
      .sort((a, b) => b.count - a.count);
  });

  const totalErrors = $derived(allErrors.length);
  const resolvedErrors = $derived(allErrors.filter((e) => e.resolved).length);

  // ─── Stats Chart ───
  $effect(() => {
    if (loading || !statsChartCanvas) return;
    const stats = categoryStats();
    if (stats.length === 0) return;

    if (statsChart) statsChart.destroy();

    const colors = [
      '#ab0000', '#d4a843', '#3b82f6', '#a855f7',
      '#22c55e', '#f97316', '#ef4444', '#eab308',
      '#06b6d4', '#ec4899', '#8b5cf6'
    ];

    statsChart = new Chart(statsChartCanvas, {
      type: 'bar',
      data: {
        labels: stats.map((s) => s.label),
        datasets: [{
          label: 'Errors',
          data: stats.map((s) => s.count),
          backgroundColor: stats.map((_, i) => colors[i % colors.length]),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#aaa',
            font: { size: 11 }
          },
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#888', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            beginAtZero: true
          },
          y: {
            ticks: { color: '#ccc', font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });

    return () => { if (statsChart) statsChart.destroy(); };
  });

  // ─── CRUD Operations ───
  async function handleAddError() {
    addErrorMsg = null;
    if (!newError.description.trim()) {
      addErrorMsg = 'Description is required.';
      return;
    }
    try {
      const entry: ErrorLog = {
        id: genId(),
        date: newError.date,
        category: newError.category,
        description: newError.description.trim(),
        correction: newError.correction.trim() || undefined,
        resolved: newError.resolved,
        createdAt: now()
      };
      await errorLogRepo.save(entry);
      allErrors = [entry, ...allErrors];
      showAddForm = false;
      newError = {
        date: today(),
        category: 'pronunciation',
        description: '',
        correction: '',
        resolved: false
      };
    } catch (e) {
      console.error('Failed to save error log:', e);
      addErrorMsg = 'Failed to save error log entry.';
    }
  }

  async function handleResolve(id: string) {
    await errorLogRepo.resolve(id);
    allErrors = allErrors.map((e) =>
      e.id === id ? { ...e, resolved: true } : e
    );
  }

  async function handleDelete(id: string) {
    await errorLogRepo.delete(id);
    allErrors = allErrors.filter((e) => e.id !== id);
  }

  function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getCategoryLabel(cat: string): string {
    return ERROR_CATEGORIES[cat as keyof typeof ERROR_CATEGORIES] ?? cat;
  }

  function getCategoryBadge(cat: string): string {
    if (cat === 'R' || cat === 'L' || cat === 'D' || cat === 'C' || cat === 'F') {
      return `badge-${cat === 'R' ? 'success' : cat === 'L' ? 'info' : cat === 'D' ? 'warning' : cat === 'C' ? 'accent' : 'ghost'}`;
    }
    return 'badge-info';
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-3xl font-bold">Error Log</h1>
    <button class="btn btn-error btn-sm" onclick={() => (showAddForm = !showAddForm)}>
      {showAddForm ? 'Cancel' : '+ Add Error'}
    </button>
  </div>

  <!-- Add Error Form (modal-like inline) -->
  {#if showAddForm}
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-3">Log a New Error</h2>
      <div class="space-y-3">
        <div>
          <label class="label-text text-xs text-gray-400 mb-1 block">Date</label>
          <input type="date" bind:value={newError.date} class="input input-bordered input-error input-sm w-full" />
        </div>
        <div>
          <label class="label-text text-xs text-gray-400 mb-1 block">Category</label>
          <select bind:value={newError.category} class="select select-bordered select-error select-sm w-full">
            <optgroup label="System">
              {#each Object.entries(ERROR_CATEGORIES).filter(([k]) => k.length === 1) as [key, label]}
                <option value={key}>{label}</option>
              {/each}
            </optgroup>
            <optgroup label="Study Errors">
              {#each STUDY_ERROR_CATEGORIES as cat}
                <option value={cat}>{ERROR_CATEGORIES[cat]}</option>
              {/each}
            </optgroup>
          </select>
        </div>
        <div>
          <label class="label-text text-xs text-gray-400 mb-1 block">Description</label>
          <textarea
            bind:value={newError.description}
            placeholder="What went wrong?"
            class="textarea textarea-bordered textarea-error textarea-sm w-full"
            rows="2"
          ></textarea>
        </div>
        <div>
          <label class="label-text text-xs text-gray-400 mb-1 block">Correction Applied</label>
          <textarea
            bind:value={newError.correction}
            placeholder="How did you correct it?"
            class="textarea textarea-bordered textarea-error textarea-sm w-full"
            rows="2"
          ></textarea>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" bind:checked={newError.resolved} class="checkbox checkbox-error checkbox-sm" />
          <span class="text-sm text-gray-400">Resolved</span>
        </div>

        {#if addErrorMsg}
          <p class="text-red-400 text-sm">{addErrorMsg}</p>
        {/if}

        <button class="btn btn-error btn-sm" onclick={handleAddError}>Save Entry</button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg text-red-500"></span>
    </div>
  {:else if allErrors.length === 0}
    <div class="flex flex-col items-center justify-center h-64 text-center">
      <div class="text-6xl mb-4">&#128203;</div>
      <p class="text-gray-400 text-lg">No errors logged yet.</p>
      <p class="text-sm text-gray-500 mt-1">Log study errors and recovery events here.</p>
      <button class="btn btn-outline btn-error mt-4" onclick={() => (showAddForm = true)}>
        Log Your First Error
      </button>
    </div>
  {:else}
    <!-- Stats summary -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-red-400">{totalErrors}</div>
        <div class="text-xs text-gray-500">Total Entries</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-green-400">{resolvedErrors}</div>
        <div class="text-xs text-gray-500">Resolved</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-yellow-400">{totalErrors - resolvedErrors}</div>
        <div class="text-xs text-gray-500">Open</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-3 text-center">
        <div class="text-2xl font-bold text-blue-400">{categoryStats().length}</div>
        <div class="text-xs text-gray-500">Categories</div>
      </div>
    </div>

    <!-- Chart -->
    {#if categoryStats().length > 1}
      <div class="card bg-base-200 border border-red-900/20 p-4">
        <h2 class="text-lg font-bold mb-3">Error Distribution</h2>
        <div class="h-48 sm:h-64">
          <canvas bind:this={statsChartCanvas} />
        </div>
      </div>
    {/if}

    <!-- Filters -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">Category:</span>
          <select
            bind:value={filterCategory}
            class="select select-bordered select-xs w-36"
          >
            <option value="all">All Categories</option>
            {#each Object.entries(ERROR_CATEGORIES) as [key, label]}
              <option value={key}>{label}</option>
            {/each}
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">From:</span>
          <input type="date" bind:value={dateFrom} class="input input-bordered input-xs w-36" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">To:</span>
          <input type="date" bind:value={dateTo} class="input input-bordered input-xs w-36" />
        </div>
        <button
          class="btn btn-ghost btn-xs"
          onclick={() => { filterCategory = 'all'; dateFrom = ''; dateTo = ''; }}
        >Clear</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card bg-base-200 border border-red-900/20 p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr class="text-xs text-gray-500">
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th class="hidden sm:table-cell">Correction</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each filteredErrors() as entry}
              <tr class="hover:bg-base-300/50 transition-colors">
                <td class="text-xs whitespace-nowrap">{formatDateShort(entry.date)}</td>
                <td>
                  <span class="badge badge-sm {getCategoryBadge(entry.category)}">
                    {getCategoryLabel(entry.category)}
                  </span>
                </td>
                <td class="max-w-xs">
                  <p class="text-sm truncate" title={entry.description}>{entry.description}</p>
                  {#if entry.details}
                    <p class="text-xs text-gray-600 truncate">{entry.details}</p>
                  {/if}
                </td>
                <td class="hidden sm:table-cell max-w-xs">
                  {#if entry.correction}
                    <p class="text-xs text-gray-400 truncate" title={entry.correction}>{entry.correction}</p>
                  {:else}
                    <span class="text-xs text-gray-600">—</span>
                  {/if}
                </td>
                <td>
                  {#if entry.resolved}
                    <span class="badge badge-success badge-xs">Resolved</span>
                  {:else}
                    <span class="badge badge-warning badge-xs">Open</span>
                  {/if}
                </td>
                <td>
                  <div class="flex gap-1">
                    {#if !entry.resolved}
                      <button
                        class="btn btn-ghost btn-xs text-green-500"
                        onclick={() => handleResolve(entry.id)}
                        title="Mark resolved"
                      >&#10003;</button>
                    {/if}
                    <button
                      class="btn btn-ghost btn-xs text-red-500"
                      onclick={() => handleDelete(entry.id)}
                      title="Delete"
                    >&#10005;</button>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="text-center text-gray-500 py-8">
                  No errors match the current filters.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-center mt-2">
      <a href={base} class="btn btn-outline btn-error btn-sm">Back to Dashboard</a>
    </div>
  {/if}
</div>
