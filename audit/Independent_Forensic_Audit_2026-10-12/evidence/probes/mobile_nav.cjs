const { chromium } = require('./pw.cjs');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto('http://127.0.0.1:8100/',{waitUntil:'load'}); await p.waitForTimeout(800);
 const nav=await p.evaluate(()=>{
   const vis=e=>e.offsetParent!==null;
   const burger=[...document.querySelectorAll('button,[role=button],a')].filter(e=>vis(e)&&/menu|☰|hamburger/i.test(e.textContent+e.className+(e.getAttribute('aria-label')||'')));
   const navLinks=[...document.querySelectorAll('nav a')].filter(vis).map(a=>a.textContent.trim()+' -> '+a.getAttribute('href'));
   const small=[...document.querySelectorAll('a,button')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<24||r.height<24);}).map(e=>({t:(e.textContent||'').trim().slice(0,18),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}));
   return {hamburgerFound:burger.length, navLinkCount:navLinks.length, navLinks:navLinks.slice(0,14), tooSmallTargets:small.length, smallSample:small.slice(0,6), hScroll:document.documentElement.scrollWidth-window.innerWidth};
 });
 console.log('MOBILE HOME:',JSON.stringify(nav,null,1));
 // can a mobile user reach a product and add to RFQ?
 await p.goto('http://127.0.0.1:8100/products/',{waitUntil:'load'}); await p.waitForTimeout(800);
 const prod=await p.evaluate(()=>({cards:document.querySelectorAll('a[href^="/products/"]').length, filtersVisible:[...document.querySelectorAll('[class*=facet],[class*=filter]')].filter(e=>e.offsetParent!==null).length}));
 console.log('MOBILE CATALOG:',JSON.stringify(prod));
 await p.screenshot({path:'shots/mobile_nav_home.png'});
 await b.close();
})();
