import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { SeoService } from './seo';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
    meta = TestBed.inject(Meta);
  });

  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    meta.removeTag('property="og:url"');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should declare a self-referencing canonical for a subpage', () => {
    service.apply('/about');

    expect(canonicalHref(document)).toBe('https://www.joseluismadrid.com/about');
  });

  it('should keep the root canonical pointing at the site origin', () => {
    service.apply('/');

    expect(canonicalHref(document)).toBe('https://www.joseluismadrid.com/');
  });

  it('should ignore query params and fragments when building the canonical', () => {
    service.apply('/projects?utm_source=newsletter#top');

    expect(canonicalHref(document)).toBe('https://www.joseluismadrid.com/projects');
  });

  it('should not declare a canonical for pages flagged as not indexable', () => {
    service.apply('/no-existe', { canonical: false });

    expect(canonicalHref(document)).toBeNull();
    expect(meta.getTag('property="og:url"')).toBeNull();
  });

  it('should synchronize description and social metadata', () => {
    service.apply('/skills', {
      description: 'Descripción de habilidades',
      title: 'Habilidades | Portafolio',
    });

    expect(meta.getTag('name="description"')?.content).toBe('Descripción de habilidades');
    expect(meta.getTag('property="og:description"')?.content).toBe('Descripción de habilidades');
    expect(meta.getTag('name="twitter:description"')?.content).toBe('Descripción de habilidades');
    expect(meta.getTag('property="og:url"')?.content).toBe('https://www.joseluismadrid.com/skills');
    expect(meta.getTag('property="og:title"')?.content).toBe('Habilidades | Portafolio');
    expect(meta.getTag('name="twitter:title"')?.content).toBe('Habilidades | Portafolio');
  });
});

function canonicalHref(document: Document): string | null {
  return (
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href') ??
    null
  );
}
