<script lang="ts">
  import { RECOVERY_PROTOCOLS } from '$lib/constants';

  let step = $state(1);
  let missedDays = $state<number | null>(null);
  let validationError = $state<string | null>(null);

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

  function handleConfirm() {
    step = 3;
  }

  function handleReset() {
    step = 1;
    missedDays = null;
    validationError = null;
  }

  const protocol = $derived(getProtocol());
  const protocolData = $derived(
    protocol ? RECOVERY_PROTOCOLS[protocol as keyof typeof RECOVERY_PROTOCOLS] : null
  );
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

        {#if missedDays && missedDays > 2}
          <div class="alert alert-warning mb-4 text-sm">
            Heart penalty: -{missedDays} hearts (after 48h grace window)
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
          <button class="btn btn-error flex-1" onclick={handleConfirm}>Confirm Recovery</button>
        </div>
      </div>
    {/if}

  {:else if step === 3}
    <!-- Step 3: Confirmation -->
    <div class="card bg-base-200 border border-green-800/30 p-6 max-w-lg mx-auto text-center">
      <div class="text-5xl mb-4">&#9989;</div>
      <h2 class="text-2xl font-bold text-green-400 mb-2">Recovery Logged</h2>
      <p class="text-gray-400 mb-2">
        Future dates have been shifted by {missedDays} day{missedDays !== 1 ? 's' : ''}.
      </p>
      <p class="text-sm text-gray-500 mb-6">
        Logged to error log with category R (Recovery). Keep going.
      </p>
      <div class="flex gap-3 justify-center">
        <a href="/" class="btn btn-error">Back to Dashboard</a>
        <button class="btn btn-outline btn-error" onclick={handleReset}>Start Over</button>
      </div>
    </div>
  {/if}
</div>
