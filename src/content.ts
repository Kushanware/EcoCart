import { calculateLocalEcoScore } from './lib/rules';
import { analyzeProduct, type EcoAnalysis } from './lib/gemini';
import { getApiKey } from './lib/storage';
import { detectMaterialFromSources, getAlternativesForProduct, getScoreInsights } from './lib/ecocart';

// Sanitize strings before injecting into innerHTML to prevent XSS
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Extract data from product pages

export interface ProductData {
  title: string;
  price: string;
  brand: string;
  description: string;
  material: string;
  url: string;
  category: string;
}

function extractAmazonData(): Partial<ProductData> {
  const title = document.querySelector('#productTitle')?.textContent?.trim() || '';
  const price = document.querySelector('.a-price .a-offscreen')?.textContent?.trim() || '';
  const brand = document.querySelector('#bylineInfo')?.textContent?.trim() || '';
  
  // Try to find material
  let material = '';
  const featureBullets = Array.from(document.querySelectorAll('#feature-bullets li span'));
  for (const span of featureBullets) {
    const text = span.textContent?.toLowerCase() || '';
    if (text.includes('material') || text.includes('cotton') || text.includes('polyester')) {
      material = text;
      break;
    }
  }

  // Find description
  const description = document.querySelector('#productDescription')?.textContent?.trim() || 
                      document.querySelector('#feature-bullets')?.textContent?.trim() || '';

  // Find category (breadcrumbs)
  let category = '';
  const breadcrumbs = document.querySelector('#wayfinding-breadcrumbs_feature_div');
  if (breadcrumbs) {
    category = Array.from(breadcrumbs.querySelectorAll('.a-link-normal'))
      .map(el => el.textContent?.trim())
      .filter(Boolean)
      .join(' > ');
  }

  if (!material) {
    material = detectMaterialFromSources(title, description, brand, category, document.body.innerText);
  }

  return { title, price, brand, description, material, category };
}

function extractFlipkartData(): Partial<ProductData> {
  let title = '';
  const h1 = document.querySelector('h1');
  if (h1) {
    const titleSpan = h1.querySelector('span');
    title = titleSpan?.textContent?.trim() || h1.textContent?.trim() || '';
  }
  if (!title) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    title = ogTitle?.getAttribute('content')?.trim() || '';
  }
  if (!title) {
    const docTitle = document.title;
    if (docTitle.includes(' - Buy') || docTitle.includes('|')) {
      title = docTitle.split(/\s*[-|]\s*/)[0].trim();
    }
  }

  let price = '';
  const allElements = document.querySelectorAll('div, span');
  for (const el of Array.from(allElements)) {
    const text = el.textContent?.trim() || '';
    if (/^₹[\d,]+$/.test(text) && text.length < 15) {
      price = text;
      break;
    }
  }

  let brand = '';
  const brandLink = document.querySelector('a[href*="/brand/"], a[href*="brand-"]');
  if (brandLink) {
    brand = brandLink.textContent?.trim() || '';
  }
  if (!brand && h1) {
    const parentDiv = h1.closest('div');
    const siblingLinks = parentDiv?.querySelectorAll('a span, a');
    if (siblingLinks) {
      for (const link of Array.from(siblingLinks)) {
        const text = link.textContent?.trim() || '';
        if (text.length > 1 && text.length < 40 && !text.includes('₹')) {
          brand = text;
          break;
        }
      }
    }
  }

  let description = '';
  const allLists = document.querySelectorAll('ul');
  for (const ul of allLists) {
    const items = ul.querySelectorAll('li');
    if (items.length >= 3 && items.length <= 15) {
      const text = Array.from(items).map(li => li.textContent?.trim()).filter(Boolean).join('. ');
      if (text.length > 50 && text.length < 2000) {
        description = text;
        break;
      }
    }
  }
  if (!description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    description = metaDesc?.getAttribute('content')?.trim() || '';
  }

  let category = '';
  const breadcrumbContainers = document.querySelectorAll('div[class]');
  for (const container of breadcrumbContainers) {
    const links = container.querySelectorAll(':scope > a');
    if (links.length >= 2 && links.length <= 8) {
      const crumbs = Array.from(links).map(a => a.textContent?.trim()).filter(Boolean);
      if (crumbs.some(c => c === 'Home' || c === 'home')) {
        category = crumbs.join(' > ');
        break;
      }
    }
  }
  if (!category) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      category = pathParts[0].replace(/-/g, ' ');
    }
  }

  let material = '';
  const allRows = document.querySelectorAll('table tr, div[class] > div[class] > div[class]');
  for (const row of allRows) {
    const cells = row.querySelectorAll('td, div');
    if (cells.length >= 2) {
      const label = cells[0].textContent?.toLowerCase().trim() || '';
      const value = cells[1].textContent?.trim() || '';
      if (label.includes('material') || label.includes('fabric') || label.includes('type')) {
        if (value.length > 1 && value.length < 200) {
          material = value;
          break;
        }
      }
    }
  }
  if (!material) {
    material = detectMaterialFromSources(title, description, brand, category, document.body.innerText);
  }

  return { title, price, brand, description, material, category };
}

