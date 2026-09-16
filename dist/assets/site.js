(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const map = (value, start, end) => clamp((value - start) / (end - start));
  const fadeWindow = (value, inStart, inEnd, outStart, outEnd) => Math.min(map(value, inStart, inEnd), 1 - map(value, outStart, outEnd));
  const style = (element, values) => { if (element) Object.assign(element.style, values); };

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const story = document.querySelector('[data-story]');
  const header = document.querySelector('[data-header]');
  const meter = document.querySelector('.scroll-meter span');
  const scenes = {
    opening: document.querySelector('[data-scene="opening"]'),
    food: document.querySelector('[data-scene="food"]'),
    crunch: document.querySelector('[data-scene="crunch"]'),
    chipA: document.querySelector('[data-scene="chip-a"]'),
    chipB: document.querySelector('[data-scene="chip-b"]'),
    chipC: document.querySelector('[data-scene="chip-c"]'),
    words: document.querySelector('[data-scene="words"]'),
    brand: document.querySelector('[data-scene="brand"]'),
    cue: document.querySelector('[data-scroll-cue]')
  };
  const brandLetters = [...document.querySelectorAll('[data-letter]')];
  const trails = [...document.querySelectorAll('.trail')];
  const parallaxImages = [...document.querySelectorAll('[data-parallax]')];
  let target = 0;
  let current = 0;
  let previous = performance.now();

  function readScroll() {
    if (!story) return;
    const rect = story.getBoundingClientRect();
    const range = Math.max(1, story.offsetHeight - innerHeight);
    target = clamp(-rect.top / range);
    const documentProgress = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (meter) meter.style.transform = `scaleX(${clamp(documentProgress)})`;
    header?.classList.toggle('scrolled', rect.bottom <= innerHeight + 74);

    if (!reducedMotion) {
      parallaxImages.forEach((image) => {
        const imageRect = image.getBoundingClientRect();
        const distance = (imageRect.top + imageRect.height / 2 - innerHeight / 2) / (innerHeight + imageRect.height);
        const movement = clamp(distance, -.5, .5) * Number(image.dataset.parallax || 20);
        image.style.transform = `scale(1.08) translate3d(0, ${-movement}px, 0)`;
      });
    }
  }

  function draw(progress) {
    const mobile = innerWidth <= 980;
    const openingOpacity = fadeWindow(progress, 0, .025, .145, .22);
    style(scenes.opening, {
      opacity: openingOpacity,
      transform: mobile
        ? `translate3d(${-24 * map(progress,.09,.22)}px, ${-34 * map(progress,.09,.22)}px, 0)`
        : `translate3d(${-46 * map(progress,.09,.22)}px, -50%, 0)`
    });

    const foodEnter = map(progress, 0, .075);
    const foodTravel = map(progress, .08, .52);
    const foodExit = map(progress, .49, .63);
    const x = mobile ? -23 * foodTravel : -24 * foodTravel;
    const y = mobile ? -7 * foodTravel : -3 * foodTravel;
    const scale = .74 + .2 * foodEnter + .15 * foodTravel - .18 * foodExit;
    const rotate = 3 - 15 * foodTravel - 14 * foodExit;
    style(scenes.food, {
      opacity: 1 - foodExit,
      transform: `translate3d(${x}vw, calc(-50% + ${y}vh), 0) scale(${scale}) rotate(${rotate}deg)`
    });

    trails.forEach((trail, index) => {
      const travel = progress * (index ? -46 : 62);
      trail.style.transform = `rotate(${(index ? -12 : 13) + travel}deg) scale(${1 + progress * .25})`;
      trail.style.opacity = String(.18 + .25 * Math.sin(progress * Math.PI));
    });

    const crunchOpacity = fadeWindow(progress, .14, .20, .29, .37);
    style(scenes.crunch, {
      opacity: crunchOpacity,
      transform: `translate3d(${24 * map(progress,.14,.37)}px, ${-24 * map(progress,.2,.37)}px, 0) scale(${.88 + .12 * map(progress,.14,.22)})`
    });
    [...(scenes.crunch?.querySelectorAll('span') || [])].forEach((letter, index) => {
      const impact = Math.sin(progress * 42 - index * .75) * 7 * crunchOpacity;
      letter.style.transform = `translateY(${impact}px) rotate(${impact * .32}deg)`;
    });

    [
      [scenes.chipA,.235,.30,.405,.485,-20],
      [scenes.chipB,.285,.35,.435,.515,22],
      [scenes.chipC,.335,.40,.465,.545,-17]
    ].forEach(([element,a,b,c,d,travel]) => {
      const opacity = fadeWindow(progress,a,b,c,d);
      style(element, {
        opacity,
        transform: `translate3d(${travel * (1 - map(progress,a,b))}px, ${18 * (1-map(progress,a,b)) - 20*map(progress,c,d)}px, 0) rotate(${travel*.13}deg) scale(${.86 + .14*map(progress,a,b)})`
      });
    });

    const wordsOpacity = fadeWindow(progress, .39, .46, .545, .625);
    style(scenes.words, {
      opacity: wordsOpacity,
      transform: `translate3d(${mobile ? 0 : 30 * map(progress,.47,.62)}px, ${mobile ? 0 : '-50%'}, 0)`
    });
    [...(scenes.words?.children || [])].forEach((line,index) => {
      const lineIn = map(progress, .405 + index*.03, .475 + index*.03);
      line.style.opacity = lineIn;
      line.style.transform = `translate3d(${(1-lineIn)*-75}px,0,0)`;
    });

    // A marca ocupa a parte mais longa da narrativa, com movimento mínimo,
    // para permanecer legível mesmo em rolagens rápidas no celular.
    const brandIn = map(progress, .575, .69);
    const brandOut = 1 - map(progress, .958, 1);
    const brandOpacity = Math.min(brandIn, brandOut);
    const breathing = 1 + Math.sin((progress-.69)*15)*.0045*brandOpacity;
    style(scenes.brand, {
      opacity: brandOpacity,
      transform: `translate3d(0, ${24*(1-brandIn)-9*map(progress,.92,1)}px, 0) scale(${(.93+.07*brandIn)*breathing})`
    });
    brandLetters.forEach((letter,index) => {
      const letterIn = map(progress,.59+index*.014,.68+index*.014);
      const settle = Math.sin(progress*19+index*1.1)*1.6*brandOpacity;
      letter.style.opacity = letterIn;
      letter.style.transform = `translate3d(0,${(1-letterIn)*100}px,0) rotate(${(1-letterIn)*(index%2?10:-10)+settle}deg) scale(${.75+.25*letterIn})`;
    });

    style(scenes.cue, {
      opacity: 1 - map(progress,.035,.10),
      transform: `translate3d(-50%,${14*map(progress,.025,.1)}px,0)`
    });
  }

  function frame(now) {
    const elapsed = Math.min(64, now - previous);
    previous = now;
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 270);
    current += (target - current) * smoothing;
    if (Math.abs(target-current) < .0001) current = target;
    draw(current);
    requestAnimationFrame(frame);
  }

  addEventListener('scroll', readScroll, {passive:true});
  addEventListener('resize', readScroll, {passive:true});
  readScroll();
  requestAnimationFrame(frame);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {rootMargin:'0px 0px -8% 0px',threshold:.1});
  document.querySelectorAll('.reveal').forEach((element,index) => {
    element.style.transitionDelay = `${Math.min(index%3,2)*65}ms`;
    observer.observe(element);
  });

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const menuItems = [...document.querySelectorAll('[data-category]')];
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filterButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    menuItems.forEach((item) => item.classList.toggle('filtered-out', category !== 'todos' && item.dataset.category !== category));
  }));

  const toggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const closeMenu = () => {
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Abrir menu');
    mobileMenu?.classList.remove('open');
    document.body.classList.remove('menu-open');
  };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
    mobileMenu?.classList.toggle('open',open);
    document.body.classList.toggle('menu-open',open);
  });
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click',closeMenu));
  addEventListener('keydown',(event) => { if(event.key==='Escape') closeMenu(); });

  if (!reducedMotion && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove',(event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX-rect.left)/rect.width-.5;
        const y = (event.clientY-rect.top)/rect.height-.5;
        card.style.transform = `perspective(850px) rotateX(${-y*4.5}deg) rotateY(${x*5.5}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave',() => { card.style.transform=''; });
    });
  }
})();
