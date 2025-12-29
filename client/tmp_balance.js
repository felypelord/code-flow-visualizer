const fs = require('fs');
const path = 'src/pages/library.tsx';
let s = fs.readFileSync(path,'utf8');
// remove template literal content {`...`} and regular backtick templates
s = s.replace(/\{\`[\s\S]*?\`\}/g, '{}');
// remove JSX expressions {...}
s = s.replace(/\{[\s\S]*?\}/g, '{}');
// remove strings "..." and '...'
s = s.replace(/"[^"]*"/g,'""').replace(/'[^']*'/g, "''");
const tagRe = /<\/??([A-Za-z0-9_-]+)([^>]*)>/g;
let m;
const stack = [];
const report = [];
let line = 1;
const lines = s.split('\n');
for(let i=0;i<lines.length;i++){
  const L = lines[i];
  let col = 1;
  while((m = tagRe.exec(L)) !== null){
    const full = m[0];
    const name = m[1];
    const isClose = full.startsWith('</');
    const selfClose = /\/\s*>$/.test(full);
    if(!isClose && !selfClose){
      stack.push({name,line:i+1,col:m.index+1});
    } else if(isClose){
      const top = stack.length?stack[stack.length-1]:null;
      if(top && top.name.toLowerCase()===name.toLowerCase()){
        stack.pop();
      } else {
        report.push({type:'mismatch', expected: top?top.name:null, found: name, atLine:i+1, col:m.index+1});
      }
    }
    col = m.index + full.length + 1;
  }
}
const out = {stack, report};
fs.writeFileSync('tmp_balance_report.json', JSON.stringify(out,null,2));
console.log('wrote tmp_balance_report.json');
