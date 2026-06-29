// ────────────────────────────────────────────────────────────────
// Tests: Component Animation Triggers
// Verifies animation classes are applied on state changes
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import type { Task } from '$lib/types';
import XpBar from '$lib/components/XpBar.svelte';
import HeartDisplay from '$lib/components/HeartDisplay.svelte';
import TaskCard from '$lib/components/TaskCard.svelte';
import EmptyState from '$lib/components/EmptyState.svelte';

// ─── XpBar ───

describe('XpBar animation', () => {
  it('renders without animate-glow class initially', () => {
    const { container } = render(XpBar, { props: { totalXp: 100 } });
    const bar = container.querySelector('.bg-gradient-to-r');
    expect(bar).not.toHaveClass('animate-glow');
  });

  it('has the transition class for smooth width animation', () => {
    const { container } = render(XpBar, { props: { totalXp: 100 } });
    const bar = container.querySelector('.bg-gradient-to-r');
    expect(bar).toHaveClass('transition-all');
  });

  it('displays correct XP text', () => {
    const { container } = render(XpBar, { props: { totalXp: 250 } });
    expect(container.textContent).toContain('250 XP');
  });

  it('sets progress bar width based on totalXp', () => {
    const { container } = render(XpBar, { props: { totalXp: 50 } });
    const bar = container.querySelector('.bg-gradient-to-r');
    expect(bar).toHaveStyle({ width: '50%' });
  });
});

// ─── HeartDisplay ───

describe('HeartDisplay animation', () => {
  it('renders the correct number of hearts', () => {
    const { container } = render(HeartDisplay, { props: { current: 3, max: 5 } });
    const hearts = container.querySelectorAll('span.text-lg');
    expect(hearts.length).toBe(5); // max hearts
    // 3 filled hearts
    const filledHearts = container.querySelectorAll('.opacity-30');
    expect(filledHearts.length).toBe(2); // 5 - 3
  });

  it('has transition-all class for smooth heart changes', () => {
    const { container } = render(HeartDisplay, { props: { current: 3 } });
    const hearts = container.querySelectorAll('span.text-lg');
    expect(hearts[0]).toHaveClass('transition-all');
  });

  it('shows correct title attribute', () => {
    const { container } = render(HeartDisplay, { props: { current: 2, max: 5 } });
    const div = container.querySelector('.flex');
    expect(div).toHaveAttribute('title', '2/5 hearts');
  });

  it('applies opacity reduction to filled hearts in break mode', () => {
    const { container } = render(HeartDisplay, { props: { current: 2, max: 5, breakMode: true } });
    // Filled hearts are the first `current` spans (indices 0, 1)
    const hearts = container.querySelectorAll('span.text-lg');
    for (let i = 0; i < 2; i++) {
      expect(hearts[i].className).toContain('opacity-50');
    }
  });
});

// ─── TaskCard ───

describe('TaskCard animation', () => {
  const mockTask: Task = {
    id: 'test-1',
    dayId: 'day-1',
    discipline: 'english',
    category: 'reading',
    difficulty: 'medium',
    description: 'Read a chapter',
    durationMin: 20
  };

  it('renders without animate-check class when not completed', () => {
    const { container } = render(TaskCard, {
      props: {
        task: mockTask,
        completed: false,
        onComplete: () => {},
        onUncomplete: () => {}
      }
    });
    const checkbox = container.querySelector('.checkbox');
    expect(checkbox).not.toHaveClass('animate-check');
  });

  it('has animate-check class when completed', () => {
    const { container } = render(TaskCard, {
      props: {
        task: mockTask,
        completed: true,
        onComplete: () => {},
        onUncomplete: () => {}
      }
    });
    const checkbox = container.querySelector('.checkbox');
    expect(checkbox).toHaveClass('animate-check');
  });

  it('shows checkbox-success class when completed', () => {
    const { container } = render(TaskCard, {
      props: {
        task: mockTask,
        completed: true,
        onComplete: () => {},
        onUncomplete: () => {}
      }
    });
    const checkbox = container.querySelector('.checkbox');
    expect(checkbox).toHaveClass('checkbox-success');
  });

  it('has transition class on card container', () => {
    const { container } = render(TaskCard, {
      props: {
        task: mockTask,
        completed: false,
        onComplete: () => {},
        onUncomplete: () => {}
      }
    });
    const card = container.querySelector('.card');
    expect(card).toHaveClass('transition-all');
  });
});

// ─── EmptyState ───

describe('EmptyState animation', () => {
  it('renders title and description', () => {
    const { container } = render(EmptyState, {
      props: {
        title: 'No Data',
        description: 'Nothing to show'
      }
    });
    expect(container.textContent).toContain('No Data');
    expect(container.textContent).toContain('Nothing to show');
  });

  it('renders icon with emoji', () => {
    const { container } = render(EmptyState, {
      props: {
        icon: '📋',
        title: 'Test'
      }
    });
    const iconDiv = container.querySelector('.text-6xl');
    expect(iconDiv).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const { container } = render(EmptyState, {
      props: {
        title: 'Test',
        action: { label: 'Go Back', href: '/home' }
      }
    });
    const link = container.querySelector('a');
    expect(link).toHaveTextContent('Go Back');
    expect(link).toHaveAttribute('href', '/home');
  });
});
