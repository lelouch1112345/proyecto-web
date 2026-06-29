<script lang="ts">
  import { fly } from 'svelte/transition';

  interface Props {
    onComplete: () => void;
  }

  let { onComplete }: Props = $props();

  let step = $state(1);
  let fadeOut = $state(false);
  let direction = $state(1);

  const steps = [
    {
      icon: '✦',
      title: 'Welcome to Third-Life',
      subtitle: 'Your gamified anti-procrastination companion',
      description:
        'Third-Life turns your 84-day study plan into an interactive game. Complete tasks, earn XP, level up, and build unstoppable consistency across English, Spanish, Japanese, and Music.',
      highlights: [
        { emoji: '📋', text: 'Daily dashboard with today\'s tasks' },
        { emoji: '⭐', text: 'Earn XP and climb 14 levels' },
        { emoji: '🔥', text: 'Build streaks and unlock achievements' },
        { emoji: '❤️', text: 'Heart system keeps you honest — 48h grace window' }
      ]
    },
    {
      icon: '🗺️',
      title: 'Quick Tour',
      subtitle: 'Here\'s what you\'ll find',
      description: 'The app is organized into six sections accessible from the navigation bar:',
      highlights: [
        { emoji: '📊', text: 'Dashboard — your daily command center with tasks, XP, streak, and hearts' },
        { emoji: '📈', text: 'Progress — XP charts, discipline radar, streak heatmap, calibration stats' },
        { emoji: '🏆', text: 'Achievements — 16 badges to unlock, with progress tracking' },
        { emoji: '🔄', text: 'Recovery — guided wizard for when life gets in the way' },
        { emoji: '📝', text: 'Error Log — track study errors and recovery events' },
        { emoji: '⚙️', text: 'Settings — theme, timer, data export/import, danger zone' }
      ]
    },
    {
      icon: '🚀',
      title: 'Ready to Start',
      subtitle: 'Your 84-day journey begins now',
      description:
        'Your study plan is loaded and ready. Start with today\'s tasks on the Dashboard. Complete them, watch your XP grow, and build your streak one day at a time.',
      highlights: [
        { emoji: '🎯', text: 'Start with today\'s highlighted task' },
        { emoji: '⏱️', text: 'Use the session timer to stay focused (default: 40 min)' },
        { emoji: '📝', text: 'Log errors to track patterns and improve' },
        { emoji: '🦅', text: 'If you miss days, the Recovery wizard has your back' }
      ]
    }
  ];

  const currentStep = $derived(steps[step - 1]);

  function next() {
    if (step < 3) {
      direction = 1;
      step++;
    } else {
      fadeOut = true;
      setTimeout(() => onComplete(), 300);
    }
  }

  function skip() {
    fadeOut = true;
    setTimeout(() => onComplete(), 300);
  }
</script>

<div
  class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 {fadeOut ? 'opacity-0' : 'opacity-100'}"
  role="dialog"
  aria-modal="true"
  aria-label="Onboarding"
>
  <div class="bg-base-200 border border-red-900/40 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 {fadeOut ? 'scale-95' : 'scale-100'}">
    <!-- Header -->
    <div class="p-6 pb-2 text-center">
      <div class="text-5xl mb-3">{currentStep.icon}</div>
      <h2 class="text-2xl font-bold">{currentStep.title}</h2>
      <p class="text-sm text-red-400 mt-1">{currentStep.subtitle}</p>
    </div>

    <!-- Content -->
    {#key step}
      <div class="px-6 py-4" transition:fly={{ x: direction * 20, duration: 250 }}>
        <p class="text-sm text-gray-400 mb-4">{currentStep.description}</p>

        <div class="space-y-3">
          {#each currentStep.highlights as item}
            <div class="flex items-start gap-3 p-2.5 bg-base-300/50 rounded-lg">
              <span class="text-lg shrink-0">{item.emoji}</span>
              <span class="text-sm text-gray-300">{item.text}</span>
            </div>
          {/each}
        </div>
    </div>
    {/key}

    <!-- Step indicators -->
    <div class="flex justify-center gap-2 py-3">
      {#each steps as _, i}
        <button
          class="w-2 h-2 rounded-full transition-all duration-300 {i + 1 === step ? 'bg-red-500 w-6' : 'bg-gray-600'}"
          onclick={() => { direction = (i + 1) > step ? 1 : -1; step = i + 1; }}
          aria-label="Step {i + 1}"
        ></button>
      {/each}
    </div>

    <!-- Footer -->
    <div class="p-6 pt-2 flex gap-3 items-center">
      <button
        class="btn btn-ghost btn-sm text-gray-500"
        onclick={skip}
      >
        {step < 3 ? 'Skip tour' : ''}
      </button>
      <button
        class="btn btn-error flex-1"
        onclick={next}
      >
        {step < 3 ? 'Next →' : 'Start Learning! 🚀'}
      </button>
    </div>
  </div>
</div>
