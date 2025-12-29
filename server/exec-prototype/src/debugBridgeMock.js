// Simple mock debug bridge that emits snapshots for a session

function makeSnapshots(code) {
  // naive: count lines and produce snapshots stepping through lines
  const lines = (code || '').split('\n').length || 1;
  const snapshots = [];
  for (let i = 1; i <= lines && i <= 50; i++) {
    snapshots.push({
      line: i,
      vars: { i, sample: `val${i}` },
      stack: [{ id: 'fn', name: 'mockFn', variables: [{ name: 'i', value: i }] }],
      heap: [],
      event: 'step'
    });
  }
  snapshots.push({ line: null, event: 'end', result: null });
  return snapshots;
}

module.exports = { makeSnapshots };
