import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../../components/Footer';
import { SUGGEST_FORM_URL } from '../../constants';

describe('Footer', () => {
  it('renders the Contribute section heading', () => {
    render(<Footer />);
    expect(screen.getByText('Contribute')).toBeInTheDocument();
  });

  it('renders the Suggest a Resource link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Suggest a Resource' });
    expect(link).toBeInTheDocument();
  });

  it('Suggest a Resource link points to the correct form URL', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Suggest a Resource' });
    expect(link).toHaveAttribute('href', SUGGEST_FORM_URL);
  });

  it('renders the GitHub link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/Tortoise-AI/Project-Delivery-Toolkit');
  });

  it('external links in Contribute section open in a new tab', () => {
    render(<Footer />);
    const suggestLink = screen.getByRole('link', { name: 'Suggest a Resource' });
    const githubLink = screen.getByRole('link', { name: 'GitHub' });

    expect(suggestLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('external links in Contribute section have rel="noreferrer"', () => {
    render(<Footer />);
    const suggestLink = screen.getByRole('link', { name: 'Suggest a Resource' });
    const githubLink = screen.getByRole('link', { name: 'GitHub' });

    expect(suggestLink).toHaveAttribute('rel', 'noreferrer');
    expect(githubLink).toHaveAttribute('rel', 'noreferrer');
  });
});
