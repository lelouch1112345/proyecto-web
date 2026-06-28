<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { planRepo, heartRepo, errorLogRepo } from '$lib/db';
  import { RECOVERY_PROTOCOLS, GRACE_WINDOW_HOURS } from '$lib/constants';
  import { genId, today, now } from '$lib/utils/id';

  let step = $state(1);
  let missedDays = $state<number | null>(null);
  let validationError = $state<string | null>(null);
  let processing = $state(false);
  let recovered = $state(false);
  let activePlanStartDate = $state<string>('');

  onMount(async () => {
    const plan = await planRepo.getActive();
    if (plan) {
      activePlanStartDate = plan.startDate;
    }
  });

  function getProtocol(): string {
    if (missedDays === null) return '';
    if (missedDays <= 2) return '1-2';
    if (missedDays <= 5) return '3-5';
    if (missedDays <= 13) return '6-13';
    return 'burnout';
  }

  function handleSubmit() {
    validationError = null;
    if (missedDays === null || missedDays < 1) {
      validationError = 'Must be at least 1 day';
      return;
    }
    if (missedDays > 84) {
      validationError = 'Maximum 84 days';
      return;
    }
    step = 2;
  }

  async function handleConfirm() {
    if (missedDays === null) return;
    processing = true;
    try {
      const plan = await planRepo.getActive();
      if (!plan) {
        validationError = 'No active plan found';
        processing = false;
        return;
      }

      const protocolKey = getProtocol();
      const isBurnout = protocolKey === 'burnout';

      // 1. Shift plan dates forward by missed days
      const currentStart = new Date(plan.startDate);
      currentStart.setDate(currentStart.getDate() + missedDays);
      plan.startDate = currentStart.toISOString().split('T')[0];
      await planRepo.save(plan);

      // 2. Apply heart penalty
      const heartState = await heartRepo.getState();
      if (heartState) {
        if (isBurnout) {
          // Burnout: reset to 3 hearts
          await heartRepo.resetTo(3);
        } else if (missedDays > 2) {
          // Standard: deduct hearts after 48h grace
          const penalty = Math.max(0, (missedDays ?? 0) - 2);
          const newHearts = Math.max(0, heartState.current - penalty);
          await heartRepo.resetTo(newHearts);
        }
      }

      // 3. Log recovery event to error log
      await errorLogRepo.save({
        id: genId(),
        date: today(),
        category: 'R',
        description: `Recovery: ${missedDays} day${missedDays !== 1 ? 's' : ''} missed`,
        details: `Protocol: ${protocolKey}. Plan dates shifted by ${missedDays} day${missedDays !== 1 ? 's' : ''}.`,
        correction: isBurnout
          ? 'Full reset protocol applied — restart from Day 1'
          : `Date shift: +${missedDays} day${missedDays !== 1 ? 's' : ''}. Hearts adjusted.`,
        resolved: true,
        createdAt: now()
      });

      recovered = true;
      step = 3;
    } catch (e) {
      console.error('Recovery failed:', e);
      validationError = 'Failed to process recovery. Please try again.';
    } finally {
      processing = false;
    }
  }

  function handleReset() {
    step = 1;
    missedDays = null;
    validationError = null;
    recovered = false;
  }

  const protocol = $derived(getProtocol());
  const protocolData = $derived(
    protocol ? RECOVERY_PROTOCOLS[protocol as keyof typeof RECOVERY_PROTOCOLS] : null
  );

  const motMessage = $derived(protocol === 'burnout'
    ? 'No importa cuántas veces te caigas — lo importante es cuántas veces te levantas. 🦅'
    : protocol === '6-13'
    ? 'Cada día es una nueva oportunidad. Vuelve al ruedo. 💪'
    : 'Los tropiezos son parte del camino. Seguí adelante. 🔥');
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Emergency Recovery</h1>

  <!-- Progress Steps -->
  <ul class="steps steps-horizontal w-full">
    <li class="step {step >= 1 ? 'step-error' : ''}">Missed Days</li>
    <li class="step {step >= 2 ? 'step-error' : ''}">Protocol</li>
    <li class="step {step >= 3 ? 'step-error' : ''}">Confirm</li>
  </ul>

  {#if step === 1}
    <!-- Step 1: Input missed days -->
    <div class="card bg-base-200 border border-red-900/20 p-6 max-w-md mx-auto">
      <h2 class="text-xl font-bold mb-2">How many days did you miss?</h2>
      <p class="text-sm text-gray-400 mb-4">Enter the number of consecutive days you missed (1-84)</p>
      <p class="text-xs text-gray-600 mb-4 italic">
        Current plan start: {activePlanStartDate || 'Not loaded'}
      </p>

      <input
        type="number"
        min="1"
        max="84"
        bind:value={missedDays}
        placeholder="e.g. 3"
        class="input input-bordered input-error w-full mb-2"
      />

      {#if validationError}
        <p class="text-red-400 text-sm mb-2">{validationError}</p>
      {/if}

      <div class="text-sm text-gray-500 mb-4 p-3 bg-base-300 rounded-lg">
        <p class="font-bold mb-1">Protocol guide:</p>
        <ul class="space-y-0.5">
          <li>1–2 days &rarr; Light catch-up (no date shift)</li>
          <li>3–5 days &rarr; Standard recovery</li>
          <li>6–13 days &rarr; Extended recovery + date shift</li>
          <li>14+ days &rarr; Full reset (Burnout) &mdash; keep XP/achievements</li>
        </ul>
      </div>

      <button class="btn btn-error w-full" onclick={handleSubmit}>Continue</button>
    </div>

  {:else if step === 2}
    <!-- Step 2: Show Protocol -->
    {#if protocolData}
      <div class="card bg-base-200 border border-red-900/20 p-6 max-w-lg mx-auto">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">{protocol === 'burnout' ? '&#129396;' : '&#128170;'}</span>
          <div>
            <h2 class="text-xl font-bold">{protocolData.label}</h2>
            <p class="text-sm text-gray-400">{protocolData.description}</p>
          </div>
        </div>

        <!-- Motivational message -->
        <div class="alert alert-info mb-4 text-sm italic border-blue-900/30 bg-blue-950/30">
          {motMessage}
        </div>

        {#if missedDays && missedDays > 2}
          <div class="alert alert-warning mb-4 text-sm">
            Heart penalty: -{Math.max(0, missedDays - 2)} hearts (48h grace applied)
          </div>
        {/if}

        {#if protocol === 'burnout'}
          <div class="alert alert-success mb-4 text-sm">
            🦅 Fénix achievement hint: recover from burnout to earn it.
          </div>
        {/if}

        <div class="space-y-2 mb-6">
          {#each protocolData.instructions as instruction}
            <div class="flex gap-2 text-sm">
              <span class="text-red-400 mt-0.5">&#8226;</span>
              <span>{instruction}</span>
            </div>
          {/each}
        </div>

        <div class="flex gap-3">
          <button class="btn btn-outline btn-error flex-1" onclick={handleReset}>Back</button>
          <button
            class="btn btn-error flex-1"
            onclick={handleConfirm}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm Recovery'}
          </button>
        </div>
      </div>
    {/if}

  {:else if step === 3}
    <!-- Step 3: Confirmation -->
    <div class="card bg-base-200 border border-green-800/30 p-6 max-w-lg mx-auto text-center">
      <div class="text-5xl mb-4">&#9989;</div>
      <h2 class="text-2xl font-bold text-green-400 mb-2">Recovery Complete</h2>
      <p class="text-gray-400 mb-4">
        {#if protocol === 'burnout'}
          Plan reset to Day 1. Your XP, achievements, and streak history are preserved.
        {:else}
          Future dates shifted by {missedDays} day{missedDays !== 1 ? 's' : ''}.
        {/if}
      </p>
      <p class="text-sm text-gray-500 mb-2 italic">
        {protocol === 'burnout'
          ? 'La única derrota verdadera es no intentarlo de nuevo.'
          : 'No importa cuántas veces te caigas — lo importante es cuántas veces te levantas.'}
      </p>
      <p class="text-xs text-gray-600 mb-6">
        Recovery logged to error log (category R). Heart penalty applied.
      </p>
      <div class="flex gap-3 justify-center">
        <a href={base} class="btn btn-error">Back to Dashboard</a>
        <button class="btn btn-outline btn-error" onclick={handleReset}>Start Over</button>
      </div>
    </div>
  {/if}
</div>