function isProductPage(): boolean {
  // 1. JSON-LD Product schema
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of scripts) {
    const text = script.textContent || '';
    if (text.includes('"Product"') || text.includes('"@type":"Product"') || text.includes('"@type": "Product"')) {
      return true;
    }
  }

  // 2. OpenGraph Product type
  const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content');
  if (ogType === 'product' || ogType?.includes('product')) {
    return true;
  }

  // 3. Common E-commerce URL patterns
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/product/') || path.includes('/p/') || path.includes('/products/') || path.includes('/dp/')) {
    return true;
  }

  // 4. Common DOM elements indicating product page (Add to Cart button, Buy Now button)
  const buyButton = document.querySelector('button[class*="buy" i], button[id*="buy" i], button[class*="cart" i], button[id*="cart" i], input[type="submit"][value*="cart" i], input[type="submit"][value*="buy" i]');
  if (buyButton) {
    return true;
  }

  return false;
}

// ─── Shopping Website Detection ───
// Broader than isProductPage(): detects if user is on ANY page of a shopping website

const SHOPPING_DOMAINS: Record<string, string> = {
  'amazon': 'Amazon',
  'flipkart': 'Flipkart',
  'myntra': 'Myntra',
  'ajio': 'AJIO',
  'meesho': 'Meesho',
  'snapdeal': 'Snapdeal',
  'nykaa': 'Nykaa',
  'tatacliq': 'Tata CLiQ',
  'jiomart': 'JioMart',
  'ebay': 'eBay',
  'walmart': 'Walmart',
  'target': 'Target',
  'bestbuy': 'Best Buy',
  'etsy': 'Etsy',
  'shopify': 'Shopify Store',
  'aliexpress': 'AliExpress',
  'alibaba': 'Alibaba',
  'shein': 'SHEIN',
  'zara': 'Zara',
  'hm.com': 'H&M',
  'uniqlo': 'Uniqlo',
  'asos': 'ASOS',
  'nordstrom': 'Nordstrom',
  'macys': "Macy's",
  'costco': 'Costco',
  'homedepot': 'Home Depot',
  'lowes': "Lowe's",
  'wayfair': 'Wayfair',
  'ikea': 'IKEA',
  'sephora': 'Sephora',
  'ulta': 'Ulta Beauty',
  'zappos': 'Zappos',
  'nike': 'Nike',
  'adidas': 'Adidas',
  'puma': 'Puma',
  'croma': 'Croma',
  'reliancedigital': 'Reliance Digital',
  'lenskart': 'Lenskart',
  'bewakoof': 'Bewakoof',
  'firstcry': 'FirstCry',
  'purplle': 'Purplle',
  'blinkit': 'Blinkit',
  'bigbasket': 'BigBasket',
  'swiggy': 'Swiggy Instamart',
  'zepto': 'Zepto',
  'shopee': 'Shopee',
  'lazada': 'Lazada',
  'overstock': 'Overstock',
  'newegg': 'Newegg',
  'wish': 'Wish',
  'temu': 'Temu',
};

interface ShoppingSiteInfo {
  detected: boolean;
  siteName: string;
  isProductPage: boolean;
  signals: string[];
}

function detectShoppingSite(): ShoppingSiteInfo {
  const hostname = window.location.hostname.toLowerCase();
  const signals: string[] = [];
  let siteName = '';

  // 1. Check known shopping domains
  for (const [domain, name] of Object.entries(SHOPPING_DOMAINS)) {
    if (hostname.includes(domain)) {
      siteName = name;
      signals.push(`Known store: ${name}`);
      break;
    }
  }

  // 2. Check for e-commerce platform meta tags (Shopify, WooCommerce, Magento, etc.)
  if (!siteName) {
    const shopifyMeta = document.querySelector('meta[name="shopify-checkout-api-token"], meta[name="shopify-digital-wallet"], link[href*="cdn.shopify.com"]');
    if (shopifyMeta) {
      siteName = 'Shopify Store';
      signals.push('Shopify platform detected');
    }

    const wooMeta = document.querySelector('meta[name="generator"][content*="WooCommerce"], link[href*="woocommerce"]');
    if (wooMeta) {
      siteName = siteName || 'Online Store';
      signals.push('WooCommerce platform detected');
    }

    const magentoMeta = document.querySelector('script[src*="mage/"], script[src*="Magento"]');
    if (magentoMeta) {
      siteName = siteName || 'Online Store';
      signals.push('Magento platform detected');
    }
  }

  // 3. Check for cart/checkout links on the page
  const cartLinks = document.querySelectorAll('a[href*="/cart"], a[href*="/checkout"], a[href*="/basket"], a[href*="/bag"]');
  if (cartLinks.length > 0) {
    signals.push('Cart/checkout links found');
    if (!siteName) {
      // Extract a nice name from the page title or domain
      const titleParts = document.title.split(/[-|–—]/);
      siteName = titleParts[titleParts.length - 1]?.trim() || hostname.replace('www.', '').split('.')[0];
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    }
  }

  // 4. Check for Add to Cart buttons
  const addToCartBtn = document.querySelector(
    'button[class*="add-to-cart" i], button[class*="addtocart" i], ' +
    'button[id*="add-to-cart" i], button[id*="addToCart" i], ' +
    'input[value*="Add to Cart" i], button[data-action="add-to-cart"], ' +
    '#add-to-cart-button, .add-to-cart'
  );
  if (addToCartBtn) {
    signals.push('Add to Cart button found');
  }

  // 5. Check for product structured data
  const hasProductSchema = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .some(s => (s.textContent || '').includes('"Product"'));
  if (hasProductSchema) {
    signals.push('Product schema detected');
  }

  // 6. Check for price meta tags
  const priceMeta = document.querySelector(
    'meta[property="product:price:amount"], meta[property="og:price:amount"], [itemprop="price"]'
  );
  if (priceMeta) {
    signals.push('Price metadata found');
  }

  const detected = signals.length >= 1 && siteName !== '';
  const isOnProductPage = isProductPage();

  return { detected, siteName, isProductPage: isOnProductPage, signals };
}

