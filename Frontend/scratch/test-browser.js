import http from 'node:http';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  console.log('--- FETCHING ROOT HTML ---');
  const root = await fetchUrl('http://localhost:8080/');
  console.log('Root HTML Status:', root.status);

  console.log('\n--- FETCHING MAIN.TSX ---');
  const main = await fetchUrl('http://localhost:8080/src/main.tsx');
  console.log('Main.tsx Status:', main.status);
  console.log('Main.tsx content:\n', main.data);

  console.log('\n--- FETCHING APP.TSX ---');
  const app = await fetchUrl('http://localhost:8080/src/App.tsx');
  console.log('App.tsx Status:', app.status);

  console.log('\n--- FETCHING INDEX.CSS ---');
  const css = await fetchUrl('http://localhost:8080/src/index.css');
  console.log('Index.css Status:', css.status);

  console.log('\n--- TESTING MODULE IMPORTS ---');
  const react = await fetchUrl('http://localhost:8080/node_modules/.vite/deps/react.js');
  console.log('react.js Status:', react.status);

  const reactDom = await fetchUrl('http://localhost:8080/node_modules/.vite/deps/react-dom_client.js');
  console.log('react-dom_client.js Status:', reactDom.status);
}

test().catch(console.error);
