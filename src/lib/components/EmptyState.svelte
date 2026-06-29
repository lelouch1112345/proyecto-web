<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Tone } from '$lib/i18n';

  interface Props {
    icon?: string;
    title: string;
    description?: string;
    action?: { label: string; href: string };
    tone?: Tone;
  }

  let { icon = '📋', title, description, action, tone = 'neutral' }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center h-64 text-center px-4"
  transition:fly={{ y: 20, duration: 300 }}
>
  <div class="text-6xl mb-4">{icon}</div>
  <h2 class="text-2xl font-bold text-gray-400 mb-2">{title}</h2>
  {#if description}
    <p class="text-gray-500 max-w-md mb-4">{description}</p>
  {/if}
  {#if action}
    <a href={action.href} class="btn btn-outline btn-error">
      {action.label}
    </a>
  {/if}
</div>
