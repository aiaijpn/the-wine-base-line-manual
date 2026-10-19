const pages = [...document.querySelectorAll('.page')];
const guidePages = pages.filter((page) => page.classList.contains('guide-page'));
const operationState = new Map();
history.scrollRestoration = 'manual';

const businessLabels = {
  'shop-card': 'ショップカード',
  friends: '友だち登録',
  messages: 'メッセージ配信'
};

function getLabel(element) {
  return element.querySelector('b, summary, h3')?.textContent.trim() || element.dataset.operationLabel;
}

function showOperation(page, index, focusContent = false) {
  const state = operationState.get(page.id);
  if (!state) return;
  state.current = index;
  state.items.forEach((item, itemIndex) => {
    const selected = itemIndex === index;
    item.hidden = !selected;
    item.setAttribute('aria-hidden', String(!selected));
    state.buttons[itemIndex].setAttribute('aria-pressed', String(selected));
  });
  if (focusContent) {
    const item = state.items[index];
    item.setAttribute('tabindex', '-1');
    item.focus({ preventScroll: true });
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function setupOperations(page) {
  const sourceNote = page.querySelector('.source-note');
  if (sourceNote) sourceNote.dataset.operationLabel = '公式資料';
  const candidates = [...page.querySelectorAll('.steps > li, .check-list > li, .tip, .operation-plan, .source-note, .friend-add')];
  const staffIntro = page.querySelector('.operation-guide > .section-intro');
  if (staffIntro) {
    staffIntro.dataset.operationLabel = 'ポイント付与の仕組み';
    candidates.splice(4, 0, staffIntro);
  }
  const selector = document.createElement('nav');
  selector.className = 'operation-selector';
  selector.setAttribute('aria-label', `${businessLabels[page.id]}の操作選択`);

  candidates.forEach((item, index) => {
    item.classList.add('operation-item');
    item.hidden = index !== 0;
    item.setAttribute('aria-hidden', String(index !== 0));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'operation-button';
    button.textContent = getLabel(item);
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => showOperation(page, index, true));
    selector.append(button);
  });

  page.querySelector('.lead').after(selector);
  page.classList.add('has-operation-tabs');
  operationState.set(page.id, { items: candidates, buttons: [...selector.children], current: 0 });
}

function setupShopCategories(page) {
  const buttons = [...page.querySelectorAll('[data-shop-category]')];
  const panels = [...page.querySelectorAll('[data-shop-panel]')];

  function showCategory(category, focusContent = false) {
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.shopCategory === category));
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.shopPanel === category;
      panel.hidden = !selected;
      panel.setAttribute('aria-hidden', String(!selected));
      if (selected && focusContent) {
        panel.setAttribute('tabindex', '-1');
        panel.focus({ preventScroll: true });
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => showCategory(button.dataset.shopCategory, true));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const columns = window.matchMedia('(max-width: 720px)').matches ? 2 : 4;
      const amount = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -columns : columns;
      const next = Math.min(buttons.length - 1, Math.max(0, index + amount));
      buttons[next].focus();
      showCategory(buttons[next].dataset.shopCategory);
    });
  });

  showCategory(buttons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.shopCategory || 'customer');
}

function addBusinessSelector(page) {
  const selector = document.createElement('nav');
  selector.className = 'business-selector';
  selector.setAttribute('aria-label', '業務選択');
  guidePages.forEach((guidePage) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'business-button';
    button.textContent = businessLabels[guidePage.id];
    button.dataset.page = guidePage.id;
    button.setAttribute('aria-pressed', String(guidePage === page));
    selector.append(button);
  });
  page.querySelector('.back-button').after(selector);
}

guidePages.forEach((page) => {
  addBusinessSelector(page);
  if (page.id === 'shop-card') setupShopCategories(page);
  else setupOperations(page);
});

function showPage(id, write = true) {
  const target = document.getElementById(id) || document.getElementById('home');
  pages.forEach((page) => page.hidden = page !== target);
  if (write) history.pushState({ id: target.id }, '', `#${target.id}`);
  window.scrollTo({ top: 0, behavior: write ? 'smooth' : 'auto' });
  const heading = target.querySelector('h1, h2');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
  if (!write) requestAnimationFrame(() => window.scrollTo(0, 0));
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-page]');
  if (trigger) {
    event.preventDefault();
    showPage(trigger.dataset.page);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const activePage = guidePages.find((page) => !page.hidden);
  const state = activePage && operationState.get(activePage.id);
  if (!state) return;
  event.preventDefault();
  const amount = event.key === 'ArrowRight' ? 1 : -1;
  const next = Math.min(state.items.length - 1, Math.max(0, state.current + amount));
  showOperation(activePage, next, true);
  state.buttons[next].focus({ preventScroll: true });
});

window.addEventListener('popstate', () => showPage(location.hash.slice(1) || 'home', false));
showPage(location.hash.slice(1) || 'home', false);
