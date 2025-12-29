const fs = require('fs');
const s = fs.readFileSync('src/pages/library.tsx','utf8');
function findBalance(tag){
  const reOpen = new RegExp('<'+tag+'\\b','g');
  const reClose = new RegExp('<\\/'+tag+'>','g');
  return {tag, open:(s.match(reOpen)||[]).length, close:(s.match(reClose)||[]).length};
}
const tags = ['div','section','article','header','footer','aside','nav','pre','button','h3','h4','p','Layout'];
const res = tags.map(findBalance);
// rough all tags
const opens = (s.match(/<([A-Za-z0-9_-]+)([^>]*)>/g)||[]).length;
const closes = (s.match(/<\\/([A-Za-z0-9_-]+)>/g)||[]).length;
const out = {res, opens, closes};
fs.writeFileSync('tmp_tag_report.json', JSON.stringify(out, null, 2));
console.log('wrote tmp_tag_report.json');
