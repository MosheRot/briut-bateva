// Shared behavior for the treatment landing pages (massage, facial).
// Mirrors the lead tracking on the home page so conversions are counted the same way.

// Where did this visitor come from? Kept for the whole visit and added to WhatsApp messages and form emails.
var leadSource = (function () {
  try {
    var saved = sessionStorage.getItem('lead-src');
    if (saved) return saved;
  } catch (e) {}
  var params = new URLSearchParams(location.search);
  var utm = (params.get('utm_source') || '').toLowerCase();
  var medium = (params.get('utm_medium') || '').toLowerCase();
  var ua = navigator.userAgent || '';
  var paid = /cpc|ppc|paid|ad/.test(medium);
  var names = { instagram: 'אינסטגרם', ig: 'אינסטגרם', facebook: 'פייסבוק', fb: 'פייסבוק', threads: 'Threads', th: 'Threads', an: 'פייסבוק' };
  var src;
  if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) src = 'מודעה בגוגל';
  else if (names[utm]) src = (paid ? (/^[A-Za-z]/.test(names[utm]) ? 'מודעה ב-' : 'מודעה ב') : '') + names[utm];
  else if (utm === 'google') src = paid ? 'מודעה בגוגל' : 'גוגל';
  else if (utm) src = utm;
  else if (/Instagram/i.test(ua)) src = 'אינסטגרם';
  else if (/Barcelona|Threads/i.test(ua)) src = 'Threads';
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) src = 'פייסבוק';
  else if (params.has('fbclid')) src = 'פייסבוק / אינסטגרם';
  else {
    var host = '';
    try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (!host || host === location.hostname.replace(/^www\./, '')) src = 'ישירות לאתר';
    else if (/instagram\./.test(host)) src = 'אינסטגרם';
    else if (/threads\.(net|com)/.test(host)) src = 'Threads';
    else if (/facebook\.|fb\.com|fb\.me/.test(host)) src = 'פייסבוק';
    else if (/google\./.test(host)) src = 'חיפוש בגוגל';
    else if (/bing\.|yahoo\.|duckduckgo\./.test(host)) src = 'חיפוש באינטרנט';
    else src = host;
  }
  try { sessionStorage.setItem('lead-src', src); } catch (e) {}
  return src;
})();

(function () {
  var note = '\n(הגעתי מ: ' + leadSource + ')';
  document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
    var href = a.getAttribute('href');
    var i = href.indexOf('?text=');
    if (i === -1) return;
    var text = decodeURIComponent(href.slice(i + 6)) + note;
    a.setAttribute('href', href.slice(0, i) + '?text=' + encodeURIComponent(text));
  });
})();

function handleSubmit(e) {
  e.preventDefault();
  var form = e.target;
  var data = new FormData(form);
  var fullname = data.get('fullname');
  var phone = data.get('phone');
  var treatment = data.get('treatment');
  var notes = data.get('notes');

  var waText = 'היי, אשמח לקבוע תור\n' +
    'שם: ' + fullname + '\n' +
    'טלפון: ' + phone + '\n' +
    'סוג טיפול: ' + treatment +
    (notes ? '\nהערות: ' + notes : '') +
    '\n(הגעתי מ: ' + leadSource + ')';
  window.open('https://wa.me/972534103577?text=' + encodeURIComponent(waText), '_blank', 'noopener');

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: 'a9da06c5-93ed-4f7f-be08-0c29420b2083',
      subject: 'פנייה חדשה מהאתר - בריאות בטבע (' + treatment + ')',
      from_name: fullname,
      name: fullname,
      phone: phone,
      treatment: treatment,
      notes: notes || '-',
      source: leadSource,
      page: location.pathname
    })
  }).catch(function () {});

  if (typeof gtag === 'function') {
    gtag('event', 'conversion', { 'send_to': 'AW-17934231921/3fkLCM-E17wcEPHS2udC' });
    gtag('event', 'generate_lead', { 'currency': 'ILS' });
  }

  if (typeof fbq === 'function') {
    fbq('track', 'Lead');
  }

  form.reset();
  var wrapper = form.closest('.contact-wrapper');
  wrapper.classList.add('sent');
  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

(function () {
  document.getElementById('year').textContent = new Date().getFullYear();
  var bar = document.getElementById('cookie-bar');
  var seen = false;
  try { seen = localStorage.getItem('cookie-ok') === '1'; } catch (e) {}
  if (!seen) bar.classList.add('show');
  document.getElementById('cookie-ok').addEventListener('click', function () {
    bar.classList.remove('show');
    try { localStorage.setItem('cookie-ok', '1'); } catch (e) {}
  });
})();

(function () {
  var items = document.querySelectorAll('.reveal');
  var seenSections = {};
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);

        var section = entry.target.closest('section[id]');
        if (section && !seenSections[section.id] && typeof gtag === 'function') {
          seenSections[section.id] = true;
          gtag('event', 'section_view', {
            'send_to': 'G-2645Y9Y97M',
            'section_id': section.id
          });
        }
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { observer.observe(el); });
})();

// Track direct WhatsApp / phone link clicks as leads in GA4
document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('a[href]');
  if (!link || typeof gtag !== 'function') return;
  var href = link.getAttribute('href');
  var eventName = null;
  if (href.indexOf('wa.me/') !== -1) eventName = 'whatsapp_click';
  else if (href.indexOf('tel:') === 0) eventName = 'phone_click';
  else if (href.indexOf('waze.com') !== -1 || href.indexOf('google.com/maps') !== -1) eventName = 'directions_click';
  if (!eventName) return;
  if (typeof fbq === 'function') {
    fbq('track', eventName === 'directions_click' ? 'FindLocation' : 'Contact');
  }
  gtag('event', eventName, {
    'send_to': 'G-2645Y9Y97M',
    'link_location': link.className || 'inline',
    'transport_type': 'beacon'
  });
});

// Track which FAQ questions people actually open
document.querySelectorAll('.faq-item').forEach(function (item) {
  item.addEventListener('toggle', function () {
    if (!item.open || typeof gtag !== 'function') return;
    var q = item.querySelector('summary');
    gtag('event', 'faq_open', {
      'send_to': 'G-2645Y9Y97M',
      'faq_question': q ? q.textContent.trim() : ''
    });
  });
});
