#!/usr/bin/env node
/**
 * Usage: set VERCEL_TOKEN and VERCEL_PROJECT (name) in env or tmp/.env
 * Then run: node scripts/vercel_apply_envs.js
 * The script reads values from process.env for the keys below and creates/updates them in the project.
 */
import fs from 'fs';
import path from 'path';
// use global fetch available in Node 18+
import dotenv from 'dotenv';

dotenv.config({ path: './tmp/.env' });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT;
const TEAM = process.env.VERCEL_TEAM; // optional

if (!VERCEL_TOKEN || !PROJECT) {
  console.error('Set VERCEL_TOKEN and VERCEL_PROJECT (project name) in env or tmp/.env');
  process.exit(1);
}

const API = 'https://api.vercel.com';

const envKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PRO_MONTHLY_USD',
  'STRIPE_PRICE_BATTLE_PASS',
  'PUBLIC_BASE_URL'
];

async function api(pathSuffix, opts={}){
  const url = API + pathSuffix + (TEAM ? `?teamId=${TEAM}` : '');
  const res = await fetch(url, Object.assign({ headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' } }, opts));
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vercel API ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

async function getProject(){
  return api(`/v9/projects/${encodeURIComponent(PROJECT)}`);
}

async function listEnv(projectId){
  return api(`/v2/projects/${projectId}/env`);
}

async function removeEnv(projectId, envId){
  return api(`/v2/projects/${projectId}/env/${envId}`, { method: 'DELETE' });
}

async function createEnv(projectId, key, value){
  const body = { key, value: String(value), target: ['production','preview'], type: 'encrypted' };
  return api(`/v2/projects/${projectId}/env`, { method: 'POST', body: JSON.stringify(body) });
}

async function main(){
  const proj = await getProject();
  const projectId = proj.id || proj.uid || proj.projectId || proj.name;
  console.log('Project resolved:', proj.name, projectId);

  const existing = await listEnv(projectId);
  const byKey = new Map((existing.envs || existing).map(e=>[e.key,e]));

  for (const k of envKeys){
    const v = process.env[k];
    if (typeof v === 'undefined') {
      console.log('Skipping', k, '- not set in environment');
      continue;
    }
    if (byKey.has(k)){
      const e = byKey.get(k);
      console.log('Updating', k, ' (deleting old id', e.uid || e.id || e.key, ')');
      try { await removeEnv(projectId, e.uid || e.id); } catch(err){ console.warn('delete failed, continuing', err.message); }
    }
    console.log('Creating', k);
    await createEnv(projectId, k, v);
    console.log('Created', k);
  }

  console.log('All done. Please redeploy the project from Vercel dashboard or via CLI to pick up new envs.');
}

main().catch(err=>{ console.error('ERROR', err && (err.stack||err.message||err)); process.exit(2); });
