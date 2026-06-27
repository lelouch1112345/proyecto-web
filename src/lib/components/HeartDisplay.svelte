<script lang="ts">
  import { MAX_HEARTS } from '$lib/constants';

  interface Props {
    current: number;
    max?: number;
    breakMode?: boolean;
  }

  let { current, max = MAX_HEARTS, breakMode = false }: Props = $props();

  $effect(() => {
    // Reactively update when props change
  });
</script>

<div class="flex items-center gap-0.5" title="{current}/{max} hearts">
  {#each Array(max) as _, i}
    {#if i < current}
      <span class="text-lg transition-all duration-300 {breakMode ? 'opacity-50' : ''}">❤️</span>
    {:else}
      <span class="text-lg opacity-30">🖤</span>
    {/if}
  {/each}
</div>
