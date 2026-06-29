import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/proyecto-web';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/ik/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
  });

  // 1. Dashboard
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/anim-dashboard.png', fullPage: true });
  console.log('✅ Dashboard loaded — /tmp/anim-dashboard.png');

  const bodyText = await page.locator('body').innerText();
  const hasTasks = bodyText.includes('Day') || bodyText.includes('tarea') || bodyText.includes('Tarea');
  const hasEmpty = bodyText.includes('No hay') || bodyText.includes('empty') || bodyText.includes('Empty');
  console.log(`  Content: tasks=${hasTasks}, empty=${hasEmpty}`);

  // 2. Plan page
  const planLink = page.locator('a').filter({ hasText: /Plan|plan|Study|study/i });
  const planCount = await planLink.count();
  console.log(`  Plan links found: ${planCount}`);
  if (planCount > 0) {
    await planLink.first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/anim-plan.png', fullPage: true });
    console.log('✅ Plan page — /tmp/anim-plan.png');
  }

  // 3. Achievements  
  const achLink = page.locator('a').filter({ hasText: /Achievements|achievements|Logros|logros|Logros/i });
  const achCount = await achLink.count();
  console.log(`  Achievements links found: ${achCount}`);
  if (achCount > 0) {
    await achLink.first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/anim-achievements.png', fullPage: true });
    console.log('✅ Achievements page — /tmp/anim-achievements.png');
  }

  // 4. Errors
  const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('manifest'));
  console.log(`\nConsole errors (non-favicon/manifest): ${realErrors.length}`);
  realErrors.forEach(e => console.log(`  ${e}`));

  await browser.close();
  console.log('\n✅ Animation visual test complete');
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
