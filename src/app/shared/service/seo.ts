import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Origen canónico oficial del sitio (con `www`). */
export const SITE_ORIGIN = 'https://www.joseluismadrid.com';

/**
 * Metadescripción por defecto. Coincide con la declarada en `index.html` para
 * que el HTML previo a la hidratación ya sea correcto.
 */
export const DEFAULT_DESCRIPTION =
  'Portafolio de José Luis Madrid Londoño, desarrollador de software Full Stack especializado en desarrollo web, aplicaciones modernas, APIs REST y soluciones tecnológicas.';

export interface SeoPageMeta {
  /** Descripción de la página. Si se omite se usa `DEFAULT_DESCRIPTION`. */
  description?: string;
  /** Título de la página. Si se omite se respeta el título del documento. */
  title?: string;
  /**
   * `false` para páginas que no deben declarar una URL canónica propia, como
   * la página 404, que responde con estado 404 y no debe indexarse.
   */
  canonical?: boolean;
}

/**
 * Mantiene sincronizados con la ruta activa los metadatos que el router no
 * gestiona por sí solo: `link[rel=canonical]`, `og:url`, la metadescripción y
 * los títulos de las tarjetas sociales.
 *
 * Sin este servicio las 5 páginas prerenderizadas comparten la canónica del
 * root, lo que impide a los buscadores consolidar cada URL por separado.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.applyToActiveRoute(event.urlAfterRedirects));
  }

  /**
   * Aplica los metadatos para una URL concreta.
   * Es público para poder verificarlo en pruebas sin depender del router.
   */
  apply(url: string, meta: SeoPageMeta = {}): void {
    const { description = DEFAULT_DESCRIPTION, title, canonical = true } = meta;

    if (canonical) {
      const canonicalUrl = this.canonicalUrl(url);

      this.setCanonical(canonicalUrl);
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    } else {
      this.clearCanonical();
      this.meta.removeTag('property="og:url"');
    }

    this.setDescriptions(description);

    if (title) {
      this.setSocialTitles(title);
    }
  }

  /** Normaliza cualquier URL interna a su forma canónica absoluta. */
  private canonicalUrl(url: string): string {
    const [path] = url.split(/[?#]/);
    const normalized = path.replace(/\/+$/, '');

    return normalized ? `${SITE_ORIGIN}${normalized}` : `${SITE_ORIGIN}/`;
  }

  private setCanonical(canonical: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', canonical);
  }

  private clearCanonical(): void {
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }

  private setDescriptions(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  private setSocialTitles(pageTitle: string): void {
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
  }

  private applyToActiveRoute(url: string): void {
    const route = this.deepestRoute(this.router.routerState.snapshot.root);
    const routeTitle = route.title;

    if (routeTitle) {
      // Garantiza que el `<title>` y las tarjetas sociales no diverjan.
      this.title.setTitle(routeTitle);
    }

    this.apply(url, {
      description: this.descriptionOf(route),
      title: routeTitle ?? this.title.getTitle(),
      canonical: route.data['noCanonical'] !== true,
    });
  }

  private deepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;

    while (current.firstChild) {
      current = current.firstChild;
    }

    return current;
  }

  /** El último `data.description` definido en el árbol de rutas gana. */
  private descriptionOf(route: ActivatedRouteSnapshot): string {
    let description = DEFAULT_DESCRIPTION;

    for (const snapshot of route.pathFromRoot) {
      const value = snapshot.data['description'];

      if (typeof value === 'string') {
        description = value;
      }
    }

    return description;
  }
}
