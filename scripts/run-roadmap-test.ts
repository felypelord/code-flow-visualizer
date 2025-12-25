import { getRoadmap, getRoadmapItem } from '../api/roadmap/index';

async function run() {
  const fakeRes = { json: (d: any) => console.log(JSON.stringify(d, null, 2)) } as any;
  console.log('--- GET ROADMAP ---');
  await getRoadmap({} as any, fakeRes);
  console.log('--- GET ROADMAP ITEM (binary-search) ---');
  await getRoadmapItem({ params: { slug: 'binary-search' } } as any, fakeRes);
}

run().catch(e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
