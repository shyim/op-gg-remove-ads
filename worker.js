export default {
    async fetch(request, env) {
      const pathName = new URL(request.url).pathname;
      const res = await fetch(`https://opgg-desktop-data.akamaized.net/${pathName}`);
  
      const headers = new Headers();
      for (var pair of res.headers.entries()) {
        headers.set(pair[0], pair[1]);
      }
  
      if (pathName.endsWith('.js') || pathName.endsWith('.css') || pathName.endsWith('.html')) {
        
        let content = await res.text();
  
        content = content.replaceAll('https://opgg-desktop-data.akamaized.net', "https://op-gg-remove-ads.shyim.workers.dev");
        content = content.replaceAll(/<body>.*<\/body>/gm, 'TEST');
        content = content.replaceAll('https://www.mobwithad.com', 'https://google.com');
        content += '\ndocument.head.insertAdjacentHTML("beforeend", \'<style>#ads-container,#ads-container2,#ads-container3,#sids-ads{display: none !important}</style>\')';
  
        return new Response(content, {
          statusCode: res.statusCode,
          headers
        });
      }
  
      return new Response(res.body, {
        statusCode: res.statusCode,
        headers
      })
    }
  }