// Session key to track if user has dismissed the auto-open for this page
const SESSION_DISMISSED_KEY = 'ecocart-auto-dismissed';

function findProductInJsonLd(obj: unknown): Record<string, unknown> | null {
  if (!obj || typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;
  if (record['@type'] === 'Product' || record['type'] === 'Product') return record;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
  } else {
    for (const key of Object.keys(record)) {
      const found = findProductInJsonLd(record[key]);
      if (found) return found;
    }
  }
  return null;
}

function extractGenericJsonLd(): Record<string, unknown> | null {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent || '');
      const productObj = findProductInJsonLd(json);
      if (productObj) return productObj;
    } catch (e) {
      // ignore parsing errors
    }
  }
  return null;
}

function genericExtractor(): Partial<ProductData> {
  const jsonLd = extractGenericJsonLd();

  // --- Title ---
  let title = '';
  if (jsonLd?.name) {
    title = String(jsonLd.name);
  } else {
    title = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
            document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim() ||
            document.querySelector('h1')?.textContent?.trim() ||
            document.querySelector('[itemprop="name"]')?.textContent?.trim() ||
            document.querySelector('.product-title')?.textContent?.trim() ||
            document.querySelector('.product-name')?.textContent?.trim() ||
            '';
  }

  // --- Description ---
  let description = '';
  if (jsonLd?.description) {
    description = String(jsonLd.description);
  } else {
    description = document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
                  document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
                  document.querySelector('#description')?.textContent?.trim() ||
                  document.querySelector('.description')?.textContent?.trim() ||
                  document.querySelector('.product-description')?.textContent?.trim() ||
                  document.querySelector('[itemprop="description"]')?.textContent?.trim() ||
                  '';
  }

  // --- Brand ---
  let brand = '';
  if (jsonLd?.brand) {
    if (typeof jsonLd.brand === 'string') {
      brand = jsonLd.brand;
    } else if (typeof jsonLd.brand === 'object' && jsonLd.brand !== null) {
      brand = String((jsonLd.brand as Record<string, unknown>).name || '');
    }
  }
  if (!brand) {
    brand = document.querySelector('meta[property="product:brand"]')?.getAttribute('content')?.trim() ||
            document.querySelector('[itemprop="brand"]')?.textContent?.trim() ||
            document.querySelector('.brand')?.textContent?.trim() ||
            document.querySelector('.product-brand')?.textContent?.trim() ||
            '';
  }

  // --- Price ---
  let price = '';
  if (jsonLd?.offers) {
    const offers = jsonLd.offers;
    if (Array.isArray(offers)) {
      const first = offers[0] as Record<string, unknown> | undefined;
      price = String(first?.price || first?.priceRange || '');
    } else if (typeof offers === 'object' && offers !== null) {
      const offersRecord = offers as Record<string, unknown>;
      price = String(offersRecord.price || offersRecord.priceRange || '');
    }
  }
  if (!price) {
    price = document.querySelector('meta[property="product:price:amount"]')?.getAttribute('content')?.trim() ||
            document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')?.trim() ||
            document.querySelector('[itemprop="price"]')?.textContent?.trim() ||
            document.querySelector('.price')?.textContent?.trim() ||
            document.querySelector('.product-price')?.textContent?.trim() ||
            '';
  }

  // --- Category ---
  let category = '';
  if (jsonLd?.category) {
    category = String(jsonLd.category);
  }
  if (!category) {
    const breadcrumbs = Array.from(document.querySelectorAll('.breadcrumb, .breadcrumbs, [class*="breadcrumb"]'));
    if (breadcrumbs.length > 0) {
      category = breadcrumbs[0].textContent?.replace(/\s+/g, ' ').trim() || '';
    }
  }
  if (!category) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      category = pathParts[0].replace(/-/g, ' ');
    }
  }

  // --- Material ---
  let material = '';
  if (jsonLd?.material) {
    material = String(jsonLd.material);
  }
  if (!material) {
    // Search elements containing material text
    const rows = Array.from(document.querySelectorAll('table tr, li, div'));
    for (const row of rows) {
      const text = row.textContent?.toLowerCase() || '';
      if (text.includes('material') || text.includes('fabric') || text.includes('composition')) {
        const parts = text.split(/[:\-\n]/);
        if (parts.length >= 2) {
          const value = parts[1].trim();
          if (value.length > 2 && value.length < 100) {
            material = value;
            break;
          }
        }
      }
    }
  }
  if (!material) {
    material = detectMaterialFromSources(title, description, brand, category, document.body.innerText);
  }

  return { title, price, brand, description, material, category };
}



// ─── Sidebar Overlay Creation & UI population ───

function showSidebarError(msg: string) {
  const shadow = document.getElementById('ecocart-root')?.shadowRoot;
  if (!shadow) return;

  const loadingEl = shadow.getElementById('ecocart-loading');
  const errorEl = shadow.getElementById('ecocart-error');
  const dataEl = shadow.getElementById('ecocart-data');
  const errMsgEl = shadow.getElementById('ecocart-error-msg');

  if (loadingEl) loadingEl.style.display = 'none';
  if (dataEl) dataEl.style.display = 'none';
  if (errMsgEl) errMsgEl.textContent = msg;
  if (errorEl) {
    errorEl.style.display = 'flex';
    errorEl.style.flexDirection = 'column';
    errorEl.style.alignItems = 'center';
  }
}

