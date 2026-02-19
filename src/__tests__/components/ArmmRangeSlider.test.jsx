import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../data/resources.json', () => ({
  default: [
    {
      id: 'resource-1',
      title: 'Mission Critical Playbook',
      url: 'https://example.com/mission',
      description: 'Level 4 resource',
      personas: ['Project'],
      barriers: ['leadership-and-alignment.fragmented-governance'],
      barrier_category: 'leadership-and-alignment',
      tags: ['playbook'],
      armm_level: 'Level 4: Mission-Critical',
    },
    {
      id: 'resource-2',
      title: 'Experimenting Starter Guide',
      url: 'https://example.com/starter',
      description: 'Level 0 resource',
      personas: ['Business'],
      barriers: ['leadership-and-alignment.fragmented-governance'],
      barrier_category: 'leadership-and-alignment',
      tags: ['starter'],
      armm_level: 'Level 0: Experimenting',
    },
  ],
}));

vi.mock('../../data/barrier_themes.json', () => ({
  default: [
    {
      id: 'leadership-and-alignment',
      name: 'Leadership & Alignment',
      order: '1',
    },
  ],
}));

vi.mock('../../data/barriers.json', () => ({
  default: [
    {
      id: 'leadership-and-alignment.fragmented-governance',
      name: 'Fragmented governance',
      themeId: 'leadership-and-alignment',
    },
  ],
}));

vi.mock('../../utils/serviceWorkerRegistration', () => ({
  register: () => {},
}));

vi.mock('recharts', () => ({
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

import App from '../../App';

describe('ARMM slider overlap behavior', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('keeps max at level 4 when dragging left from an overlapped [4,4] state', () => {
    const { container } = render(<App />);
    const [minSlider, maxSlider] = container.querySelectorAll('input[type="range"]');

    fireEvent.change(minSlider, { target: { value: '4' } }); // [4,4]

    // Simulate continued drag events on the same overlapped (top) thumb.
    fireEvent.change(maxSlider, { target: { value: '3' } });
    fireEvent.change(maxSlider, { target: { value: '3' } });

    expect(screen.getByText('L3: Resilient')).toBeInTheDocument();
    expect(screen.getByText('L4: Mission-Critical')).toBeInTheDocument();
    expect(screen.queryAllByText('L3: Resilient')).toHaveLength(1);
  });

  it('keeps min at level 0 when dragging right from an overlapped [0,0] state', () => {
    const { container } = render(<App />);
    const [minSlider, maxSlider] = container.querySelectorAll('input[type="range"]');

    fireEvent.change(maxSlider, { target: { value: '0' } }); // [0,0]

    // Simulate continued drag events on the same overlapped thumb.
    fireEvent.change(minSlider, { target: { value: '1' } });
    fireEvent.change(minSlider, { target: { value: '1' } });

    expect(screen.getByText('L0: Experimenting')).toBeInTheDocument();
    expect(screen.getByText('L1: Supervised')).toBeInTheDocument();
    expect(screen.queryAllByText('L1: Supervised')).toHaveLength(1);
  });
});
