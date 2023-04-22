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
      content = content.replaceAll('location.href="https://app.labs.sydney', 'location.href2="https://app.labs.sydney');
      content = content.replaceAll('https://app.labs.sydney', "https://op-gg-remove-ads.shyim.workers.dev");

      if (pathName.endsWith('.js')) {
          content = content.replaceAll(/<body>.*<\/body>/gm, '');
          content = content.replaceAll('https://www.mobwithad.com', 'https://google.com');
          content += '\ndocument.head.insertAdjacentHTML("beforeend", \'<style>#ads-container,#ads-container2,#ads-container3,#sids-ads,main > div[style]:last-child{display: none !important}</style>\')';
      }

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