function updateSidebarUI(product: Partial<ProductData>, analysis: EcoAnalysis) {
  const shadow = document.getElementById('ecocart-root')?.shadowRoot;
  if (!shadow) return;

  // 1. Update launcher badge
  const launcherBadge = shadow.getElementById('ecocart-launcher-badge');
  if (launcherBadge) {
    launcherBadge.textContent = analysis.ecoScore.toString();
    launcherBadge.style.display = 'flex';
    if (analysis.ecoScore >= 70) {
      launcherBadge.style.borderColor = '#16a34a';
      launcherBadge.style.color = '#15803d';
    } else if (analysis.ecoScore >= 40) {
      launcherBadge.style.borderColor = '#d97706';
      launcherBadge.style.color = '#b45309';
    } else {
      launcherBadge.style.borderColor = '#dc2626';
      launcherBadge.style.color = '#b91c1c';
    }
  }

  // 2. Update Progress Ring
  const ringFg = shadow.getElementById('ring-fg') as SVGPathElement | null;
  const ringText = shadow.getElementById('ring-text');
  if (ringFg) {
    ringFg.setAttribute('stroke-dasharray', `${analysis.ecoScore}, 100`);
    if (analysis.ecoScore >= 70) {
      ringFg.setAttribute('stroke', '#16a34a');
    } else if (analysis.ecoScore >= 40) {
      ringFg.setAttribute('stroke', '#d97706');
    } else {
      ringFg.setAttribute('stroke', '#dc2626');
    }
  }
  if (ringText) {
    ringText.textContent = analysis.ecoScore.toString();
  }

  // 3. Update Confidence
  const confBadge = shadow.getElementById('conf-badge');
  if (confBadge) {
    confBadge.textContent = `${analysis.confidence} Confidence`;
    confBadge.className = `confidence-badge conf-${analysis.confidence.toLowerCase()}`;
  }

  // 4. Update Product Info
  const prTitle = shadow.getElementById('pr-title');
  const prCat = shadow.getElementById('pr-cat');
  if (prTitle) prTitle.textContent = product.title || 'Unknown Product';
  if (prCat) {
    const categoryName = product.category ? product.category.split(' > ').pop() : 'Product';
    prCat.textContent = `${categoryName} Detected`;
  }

  // 5. Recommendations
  const recText = shadow.getElementById('rec-text');
  if (recText) recText.textContent = analysis.recommendations;

  // 6. Carbon & Water Badges
  const carbVal = shadow.getElementById('carb-val');
  const watVal = shadow.getElementById('wat-val');
  if (carbVal) {
    carbVal.textContent = analysis.carbonImpact;
    carbVal.className = `impact-val val-${analysis.carbonImpact.toLowerCase().replace(/\s+/g, '-')}`;
  }
  if (watVal) {
    watVal.textContent = analysis.waterUsage;
    watVal.className = `impact-val val-${analysis.waterUsage.toLowerCase().replace(/\s+/g, '-')}`;
  }

  // 7. Highlights & Concerns
  const strengthsList = shadow.getElementById('strengths-list');
  const concernsList = shadow.getElementById('concerns-list');
  
  if (strengthsList) {
    strengthsList.innerHTML = analysis.strengths.map(s => `
      <div class="bullet-item strength">
        <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #16a34a; min-width: 16px; margin-top: 2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${escapeHtml(s)}</span>
      </div>
    `).join('');
  }

  if (concernsList) {
    concernsList.innerHTML = analysis.concerns.map(c => `
      <div class="bullet-item concern">
        <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #d97706; min-width: 16px; margin-top: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>${escapeHtml(c)}</span>
      </div>
    `).join('');
  }

  // 8. Alternatives
  const altsList = shadow.getElementById('alts-list');
  if (altsList) {
    const alternatives = getAlternativesForProduct(product);

    altsList.innerHTML = alternatives.map(alt => `
      <div class="alt-item">
        <div class="alt-copy">
          <span class="alt-name">${escapeHtml(alt.name)}</span>
          <div class="alt-reason">${escapeHtml(alt.reason)}</div>
        </div>
        <span class="alt-score">${alt.score} Eco</span>
      </div>
    `).join('');
  }

  // 9. Why this score
  const whyList = shadow.getElementById('why-score-list');
  if (whyList) {
    const insights = getScoreInsights(product, analysis.scoreBreakdown || { materials: 0, durability: 0, packaging: 0, locality: 0, brandBonus: 0 });
    whyList.innerHTML = insights.map(insight => `
      <div class="why-score-item">
        <div class="why-score-head">
          <span class="why-score-label">${escapeHtml(insight.label)}</span>
          <span class="why-score-value">+${insight.value}</span>
        </div>
        <div class="why-score-note">${escapeHtml(insight.note)}</div>
      </div>
    `).join('');
  }

  // 10. Detailed Breakdown
  const bd = analysis.scoreBreakdown || { materials: 0, durability: 0, packaging: 0, locality: 0, brandBonus: 0 };
  const updateBar = (id: string, value: number, max: number) => {
    const bar = shadow.getElementById(id);
    const valText = shadow.getElementById(id + '-val');
    if (bar) bar.style.width = `${(value / max) * 100}%`;
    if (valText) valText.textContent = `${value}/${max}`;
  };
  
  updateBar('bd-materials', bd.materials, 60);
  updateBar('bd-durability', bd.durability, 30);
  updateBar('bd-packaging', bd.packaging, 20);
  updateBar('bd-locality', bd.locality, 20);
  updateBar('bd-brand', bd.brandBonus, 10);

  // Switch states
  const loadingEl = shadow.getElementById('ecocart-loading');
  const errorEl = shadow.getElementById('ecocart-error');
  const dataEl = shadow.getElementById('ecocart-data');
  
  if (loadingEl) loadingEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
  if (dataEl) dataEl.style.display = 'block';
}

