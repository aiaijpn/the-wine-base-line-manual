const pages=[...document.querySelectorAll('.page')];
history.scrollRestoration='manual';
function showPage(id,write=true){const target=document.getElementById(id)||document.getElementById('home');pages.forEach(page=>page.hidden=page!==target);if(write)history.pushState({id:target.id},'',`#${target.id}`);window.scrollTo({top:0,behavior:write?'smooth':'auto'});const heading=target.querySelector('h1,h2');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});if(!write)requestAnimationFrame(()=>window.scrollTo(0,0))}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-page]');if(trigger){event.preventDefault();showPage(trigger.dataset.page)}});
window.addEventListener('popstate',()=>showPage(location.hash.slice(1)||'home',false));
showPage(location.hash.slice(1)||'home',false);
