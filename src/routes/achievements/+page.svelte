<script lang="ts">
  import { onMount } from 'svelte';
  import { achievementRepo } from '$lib/db';
  import type { Achievement } from '$lib/types';
  import { ACHIEVEMENT_DEFINITIONS } from '$lib/constants';

  let achievements = $state<Achievement[]>([]);
  let loading = $state(true);
  let sortMode = $state<'recent' | 'progress' | 'locked'>('recent');
  let newlyUnlocked = $state<Set<string>>(new Set());

  onMount(async () => {
    try {
      achievements = await achievementRepo.getAll();
      // Detect newly unlocked by checking which were unlocked in this session
      // (compared to stored unlockedAt)
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      for (const a of achievements) {
        if (a.unlocked && a.unlockedAt) {
          const unlockedDate = new Date(a.unlockedAt);
          if (unlockedDate >= fiveMinAgo && unlockedDate <= now) {
            newlyUnlocked.add(a.id);
          }
        }
      }
      // Clear animation after 4s
      if (newlyUnlocked.size > 0) {
        setTimeout(() => (newlyUnlocked = new Set()), 4000);
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    } finally {
      loading = false;
    }
  });

  const sortedAchievements = $derived(() => {
    const sorted = [...achievements];
    switch (sortMode) {
      case 'recent':
        // Most recently unlocked first, then locked (by progress desc)
        sorted.sort((a, b) => {
          if (a.unlocked && b.unlocked) {
            return (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '');
          }
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return (b.progress ?? 0) - (a.progress ?? 0);
        });
        break;
      case 'progress':
        // Highest progress first
        sorted.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
        break;
      case 'locked':
        // Locked first (by progress desc), then unlocked (by date)
        sorted.sort((a, b) => {
          if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
          if (a.unlocked && b.unlocked) {
            return (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '');
          }
          return (b.progress ?? 0) - (a.progress ?? 0);
        });
        break;
    }
    return sorted;
  });

  function getConditionText(achievement: Achievement): string {
    const { type, target, discipline } = achievement.condition;
    const discLabel = discipline ? `${discipline} ` : '';
    switch (type) {
      case 'total_xp': return `Earn ${target} total XP`;
      case 'streak_days': return `Maintain a ${target}-day streak`;
      case 'tasks_completed': return `Complete ${target} task${target !== 1 ? 's' : ''}`;
      case 'discipline_tasks': return `Complete ${target} ${discLabel}tasks`;
      case 'perfect_weeks': return `Complete ${target} perfect week${target !== 1 ? 's' : ''}`;
      case 'check_ins': return `Complete ${target} daily check-ins`;
      case 'hearts_saved': return `Keep all hearts for ${target} days`;
      case 'recoveries': return `Recover from burnout ${target} time${target !== 1 ? 's' : ''}`;
      default: return '';
    }
  }

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-3xl font-bold">Achievements</h1>
    <div class="flex gap-2">
      <button
        class="btn btn-xs {sortMode === 'recent' ? 'btn-error' : 'btn-ghost'}"
        onclick={() => (sortMode = 'recent')}
      >Recent</button>
      <button
        class="btn btn-xs {sortMode === 'progress' ? 'btn-error' : 'btn-ghost'}"
        onclick={() => (sortMode = 'progress')}
      >Progress</button>
      <button
        class="btn btn-xs {sortMode === 'locked' ? 'btn-error' : 'btn-ghost'}"
        onclick={() => (sortMode = 'locked')}
      >Locked</button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg text-red-500"></span>
    </div>
  {:else if achievements.length === 0}
    <div class="flex flex-col items-center justify-center h-64 text-center">
      <div class="text-6xl mb-4">&#127942;</div>
      <p class="text-gray-400 text-lg">Complete your first tasks to earn achievements!</p>
      <a href="/" class="btn btn-outline btn-error mt-4">Go to Dashboard</a>
    </div>
  {:else}
    <!-- Stats bar -->
    <div class="grid grid-cols-3 gap-3 max-w-xs">
      <div class="card bg-base-200 border border-red-900/20 p-2 text-center">
        <div class="text-xl font-bold text-red-400">{achievements.filter(a => a.unlocked).length}</div>
        <div class="text-xs text-gray-500">Unlocked</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-2 text-center">
        <div class="text-xl font-bold text-gray-400">{achievements.filter(a => !a.unlocked).length}</div>
        <div class="text-xs text-gray-500">Locked</div>
      </div>
      <div class="card bg-base-200 border border-red-900/20 p-2 text-center">
        <div class="text-xl font-bold text-gold-400">{achievements.length}</div>
        <div class="text-xs text-gray-500">Total</div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {#each sortedAchievements() as achievement}
        <div
          class="card bg-base-200 border p-4 transition-all duration-500
            {achievement.unlocked
              ? 'border-yellow-600/50 shadow-lg shadow-yellow-900/20 achievement-unlocked'
              : 'border-red-900/20 opacity-60'}
            {newlyUnlocked.has(achievement.id) ? 'achievement-new' : ''}"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-3xl">{achievement.icon}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-sm">{achievement.name}</h3>
              <p class="text-xs text-gray-500">{achievement.category}</p>
            </div>
            {#if achievement.unlocked}
              <span class="badge badge-success badge-sm">Unlocked</span>
            {:else}
              <span class="badge badge-ghost badge-sm">Locked</span>
            {/if}
          </div>
          <p class="text-xs text-gray-400">{achievement.description}</p>

          <!-- Condition text for locked achievements -->
          {#if !achievement.unlocked}
            <p class="text-xs text-gray-500 italic mt-1">{getConditionText(achievement)}</p>
          {/if}

          <!-- Progress bar -->
          {#if achievement.progress !== undefined && achievement.progress > 0 && achievement.progress < 100}
            <div class="mt-2">
              <div class="w-full bg-base-300 rounded-full h-1.5">
                <div class="bg-red-500 h-1.5 rounded-full transition-all duration-500" style="width: {achievement.progress}%"></div>
              </div>
              <span class="text-xs text-gray-500 mt-0.5 block">{achievement.progress}%</span>
            </div>
          {:else if !achievement.unlocked}
            <div class="mt-2">
              <div class="w-full bg-base-300 rounded-full h-1.5">
                <div class="bg-red-500 h-1.5 rounded-full" style="width: 0%"></div>
              </div>
              <span class="text-xs text-gray-500 mt-0.5 block">Not started</span>
            </div>
          {/if}

          <!-- Unlock date -->
          {#if achievement.unlocked && achievement.unlockedAt}
            <p class="text-xs text-green-600 mt-2">
              Unlocked: {formatDate(achievement.unlockedAt)}
            </p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  @keyframes unlockPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
    50% { transform: scale(1.03); box-shadow: 0 0 20px 10px rgba(234, 179, 8, 0.2); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
  }
  .achievement-new {
    animation: unlockPulse 2s ease-in-out 2;
    border-color: #eab308 !important;
  }
  .achievement-unlocked {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .achievement-unlocked:hover {
    transform: translateY(-2px);
  }
</style>