async function runAnalysis() {
  const shadow = document.getElementById('ecocart-root')?.shadowRoot;
  if (!shadow) return;

  // Show loading
  const loadingEl = shadow.getElementById('ecocart-loading');
  const errorEl = shadow.getElementById('ecocart-error');
  const dataEl = shadow.getElementById('ecocart-data');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (errorEl) errorEl.style.display = 'none';
  if (dataEl) dataEl.style.display = 'none';

  // Extract
  const url = window.location.hostname;
  let data: Partial<ProductData> = {};

  if (url.includes('amazon')) {
    data = extractAmazonData();
  } else if (url.includes('flipkart')) {
    data = extractFlipkartData();
  } else if (isProductPage()) {
    data = genericExtractor();
  }
  data.url = window.location.href;

  if (!data.title) {
    showSidebarError('Could not find a product on this page. Navigate to a product page or retry.');
    return;
  }

  try {
    const apiKey = await getApiKey();
    const methodModeSelect = shadow.getElementById('ecocart-method-mode') as HTMLSelectElement | null;
    const isGeminiMode = methodModeSelect ? methodModeSelect.value === 'gemini' : !!apiKey;

    let ecoData: EcoAnalysis;
    if (isGeminiMode && apiKey) {
      try {
        ecoData = await analyzeProduct(data);
        if (!ecoData.scoreBreakdown) {
          ecoData.scoreBreakdown = { materials: 0, durability: 0, packaging: 0, locality: 0, brandBonus: 0 };
        }
      } catch (err) {
        // Gemini failed — silently fall back to local rule engine
        ecoData = calculateLocalEcoScore(data);
      }
    } else {
      ecoData = calculateLocalEcoScore(data);
    }

    updateSidebarUI(data, ecoData);
  } catch (err: unknown) {
    showSidebarError(err instanceof Error ? err.message : 'An unexpected error occurred.');
  }
}

async function initSettingsUI() {
  const shadow = document.getElementById('ecocart-root')?.shadowRoot;
  if (!shadow) return;

  const keyInput = shadow.getElementById('ecocart-api-key') as HTMLInputElement | null;
  const methodMode = shadow.getElementById('ecocart-method-mode') as HTMLSelectElement | null;

  if (keyInput) {
    const apiKey = await getApiKey();
    keyInput.value = apiKey || '';
  }

  if (methodMode) {
    chrome.storage.local.get(['ecoAnalysisMode'], (result) => {
      const mode = (result.ecoAnalysisMode as string) || 'local';
      methodMode.value = mode;
    });
  }
}

