import { promises as fs } from 'fs';
import path from 'path';
import { GameProjectSchema } from '@/types/project-content';

const CONTENT_DIR = path.resolve('src/content/projects/games');
const TIMEOUT_MS = 10_000;

type LinkResult = {
  game: string;
  platform: string;
  url: string;
  status: 'ok' | 'dead' | 'error';
  detail: string;
};

async function checkUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'miresu-LinkChecker/1.0' },
    });

    // Some stores block HEAD — retry with GET
    if (res.status === 405 || res.status === 403) {
      const getRes = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'miresu-LinkChecker/1.0' },
      });
      return { ok: getRes.ok, detail: `GET ${getRes.status}` };
    }

    return { ok: res.ok, detail: `${res.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: message };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith('.json'));
  const results: LinkResult[] = [];

  for (const file of files) {
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
    const parsed = GameProjectSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) continue;

    const game = parsed.data;
    if (!game.storeLinks?.length) continue;

    for (const link of game.storeLinks) {
      const { ok, detail } = await checkUrl(link.url);
      results.push({
        game: game.slug,
        platform: link.platform,
        url: link.url,
        status: ok ? 'ok' : link.enabled === false ? 'dead' : 'error',
        detail,
      });
    }
  }

  // Report
  const alive = results.filter((r) => r.status === 'ok');
  const dead = results.filter((r) => r.status !== 'ok');

  console.log(`\nStore Link Health Check`);
  console.log(`${'='.repeat(50)}`);

  for (const r of alive) {
    console.log(`  ✔ ${r.game} / ${r.platform} — ${r.detail}`);
  }

  if (dead.length > 0) {
    console.log(`\n  Dead or unreachable links:`);
    for (const r of dead) {
      const flag = r.status === 'dead' ? '(already disabled)' : '⚠ NEEDS ATTENTION';
      console.log(`  ✖ ${r.game} / ${r.platform} — ${r.detail} ${flag}`);
      console.log(`    ${r.url}`);
    }
    console.log(`\nTo disable a dead link, set "enabled": false in the game's JSON file.`);
  }

  console.log(`\n${alive.length} ok, ${dead.length} dead/unreachable\n`);

  if (dead.some((r) => r.status === 'error')) {
    process.exitCode = 1;
  }
}

main();
