import Application from '../Application.ts';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { MinimalRepository } from '../types/github.ts';

export async function githubPaginate<T>(url: string, config: AxiosRequestConfig = {}): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | undefined = url;
  const params = { ...config.params, per_page: config.params?.per_page ?? 100 };

  while (nextUrl) {
    const response: AxiosResponse<T[]> = await Application.request<T[]>(nextUrl, {
      ...config,
      params: nextUrl === url ? params : undefined
    });
    if (Array.isArray(response.data)) results.push(...response.data);
    if (!response.headers) break;
    const linkHeader: string | undefined = response.headers.link;
    if (!linkHeader) break;

    const nextLink = linkHeader
      .split(',')
      .map((link) => link.trim())
      .find((link) => /;\s*rel="next"/i.test(link));
    nextUrl = nextLink?.match(/<([^>]+)>/)?.[1];
  }

  return results;
}

export async function getRepoCount() {
  const cached = Application.cache.get<number>('github:repo:count');
  if (cached) return cached;
  const repos = await githubPaginate<MinimalRepository>('https://api.github.com/orgs/polyfrost/repos', {
    headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' }
  });
  return Application.cache.set<number>('github:repo:count', repos.length);
}