function initEcoCart() {
  if (!isProductPage()) {
    return;
  }

  // Prevent double injection
  if (document.getElementById('ecocart-root')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'ecocart-root';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Stylesheet
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

    /* ─── Shopping Detected Toast ─── */
    .ecocart-toast {
      position: fixed;
      bottom: 96px;
      right: 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 14px 20px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      animation: toastIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      max-width: 320px;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .ecocart-toast.hiding {
      animation: toastOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .toast-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
    }

    .toast-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 700;
      font-size: 13px;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-subtitle {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-action {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: #22c55e;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .toast-action:hover {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .toast-close {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #334155;
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      line-height: 1;
    }

    .toast-close:hover {
      background: #475569;
      color: white;
    }

    .toast-signals {
      display: flex;
      gap: 4px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .toast-signal-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      opacity: 0.7;
    }

    @keyframes toastIn {
      0% {
        opacity: 0;
        transform: translateY(16px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes toastOut {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(8px) scale(0.97);
      }
    }

    /* Launcher pulse when shopping detected */
    #ecocart-launcher.shopping-detected {
      animation: launcherPulse 2s ease-in-out infinite;
    }

    @keyframes launcherPulse {
      0%, 100% {
        box-shadow: 0 4px 20px rgba(22, 163, 74, 0.4);
      }
      50% {
        box-shadow: 0 4px 30px rgba(22, 163, 74, 0.7), 0 0 0 8px rgba(22, 163, 74, 0.12);
      }
    }

    /* Shopping site badge on launcher */
    .launcher-shopping-badge {
      position: absolute;
      top: -4px;
      left: -4px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: white;
      border-radius: 8px;
      padding: 2px 6px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
      white-space: nowrap;
    }

    /* Sidebar auto-open entrance animation */
    #ecocart-sidebar.auto-opening {
      animation: sidebarSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes sidebarSlideIn {
      0% {
        right: -430px;
        opacity: 0.5;
      }
      100% {
        right: 0;
        opacity: 1;
      }
    }

    /* Stats bar inside toast */
    .toast-stats {
      display: flex;
      gap: 12px;
      margin-top: 2px;
    }

    .toast-stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: rgba(255,255,255,0.5);
    }

    .toast-stat-icon {
      font-size: 12px;
    }


    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
    }

    #ecocart-launcher {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      box-shadow: 0 4px 20px rgba(22, 163, 74, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 26px;
      cursor: pointer;
      z-index: 2147483647;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }

    #ecocart-launcher:hover {
      transform: scale(1.1) rotate(10deg);
      box-shadow: 0 6px 24px rgba(22, 163, 74, 0.5);
    }

    #ecocart-launcher:active {
      transform: scale(0.95);
    }

    #ecocart-launcher-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ffffff;
      color: #1e293b;
      border: 2px solid #16a34a;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    #ecocart-sidebar {
      position: fixed;
      top: 0;
      right: -430px;
      width: 420px;
      height: 100vh;
      background: #f8fafc;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
      z-index: 2147483646;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #e2e8f0;
    }

    #ecocart-sidebar.open {
      right: 0;
    }

    .ecocart-header {
      background: #15803d;
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }

    .ecocart-logo {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    #ecocart-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      transition: color 0.2s;
    }

    #ecocart-close:hover {
      color: white;
    }

    .ecocart-body {
      padding: 20px;
      flex-grow: 1;
      overflow-y: auto;
    }

    .ecocart-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02);
      border: 1px solid #e2e8f0;
    }

    .ecocart-card-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .score-container {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .score-ring {
      width: 90px;
      height: 90px;
      flex-shrink: 0;
    }

    .ring-bg {
      fill: none;
      stroke: #f1f5f9;
      stroke-width: 3.5;
    }

    .ring-fg {
      fill: none;
      stroke-width: 3.5;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s ease-out, stroke 0.3s ease;
    }

    .ring-text {
      fill: #1e293b;
      font-weight: 700;
      font-size: 10px;
      text-anchor: middle;
    }

    .score-info {
      flex: 1;
    }

    .score-heading {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .score-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }

    .confidence-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .conf-high { background: #dcfce7; color: #15803d; }
    .conf-medium { background: #fef9c3; color: #a16207; }
    .conf-low { background: #fee2e2; color: #b91c1c; }

    .product-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 4px;
      line-clamp: 2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .product-category {
      font-size: 10px;
      font-weight: 700;
      color: #16a34a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .impact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .impact-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      text-align: center;
    }

    .impact-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }

    .impact-val {
      font-size: 14px;
      font-weight: 700;
    }

    .val-low { color: #16a34a; }
    .val-medium { color: #d97706; }
    .val-high { color: #ea580c; }
    .val-very-high { color: #dc2626; }

    .bullet-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      line-height: 1.4;
    }

    .bullet-item.strength {
      color: #15803d;
    }

    .bullet-item.concern {
      color: #b45309;
    }

    .alt-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .alt-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      transition: background 0.2s;
    }

    .alt-item:hover {
      background: #f1f5f9;
    }

    .alt-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alt-name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }

    .alt-score {
      font-size: 12px;
      font-weight: 700;
      background: #dcfce7;
      color: #15803d;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .alt-reason {
      font-size: 11px;
      color: #64748b;
      line-height: 1.35;
    }

    .why-score-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .why-score-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
    }

    .why-score-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .why-score-label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }

    .why-score-value {
      font-size: 12px;
      font-weight: 800;
      color: #15803d;
      background: #dcfce7;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .why-score-note {
      font-size: 11px;
      color: #64748b;
      line-height: 1.35;
    }

    .accordion-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      padding: 4px 0;
    }

    .accordion-content {
      display: none;
      margin-top: 12px;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    .accordion-content.open {
      display: block;
    }

    .accordion-arrow {
      font-size: 12px;
      color: #64748b;
      transition: transform 0.2s;
    }

    .accordion-header.active .accordion-arrow {
      transform: rotate(90deg);
    }

    .breakdown-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 8px;
      color: #475569;
    }

    .breakdown-bar-bg {
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      flex: 1;
      margin: 0 10px;
      overflow: hidden;
    }

    .breakdown-bar-fg {
      height: 100%;
      background: #16a34a;
      border-radius: 3px;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }

    .ecocart-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      background: #f8fafc;
    }

    .ecocart-input:focus {
      border-color: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
    }

    .ecocart-btn {
      background: #15803d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      text-align: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .ecocart-btn:hover {
      background: #166534;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(22, 163, 74, 0.1);
      border-left-color: #16a34a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  shadow.appendChild(style);

  // Launcher DOM
  const launcher = document.createElement('div');
  launcher.id = 'ecocart-launcher';
  launcher.setAttribute('role', 'button');
  launcher.setAttribute('aria-label', 'Open EcoCart Sidebar');
  launcher.setAttribute('tabindex', '0');
  launcher.innerHTML = `
    <span>🌿</span>
    <div id="ecocart-launcher-badge" style="display: none;"></div>
  `;
  shadow.appendChild(launcher);

  // Sidebar DOM
  const sidebar = document.createElement('div');
  sidebar.id = 'ecocart-sidebar';
  sidebar.innerHTML = `
    <div class="ecocart-header">
      <div class="ecocart-logo">
        <span style="font-size: 20px; margin-right: 8px;">🌿</span>
        <span>EcoCart AI</span>
      </div>
      <button id="ecocart-close" aria-label="Close EcoCart Sidebar">&times;</button>
    </div>
    
    <div class="ecocart-body">
      <!-- Loading State -->
      <div id="ecocart-loading" class="ecocart-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 15px; font-weight: 500; color: #475569; font-size: 13px;">Analyzing product sustainability...</p>
      </div>
      
      <!-- Error State -->
      <div id="ecocart-error" class="ecocart-card" style="display: none; padding: 20px; text-align: center; border-color: #fca5a5; background: #fef2f2; flex-direction: column; align-items: center;">
        <span style="font-size: 32px; color: #ef4444; margin-bottom: 8px;">⚠</span>
        <h4 style="margin-bottom: 6px; color: #991b1b; font-weight: 600; font-size: 14px;">Analysis Failed</h4>
        <p id="ecocart-error-msg" style="font-size: 12px; color: #b91c1c; margin-bottom: 16px; line-height: 1.4;"></p>
        <button id="ecocart-retry-btn" class="ecocart-btn" style="width: 100%;" aria-label="Retry Product Analysis">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Retry Extraction
        </button>
      </div>

      <!-- Main Data State -->
      <div id="ecocart-data" style="display: none;">
        <!-- Product info card -->
        <div class="ecocart-card">
          <div class="product-category" id="pr-cat">Product</div>
          <div class="product-title" id="pr-title">--</div>
        </div>

        <!-- Score Ring Card -->
        <div class="ecocart-card">
          <div class="score-container">
            <svg class="score-ring" viewBox="0 0 36 36">
              <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path id="ring-fg" class="ring-fg" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="21.5" id="ring-text" class="ring-text">--</text>
            </svg>
            <div class="score-info">
              <div class="score-heading">Eco Score</div>
              <p class="score-desc" id="rec-text">--</p>
              <span class="confidence-badge conf-high" id="conf-badge">High Confidence</span>
            </div>
          </div>
        </div>

        <!-- Impact badges -->
        <div class="ecocart-card" style="padding: 12px;">
          <div class="impact-grid">
            <div class="impact-item">
              <span class="impact-label">Carbon Impact</span>
              <span class="impact-val val-low" id="carb-val">--</span>
            </div>
            <div class="impact-item">
              <span class="impact-label">Water Usage</span>
              <span class="impact-val val-low" id="wat-val">--</span>
            </div>
          </div>
        </div>

        <!-- Highlights & Concerns -->
        <div class="ecocart-card">
          <div class="ecocart-card-title">Sustainability Highlights</div>
          <div class="bullet-list" id="strengths-list"></div>
          <div class="bullet-list" id="concerns-list" style="margin-top: 12px;"></div>
        </div>

        <!-- Alternatives -->
        <div class="ecocart-card">
          <div class="ecocart-card-title">Better Alternatives</div>
          <div class="alt-list" id="alts-list"></div>
        </div>

        <!-- Why This Score Accordion -->
        <div class="ecocart-card">
          <div class="accordion-header" id="acc-why-hdr">
            <span>Why this score?</span>
            <svg class="icon accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div class="accordion-content" id="acc-why-content">
            <div id="why-score-list" class="why-score-list"></div>
          </div>
        </div>

        <!-- Detailed Analysis Accordion -->
        <div class="ecocart-card">
          <div class="accordion-header" id="acc-analysis-hdr">
            <span>Detailed Analysis</span>
            <svg class="icon accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div class="accordion-content" id="acc-analysis-content">
            <div class="breakdown-row">
              <span>Materials (60 pts)</span>
              <div class="breakdown-bar-bg">
                <div id="bd-materials" class="breakdown-bar-fg" style="width: 0%;"></div>
              </div>
              <span id="bd-materials-val">--</span>
            </div>
            <div class="breakdown-row">
              <span>Durability (30 pts)</span>
              <div class="breakdown-bar-bg">
                <div id="bd-durability" class="breakdown-bar-fg" style="width: 0%;"></div>
              </div>
              <span id="bd-durability-val">--</span>
            </div>
            <div class="breakdown-row">
              <span>Packaging (20 pts)</span>
              <div class="breakdown-bar-bg">
                <div id="bd-packaging" class="breakdown-bar-fg" style="width: 0%;"></div>
              </div>
              <span id="bd-packaging-val">--</span>
            </div>
            <div class="breakdown-row">
              <span>Locality (20 pts)</span>
              <div class="breakdown-bar-bg">
                <div id="bd-locality" class="breakdown-bar-fg" style="width: 0%;"></div>
              </div>
              <span id="bd-locality-val">--</span>
            </div>
            <div class="breakdown-row">
              <span>Brand Bonus (10 pts)</span>
              <div class="breakdown-bar-bg">
                <div id="bd-brand" class="breakdown-bar-fg" style="width: 0%;"></div>
              </div>
              <span id="bd-brand-val">--</span>
            </div>
          </div>
        </div>

        <!-- Settings Accordion -->
        <div class="ecocart-card" style="margin-bottom: 30px;">
          <div class="accordion-header" id="acc-settings-hdr">
            <span>Settings</span>
            <svg class="icon accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div class="accordion-content" id="acc-settings-content">
            <div class="settings-form">
              <div>
                <label class="form-label" style="display: block; margin-bottom: 6px;">Analysis Engine</label>
                <select id="ecocart-method-mode" class="ecocart-input" aria-label="Select Analysis Engine">
                  <option value="local">Local Rules Engine</option>
                  <option value="gemini">AI Analysis (Gemini API)</option>
                </select>
              </div>
              <div>
                <label class="form-label" style="display: block; margin-bottom: 6px;">Gemini API Key</label>
                <input type="password" id="ecocart-api-key" class="ecocart-input" placeholder="Enter API Key..." aria-label="Gemini API Key" />
              </div>
              <button id="ecocart-save-settings" class="ecocart-btn" style="width: 100%;" aria-label="Save Settings">Save Settings</button>
              <div id="ecocart-settings-status" style="display: none; font-size: 11px; text-align: center; margin-top: 4px; font-weight: 500;"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
  shadow.appendChild(sidebar);

  // Wire up Toggle Open/Close
  launcher.addEventListener('click', () => {
    sidebar.classList.remove('auto-opening');
    sidebar.classList.toggle('open');
    // Stop pulse once user interacts
    launcher.classList.remove('shopping-detected');
  });

  const closeBtn = shadow.getElementById('ecocart-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebar.classList.remove('auto-opening');
      // Mark as dismissed for this session
      try {
        sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      } catch (e) { /* sessionStorage may not be available */ }
    });
  }

  // Accordions Toggles
  const registerAccordion = (headerId: string, contentId: string) => {
    const hdr = shadow.getElementById(headerId);
    const content = shadow.getElementById(contentId);
    if (hdr && content) {
      hdr.addEventListener('click', () => {
        hdr.classList.toggle('active');
        content.classList.toggle('open');
      });
    }
  };
  registerAccordion('acc-analysis-hdr', 'acc-analysis-content');
  registerAccordion('acc-why-hdr', 'acc-why-content');
  registerAccordion('acc-settings-hdr', 'acc-settings-content');

  // Retry Button
  const retryBtn = shadow.getElementById('ecocart-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      runAnalysis();
    });
  }

  // Settings Save Button
  const saveBtn = shadow.getElementById('ecocart-save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const keyInput = shadow.getElementById('ecocart-api-key') as HTMLInputElement | null;
      const methodMode = shadow.getElementById('ecocart-method-mode') as HTMLSelectElement | null;
      const statusEl = shadow.getElementById('ecocart-settings-status');

      if (keyInput && methodMode && statusEl) {
        const newKey = keyInput.value.trim();
        const newMode = methodMode.value;

        await chrome.storage.local.set({
          geminiApiKey: newKey,
          ecoAnalysisMode: newMode
        });

        statusEl.textContent = 'Settings saved successfully!';
        statusEl.style.color = '#15803d';
        statusEl.style.display = 'block';

        setTimeout(() => {
          statusEl.style.display = 'none';
        }, 3000);

        // Re-run analysis with new settings
        runAnalysis();
      }
    });
  }

  // Initial populate settings
  initSettingsUI();

  // ─── Shopping Website Auto-Detection & Auto-Open ───
  const shoppingInfo = detectShoppingSite();
  const wasDismissed = (() => {
    try { return sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true'; }
    catch { return false; }
  })();

  if (shoppingInfo.detected && !wasDismissed) {
    // Add pulse animation and shopping badge to launcher
    launcher.classList.add('shopping-detected');

    const shoppingBadge = document.createElement('div');
    shoppingBadge.className = 'launcher-shopping-badge';
    shoppingBadge.textContent = 'SHOP';
    launcher.appendChild(shoppingBadge);

    // Auto-open sidebar with a smooth delay
    setTimeout(() => {
      sidebar.classList.add('open', 'auto-opening');

      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'ecocart-toast';
      toast.innerHTML = `
        <div class="toast-close" id="ecocart-toast-close" role="button" aria-label="Dismiss notification" tabindex="0">&times;</div>
        <div class="toast-icon">🛒</div>
        <div class="toast-content">
          <div class="toast-title">Shopping Site Detected</div>
          <div class="toast-subtitle">${shoppingInfo.siteName} — ${shoppingInfo.isProductPage ? 'Analyzing product...' : 'Browse products for eco-analysis'}</div>
          <div class="toast-stats">
            <span class="toast-stat"><span class="toast-stat-icon">📡</span> ${shoppingInfo.signals.length} signal${shoppingInfo.signals.length > 1 ? 's' : ''}</span>
            <span class="toast-stat"><span class="toast-stat-icon">${shoppingInfo.isProductPage ? '✅' : '🔍'}</span> ${shoppingInfo.isProductPage ? 'Product page' : 'Shopping site'}</span>
          </div>
        </div>
        ${!shoppingInfo.isProductPage ? '<button class="toast-action" id="ecocart-toast-action" aria-label="View shopping statistics">View Stats</button>' : ''}
      `;
      shadow.appendChild(toast);

      // Toast close button
      const toastCloseBtn = shadow.getElementById('ecocart-toast-close');
      if (toastCloseBtn) {
        toastCloseBtn.addEventListener('click', () => {
          toast.classList.add('hiding');
          setTimeout(() => toast.remove(), 400);
        });
      }

      // Toast action button (if present)
      const toastActionBtn = shadow.getElementById('ecocart-toast-action');
      if (toastActionBtn) {
        toastActionBtn.addEventListener('click', () => {
          sidebar.classList.add('open');
          toast.classList.add('hiding');
          setTimeout(() => toast.remove(), 400);
        });
      }

      // Auto-hide toast after 6 seconds
      setTimeout(() => {
        if (toast.parentElement) {
          toast.classList.add('hiding');
          setTimeout(() => toast.remove(), 400);
        }
      }, 6000);
    }, 800);
  }

  // Run initial extraction and analysis
  runAnalysis();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extract_product') {
    const url = window.location.hostname;
    let data: Partial<ProductData> = {};

    if (url.includes('amazon')) {
      data = extractAmazonData();
    } else if (url.includes('flipkart')) {
      data = extractFlipkartData();
    } else if (isProductPage()) {
      data = genericExtractor();
    }

    sendResponse({ ...data, url: window.location.href });
  }
  return true;
});

// Initialize EcoCart Sidebar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initEcoCart, 1500);
  });
} else {
  setTimeout(initEcoCart, 1500);
}
